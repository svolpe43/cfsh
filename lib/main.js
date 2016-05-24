#!/usr/bin/env node

/*
	main.js - the entry point to the program
*/

var tree = require('./tree');
var settings = require('./settings');

// load all plugins
var plugins = [];
for(var i = 0; i < settings.plugins.length; i++){
	var Plug = require('./plugins/' + settings.plugins[i]);
	plugins.push(new Plug(tree));
}

// setup the input stream
require('./input')(function(command){

	if(!command){
		finish(); return;
	}

	// expand command using aliases
	for(var key in settings.aliases){
		if(key === command){
			command = settings.aliases[key];
		}
	}

	execute(command);
});

finish();

function execute(str){
	
	var parts = str.split(/\s+/);
	var cmds = [];
	var opts = [];

	// catch user trying to exit program
	if(parts[0] === 'exit' || parts[0] === 'quit'){
		console.log("Good bye");
		process.exit();
	}

	for(var j = 0; j < parts.length; j++){
		if(parts[j][0] === '-'){
			opts.push(parts[j].substring(1, parts[j].length));
		}else{
			cmds.push(parts[j])
		}
	}

	// execute the command if it exists, execs first found only
	for(var i = 0; i < plugins.length; i++){
		if(has_cmd(cmds[0], plugins[i].cmds)){
			plugins[i].do_cmd(cmds, opts, finish);
			return;
		}
	}

	// only gets here if the command didn't exist
	console.log('Don\'t recognize that command.');
	finish();
}

function has_cmd(cmd, cmds){
	for(var i = 0; i < cmds.length; i++){
		if(cmds[i] === cmd){
			return true;
		}
	}
	return false;
}

// set up console for next command
function finish(){

	var path = tree.current_path;

	// add color
	var cwd = settings.path_color + path;
	cwd += settings.end_marker_color + "#:";

	// reset color
	cwd += "\u001b[0m";
	process.stdout.write(cwd);
}

module.exports.get_plugins = function(){
	return plugins;
}

