
var settings = require('../settings');

var tree = null;

function Util(_tree){
	tree = _tree;

	this.cmds = ['grep'];
}

// all plugins must have a do_cmd function, this is the entry point
Util.prototype.do_cmd = function(args, opts, callback, is_down_stream, data){
	
	switch(args[0]){
		case 'grep': grep(args, opts, callback, is_down_stream, data); break;
		default: console.log('Don\'t recognize that command.');
	}
}

function grep(args, opts, callback, is_down_stream, data){

	if(!args[1]){
		args[1] = '.*';
	}

	if(surrounded(args[1], '"') || surrounded(args[1], "'")){
		args[1] = args[1].slice(1, -1).split(' ');
	}

	function surrounded(str, ch){
		return (str[0] === ch && str[str.length - 1] === ch);
	}

	var reverse = false;
	for(var i = 0; i < opts.length; i++){
		if(opts[i] === 'v'){
			reverse = true;
		}
	}

	if(data){
		console.log();
		for(var i = 0; i < data.length; i++){
			var regex = new RegExp(args[1]);
			var match = (reverse) ? !regex.test(data[i]): regex.test(data[i]);
    		if (match) {
				console.log(data[i]);
			}
		}
		console.log();
	}
	callback();
}

module.exports = Util;
