
/*

	input.js

*/

module.exports = Input;

function Input(callback){

	// listen for incoming text and parse it
	process.stdin.resume();
	process.stdin.setEncoding('utf8');
	process.stdin.on('data', function (text) {

		callback(text.replace('\n', '').split(/\s+/));
	});
}