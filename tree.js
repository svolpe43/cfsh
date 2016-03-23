
/*
	tree.js - holds a trie data structure of aws nodes
*/

var node = require('./nodes');
var l = require('winston');

var root;
var current;
var current_path;

var Tree = function(){

	root = new node.Root();
	current = root;
	current_path = '/';

	this.current_path = function(){
		return current_path;
	}
}

Tree.prototype.cd = function(path, callback){

	if(!path){
		console.log('No path specified.');
		callback();
		return;
	}

	get_node(path, function(node){
		
		if(!node){

			console.log('Path not found.');
			callback();
		}else{

			current = node;
			current_path = create_path(current);

			callback();
		}
	});
}

Tree.prototype.ls = function(path, callback){

	var node;

	if(path){
		node = get_node(path);
	}else{
		node = current;
	}

	if(node){

		l.debug('Node:', node);

		// make sure all of the chilren are up to date
		node.update_children(function(){

			console.log();
			for(var i = 0; i < node.children.length; i++){
				console.log(node.children[i].name);
			}
			console.log();

			callback();
		});
	}else{
		console.log('That path does not exist.');
	}
}

// paths are in the form /stack_name/logical_id/logical_id
function get_node(path, callback){

	var cur = null;

	if(!path){
		return null;
	}else if(path[0] === '/'){
		cur = root;
	}else{
		cur = current;
	}

	var segments = path.split('/');

	get_node_recursive(cur, 0, segments, function(node){
		callback(node);
	});
}

function get_node_recursive(cur, cur_seg, segments, callback){

	if(cur_seg === segments.length){
		callback(cur);
	}

	if(segments[cur_seg] === '..'){
		callback(cur.parent, cur_seg + 1, segments, callback);
		return;
	}else{

		cur.update_children(function(){

			for(var j = 0; j < cur.children.length; j++){

				if(cur.children[j].name === segments[cur_seg]){
					cur = cur.children[j];
					callback(cur, cur_seg + 1, segments, callback);
					return;
				}
			}

			console.log(
				cur.name,
				'does not have a child',
				segments[cur_seg]);

			callback(null);
		});
	}
}

function create_path(leaf){

	var current = leaf;
	var path = '';

	if(current.parent === null){
		return '/';
	}

	while(current.parent !== null){
		path += current.name + '/';
		current = current.parent;
	}

	return path.split('/').reverse().join('/');
}

module.exports.Tree = Tree;
