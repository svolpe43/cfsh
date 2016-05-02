
/*

	input.js

*/
var keypress = require('keypress');
var readline = require('readline');

module.exports = Input;

var handle = null;
var command = '';
var history = [];
var current = 0;
var starting_position = 3;

function Input(_handle){
	handle = _handle;

	// listen for incoming text and parse it
	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	process.stdin.on('data', function(data){
		handle_data(data);
	});

	set_up_keyevents();
}

function handle_data(text, callback){
	if(text.length === 1 && text.match(/[ -~]/)){
		process.stdout.write(text);
		command += text;
	}
}

function set_up_keyevents(){

	keypress(process.stdin);

	process.stdin.setRawMode(true);
	process.stdin.on('keypress', function (ch, key) {

		if (key) {

			if(key.name === 'c' && key.ctrl){
				process.stdout.write('Good bye.\n');
				process.exit();
			}

			switch(key.name){
				case('up'): up_key(); break;
				case('down'): down_key(); break;
				case('right'): right_key(); break;
				case('left'): left_key(); break;
				case('backspace'): backspace_key(); break;
				case('return'): return_key(); break;
			}
		}
	});
}

function return_key(){
	history.push(command);
	process.stdout.write('\n');
	handle(command);
	current = history.length;
	command = '';
}

function up_key(){
	if(history.length === 0 || current === 0){
		return;
	}

	current--;
	command = history[current];
	write_terminal_prompt(command);
}

function down_key(){

	if(history.length === 0 || current === history.length){
		return;
	}

	current++;
	command = (current === history.length) ? '' : history[current];
	write_terminal_prompt(command);
}

function right_key(){
	readline.moveCursor(process.stdout, 1, 0);
}

function left_key(){
	readline.moveCursor(process.stdout, -1, 0);
}

function backspace_key(){
	command = command.substring(0, command.length - 1);
	write_terminal_prompt(command);
}

function write_terminal_prompt(cmd){
	readline.clearLine(process.stdout);
	readline.cursorTo(process.stdout, 0);
	handle(false);
	process.stdout.write(cmd);
}

