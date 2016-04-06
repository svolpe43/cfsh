
var AWS = require('aws-sdk');
var fs = require('fs');

var params = {region: 'us-east-1'};
var cf = new AWS.CloudFormation(params);

var temp_path = 'cf/';

function Ops(){}

Ops.prototype.mk = function(type, name, callback){

	// read from some params file

	fs.readFile(temp_path + type + '.json', function(err, data) {
        if (err){
            callback('Read template file:' + err);
        }else{

    	    var template_body = data.toString();

    	    cf.createStack({
    	    	StackName: name,
    	    	Capabilities: ['CAPABILITY_IAM'],
    	    	TemplateBody: template_body
    	    }, function(err, data) {
    	    	if (err){
    	    		callback(err);
    	    	}else{
    	    		callback();
    	    	}
    	    });
        }
	});
}

Ops.prototype.up = function(type, name, callback){

	fs.readFile(temp_path + type + '.json', function(err, data) {
        if (err){
            callback('Read template file:' + err);
        }else{

    	    var template_body = data.toString();

    	    cf.updateStack({
    	    	StackName: name,
    	    	Capabilities: ['CAPABILITY_IAM'],
    	    	TemplateBody: template_body
    	    }, function(err, data) {
    	    	if (err){
    	    		callback(err);
    	    	}else{
    	    		callback();
    	    	}
    	    });
        }
	});	
}

Ops.prototype.rm = function(stack_node, callback){

	cf.deleteStack({
		StackName: stack_node.name
	}, function(err, data){
		if(err){
			callback(err);
		}else{
			callback();
		}
	});
}

module.exports.Ops = Ops;