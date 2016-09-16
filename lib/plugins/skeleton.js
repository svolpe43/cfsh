// information about the resources is stored here
// you may not find the information you need in here
// but there should be enough info to make your own calls to aws to get more info
var tree = null;

function PluginName(_tree){
	tree = _tree;

	// this is a list of commands that Cfsh will look for
	// if the user uses one of these commands Cfsh will execute do_cmd
	// with the parameters
	this.cmds = [ 'some_command'];
}

// all plugins must have a do_cmd function, this is the entry point
PluginName.prototype.do_cmd = function(args, opts, callback){
	
	switch(args[0]){
		case 'some_command': some_command(args, opts, callback); break;
		default: console.log('Don\'t recognize that command.');
	}
}

// a function to implement the command
function some_command(args, callback){
	
	// call this when you're done
	// this handles re writting the terminal
	callback();
}

// this is how you allow Cfsh to access the module
module.exports = PluginName;