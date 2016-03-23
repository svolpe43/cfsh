
/*
	main.js - the entry point to the program
*/

var aws_tree = require('./tree');

var csh = new Csh();

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
		case "ls": csh.ls(command); break;
		case "cd": csh.cd(command); break;
		case "ssh": csh.ssh(command); break;
		case "exit": csh.exit(); break;
		case "quit": csh.exit(); break;
		default: csh.huh();
	}
}

// The Cloud Shell
function Csh(){

	this.tree = new aws_tree.Tree();
	write_path(this.tree.current_path());
}

Csh.prototype.cd = function(command){
	
	var self = this;
	this.tree.cd(command[1], function(){
		write_path(self.tree.current_path());
	});
}

Csh.prototype.ls = function(command){

	var self = this;
	this.tree.ls(command[1], function(){
		write_path(self.tree.current_path());
	});
}

Csh.prototype.exit = function(){
	console.log("Good bye");
	process.exit();
}

Csh.prototype.huh = function(){
	console.error("Don't recognize that command.");
	write_path(this.tree.current_path());
}

// finish processing the command and output the results
function write_path(path){
	
	process.stdout.write(path + "#:");
}

