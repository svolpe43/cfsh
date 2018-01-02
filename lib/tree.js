
/*
	tree.js - holds a trie data structure of aws nodes
*/

var node = require('./nodes');

var Tree = function(root){
	this.root = new node.Root(root);
	this.current = this.root;
	this.last_location = this.root;
	this.current_path = '/';
}

Tree.prototype.set_current = function(node){
	if(node){
		this.last_location = this.current;
		this.current = node;
		this.current_path = create_path(this.current);
	}
}

// paths are in the form /stack_name/logical_id/logical_id
Tree.prototype.get_node = function(path, callback, multi){

	var cur = null;

	if(!path){
		return null;
	}else if(path === '-'){
		callback(this.last_location);
		return;
	}else if(path[0] === '/'){
		cur = this.root;

		if(path.length === 1){
			callback(cur);
			return;
		}

		// knock off the leading /
		path = path.slice(1);
	}else{
		cur = this.current;
	}

	// take off trailing / chars
	if(path.slice(-1) === "/"){
		path = path.substring(0, path.length - 1);
	}

	var segments = path.split('/');

	get_node_recursive(cur, 0, segments, callback, multi);
}

function get_node_recursive(cur, cur_seg, segments, callback, multi){

	var segment = segments[cur_seg];

	if(cur_seg === segments.length || cur.length > 0){
		callback(cur);
		return;
	}

	// return list of nodes if segment is a number range
	if(multi && segment.split('-').length === 2){
		range_select(segment, cur, function(list){
			if(list && list.length > 0){
				callback(list);
			}else{
				callback(null);
			}
		});
		return;
	}

	// return a single node is a number is passed in
	if(!isNaN(segments[cur_seg])){
		number_select(segment, cur, function(node){
			if(node){
				get_node_recursive(node, cur_seg + 1, segments, callback);
			}else{
				callback(null);
			}
		});
		return;
	}

	// return the parent if segment is unix ..
	if(segment === '..'){
		get_node_recursive(cur.parent, cur_seg + 1, segments, callback);
		return;
	}

	// fall back to node selection by name
	name_select(segment, cur, function(node){
		if(node){
			get_node_recursive(node, cur_seg + 1, segments, callback);
		}else{
			callback(null);
		}
	});
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

function name_select(segment, cur_node, callback){

	cur_node.update_children(function(){

		var possible = [];

		for(var i = 0; i < cur_node.children.length; i++){
			var child = cur_node.children[i];
			if(child.name === segment){
				callback(child);
				return;
			}else if(child.name.substring(0, segment.length) === segment){
				possible.push(child);
			}
		}

		// if we have one just return it
		if(possible.length === 1){
			callback(possible[0]);
		}else{
			// if there are more that 1 log the list and return null
			if(possible.length > 1){
				output_possible_nodes(possible);
			}
			callback(null);
		}
	});
}

function range_select(segment, cur_node, callback){
	var range = segment.split('-');
	var min = +range[0] - 1;
	var max = +range[1];

	cur_node.update_children(function(){
		if(check(min, cur_node.children) && check(max, cur_node.children)){
			callback(cur_node.children.slice(min, max));
		}else{
			callback(null);
		}
	});
}

function number_select(segment, cur_node, callback){
	var num = +segment - 1;
	cur_node.update_children(function(){
		if(num >= 0 && num <= cur_node.children.length){
			callback(cur_node.children[num]);
		}else{
			callback(null);
		}
	});
}

function output_possible_nodes(possible){
	console.log();
	for(var i = 0; i < possible.length; i++){
		console.log(possible[i].name);
	}
	console.log();
}

function check(num, array){
	return num >= 0 && num <= array.length;
}

module.exports = Tree;
