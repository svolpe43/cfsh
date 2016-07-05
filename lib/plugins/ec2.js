
var AWS = require('aws-sdk');
var exec = require('child_process').exec;
var settings = require('../settings');
var ssh_client = require('node-sshclient');

var params = { region: settings.region };
var ec2 = new AWS.EC2(params);
var asg = new AWS.AutoScaling(params);

var tree = null;
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
		'sshfw'];
}

EC2.prototype.do_cmd = function(args, opts, callback){
	
	switch(args[0]){
		case 'info': info(args, callback); break;
		case 'cat': cat(args, callback); break;
		case 'ssh': ssh(args, callback); break;
		case 'sshall': sshall(args, callback); break;
		case 'sshrand': sshrand(args, callback); break;
		case 'stats': stats(args, callback); break;
		case 'cud': cud(args, callback); break;
		case 'health': health(args, callback); break;
		case 'vols': vols(args, callback); break;
		case 'sshfw': sshfw(args, opts, callback); break;
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

function cat(args, callback){

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

	ec2.describeInstances({
		InstanceIds: [tree.current.aws_id]
	}, function(err, data) {
		if (err) console.log(err);
		else{
			var instance = data.Reservations[0].Instances[0];
			if(instance){
				run_cmd_via_ssh(
					instance.PublicIpAddress,
					['cat', args[1]],
					function(){
						callback();
				});
			}
		}
	});
}

function ssh(args, callback){

	if(args[1]){
		tree.get_node(args[1], function(node){
			if(node && node.type === 'Instance'){
				get_ip_and_ssh(node.name, node.aws_id);
			}
			callback();
		});
	}else{
		if(tree.current.type === 'Instance'){
			get_ip_and_ssh(tree.current.name, tree.current.aws_id);
		}else{
			console.log('Cannot ssh on that type of resource.');
		}
		callback();
	}
}

function sshall(args, callback){

	var asg;
	if(tree.current.type !== "Asg"){
		console.log("Must select an Asg first.");
		callback();
		return;
	}else{
		asg = tree.current;
	}

	asg.update_children(function(){
		for(var i = 0; i < asg.children.length; i ++){
			if(asg.children[i].type === "Instance"){
				get_ip_and_ssh(asg.children[i].name, asg.children[i].aws_id);
			}
		}
		callback();
	});
}

function sshrand(args, callback){

	if(args[1]){
		tree.get_node(args[1], function(node){
			if(node && node.type === 'Asg'){
				pick_and_ssh(node);
			}else{
				console.log("Asg node not found.");
				callback();
				return;
			}
		});
	}else{
		if(tree.current.type === 'Asg'){
			pick_and_ssh(tree.current);
		}else{
			console.log('Cannot ssh on that type of resource.');
			callback();
			return;
		}
	}

	function pick_and_ssh(asg){
		asg.update_children(function(){
			var rand = Math.floor(Math.random() * asg.children.length);
			if(asg.children[rand].type === "Instance"){
				get_ip_and_ssh(asg.children[rand].name, asg.children[rand].aws_id);
			}
			callback();
		});
	}
}

function sshfw(args, opts, callback){

	//sshfw -5000 A/06:8983
	var forward_port;
	if(opts.length > 0){
		forward_port =  Number(opts[0]);
	}else{
		forward_port = Math.floor(Math.random() * (49151 - 1024 + 1) + 1024)
	}

	var dest_port = 0;
	var node_path = '';

	var opts = args[1].split(':');
	if(opts.length === 2){
		node_path = opts[0]
		dest_port = Number(opts[1]);
	}else if(opts.length === 1){
		dest_port = Number(opts[0]);
	}

	if(node_path === ''){
		if(tree.current.type !== 'Instance'){
			console.log('Must select an Ec2 instance first.');
			callback();
			return;
		}

		console.log("localhost:" + forward_port);
		get_ip_and_ssh(tree.current.name, tree.current.aws_id, true);
	}else{
		tree.get_node(node_path, function(node){
			if(node && node.type === 'Instance'){
				console.log("localhost:" + forward_port);
				get_ip_and_ssh(tree.current.name, tree.current.aws_id, true);
			}else{
				console.log("Instance node not found.");
				callback();
				return;
			}
		});
	}
}

function stats(args, callback){
	if(tree.current.type === 'Instance'){
		ec2.describeInstances({
			InstanceIds: [tree.current.aws_id]
		}, function(err, data) {
			if (err) console.log(err);
			else{
				var instance = data.Reservations[0].Instances[0];
				if(instance){
					run_cmd_via_ssh(
						instance.PublicIpAddress,
						['top -b -n 1 | grep -E "top -|KiB Mem"'],
						function(){
							callback();
					});
				}
			}
		});
	}else{
		console.log('Cannot ssh on that type of resource.');
		callback();
	}
}

function cud(args, callback){

	if(tree.current.type !== 'Instance'){
		console.log('You can only use "cud" on instance nodes.');
		callback();
		return;
	}

	ec2.describeInstances({
		InstanceIds: [tree.current.aws_id]
	}, function(err, data) {
		if (err) console.log(err);
		else{
			var instance = data.Reservations[0].Instances[0];
			if(instance){
				run_cmd_via_ssh(
					instance.PublicIpAddress,
					['cat', '/var/log/cloud-init-output.log'],
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

function get_ip_and_ssh(name, id, forward){
	ec2.describeInstances({
		InstanceIds: [id]
	}, function(err, data) {
		if (err) console.log(err);
		else{
			if(data.Reservations[0]){
				var instance = data.Reservations[0].Instances[0];
				if(instance && instance.PublicIpAddress){
					if(forward){
						ssh_forward(name, instance.PublicIpAddress);
					}else{
						ssh_into_instance(name, instance.PublicIpAddress);
					}
				}
			}
		}
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

function run_cmd_via_ssh(ip, args, callback){

	console.log();

	var ssh = new ssh_client.SSH({
	    hostname: ip,
	    user: settings.ssh_user,
	    port: 22,
	    option : {
			'StrictHostKeyChecking': 'no',
			'LogLevel': 'error'
	    }
	});

	var cmd = '';
	for(var i = 0; i < args.length; i++){
		cmd += args[i] + ' ';
	}

	ssh.command(cmd, function(res) {
		if(res.stderr){
			console.log(res.stderr);
		}else{
			console.log(res.stdout);
		}
	    callback();
	});
}

function ssh_into_instance(id, ip){

	if(!ip){
		return;
	}

	var command = "osascript -e 'tell application \"Terminal\"";
	command += " to activate' -e 'tell application \"System Events\"";
	command += " to tell process \"Terminal\" to keystroke \"t\" using";
	command += " command down' -e 'tell application \"Terminal\" to do script ";
	command += "\"echo '" + id + "' && ssh -o StrictHostKeyChecking=no";
	command += " " + settings.ssh_user + "@" + ip + "\"";
	command += " in selected tab of the front window'";

	var ssh = exec(command, function(){});
}

function ssh_forward(id, ip, dest_port, forward_port){

	if(!ip || !dest_port || !forward_port){
		return;
	}

	var command = "osascript -e 'tell application \"Terminal\"";
	command += " to activate' -e 'tell application \"System Events\"";
	command += " to tell process \"Terminal\" to keystroke \"t\" using";
	command += " command down' -e 'tell application \"Terminal\" to do script ";
	command += "\"echo '" + id + "' && ssh -o StrictHostKeyChecking=no";
	command += " -L " + forward_port + ":localhost:" + dest_port + " " + settings.ssh_user + "@" + ip + "\"";
	command += " in selected tab of the front window'";

	var ssh = exec(command, function(){});
}
