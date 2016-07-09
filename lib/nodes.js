

var AWS = require('aws-sdk');
var settings = require('./settings');

var params = { region: settings.region };
var cf = new AWS.CloudFormation(params);
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
		case "SecurityGroupIngress": return new SecurityGroupIngress(data, parent);
		case "HostedZone": return new HostedZone(data, parent);
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
				callback();
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
	this.status = data.StackStatus;

	this.parent = parent;
	this.children = [];
}

Stack.prototype.update_children = function(callback){

	var self = this;

	this.children = [];

	cf.listStackResources({
			StackName: this.name,
		}, function(err, data) {
			if (err){
				console.log(err, err.stack);
				callback();
			}else{
				
				resources = data.StackResourceSummaries;

				resources.forEach(function(resource){

					var type = settings.lookup[resource.ResourceType];
					var node = create_node(type, resource, self);

					if(node){
						self.children.push(node);
					}
				});

				callback();
			}
	});
}

Stack.prototype.label = function(is_long){
	if(is_long)
		return [this.name, this.status];
	else
		return [this.name];
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
			callback();
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

Asg.prototype.label = function(is_long){
	return [this.name];
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
	}

	if(data.LifecycleState){
		this.lifecycle_state = data.LifecycleState;
	}else{
		this.lifecycle_state = '';
	}

	if(data.HealthStatus){
		this.health_state = data.HealthStatus;
	}else{
		this.health_state = '';
	}

	this.parent = parent;
	this.children = [];
}

Instance.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

Instance.prototype.label = function(is_long){
	if(is_long)
		return [this.name, this.lifecycle_state, this.health_state];
	else
		return [this.name];
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

InstanceProfile.prototype.label = function(is_long){
	return [this.name];
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

InternetGateway.prototype.label = function(is_long){
	return [this.name];
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

LaunchConfig.prototype.label = function(is_long){
	return [this.name];
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

Elb.prototype.label = function(is_long){
	return [this.name];
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

Alarm.prototype.label = function(is_long){
	return [this.name];
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

Topic.prototype.label = function(is_long){
	return [this.name];
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

Role.prototype.label = function(is_long){
	return [this.name];
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

Route.prototype.label = function(is_long){
	return [this.name];
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

RouteTable.prototype.label = function(is_long){
	return [this.name];
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

SecurityGroup.prototype.label = function(is_long){
	return [this.name];
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

Subnet.prototype.label = function(is_long){
	return [this.name];
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

SubnetRouteTableAssoc.prototype.label = function(is_long){
	return [this.name];
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

VPC.prototype.label = function(is_long){
	return [this.name];
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

VPCGatewayAttach.prototype.label = function(is_long){
	return [this.name];
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

RecordSetGroup.prototype.label = function(is_long){
	return [this.name];
}

function SecurityGroupIngress(data, parent){

	this.type = 'SecurityGroupIngress';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

SecurityGroupIngress.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

SecurityGroupIngress.prototype.label = function(is_long){
	return [this.name];
}

function HostedZone(data, parent){

	this.type = 'SecurityGroupIngress';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

HostedZone.prototype.update_children = function(callback){
	var self = this;

	this.children = [];

	callback();
}

HostedZone.prototype.label = function(is_long){
	return [this.name];
}
