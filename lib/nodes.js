

var AWS = require('aws-sdk');
var exec = require('child_process').exec;
var settings = require('./settings');

var params = { region: settings.region };
var cf = new AWS.CloudFormation(params);
var ec2 = new AWS.EC2(params);
var elb = new AWS.ELB(params);
var asg = new AWS.AutoScaling(params);
var iam = new AWS.IAM(params);

function create_node(type, data, parent){

	var node = null;

	switch(type){
		case "Asg": return new Asg(data, parent);
		case "Instance": return new Instance(data, parent);
		case "InstanceProfile": return new InstanceProfile(data, parent);
		case "InternetGateway": return new InternetGateway(data, parent);
		case "LaunchConfig": return new LaunchConfig(data, parent);
		case "Elb": return new Elb(data, parent);
		case "Alarm": return new Alarm(data, parent);
		case "Topic": return new Topic(data, parent);
		case "Role": return new Role(data, parent);
		case "Route": return new Route(data, parent);
		case "RouteTable": return new RouteTable(data, parent);
		case "SecurityGroup": return new SecurityGroup(data, parent);
		case "Subnet": return new Subnet(data, parent);
		case "SubnetRouteTableAssoc": return new SubnetRouteTableAssoc(data, parent);
		case "VPC": return new VPC(data, parent);
		case "VPCGatewayAttach": return new VPCGatewayAttach(data, parent);
		case "RecordSetGroup": return new RecordSetGroup(data, parent);
	}
}

exports.Root = function(){

	this.type = 'root';
	this.name = 'Root';

	this.parent = null;
	this.children = [];

	this.update_children = function(callback){

		var self = this;

		this.children = [];

		cf.listStacks({
			StackStatusFilter: settings.stack_filter
		}, function(err, data){

			if(err){
				console.log('list_stacks cmd', err);
			}else{

			    var stacks = data.StackSummaries;
				stacks.forEach(function (stack){
					self.children.push(new Stack(stack, self));
				});

				callback();
			}
		});
	}
}

function Stack(data, parent){

	this.type = 'Stack';
	this.name = data.StackName;

	this.parent = parent;
	this.children = [];
}

Stack.prototype.update_children = function(callback){

	var self = this;

	this.children = [];

	cf.listStackResources({
			StackName: this.name,
		}, function(err, data) {
			if (err) console.log(err, err.stack);
			else{
				
				resources = data.StackResourceSummaries;

				resources.forEach(function(resource){

					var type = settings.lookup[resource.ResourceType];
					var node = create_node(type, resource, self);

					if(!node){
						console.log(
							'Couldnt create object from resource:', resource,
							'\n Yell at Shawn to fix that.');
					}else{
						self.children.push(node);
					}
				});

				callback();
			}
	});
}

function Asg(data, parent){

	this.type = 'Asg';
	this.name = data.LogicalResourceId;

	this.resource_id = data.PhysicalResourceId;

	this.parent = parent;
	this.children = [];
}

Asg.prototype.update_children = function(callback){

	var self = this;

	this.children = [];

	asg.describeAutoScalingGroups({
		AutoScalingGroupNames: [self.resource_id]
	}, function(err, data) {
		if (err){
			console.log(err, err.stack);
		}else{

			var instances = data.AutoScalingGroups[0].Instances;
			instances.forEach(function(instance){

				var node = create_node('Instance', instance, self);

				self.children.push(node);
			});

			callback();
		}
	});
}

function Instance(data, parent){

	var self = this;

	this.type = 'Instance';
	
	// determine if instance is a stack resource
	if(data.LogicalResourceId){
		this.name = data.LogicalResourceId;
		this.aws_id = data.PhysicalResourceId;
	}else{
		this.name = data.InstanceId;
		this.aws_id = data.InstanceId;
		this.status = data.HealthStatus;
		this.az = data.AvailabilityZone;
	}
	
	this.ip = null;

	ec2.describeInstances({
		InstanceIds: [this.aws_id]
	}, function(err, data) {
		if (err) console.log(err, err.stack);
		else{
			var instance = data.Reservations[0].Instances[0];

			if(instance.PublicIpAddress !== undefined){
				self.ip = instance.PublicIpAddress;
			}
		}
	});

	this.parent = parent;
	this.children = [];
}

Instance.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

Instance.prototype.ssh = function(callback){

	if(!this.name || !this.ip){
		console.log('Couldnt get the ip address for this instance.');
		return;
	}

	var command = "osascript -e 'tell application \"Terminal\"";
	command += " to activate' -e 'tell application \"System Events\"";
	command += " to tell process \"Terminal\" to keystroke \"t\" using";
	command += " command down' -e 'tell application \"Terminal\" to do script ";
	command += "\"echo " + this.name + " && ssh -o StrictHostKeyChecking=no -i ";
	command += settings.key_path + " " + settings.ssh_user + "@" + this.ip + "\"";
	command += " in selected tab of the front window'";

	var ssh = exec(command, function(){});
}

function InstanceProfile(data, parent){

	this.type = 'InstanceProfile';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

InstanceProfile.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

function InternetGateway(data, parent){

	this.type = 'cf_stack';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

InternetGateway.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

function LaunchConfig(data, parent){

	this.type = 'cf_stack';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

LaunchConfig.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

function Elb(data, parent){

	this.type = 'cf_stack';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

Elb.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

function Alarm(data, parent){

	this.type = 'cf_stack';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

Alarm.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

function Topic(data, parent){

	this.type = 'Topic';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

Topic.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

function Role(data, parent){

	this.type = 'Role';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

Role.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

function Route(data, parent){

	this.type = 'Route';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

Route.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

function RouteTable(data, parent){

	this.type = 'RouteTable';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

RouteTable.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

function SecurityGroup(data, parent){

	this.type = 'SecurityGroup';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

SecurityGroup.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

function Subnet(data, parent){

	this.type = 'Subnet';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

Subnet.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

function SubnetRouteTableAssoc(data, parent){

	this.type = 'SubnetRouteTableAssoc';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

SubnetRouteTableAssoc.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

function VPC(data, parent){

	this.type = 'VPC';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

VPC.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

function VPCGatewayAttach(data, parent){

	this.type = 'VPCGatewayAttach';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

VPCGatewayAttach.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

function RecordSetGroup(data, parent){

	this.type = 'RecordSetGroup';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

RecordSetGroup.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}