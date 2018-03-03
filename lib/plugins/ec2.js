
var AWS = require('aws-sdk');
var exec = require('child_process').exec;
var settings = require('../settings');
var ssh_client = require('node-sshclient');
var opn = require('opn');
var fs = require('fs');
var os = require('os');

var params = { region: settings.region };
var ec2 = new AWS.EC2(params);
var asg = new AWS.AutoScaling(params);

var tree = null;
var watcher = null;

function EC2(_tree){
	tree = _tree;

	this.cmds = [
		'info',
		'ssh',
		'cat',
		'sshall',
		'sshrand',
		'stats',
		'cud',
		'health',
		'vols',
		'sshfw',
		'sync',
		'exec',
		'mirror',
		'mirror-stop'];
}

EC2.prototype.do_cmd = function(args, opts, callback){

	switch(args[0]){
		case 'info': info(args, callback); break;
		case 'cat': cat(args, opts, callback); break;
		case 'ssh': ssh(args, opts, callback); break;
		case 'sshall': sshall(args, opts, callback); break;
		case 'sshrand': sshrand(args, opts, callback); break;
		case 'stats': stats(args, opts, callback); break;
		case 'cud': cud(args, opts, callback); break;
		case 'health': health(args, callback); break;
		case 'vols': vols(args, callback); break;
		case 'sshfw': sshfw(args, opts, callback); break;
		case 'sync': sync(args, opts, callback); break;
		case 'exec': execute(args, opts, callback); break;
		case 'mirror': mirror(args, opts, callback); break;
		case 'mirror-stop': mirror_stop(args, opts, callback); break;
		default: console.log('EC2 plugin doesn\'t recognize that command.');
	}
}

module.exports = EC2;

function info(args, callback){

	if(tree.current){

		console.log();
		console.log(tree.current.name);

		ec2.describeInstances({
			InstanceIds: [tree.current.aws_id]
		}, function(err, data) {
			if (err) console.log(err);
			else{
				var instance = data.Reservations[0].Instances[0];
				if(instance){
					output_ec2_data(instance);
					callback();
				}
			}
		});
	}else{
		console.log('Problem finding aws data.');
		callback();
	}
}

function cat(args, opts, callback){

	if(tree.current.type !== 'Instance'){
		console.log('Cannot cat on that type of resource.');
		callback();
		return;
	}

	if(!args[1]){
		console.log("Must enter a path to a file.");
		callback();
		return;
	}

	var proxy = (process.env.PROXY_ALIAS === 'true');

	ec2.describeInstances({
		InstanceIds: [tree.current.aws_id]
	}, function(err, data) {
		if (err) console.log(err);
		else{
			var instance = data.Reservations[0].Instances[0];
			if(instance){
				run_cmd_via_ssh(
					instance,
					['cat', args[1]],
					proxy,
					function(){
						callback();
				});
			}
		}
	});
}

function ssh(args, opts, callback){

	var proxy = (process.env.PROXY_ALIAS === 'true');

	if(args[1]){
		tree.get_node(args[1], function(node){
			if(node && node.type === 'Instance'){
				get_ip_and_ssh(node.aws_id, proxy, callback);
			}else{
				console.log('Cannot ssh on that type of resource.');
				callback();
			}
		});
	}else{
		if(tree.current.type === 'Instance'){
			get_ip_and_ssh(tree.current.aws_id, proxy, callback);
		}else{
			console.log('Cannot ssh on that type of resource.');
			callback();
		}
	}
}

function sshall(args, opts, callback){

	var asg;
	if(tree.current.type !== "Asg"){
		console.log("Must select an Asg first.");
		callback();
		return;
	}else{
		asg = tree.current;
	}

	var proxy = (process.env.PROXY_ALIAS === 'true');

	asg.update_children(function(){
		sshall_recursive(0);
	});

	function sshall_recursive(cur){

		if(cur == asg.children.length){
			callback(); return;
		}

		if(asg.children[cur].type === "Instance"){
			get_ip_and_ssh(asg.children[cur].aws_id, proxy, function(){
				sshall_recursive(cur + 1);
			});
		}
	}
}

