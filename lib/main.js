#!/usr/bin/env node

/*
	main.js - the entry point to the program
*/

var aws_tree = require('./tree');
var aws_ops = require('./ops');
var settings = require('./settings');

var cfsh = new Cfsh();
var ops = new aws_ops.Ops();

// create an interactive shell
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (text) {

	// there may be a new line at the end of the line
	parse_text(text.replace("\n", ""));
});

function parse_text(text){

	var command = text.split(/\s+/);

	switch(command[0]){
		case "ls": cfsh.ls(command); break;
		case "cd": cfsh.cd(command); break;
		case "ssh": cfsh.ssh(command); break;
		case "mk": cfsh.mk(command); break;
		case "exit": cfsh.exit(); break;
		case "quit": cfsh.exit(); break;
		default: cfsh.huh();
	}
}

// The Cloud Shell
function Cfsh(){

	this.tree = new aws_tree.Tree();
	write_path(this.tree.current_path());
}

Cfsh.prototype.cd = function(command){
	
	var self = this;
	this.tree.cd(command[1], function(){
		write_path(self.tree.current_path());
	});
}

Cfsh.prototype.ls = function(command){

	var self = this;
	this.tree.ls(command[1], function(){
		write_path(self.tree.current_path());
	});
}

Cfsh.prototype.ssh = function(command){

	var self = this;
	this.tree.ssh({}, function(){
		write_path(self.tree.current_path());
	});
}

Cfsh.prototype.mk = function(command){

	var self = this;
	ops.mk(command[1], command[2], function(msg){

		if(msg){
			console.log(msg);
		}
		
		write_path(self.tree.current_path());
	});
}

Cfsh.prototype.exit = function(){
	console.log("Good bye");
	process.exit();
}

Cfsh.prototype.huh = function(){
	console.error("Don't recognize that command.");
	write_path(this.tree.current_path());
}

// finish processing the command and output the results
function write_path(path){
	
	process.stdout.write(
		settings.path_color + path + settings.end_marker_color + "#:" + "\u001b[0m");
}

