#!/usr/bin/env node

/*
	main.js - the entry point to the program
*/

var fs = require('fs');

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

	execute(command);
});

finish();

function execute(str){
	
	var cmds = str.split(/\s+/);

	// catch user trying to exit program
	if(cmds[0] === 'exit' || cmds[0] === 'quit'){
		console.log("Good bye");
		process.exit();
	}

	// execute the command if it exists, execs first found only
	for(var i = 0; i < plugins.length; i++){
		if(has_cmd(cmds[0], plugins[i].cmds)){
			plugins[i].do_cmd(cmds, finish);
			return;
		}
	}

	// complain if we don't have that command
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

	// the paths length plus the end marker
	return path.length + 2;
}