function sshrand(args, opts, callback){

	var proxy = (process.env.PROXY_ALIAS === 'true');

	if(args[1]){
		tree.get_node(args[1], function(node){
			choose_and_ssh(node);
		});
	}else{
		choose_and_ssh(tree.current);
	}

	function choose_and_ssh(asg){
		if(asg && asg.type === 'Asg'){
			asg.update_children(function(){
				var rand = Math.floor(Math.random() * asg.children.length);
				if(asg.children[rand].type === "Instance"){
					get_ip_and_ssh(asg.children[rand].aws_id, proxy, callback);
				}
			});
		}else{
			console.log("Asg node not found.");
			callback(); return;
		}
	}
}

function sshfw(args, opts, callback){

	//sshfw A/06:8983
	var forward_port = Math.floor(Math.random() * (49151 - 1024 + 1) + 1024)

	var dest_port = 0;
	var node_path = '';

	if(args[1] === undefined){
		console.log('Command requires at least a destination port.');
		callback();
		return;
	}

	var proxy = (process.env.PROXY_ALIAS === 'true');

	var input = args[1].split(':');
	if(input.length === 2){
		node_path = input[0]
		dest_port = Number(input[1]);
	}else if(input.length === 1){
		dest_port = Number(input[0]);
	}

	if(node_path === ''){
		if(tree.current.type !== 'Instance'){
			console.log('Must select an ec2 instance first.');
			callback(); return;
		}

		get_ip(tree.current.aws_id, function(ip){
			ssh_forward(tree.current.aws_id, ip, forward_port, dest_port, proxy, callback);
		});
	}else{
		tree.get_node(node_path, function(node){
			if(node && node.type === 'Instance'){
				get_ip(node.aws_id, function(ip){
					ssh_forward(node.aws_id, ip, forward_port, dest_port, proxy, callback);
				});
			}else{
				console.log("Instance node not found.");
				callback();
			}
		});
	}
}

function stats(args, opts, callback){

	var proxy = (process.env.PROXY_ALIAS === 'true');

	if(tree.current.type === 'Instance'){
		ec2.describeInstances({
			InstanceIds: [tree.current.aws_id]
		}, function(err, data) {
			if (err) console.log(err);
			else{
				var instance = data.Reservations[0].Instances[0];
				if(instance){
					run_cmd_via_ssh(
						instance,
						['top -b -n 1 | grep -E "top -|KiB Mem"'],
						proxy,
						function(){
							callback();
					});
				}
			}
		});
	}else if(tree.current.type === 'Asg'){
		var asg = tree.current;
		var cur_done = 0;
		foreach_instances_parallel(asg, function(instance){
			run_cmd_via_ssh(
				instance,
				['top -b -n 1 | grep -E "top -|KiB Mem"'],
				proxy,
				function(){
					cur_done++;
					if(cur_done == asg.children.length){
						callback();
					}
			});
		});
	}else{
		console.log('Cannot ssh on that type of resource.');
		callback();
	}
}

function cud(args, opts, callback){

	if(tree.current.type !== 'Instance'){
		console.log('You can only use "cud" on instance nodes.');
		callback();
		return;
	}

	var proxy = (process.env.PROXY_ALIAS === 'true');

	ec2.describeInstances({
		InstanceIds: [tree.current.aws_id]
	}, function(err, data) {
		if (err) console.log(err);
		else{
			var instance = data.Reservations[0].Instances[0];
			if(instance){
				run_cmd_via_ssh(
					instance,
					['cat', '/var/log/cloud-init-output.log'],
					proxy,
					function(){
						callback();
				});
			}
		}
	});
}

