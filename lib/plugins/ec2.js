
var AWS = require('aws-sdk');
var exec = require('child_process').exec;
var settings = require('../settings');
var ssh_client = require('node-sshclient');

var params = { region: settings.region };
var ec2 = new AWS.EC2(params);

var tree = null;
function EC2(_tree){
	tree = _tree;

	this.cmds = [ 'info', 'ssh', 'cat', 'sshall', 'stats', 'cud'];
}

EC2.prototype.do_cmd = function(args, opts, callback){
	
	switch(args[0]){
		case 'info': info(args, callback); break;
		case 'cat': cat(args, callback); break;
		case 'ssh': ssh(args, callback); break;
		case 'sshall': sshall(args, callback); break;
		case 'stats': stats(args, callback); break;
		case 'cud': cud(args, callback); break;
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

	var stack = tree.current;

	if(stack.type === "root"){
		console.log("Must select a stack node first.");
		callback();
		return;
	}

	while(stack.type != "Stack"){
		stack = stack.parent;
	}

	stack.update_children(function(){
		for(var i = 0; i < stack.children.length; i ++){

			var resource = stack.children[i];

			if(resource.type === "Instance"){
				get_ip_and_ssh(resource.name, resource.aws_id);
			}else if(resource.type === "Asg"){
				var asg = resource;
				asg.update_children(function(){
					for(var j = 0; j < asg.children.length; j++){
						get_ip_and_ssh(asg.children[j].name, asg.children[j].aws_id);
					}
				});
			}
		}
		callback();
	});
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

function get_ip_and_ssh(name, id){
	ec2.describeInstances({
		InstanceIds: [id]
	}, function(err, data) {
		if (err) console.log(err);
		else{
			if(data.Reservations[0]){
				var instance = data.Reservations[0].Instances[0];
				if(instance && instance.PublicIpAddress){
					ssh_into_instance(name, instance.PublicIpAddress);
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
			'StrictHostKeyChecking': 'no'
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
