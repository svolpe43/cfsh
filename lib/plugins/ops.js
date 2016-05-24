

var aws = require('aws-sdk');
var fs = require('fs');

var params = {region: 'us-east-1'};
var cf = new aws.CloudFormation(params);

var temp_path = 'cf/';

var tree = null;
function Ops(_tree){

	tree = _tree;

	this.cmds = [ 'mk', 'up', 'rm' ];
}

Ops.prototype.do_cmd = function(args, opts, callback){
	
	switch(args[0]){
		case 'mk': mk(args, callback); break;
		case 'up': up(args, callback); break;
		case 'rm': rm(args, callback); break;
		default: console.log('FDon\'t recognize that command.');
	}
}

function mk(args, callback){

	if(args.length !== 3){
		console.log('Usage: mk <type> <name>');
		callback();
		return;
	}

	var type = args[1];
	var stack_name = args[2];

	fs.readFile(temp_path + type + '.json', function(err, data) {
        if (err){
            console.log('Check the type and try again.', err);
            callback();
        }else{

    	    var template_body = data.toString();

    	    cf.createStack({
    	    	StackName: stack_name,
    	    	Capabilities: ['CAPABILITY_IAM'],
    	    	TemplateBody: template_body
    	    }, function(err, data) {
    	    	if (err){
    	    		console.log(err);
    	    	}
    	    	callback();
    	    });
        }
	});
}

function up(args, callback){

	if(args.length !== 3){
		console.log('Usage: up <type> <name>');
		callback();
		return;
	}

	var type = args[1];
	var rel_path = args[2];

	tree.get_node('/' + rel_path, function(node){

		if(node){
			fs.readFile(temp_path + rel_path + '.json', function(err, data) {

				if (err){
					console.log('Check the type and try again.', err);
				}else{

					var template_body = data.toString();

					cf.updateStack({
						StackName: node.name,
						Capabilities: ['CAPABILITY_IAM'],
						TemplateBody: template_body
					}, function(err, data) {
						if (err){
							console.log(err);
						}
						callback();
					});
				}
			});
		}else{
			console.log('Stack not found.');
			callback();
		}
	});
}

function rm(args, callback){

	var stack_name = args[1];

	if(!stack_name){
		console.log('Usage: rm <name>');
		callback();
		return;
	}

	console.log('Removing:');

	var delete_all = false;
	if(stack_name[stack_name.length - 1] === '*'){
		delete_all = true;
		stack_name = stack_name.substring(0, stack_name.length - 1);
	}

	tree.get_node('/' + stack_name, function(nodes){

		if(!nodes){
			callback();
		}

		// this is weird but I wanted ot return just
		// the node if there was one so I didnt have
		// to change every other module also
		if(nodes.length === 1){
			cf.deleteStack({
				StackName: nodes[0].name
			}, function(err, data){
				if(err){
					console.log(err);
				}
				callback();
			});
		} else if(nodes.length > 1 && delete_all){
			var cur_done = 0;
			for(var i = 0; i < nodes.length; i++){
				cf.deleteStack({
					StackName: nodes[i].name
				}, function(err, data){
					if(err){
						console.log(err);
						callback();
					}else{
						cur_done++;
						if(nodes.length === cur_done){
							callback();
						}
					}
				});
			}
		}else if (nodes.length > 1){
			callback();
		}else{
			console.log(stack_name + ' not found.');
			callback();
		}
	});
}

module.exports = Ops;