function health(args, callback){

	if(tree.current.type !== 'Instance'){
		console.log('You can only set health of instance nodes.');
		callback();
		return;
	}

	if(!args[1]){
		console.log('Must specify a health state. Unhealthy or Healthy');
		callback();
		return;
	}

	var params = {
		HealthStatus: args[1],
		InstanceId: tree.current.aws_id,
	};
	asg.setInstanceHealth(params, function(err, data) {
		if(err){
			console.log('AWS error:', err);
		}
		callback();
	});
}

function vols(args, callback){

	if (tree.current.type !== 'Asg'){
		console.log('Cannot see vols on this type of node.');
		callback();
		return;
	}

	var cur = 0;
	var total;

	console.log();

	asg.describeAutoScalingGroups({
		AutoScalingGroupNames: [tree.current.resource_id]
	}, function(err, data) {
		if (err){
			console.log('AWS error:', err);
		}else{
			if(data.AutoScalingGroups && data.AutoScalingGroups[0].Instances){
				var instances = data.AutoScalingGroups[0].Instances;
				total = instances.length;
				for(var i = 0; i < instances.length; i++){
					output_vol(instances[i].InstanceId, instances[i]);
				}
			}
		}
	});

	function output_vol(instance_id, instance){
		ec2.describeInstances({
			InstanceIds: [instance_id]
		}, function(err, idata) {
			if (err){
				console.log('AWS error:', err);
			}else{
				var mappings = idata.Reservations[0].Instances[0].BlockDeviceMappings;
				var vol_id = '-';
				var solr_domain = '-'
				for(var j = 0; j < mappings.length; j++){
					if(mappings[j].DeviceName === '/dev/sdd'){
						vol_id = mappings[j].Ebs.VolumeId
						ec2.describeVolumes({
							VolumeIds: [vol_id]
						}, function(err, data) {
							if (err){
								console.log('AWS error:', err);
							}else{
								solr_domain_tag = data.Volumes[0].Tags.filter(function(cur){
									return cur.Key === 'acquia:solr-cloud-host';
								});

								if(solr_domain_tag.length > 0){
									solr_domain = solr_domain_tag[0].Value;
								}

								console.log(
									instance_id,
									instance.LifecycleState,
									instance.HealthStatus,
									vol_id,
									solr_domain);
								cur++;
								if(cur === total){
									console.log();
									callback();
								}
							}
						});
					}
				}
			}
		});
	}
}

// sync does not support bastion proxy
function sync(args, opts, callback){

	if(!args[1] || !args[2]){
		console.log('Usage: sync <local path> <remote path>');
		callback(); return;
	}

	if(tree.current.type === "Asg"){
		var asg = tree.current;
		var output = '';
		var cur_done = 0;
		foreach_instances_parallel(asg, function(instance){
			rsync(args[1], args[2], instance.PublicIpAddress, function(out){
				console.log(out);
				cur_done++;
				if(cur_done == asg.children.length){
					callback();
				}
			});
		});

	}else if(tree.current.type === "Instance"){
		get_ip(tree.current.aws_id, function(ip){
			rsync(args[1], args[2], ip, function(out){
				console.log(out);
				callback();
			});
		});
	}else{
		console.log("Must select an Asg or Instance first.");
		callback();
	}
}

function execute(args, opts, callback){

	if(!args[1]){
		console.log('Usage: exec "<command>"');
		callback(); return;
	}

	var cmd = args[1];

	if(surrounded(cmd, '"') || surrounded(cmd, "'")){
		cmd = cmd.slice(1, -1).split(' ');
	}

	var proxy = (process.env.PROXY_ALIAS === 'true');

	function surrounded(str, ch){
		return (str[0] === ch && str[str.length - 1] === ch);
	}

	if(tree.current.type === "Asg"){
		var asg = tree.current;
		var cur_done = 0;
		foreach_instances_parallel(asg, function(instance){
			run_cmd_via_ssh(instance, cmd, proxy, function(){
				cur_done++;
				if(cur_done == asg.children.length){
					callback();
				}
			});
		});

	}else if(tree.current.type === "Instance"){
		get_ip(tree.current.aws_id, function(ip){
			run_cmd_via_ssh({
				PublicIpAddress: ip,
				InstanceId: tree.current.aws_id
			}, cmd, proxy, function(){
				callback();
			});
		});
	}else{
		console.log("Must select an Asg or Instance first.");
		callback();
	}
}

