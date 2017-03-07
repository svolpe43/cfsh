
/*
	tree.js - holds a trie data structure of aws nodes
*/

var node = require('./nodes');

var Tree = function(){
	this.root = new node.Root();
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
Tree.prototype.get_node = function(path, callback){

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

	get_node_recursive(cur, 0, segments, callback);
}

function get_node_recursive(cur, cur_seg, segments, callback){

	if(cur_seg === segments.length){
		callback(cur);
		return;
	}

	if(segments[cur_seg] === '..'){
		get_node_recursive(cur.parent, cur_seg + 1, segments, callback);
		return;
	// if the segment is a number choose that indexed child
	}else if(!isNaN(segments[cur_seg])){
		var num = +segments[cur_seg];
		cur.update_children(function(){
			if(num > 0 && num <= cur.children.length){
				get_node_recursive(cur.children[num - 1], cur_seg + 1, segments, callback);
			}else{
				callback(null);
			}
		});
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

			// if we have one just return it
			if(possible.length === 1){
				get_node_recursive(possible[0], cur_seg + 1, segments, callback);

			// if there are more that 1 log the list and return null
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

module.exports = new Tree();
