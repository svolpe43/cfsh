
var fs = require('fs');

var settings = require('../settings');
var main = require('../main');
var templates_dir = './cf/';

function Help(_tree){
	this.cmds = ['cmds', 'apps', 'help'];
}

Help.prototype.do_cmd = function(args, opts, callback){
	
	switch(args[0]){
		case 'cmds': cmds(args, callback); break;
		case 'apps': apps(args, callback); break;
		case 'help': help(args, callback); break;
		default: console.log('Don\'t recognize that command.');
	}
}

function cmds(args, callback){
	
	console.log();
	console.log('All available commands:');
	console.log();

	var plugins = main.get_plugins();
	for(var i = 0; i < plugins.length; i++){
		console.log(" " + plugins[i].constructor.name);
		for(var k = 0; k < plugins[i].cmds.length; k++){
			console.log("   " + plugins[i].cmds[k]);
		}
	}

	console.log();
	callback();
}

function apps(args, callback){

	console.log();
	console.log('All available runable apps:');
	console.log();

	fs.readdir(templates_dir, function(err, data){
		if(err){
			console.log(err);
		}else{
			for(var i = 0; i < data.length; i++){
				var parts = data[i].split('.');
				if(parts[1] === 'json'){
					console.log(parts[0]);
				}
			}
		}

		console.log();
		callback();
	});
}

function help(args, callback){

	cmds('', function(){});
	apps('', function(){
		console.log('Please submit bugs or suggestions to https://github.com/svolpe43/rtools');
		callback();
	});
}

module.exports = Help;
