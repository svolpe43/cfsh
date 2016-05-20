## CloudFormation Shell

Cfsh is a new type of shell that traverses aws resources in an AWS account. Imagine bash but instead of each node being a file or directory, each node is an AWS resource (i.e cf stack, ec2 instance, VPC, ect.). If you are comfortable inside the Unix shell then you should feel right at home when inside cfsh.

Just like bash, use the up and down arrow keys to traverse the history of commands. The history is only for a given session.

### Installation
Cfsh is a NodeJs project that uses npm for package management. So to install, do the following.
```
$git clone https://github.com/svolpe43/rtools
$cd rtools
$npm install
$npm link
```
Then the project should be installed. To run it use the following.
```
$cfsh
```

Some commands require ssh access to the instances. To run these commands you have to set the RT_KEY_PATH to the path to your key.
```
$export RT_KEY_PATH=/Users/shawn.volpe/.ssh/some-key.pem
```

Some help commands:
```
#:cmds
#:help
```

You can exit the program with 2 commands.
```
#:exit
#:quit
```

### Commands

##### cmds
List all available commands

##### apps
List apps currently available. If you drop a cf template with a '.json' file type into 'cf/', it will show up with this command.

##### help
Equivalent of cmds command and apps command.

##### type
The type command outputs the node type of the current selected node. Some commands have different behaviour based on the type of the current node. You can use this command to predict behaviour.

##### ls [path] [option]
Path is an optional parameter to ls on a certain node. If path is not specified it will list the children of the current node. The path is bash syntax with things like '..' supported.

Path is an optional parameter to `ls`, if it is not supplied it simple uses the current selected node. By passing the '-l' options in this command will give more output.

##### cd \<path\>
`cd` will change your current node to the node specified by \<path\>. `cd` currently supports some of the syntax of the original bash cd command such as `..` to go to the previous node and `/` to move to the root node.

##### mk \<type\> \<stack_name\>
The only AWS resource you can `mk` is a cf stack. The `mk` command will create a stack of type \<type\> with the name \<stack_name\>.

`mk` can make a stack of any type as long as a cf template exists for that type. To create your own stack type, simply drop a cf template file into the the cf directory of the project with the name of the file following this convention, `<type>.json`. This ensures that the `mk` command can find your cf template. For example, if you were to put a cf template in the cf directory named logging.json. By running `mk logging my-logging-stack` will create a stack using the logging.json template and the stack will be named my-logging-stack. Once the stack is complete you can cd into that stack and ls to see its resources.

##### rm \<stack_name\>
rm deletes the stack specified by \<stack_name\>

##### up \<type\> \<stack_name\>
`up` updates the stack specified by \<stack_name\> with the cf template that shares the same name as the one it used to create it.

##### ssh \<path\>
The ssh command simply opens a new terminal tab that will be sshed into the instance using the ssh user specified in settings.js. In order to use this command your current selected node needs to be of type 'Instance'. The ssh command also optionally takes in a path parameter to a given instance node.

##### sshall
The sshall command will open up a ssh session in a new tab for every instance in the current selected stack. The tabs get opened in the order that the stack resources are listed using the ls command, recursively. Inside the new terminal tabs, the Logical Id or Resource Name is echoed at the top so you can track what resource it belongs to.

##### events
The events command will output all events for the current stack.

##### params
The params command will output all parameters for the current stack.

##### tags
The tags command will output all tags for the current stack. (Individual resources comming)

##### outputs
The outputs command will output all the outputs for the current stack.

##### info
The info command is currently only supported on nodes of type 'Instance'. It lists all AWS data of the current ec2 node.

##### cat \<path\>
The cat command can only be used on a node of type 'Instance'. This command cats the path specified by '\<path\>' on the instance of the current selected node.
