
/*
	nav.js
*/

var AWS = require('aws-sdk');
var settings = require('../settings');

var params = { region: settings.region };
var cf = new AWS.CloudFormation(params);

const default_column_len = 32;

var tree = null;

function Stack(_tree){
	tree = _tree;

	this.cmds = ['events', 'params', 'tags', 'outputs'];
}

Stack.prototype.do_cmd = function(args, opts, callback){
	
	switch(args[0]){
		case 'events': events(args, callback); break;
		case 'params': parameters(args, callback); break;
		case 'tags': tags(args, callback); break;
		case 'outputs': outputs(args, callback); break;
		default: console.log('Don\'t recognize that command.');
	}
}

function events(args, callback){
	var stack = tree.current;

	if(stack.type === "root"){
		console.log("Must select a stack node first.");
		callback();
		return;
	}

	while(stack.type != "Stack"){
		stack = stack.parent;
	}

	cf.describeStackEvents({
	  StackName: stack.name
	}, function(err, data) {
		if (err) console.log(err, err.stack);
		else{
			var events = data.StackEvents;

			if(events.length === 0){
				console.log('No events on this stack.');
				callback();
				return;
			}

			for(var i = 0; i < events.length; i++){
				var e = events[i];
				console.log(pad(e.ResourceType, 40) + pad(e.ResourceStatus, 40) + pad(e.ResourceStatusReason, 40));
			}
		}

		callback();
	});
}

function parameters(args, callback){

	var stack = tree.current;

	if(stack.type === "root"){
		console.log("Must select a stack node first.");
		callback();
		return;
	}

	while(stack.type != "Stack"){
		stack = stack.parent;
	}

	cf.describeStacks({
	  StackName: stack.name
	}, function(err, data) {
		if (err) console.log(err, err.stack);
		else{
			var params = data.Stacks[0].Parameters;

			if(params.length === 0){
				console.log('No parameters on this stack.');
				callback();
				return;
			}

			console.log();
			for(var i = 0; i < params.length; i++){
				console.log(pad(params[i].ParameterKey + ':') + pad(params[i].ParameterValue));
			}
			console.log();
		}

		callback();
	});
}

function tags(args, callback){

	var stack = tree.current;

	if(stack.type === "root"){
		console.log("Must select a stack node first.");
		callback();
		return;
	}

	while(stack.type != "Stack"){
		stack = stack.parent;
	}

	cf.describeStacks({
	  StackName: stack.name
	}, function(err, data) {
		if (err) console.log(err, err.stack);
		else{
			var tags = data.Stacks[0].Tags;

			if(tags.length === 0){
				console.log('No tags on this stack.');
				callback();
				return;
			}

			for(var i = 0; i < tags.length; i++){
				console.log(pad(tags[i].Key + ':', 20) + pad(tags[i].Value));
			}
		}

		callback();
	});
}

function outputs(args, callback){

	var stack = tree.current;

	if(stack.type === "root"){
		console.log("Must select a stack node first.");
		callback();
		return;
	}

	while(stack.type != "Stack"){
		stack = stack.parent;
	}

	cf.describeStacks({
	  StackName: stack.name
	}, function(err, data) {
		if (err) console.log(err, err.stack);
		else{
			var outputs = data.Stacks[0].Outputs;

			if(outputs.length === 0){
				console.log('No outputs on this stack.');
				callback();
				return;
			}

			console.log();
			for(var i = 0; i < outputs.length; i++){
				console.log(pad(outputs[i].OutputKey + ':') + pad(outputs[i].OutputValue));
			}
			console.log();
		}

		callback();
	});
}

function pad(string, total){
	if(string === undefined){
		string = "";
	}

	if(!total){
		total = default_column_len;
	}

	var spaces = total - string.length;
	for(var i = 0; i < spaces; i++)
		string += " ";
	return string;
}

module.exports = Stack;