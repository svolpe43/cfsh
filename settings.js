
/*
	settings.js -  a list of settings for cloudNG
*/

exports.module = {

	lookup : {
		"AWS::AutoScaling::AutoScalingGroup" : "AutoScalingGroup",
		"AWS::Route53::HostedZone" : "HostedZone",
		"AWS::EC2::Instance" : "EC2Instance",
		"AWS::IAM::InstanceProfile" : "InstanceProfile",
		"AWS::AutoScaling::LaunchConfiguration" : "LaunchConfig",
		"AWS::ElasticLoadBalancing::LoadBalancer" : "LoadBalancer",
		"AWS::Route53::RecordSetGroup" : "RecordSetGroup",
		"AWS::Route53::RecordSet" : "RecordSet",
		"AWS::IAM::Role" : "Role",
		"AWS::EC2::Route" : "Route",
		"AWS::EC2::RouteTable" : "RouteTable",
		"AWS::EC2::SecurityGroup" : "SecurityGroup",
		"AWS::EC2::SubnetRouteTableAssociation" : "SubnetTableAssoc",
		"AWS::EC2::Subnet" : "Subnet",
		"AWS::RDS::DBSubnetGrou" : "DBSubnet",
		"AWS::SNS::Topic" : "SNSTopic",
		"AWS::EC2::VPC" : "VPC",
		"AWS::EC2::VPCGatewayAttachment" : "VPCGateAttach",
		"AWS::CloudWatch::Alarm" : "CWAlarm",
		"AWS::Route53::HealthCheck" : "53HealthCheck",
		"AWS::EC2::InternetGateway" : "INetGateway",
		"AWS::RDS::DBInstance" : "DBInstance",
		"AWS::SQS::Queue" : "SQSQueue",
		"AWS::RDS::DBSubnetGroup" : "DBSubnetGroup"
	},

	key_path : "/Users/shawn.volpe/.ssh/search-rage.pem",
	ssh_user : "ubuntu"
}