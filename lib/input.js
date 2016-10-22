/*
	input.js
*/

var cp = require("copy-paste");

var keypress = require('keypress');
var readline = require('readline');
var fs = require('fs');

module.exports = Input;

var hist_path = process.env.HOME + '/.cfsh/history.txt';

// debug mode
var debug = false;

// its gonna be a function to write term text
var handle = null;

// state variables
var command = '';
var history = [];
var current = 0;
var cur_char = 0;

function Input(cb, _handle){
	handle = _handle;

	keypress(process.stdin);

	process.stdin.resume();
	process.stdin.setRawMode(true);
	process.stdin.setEncoding('utf8');
	process.stdin.on('keypress', handle_characters);
	process.stdin.on('keypress', handle_special_keys);

	fs.access(hist_path, fs.F_OK, function(err) {
		if (err) {
			fs.openSync(hist_path, 'a')
		}
		r(hist_path, function(_history){
			history = _history;
			current = history.length - 1;
			cb(history);
		});
	});
}

function handle_characters(text){

	if(!text){
		return;
	}

	if(text.match(/[ -~]/) &&
	  !text.match(/\[A/) &&
	  !text.match(/\[D/) &&
	  !text.match(/\[C/) &&
	  !text.match(/\[B/)){

		var first = command.substring(0, cur_char);
		var last = command.substring(cur_char, command.length);
		command = first + text + last;
		write_terminal_prompt(command, - last.length);
		cur_char += text.length;

		if(debug){
			w('Char:' + text + ' Pos: ' + cur_char, 'debug.txt');
		}
	}
}

function handle_special_keys(ch, key){

	if (key) {
		if(key.name === 'c' && key.ctrl){
			process.stdout.write('\nGood bye.\n');
			process.exit();
		}else if(key.name === 'e' && key.ctrl){
			end(); return;
		}else if(key.name === 'a' && key.ctrl){
			beginning(); return;
		}

		switch(key.name){
			case('up'): up_key(); break;
			case('down'): down_key(); break;
			case('right'): right_key(); break;
			case('left'): left_key(); break;
			case('backspace'): backspace_key(); break;
			case('return'): return_key(); break;
		}

		if(debug){
			w('Char:' + key.name + ' Pos: ' + cur_char, 'debug.txt');
		}
	}
}

function return_key(){
	if(command){
		history.push(command);	
	}
	w(command, hist_path);

	process.stdout.write('\n');
	handle(command);
	current = history.length;
	command = '';
	cur_char = 0;
}

function up_key(){
	if(history.length === 0 || current === 0){
		return;
	}

	current--;
	command = history[current];
	cur_char = command.length;
	write_terminal_prompt(command);
}

function down_key(){
	if(history.length === 0 || current === history.length){
		return;
	}

	current++;
	command = (current === history.length) ? '' : history[current];
	cur_char = command.length;
	write_terminal_prompt(command);
}

function right_key(){
	if(cur_char < command.length){
		cur_char++;
		readline.moveCursor(process.stdout, 1, 0);
	}
}

function left_key(){
	if(cur_char !== 0){
		cur_char--;
		readline.moveCursor(process.stdout, -1, 0);
	}
}

function backspace_key(){
	if(cur_char > 0){
		var first = command.substring(0, cur_char - 1);
		var second = command.substring(cur_char, command.length);
		command = first + second;
		cur_char--;
		write_terminal_prompt(command, -second.length);
	}
}

function end(){
	cur_char = command.length;
	write_terminal_prompt(command, 0);
}

function beginning(){
	cur_char = 0;
	write_terminal_prompt(command, - command.length);
}

function write_terminal_prompt(cmd, cursor_x){
	readline.clearLine(process.stdout);
	readline.cursorTo(process.stdout, 0);
	handle(false);
	process.stdout.write(cmd);

	if(cursor_x){
		readline.moveCursor(process.stdout, cursor_x, 0);
	}	
}

// write to an external debug file
function w(str, path){
	fs.appendFile(path, str + '\n', (err) => {
	  if (err) throw err;
	});
}

function r(path, callback){
	fs.readFile(path, function(err, data){
		if(err){
			callback([]);
		}else{
			if(data){
				callback(data.toString().split('\n'));
			}
		}
	});
}
