
/*
	settings.js -  a list of settings for cloud
*/

var argv = require('optimist').argv;

// make sure the aws region is set
var region;
if(argv.r !== undefined){
	region = argv.r;
}else{
	region = 'us-east-1'
}

module.exports = {

	path_color : '\u001b[34m',
	end_marker_color : '\u001b[36m',

	plugins : [
		'nav', 'ops', 'ec2', 'stack', 'help', 'elb'
	],

	ssh_user : 'ubuntu',
	region : region,

	lookup : {
		'AWS::AutoScaling::AutoScalingGroup' : 'Asg',
		'AWS::Route53::HostedZone' : 'HostedZone',
		'AWS::EC2::Instance' : 'Instance',
		'AWS::IAM::InstanceProfile' : 'InstanceProfile',
		'AWS::AutoScaling::LaunchConfiguration' : 'LaunchConfig',
		'AWS::ElasticLoadBalancing::LoadBalancer' : 'Elb',
		'AWS::Route53::RecordSetGroup' : 'RecordSetGroup',
		'AWS::Route53::RecordSet' : 'RecordSet',
		'AWS::IAM::Role' : 'Role',
		'AWS::EC2::Route' : 'Route',
		'AWS::EC2::RouteTable' : 'RouteTable',
		'AWS::EC2::SecurityGroup' : 'SecurityGroup',
		'AWS::EC2::SubnetRouteTableAssociation' : 'SubnetRouteTableAssoc',
		'AWS::EC2::Subnet' : 'Subnet',
		'AWS::RDS::DBSubnetGroup' : 'DBSubnet',
		'AWS::SNS::Topic' : 'Topic',
		'AWS::EC2::VPC' : 'VPC',
		'AWS::EC2::VPCGatewayAttachment' : 'VPCGatewayAttach',
		'AWS::CloudWatch::Alarm' : 'Alarm',
		'AWS::Route53::HealthCheck' : 'HealthCheck',
		'AWS::EC2::InternetGateway' : 'InternetGateway',
		'AWS::RDS::DBInstance' : 'DBInstance',
		'AWS::SQS::Queue' : 'Queue',
		'AWS::RDS::DBSubnetGroup' : 'DBSubnetGroup',
		'AWS::Route53::HostedZone' : 'HostedZone',
		'AWS::EC2::SecurityGroupIngress' : 'SecurityGroupIngress'
	},

	stack_filter: [
		'CREATE_COMPLETE',
		'UPDATE_COMPLETE',
		'CREATE_IN_PROGRESS',
		'CREATE_FAILED',
		'CREATE_COMPLETE',
		'ROLLBACK_IN_PROGRESS',
		'ROLLBACK_FAILED',
		'ROLLBACK_COMPLETE',
		'DELETE_IN_PROGRESS',
		'DELETE_FAILED',
		'UPDATE_IN_PROGRESS',
		'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
		'UPDATE_COMPLETE',
		'UPDATE_ROLLBACK_IN_PROGRESS',
		'UPDATE_ROLLBACK_FAILED',
		'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS',
		'UPDATE_ROLLBACK_COMPLETE'
	],

	osa_ssh_command: 'osascript -e \'tell application "Terminal" to activate\' -e \'tell application "System Events" to tell process "Terminal" to keystroke "t" using command down\' -e \'tell application "Terminal" to do script "{{{command}}}" in selected tab of the front window\'',

	linux_ssh_command: 'xdotool key ctrl+shift+t sleep 2 type \'{{{command}}}\n\'',

	proxy_alias: 'bastion'

}
