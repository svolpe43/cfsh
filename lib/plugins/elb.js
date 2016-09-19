
var AWS = require('aws-sdk');

var settings = require('../settings');

var params = { region: settings.region };
var elb = new AWS.ELB(params);

var tree = null;

function Elb(_tree){
	tree = _tree;

	this.cmds = ['dereg', 'reg'];
}

// all plugins must have a do_cmd function, this is the entry point
Elb.prototype.do_cmd = function(args, opts, callback){
	
	switch(args[0]){
		case 'dereg': dereg(args, opts, callback); break;
		case 'reg': reg(args, opts, callback); break;
		default: console.log('Don\'t recognize that command.');
	}
}

// command to remove an instance from an elb
function dereg(args, opts, callback){

	if(tree.current.type === "Elb"){
		console.log("Must select an Elb first.");
		callback();
		return;
	}

	if(args[1]){
		tree.get_node(args[1], function(node){
			if(node && node.type === 'Instance'){
				var params = {
					Instances: [{
						InstanceId: node.name
					}],
					LoadBalancerName: tree.current.id
				};
				elb.deregisterInstancesFromLoadBalancer(params, function(err, data) {
					if (err){
						console.log(err, err.stack);
					}else{
						console.log(node.name + ' removed from Elb.');
					}
					callback();
				});
			}else{
				console.log('Cannot find that instance.');
				callback();
			}
		});
	}else{
		console.log("Must provide an instance to remove.");
		callback();
	}
}

// command to add an instance from an elb
function reg(args, opts, callback){

	if(tree.current.type === "Elb"){
		console.log("Must select an Elb first.");
		callback();
		return;
	}

	if(args[1]){
		var params = {
			Instances: [{
				InstanceId: args[1]
			}],
			LoadBalancerName: tree.current.id
		};
		elb.registerInstancesWithLoadBalancer(params, function(err, data) {
			if (err){
				console.log(err, err.stack);
			}else{
				console.log(args[1] + ' added to Elb.');
			}
			callback();
		});
	}else{
		console.log("Must provide an instance to add.");
		callback();
	}
}

module.exports = Elb;
