
/*
	nav.js
*/

var ec2_plugin = require('./ec2');

var ec2 = null;
var tree = null;

function Nav(_tree){
	tree = _tree;

	ec2 = new ec2_plugin(tree);

	this.cmds = [ 'cd', 'ls', 'type'];
}

Nav.prototype.do_cmd = function(args, callback){
	
	switch(args[0]){
		case 'ls': ls(args, callback); break;
		case 'cd': cd(args, callback); break;
		case 'type': type(args, callback); break;
		default: console.log('Don\'t recognize that command.');
	}
}

function cd(args, callback){

	var path = args[1];

	if(tree.current.type === "Instance"){
		ec2.do_cmd(args, callback);
		return;
	}

	if(!path){
		console.log('No path specified.');
		callback();
		return;
	}

	tree.get_node(path, function(node){
		if(node){
			tree.set_current(node);
		}
		callback();
	});
}

function ls(args, callback){

	var path = args[1];

	if(tree.current.type === "Instance"){
		ec2.do_cmd(args, callback);
		return;
	}

	var node;
	if(path){
		this.get_node(path, function(_node){

			if(_node){
				list_children(_node, function(){
					callback();
				});
			}else{
				console.log('That path does not exist.');
				callback();
			}
		});
	}else{
		node = tree.current;
		list_children(node, function(){
			callback();
		});
	}

	function list_children(_node, cb){

		// make sure all of the chilren are up to date
		_node.update_children(function(){
			
			console.log();
			for(var i = 0; i < _node.children.length; i++){
				console.log(_node.children[i].name);
			}
			console.log();

			cb();
		});
	}
}

function type(args, callback){
	console.log();
	console.log('Type: ' + tree.current.type);
	console.log();
	callback();
}

module.exports = Nav;
