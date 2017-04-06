#!/usr/bin/env node

/*
	main.js - the entry point to the program
*/
var fs = require('fs');
var argv = require('optimist').argv;

// make sure the aws profile is set
if(argv.p !== undefined){
	process.env.AWS_PROFILE = argv.p;
}

var tree = require('./tree');
var settings = require('./settings');

// set up data dir
if (!fs.existsSync(process.env.HOME + '/.cfsh')){
    fs.mkdirSync(process.env.HOME + '/.cfsh');
}

// load all plugins
var plugins = [];
for(var i = 0; i < settings.plugins.length; i++){
	var Plug = require('./plugins/' + settings.plugins[i]);
	plugins.push(new Plug(tree));
}

// setup the input stream
var history;
require('./input')(function(_history){
	history = _history;
}, function(command){

	if(!command){
		finish(); return;
	}

	// parse command into an array
	var chain = [''];
	var c = 0;
	var parts = command.match(/((["']).*?\2|(?:[^\\ ]+\\\s+)+[^\\ ]+|\S+)/g);
	for(var i = 0; i < parts.length; i++){
		if(parts[i] === '|'){
			c++;
			chain.push('');
		}else{
			// look at aliases then expand commands
			var expanded = parts[i];
			for(var key in settings.aliases){
				if(key === parts[i]){
					expanded = settings.aliases[key];
				}
			}
			chain[c] += ' ' + expanded;
		}
	}

	// remove empty strings before executing it
	execute_chain(chain.filter(Boolean), 0, '');
});

finish();

// recursively execute an aray of commands
function execute_chain(input, cur, data){

	if(input.length == cur){
		finish();
		return;
	}

	// if there is a chained command set flag to redirect output
	var is_down_stream = (input[cur + 1] !== undefined);

	execute(input[cur], function(data){
		execute_chain(input, cur + 1, data);
	}, is_down_stream, data);
}

function execute(command, callback, is_down_stream, data){

	var parts = command.match(/((["']).*?\2|(?:[^\\ ]+\\\s+)+[^\\ ]+|\S+)/g);

	var cmds = [];
	var opts = [];

	// catch user trying to exit program
	if(parts[0] === 'exit' || parts[0] === 'quit'){
		console.log("Good bye");
		process.exit();
	}

	// organize the parts into options and commands
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
			plugins[i].do_cmd(cmds, opts, callback, is_down_stream, data);
			return;
		}
	}

	// only gets here if the command didn't exist
	console.log('Command not recongnized: ' + parts.join());
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

module.exports.get_history = function(){
	return history;
}