// mirror does not support bastion proxy
function mirror(args, opts, callback){

	var sync_file;
	var ips = [];

	if(!args[1] || ! args[2]){
		console.log('Usage: mirror <source> <destination>');
		callback(); return;
	}

	if(watcher !== null){
		console.log('There is already a mirror process running.');
		callback(); return;
	}

	if(tree.current.type === "Asg"){
		var cur_done = 0;
		foreach_instances_parallel(tree.current, function(instance){
			ips.push(instance.PublicIpAddress);
			cur_done++;
			if(cur_done == tree.current.children.length){
				sync_file = asg_sync;
			}
		});

	}else if(tree.current.type === "Instance"){
		get_ip(tree.current.aws_id, function(ip){
			ips.push(ip);
			sync_file = instance_sync;
		});
	}else{
		console.log("Must select an Asg or Instance first.");
		callback();
	}

	watcher = fs.watch(args[1], {
		persistent: true,
		recursive: true
	}, function(eventType, filename){
		if (eventType === 'change') {
			sync_file(args[1], args[2]);
		}
	});

	console.log('Started mirroring ' + args[1] + ' with ' + args[2]);
	console.log('Hit ENTER to go back to the terminal and use it as normal while mirroring.');
	console.log('Use command \'mirror-stop\' to stop mirroring.');

	function instance_sync(source, dest){
		rsync(source, dest, ips[0], function(out){
			console.log(ips[0] + ' synced');
		});
	}

	function asg_sync(source, dest){
		console.log('\n');
		ips.forEach(function(ip){
			rsync(source, dest, ip, function(out){
				console.log(ip + ' synced');
			});
		});
	}
}

function mirror_stop(args, opts, callback){
	watcher.close();
	watcher = null;
	callback();
}

// rsync does not support bastion proxy
function rsync(source, dest, ip, callback){
	var cmd = [
		'rsync -avze',
		'"ssh -o StrictHostKeyChecking=no"',
		'--rsync-path="sudo rsync"',
		source,
		settings.ssh_user + '@' + ip + ':' + dest,
	].join(' ');

	exec(cmd, function(error, stdout, stderr){

		if(error){
			console.log(error);
		}

		var out = (stderr) ? stderr : '';
		out += (stdout) ? stdout : '';

		callback(out);
    });
}

function get_ip_and_ssh(id, proxy, callback){
	get_ip(id, function(ip){
		start_ssh(id, ip, proxy, callback);
	});
}

function get_ip(id, callback){
	ec2.describeInstances({
		InstanceIds: [id]
	}, function(err, data) {
		if (err) console.log(err);
		else{
			if(data.Reservations[0]){
				var instance = data.Reservations[0].Instances[0];
				if(instance && instance.PublicIpAddress){
					callback(instance.PublicIpAddress);
				}
			}
		}
	});
}

function foreach_instances_parallel(asg, func){
	asg.update_children(function(){
		asg.children.forEach(function(cur){
			if(cur.type === "Instance"){
				ec2.describeInstances({
					InstanceIds: [cur.aws_id]
				}, function(err, data) {
					if (err){
						console.log(err)
						callback();
					}else{
						var instance = data.Reservations[0].Instances[0];
						if(instance){
							func(instance);
						}
					}
				});
			}
		});
	});
}

