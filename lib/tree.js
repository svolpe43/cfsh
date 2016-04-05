
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
		
		if(node){

			current = node;
			current_path = create_path(current);
		}

		callback();
	});
}

Tree.prototype.ls = function(path, callback){

	var node;

	if(path){
		get_node(path, function(_node){

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
		node = current;
		list_children(node, function(){
			callback();
		});
	}

	function list_children(_node, callback){
		// make sure all of the chilren are up to date
		_node.update_children(function(){
			
			console.log();
			for(var i = 0; i < _node.children.length; i++){
				console.log(_node.children[i].name);
			}
			console.log();

			callback();
		});
	}
}

Tree.prototype.ssh = function(options, callback){

	if(current.type === 'Instance'){
		current.ssh()
	}else{
		console.log('Cannot ssh on that type of resource.');
	}

	callback();
}

// paths are in the form /stack_name/logical_id/logical_id
function get_node(path, callback){

	var cur = null;

	if(!path){
		return null;
	}else if(path[0] === '/'){
		cur = root;

		if(path.length === 1){
			callback(cur);
			return;
		}
	}else{
		cur = current;
	}

	// take of trailing / chars
	if(path.slice(-1) === "/"){
		path = path.substring(0, path.length - 1);
	}

	var segments = path.split('/');

	get_node_recursive(cur, 0, segments, function(node){
		callback(node);
	});
}

function get_node_recursive(cur, cur_seg, segments, callback){

	if(cur_seg === segments.length){
		callback(cur);
		return;
	}

	if(segments[cur_seg] === '..'){
		get_node_recursive(cur.parent, cur_seg + 1, segments, callback);
		return;
	}else{

		cur.update_children(function(){

			var possible = [];
			var segment_len = segments[cur_seg].length;

			for(var j = 0; j < cur.children.length; j++){

				if(cur.children[j].name === segments[cur_seg]){
					cur = cur.children[j];
					get_node_recursive(cur, cur_seg + 1, segments, callback);
					return;
				}else if(cur.children[j].name.substring(0, segment_len) === segments[cur_seg]){
					possible.push(cur.children[j]);
				}
			}

			if(possible.length === 1){
				get_node_recursive(possible[0], cur_seg + 1, segments, callback);
			}else if(possible.length > 1){
				console.log();
				for(var i = 0; i < possible.length; i++){
					console.log(possible[i].name);
				}
				console.log();

				callback(null);
			}else{
				callback(null);
			}
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