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
	execute(command);
});

finish();

function execute(args){

	var cmd = args[0];

	// catch user trying to exit program
	if(cmd === 'exit' || cmd === 'quit'){
		console.log("Good bye");
		process.exit();
	}

	// execute the command if it exists, execs first found only
	for(var i = 0; i < plugins.length; i++){
		if(has_cmd(cmd, plugins[i].cmds)){
			plugins[i].do_cmd(args, finish);
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
}