function output_ec2_data(i){
	console.log();

	if(i.ImageId){console.log("ImageId: " + i.ImageId)};
	if(i.State.Name){console.log("State: " + i.State.Name)};
	if(i.PrivateDnsName){console.log("Private Dns: " + i.PrivateDnsName)};
	if(i.PublicDnsName){console.log("Public Dns: " + i.PublicDnsName)};
	if(i.KeyName){console.log("Key name: " + i.KeyName)};
	if(i.InstanceType){console.log("Instance Type: " + i.InstanceType)};
	if(i.LaunchTime){console.log("Launch: " + i.LaunchTime)};
	if(i.Placement.AvailabilityZone){console.log("AZ: " + i.Placement.AvailabilityZone)};
	if(i.SubnetId){console.log("Subnet: " + i.SubnetId)};
	if(i.VpcId){console.log("VPC: " + i.VpcId)};
	if(i.PrivateIpAddress){console.log("Private Ip: " + i.PrivateIpAddress)};
	if(i.PublicIpAddress){console.log("Public Ip: " + i.PublicIpAddress)};
	if(i.Architecture){console.log("Arch: " + i.Architecture)};
	if(i.Tags){
		console.log("Tags: ");
		var start = "  ";
		for(var j = 0; j < i.Tags.length; j++){
			console.log(start + i.Tags[j].Key + ": " + i.Tags[j].Value);
		}
	}
	if(i.SecurityGroups){
		console.log("Security Groups: ");
		var start = "  ";
		for(var j = 0; j < i.SecurityGroups.length; j++){
			console.log(start + i.SecurityGroups[j].GroupId);
		}
	}
	console.log();
}

function run_cmd_via_ssh(instance, args, proxy, callback){

	var ssh_params = {
	    hostname: instance.PublicIpAddress,
	    user: settings.ssh_user,
	    port: 22,
	    option : {
			'StrictHostKeyChecking': 'no',
			'LogLevel': 'error'
	    }
	};

	if(proxy){
		ssh_params.option.ProxyCommand = 'ssh ' + settings.proxy_alias + ' -W %h:%p'
	}

	var ssh = new ssh_client.SSH(ssh_params);

	var cmd = '';
	for(var i = 0; i < args.length; i++){
		cmd += args[i] + ' ';
	}

	ssh.command(cmd, function(res) {

		console.log('========== ' + instance.InstanceId + ' ==========\n');

		if(res.stderr){
			console.log(res.stderr);
		}else{
			console.log(res.stdout);
		}
	    callback();
	});
}

function start_ssh(id, ip, proxy, callback){

	if(!ip) return;

	var command;
	if(proxy){
		var command = "echo '" + id + "' && ssh -tt " + settings.proxy_alias + " ssh -o StrictHostKeyChecking=no " + settings.ssh_user + "@" + ip;
	}else{
		var command = "echo '" + id + "' && ssh -o StrictHostKeyChecking=no " + settings.ssh_user + "@" + ip;
	}

	if(os.platform == 'linux'){
		var shell_cmd = settings.linux_ssh_command.replace(/{{{command}}}/, command);
	}else{
		var shell_cmd = settings.osa_ssh_command.replace(/{{{command}}}/, command);
	}

	var ssh = exec(shell_cmd, function(error, out, err){
		if(error!==null) console.log(error);
	});

	setTimeout(callback, 750);
}


function ssh_forward(id, ip, forward_port, dest_port, proxy, callback){

	if(ip && dest_port && forward_port){
		console.log("localhost:" + forward_port + ' -> ' + ip + ':' + dest_port);

		var command
		if(proxy){
			command = "echo '" + id + "' && ssh " + settings.proxy_alias + " -L " + forward_port + ":localhost:" + forward_port + " ssh -L " + forward_port + ":localhost:" + dest_port + " " + settings.ssh_user + "@" + ip;
		}else{
			command = "echo '" + id + "' && ssh -o StrictHostKeyChecking=no -L " + forward_port + ":localhost:" + dest_port + " " + settings.ssh_user + "@" + ip;
		}

		if(os.platform == 'linux'){
			var shell_cmd = settings.linux_ssh_command.replace(/{{{command}}}/, command);
		}else{
			var shell_cmd = settings.osa_ssh_command.replace(/{{{command}}}/, command);
		}

		var ssh = exec(shell_cmd, function(error, out, err){
			if(error!==null){
				console.log(error);
			}else{
				opn('http://localhost:' + forward_port);
			}
		});
	}else{
		return;
	}

	callback();
}
