

var AWS = require('aws-sdk');
var settings = require('./settings');

var params = { region: settings.region };
var cf = new AWS.CloudFormation(params);
var ec2 = new AWS.EC2(params);
var elb = new AWS.ELB(params);
var asg = new AWS.AutoScaling(params);
var iam = new AWS.IAM(params);

function create_node(data, parent){

	var node = null;

	switch(settings.lookup[data.ResourceType]){
		case "Asg": return new Asg(data, parent);
		case "InstanceProfile": return new InstanceProfile(data, parent);
		case "InternetGateway": return new InternetGateway(data, parent);
		case "LaunchConfig": return new LaunchConfig(data, parent);
		case "Elb": return new Elb(data, parent);
		case "Alarm": return new Alarm(data, parent);
		case "MonTopic": return new MonTopic(data, parent);
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

	cf.listStackResources({
			StackName: this.name,
		}, function(err, data) {
			if (err) console.log(err, err.stack);
			else{
				
				resources = data.StackResourceSummaries;

				resources.forEach(function(resource){

					var node = create_node(resource, self);
					self.children.push(node);
				});

				callback();
			}
	});
}

function Asg(data, parent){

	this.type = 'Asg';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

Asg.prototype.update_children = function(callback){
	var self = this;
}

function InstanceProfile(data, parent){

	this.type = 'InstanceProfile';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

InstanceProfile.prototype.update_children = function(callback){
	var self = this;
}

function InternetGateway(data, parent){

	this.type = 'cf_stack';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

InternetGateway.prototype.update_children = function(callback){
	var self = this;
}

function LaunchConfig(data, parent){

	this.type = 'cf_stack';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

LaunchConfig.prototype.update_children = function(callback){
	var self = this;
}

function Elb(data, parent){

	this.type = 'cf_stack';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

Elb.prototype.update_children = function(callback){
	var self = this;
}

function Alarm(data, parent){

	this.type = 'cf_stack';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

Alarm.prototype.update_children = function(callback){
	var self = this;
}

function MonTopic(data, parent){

	this.type = 'MonTopic';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

MonTopic.prototype.update_children = function(callback){
	var self = this;
}

function Role(data, parent){

	this.type = 'Role';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

Role.prototype.update_children = function(callback){
	var self = this;
}

function Route(data, parent){

	this.type = 'Route';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

Route.prototype.update_children = function(callback){
	var self = this;
}

function RouteTable(data, parent){

	this.type = 'RouteTable';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

RouteTable.prototype.update_children = function(callback){
	var self = this;
}

function SecurityGroup(data, parent){

	this.type = 'SecurityGroup';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

SecurityGroup.prototype.update_children = function(callback){
	var self = this;
}

function Subnet(data, parent){

	this.type = 'Subnet';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

Subnet.prototype.update_children = function(callback){
	var self = this;
}

function SubnetRouteTableAssoc(data, parent){

	this.type = 'SubnetRouteTableAssoc';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

SubnetRouteTableAssoc.prototype.update_children = function(callback){
	var self = this;
}

function VPC(data, parent){

	this.type = 'VPC';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

VPC.prototype.update_children = function(callback){
	var self = this;
}

function VPCGatewayAttach(data, parent){

	this.type = 'VPCGatewayAttach';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

VPCGatewayAttach.prototype.update_children = function(callback){
	var self = this;
}

function RecordSetGroup(data, parent){

	this.type = 'RecordSetGroup';
	this.name = data.LogicalResourceId;

	this.parent = parent;
	this.children = [];
}

RecordSetGroup.prototype.update_children = function(callback){
	var self = this;
}