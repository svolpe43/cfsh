
var fs = require('fs');

var settings = require('../settings');
var templates_dir = './cf/';

function Help(_tree){
	this.cmds = ['cmds', 'apps', 'help'];
}

Help.prototype.do_cmd = function(args, callback){
	
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

	var plugs = settings.plugins;
	var plugins = [];
	for(var i = 0; i < plugs.length; i++){

		var constructor = require('./' + plugs[i]);
		var plug = new constructor();

		console.log(" " + plugs[i].charAt(0).toUpperCase() + plugs[i].slice(1));
		for(var k = 0; k < plug.cmds.length; k++){
			console.log("   " + plug.cmds[k]);
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
