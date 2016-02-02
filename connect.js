
/*
	connect.js - a interactive tool to explore cloud formation and connect to instances
*/

// libraries
var exec = require('child_process').exec;
var AWS = require('aws-sdk');

// custom modules
var settings = require('./settings').module;

// aws objects
var aws_params = { region: "us-east-1" };
var aws_cf = new AWS.CloudFormation(aws_params);
var aws_ec2 = new AWS.EC2(aws_params);
var aws_elb = new AWS.ELB(aws_params);
var aws_asg = new AWS.AutoScaling(aws_params);

// enums
STACKS = "STACKS";
RES = "RES";
INSTANCES = "INSTANCES";

// initialization
var status = STACKS; 
var stacks = [];
var resources = [];
var instance = null;
var lookup = settings.lookup;
var key_path = settings.key_path;
var ssh_user = settings.ssh_user;

// gooo!
start();

// start off the script by listing stacks and handle input
function start(){
	list_stacks();

	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	var util = require('util');

	process.stdin.on('data', function (text) {

		// there may be a new line at the end of the line
		var text = text.replace("\n", "");

		if (text === 'stacks')
		 	list_stacks();

		if(text === 'ssh'){
			if(instance != null)
				ssh(instance);
			else
				console.log("You must select an EC2 instance first.");
		}

		if(text.indexOf("health=") == 0){
			if(instance != -1)
				set_instance_health(instance, text.substring(7));
			else
				console.log("You must select an EC2 instance first.");
		}

		var index = Number(text);
		if(!isNaN(index)){
			if(status == STACKS)
				list_resources(stacks[index].StackName);
			else if(status == RES){
				select_resource(resources[index].ResourceType, resources[index].PhysicalResourceId);
			}else if(status == INSTANCES){
				select_resource("AWS::EC2::Instance", resources[index].InstanceId);
			}
		}

		if (text === 'quit')
		 	process.exit();
	});
}

// lists the stacks in the current AWS account
function list_stacks(){

	// reset the ip so that there is no instance selected
	ip = -1;

	status = STACKS;
	aws_cf.listStacks({
		StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE']
	}, function(err, data){
	    stacks = data.StackSummaries;
	    var index = 0;
	    console.log("\nStacks");
		stacks.forEach(function (stack){
			console.log(index + num_padding(index) + stack.StackName);
			index++;
		});
	});
}

function list_resources(stackName){
	status = RES;
	aws_cf.listStackResources({
		StackName: stackName,
	}, function(err, data) {
		if (err) console.log(err, err.stack);
		else{
			var index = 0;
			resources = data.StackResourceSummaries;
			console.log("\n" + stackName);
			resources.forEach(function (resource){
				console.log(index + num_padding(index) + name_padding(lookup[resource.ResourceType]) + " |  " + resource.PhysicalResourceId);
				index++;
			});
		}
	});
}

// selects a resource so that it can give more details and options
function select_resource(type, res_id){
	switch(type){
		case "AWS::ElasticLoadBalancing::LoadBalancer": elb(res_id); break;
		case "AWS::EC2::Instance": ec2_instance(res_id); break;
		case "AWS::AutoScaling::AutoScalingGroup": asg(res_id); break;
		default: console.error("Sorry can't support that type yet: " + type);
	}
}

// ensure to write the correct amount of spaces after the resource name
function name_padding(string){
	if(string === undefined){
		string = "";
	}

	var total = 16;
	var spaces = total - string.length;
	for(var i = 0; i < spaces; i++)
		string += " ";
	return string;
}

// ensure to write the correct amount of spaces after the index number
function num_padding(num){
	var padding = 1;
	padding = (num < 10) ? padding + 1 : padding;
	var out = "";
	for(var i = 0; i < padding; i++)
		out += " ";
	return out + " |  ";
}

/*

Commands

*/

// initiate a ssh connection with the instance in a different tab, then exit
function ssh(instance){0
	var command = "osascript -e 'tell application \"Terminal\" to activate' -e 'tell application \"System Events\" to tell process \"Terminal\" to keystroke \"t\" using command down' -e 'tell application \"Terminal\" to do script ";
	command += "\"echo " + instance.id + " && ssh -o StrictHostKeyChecking=no -i " + key_path + " " + ssh_user + "@" + instance.ip;
	command += "\"";
	command += " in selected tab of the front window'";

	// execute ssh
	var ssh = exec(command, function(){});
}

function set_instance_health(instance, health){

	console.log("$$$" + health + "$$$");

	if(health !== "Unhealthy" && health !== "Healthy"){
		console.log("That's not a good instance health state.");
		return;
	}

	var params = {
		HealthStatus: health,
		InstanceId: instance.id,
	};
	aws_asg.setInstanceHealth(params, function(err, data) {
		if (err) console.log(err, err.stack);
		else{
			select_resource("AWS::EC2::Instance", instance.id);
		}
	});
}

/*

Resource handlers

*/

function elb(res_id){

	aws_elb.describeLoadBalancers({ LoadBalancerNames : [res_id] }, function(err, data){
		if (err) console.log(err, err.stack);
		else{
			var elb = data.LoadBalancerDescriptions[0];
			console.log("\nLoad Balancer")
			console.log(elb.LoadBalancerName + " |  " + elb.DNSName);

			aws_elb.describeInstanceHealth({ LoadBalancerName : res_id }, function(err, data){
				if (err) console.log(err, err.stack);
				else{
					var instances = data.InstanceStates;
					console.log("\nInstance Health States")
					var index = 0;
					status = INSTANCES;
					resources = instances;
					instances.forEach(function(instance){
						var reason_code = (instance.ReasonCode == "N/A") ? "" : instance.ReasonCode + " |  ";
						var description = (instance.Description == "N/A") ? "" : instance.Description + " |  ";
						console.log(index + num_padding(index) + instance.InstanceId + " |  " + instance.State + reason_code + description);
					});
				}
			});
		}
	});
}

function ec2_instance(res_id){
	aws_ec2.describeInstances({ InstanceIds: [res_id] }, function(err, data) {
		if (err) console.log(err, err.stack);
		else{
			var resp_instance = data.Reservations[0].Instances[0];
			var ip;

			// if the instance is shutting down the ip will be undefined
			if(resp_instance.PublicIpAddress !== undefined){
				// save the selected instance
				instance = {
					ip : resp_instance.PublicIpAddress,
					id: resp_instance.InstanceId
				};

				ip = instance.ip;
			}else{
				ip = "Null IP";
				instance = null;
			}

			console.log("\nInstance")
			console.log(instance.id + " |  " + ip + " |  " + resp_instance.State.Name);
		}
	});
}

function asg(res_id){
	aws_asg.describeAutoScalingGroups({AutoScalingGroupNames: [res_id]}, function(err, data) {
		if (err) console.log(err, err.stack);
		else{
			var instances = data.AutoScalingGroups[0].Instances;
			console.log("\nInstance")
			var index = 0;
			status = INSTANCES;
			resources = instances;
			instances.forEach(function(instance){
				ip = instance.PublicIpAddress;
				console.log(index + num_padding(index) + instance.InstanceId + " |  " + instance.HealthStatus);
				index++;
			});
		}
	});
}
