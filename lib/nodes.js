

var AWS = require('aws-sdk');
var settings = require('./settings');

var params = { region: settings.region };
var cf = new AWS.CloudFormation(params);
var elb = new AWS.ELB(params);
var asg = new AWS.AutoScaling(params);
var iam = new AWS.IAM(params);
var ec2 = new AWS.EC2(params);

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

exports.Root = function(root){

	this.type = 'root';
	this.name = 'Root';

	this.parent = null;
	this.children = [];

	this.update_children = function(callback){

		var self = this;

		this.children = [];

		if(root === 'cf'){
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
		}else if(root === 'ec2'){

			ec2.describeInstances({
				MaxResults: 20
			}, function(err, data){

				if(err){
					console.log('describe_instances cmd', err);
					callback();
				}else{

				    var reservations = data.Reservations;

				    reservations.forEach(function (reservation){
						reservation.Instances.forEach(function (instance){
							self.children.push(new Instance(instance, self));
						});
					});

					callback();
				}
			});
		}
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

			if(data.AutoScalingGroups.length > 0){
				var instances = data.AutoScalingGroups[0].Instances;
				instances.forEach(function(instance){
					var node = create_node('Instance', instance, self);
					self.children.push(node);
				});
				callback();
			}else{
				console.log('Looks like the auto scaling group does not exist anymore.');
				callback();
			}
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

Instance.prototype.info = function(callback){

	console.log();
	console.log(this.name);

	ec2.describeInstances({
		InstanceIds: [this.aws_id]
	}, function(err, data) {
		if (err){
			console.log(err);
			callback();
		}else{
			var i = data.Reservations[0].Instances[0];
			if(i){
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

			callback();
		}
	});
}

function Elb(data, parent){

	this.type = 'ElB';
	this.name = data.LogicalResourceId;
	this.id = data.PhysicalResourceId

	this.parent = parent;
	this.children = [];
}

Elb.prototype.update_children = function(callback){

	var self = this;

	this.children = [];

	var params = {
		LoadBalancerNames: [this.id],
	};
	elb.describeLoadBalancers(params, function(err, data) {
		if (err){
			console.log(err, err.stack);
			callback();
		}else{
			if(data.LoadBalancerDescriptions.length > 0){
				var instances = data.LoadBalancerDescriptions[0].Instances;
				instances.forEach(function(instance){

					var node = create_node('Instance', instance, self);
					self.children.push(node);
				});
				callback();
			}else{
				console.log('Looks like the ELB does not exist anymore.');
				callback();
			}
		}
	});
}

Elb.prototype.label = function(is_long){
	return [this.name];
}

/*
	Unimplemented
*/

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
