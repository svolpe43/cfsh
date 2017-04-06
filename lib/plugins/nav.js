
/*
	nav.js
*/

var main = require('../main');

var tree = null;

function Nav(_tree){
	tree = _tree;

	this.cmds = [ 'cd', 'ls', 'type', 'history'];
}

Nav.prototype.do_cmd = function(args, opts, callback, is_down_stream, data){
	
	switch(args[0]){
		case 'ls': ls(args, opts, callback, is_down_stream, data); break;
		case 'cd': cd(args, callback); break;
		case 'type': type(args, callback); break;
		case 'history': history(args, callback); break;
		default: console.log('Don\'t recognize that command.');
	}
}

function cd(args, callback){

	var path = (args[1]) ? args[1] : '/';

	tree.get_node(path, function(node){
		if(node){
			tree.set_current(node);
		}else{
			console.log('Path not found.');
		}
		callback();
	});
}

function ls(args, opts, callback, is_down_stream){

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
				list_children(is_down_stream, _node, is_long, callback);
			}else{
				console.log('That path does not exist.');
				callback();
			}
		});
	}else{
		node = tree.current;
		list_children(is_down_stream, node, is_long, callback);
	}
}

function history(args, callback){

	var hist = main.get_history();

	var num = hist.length;
	if(args[1]){
		num = Number(args[1]);
	}

	console.log();
	for(var i = hist.length - num; i < hist.length; i++){
		if(i > -1){
			console.log(hist[i]);
		}
	}
	console.log();

	callback();
}

function list_children(is_down_stream, _node, is_long, cb){

	// make sure all of the chilren are up to date
	_node.update_children(function(){

		if(!is_down_stream){
			console.log();
		}

		var data = [];
		for(var i = 0; i < _node.children.length; i++){

			var text = _node.children[i].label(is_long);

			if(is_down_stream){
				data.push(text.join(' '));
			}else{
				process.stdout.write(name_padding(6, '[' + (i + 1) + ']'));
				for(var j = 0; j < text.length; j++){
					process.stdout.write(name_padding(32, text[j]));
				}
				console.log();
			}
		}

		if(!is_down_stream){
			console.log();
		}

		cb(data);
	});
}

function type(args, callback){
	console.log();
	console.log('Type: ' + tree.current.type);
	console.log();
	callback();
}

function name_padding(col_len, string){
	if(string === undefined){
		string = "";
	}

	var spaces = col_len - string.length;
	for(var i = 0; i < spaces; i++)
		string += " ";
	return string;
}

module.exports = Nav;
