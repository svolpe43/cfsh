
/*
	nav.js
*/

const column_len = 32;

var tree = null;

function Nav(_tree){
	tree = _tree;

	this.cmds = [ 'cd', 'ls', 'type'];
}

Nav.prototype.do_cmd = function(args, opts, callback){
	
	switch(args[0]){
		case 'ls': ls(args, opts, callback); break;
		case 'cd': cd(args, callback); break;
		case 'type': type(args, callback); break;
		default: console.log('Don\'t recognize that command.');
	}
}

function cd(args, callback){

	var path = args[1];

	if(!path){
		console.log('No path specified.');
		callback();
		return;
	}

	tree.get_node(path, function(node){
		if(node){
			tree.set_current(node);
		}else{
			console.log('Path no found.')
		}
		callback();
	});
}

function ls(args, opts, callback){

	var path = args[1];

	var is_long = false;
	for(var i = 0; i < opts.length; i++){
		if(opts[i] === 'l'){
			is_long = true;
		}
	}

	var node;
	if(path){
		tree.get_node(path, function(_node){

			if(_node){
				list_children(_node, is_long, callback);
			}else{
				console.log('That path does not exist.');
				callback();
			}
		});
	}else{
		node = tree.current;
		list_children(node, is_long, callback);
	}
}

function list_children(_node, is_long, cb){

	// make sure all of the chilren are up to date
	_node.update_children(function(){
		
		console.log();
		for(var i = 0; i < _node.children.length; i++){
			var text = _node.children[i].label(is_long);

			for(var j = 0; j < text.length; j++){
				process.stdout.write(name_padding(text[j]));
			}
			console.log();
		}
		console.log();

		cb();
	});
}

function type(args, callback){
	console.log();
	console.log('Type: ' + tree.current.type);
	console.log();
	callback();
}

function name_padding(string){
	if(string === undefined){
		string = "";
	}

	var spaces = column_len - string.length;
	for(var i = 0; i < spaces; i++)
		string += " ";
	return string;
}

module.exports = Nav;
