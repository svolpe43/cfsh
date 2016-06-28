# CloudFormation Shell

Cfsh is a shell that traverses aws resources in Cloudformation. If you are comfortable inside the Unix shell then you should feel at home. The behavior and commands mimic bash as much as possible. It has the basic navigation commands such as 'ls' and 'cd' and you can use the up and down arrow keys to traverse the history of commands. The history is only for a given session, so if you exit the program history is erased.

## Installation
Cfsh is a Node.js project, you can get it [here](https://nodejs.org/en/download/). It relies on Node.js's package manager, npm, so to install do the following.
```
$git clone https://github.com/svolpe43/cfsh
$cd cfsh
$npm install
$npm link
```
Then the project should be installed. To run it use the following.
```
$cfsh
```

Specify an AWS region with -r and a AWS profile with -p.
```
$cfsh -r us-west-1 -p prod-account
```

Some commands require ssh access to the instances so make sure your ssh key is added to your key ring prior to running cfsh.

Some help commands:
```
#:cmds
#:help
```

And exit with:
```
#:exit
```

Some commands have options or arguments. To save commonly used ones add aliases to the settings file.
```
aliases : {
	'ls' : 'ls -l'
}
```

## Commands

##### Help Plugin
[help](#help)  
[cmds](#cmds)  
[apps](#apps)  
##### Navigation Plugin
[ls](#ls)  
[cd](#cd)  
[type](#type)  
[history](#history)
##### Operations Plugin
[mk](#mk)  
[rm](#rm)  
[up](#up)  
##### Stack Plugin
[events](#events)  
[params](#params)  
[tags](#tags)  
[outputs](#outputs)  
##### EC2 Plugin
[info](#info)  
[stats](#stats)  
[cat](#cat)  
[ssh](#ssh)  
[sshall](#sshall)  
[vols](#vols)  
[health](#health)  
[cud](#cud)  

## Help Plugin

#### help
Equivalent of cmds command and apps command.

#### cmds
List all available commands

#### apps
List apps currently available. If you drop a cf template with a '.json' file type into 'cf/', it will show up with this command.

## Nagivation Plugin

#### ls [path] [option]
Path is an optional parameter to ls on a certain node. If path is not specified it will list the children of the current node. The path is bash syntax with things like '..' supported.

Path is an optional parameter to `ls`, if it is not supplied it simple uses the current selected node. By passing the '-l' options in this command will give more output.

#### cd \<path\>
`cd` will change your current node to the node specified by \<path\>. `cd` currently supports some of the syntax of the original bash cd command such as `..` to go to the previous node and `/` to move to the root node.

#### type
The type command outputs the node type of the current selected node. Some commands have different behaviour based on the type of the current node. You can use this command to predict behaviour.

#### history \<num\>
The history command will output your current session's command history. If the num option is specified, it will show the last num commands.

## Operations Plugin

#### mk \<type\> \<stack_name\>
The only AWS resource you can `mk` is a cf stack. The `mk` command will create a stack of type \<type\> with the name \<stack_name\>.

`mk` can make a stack of any type as long as a cf template exists for that type. To create your own stack type, simply drop a cf template file into the the cf directory of the project with the name of the file following this convention, `<type>.json`. This ensures that the `mk` command can find your cf template. For example, if you were to put a cf template in the cf directory named logging.json. By running `mk logging my-logging-stack` will create a stack using the logging.json template and the stack will be named my-logging-stack. Once the stack is complete you can cd into that stack and ls to see its resources.

#### rm \<stack_name\>
rm deletes the stack specified by \<stack_name\>

#### up \<type\> \<stack_name\>
`up` updates the stack specified by \<stack_name\> with the cf template that shares the same name as the one it used to create it.

## Stack Plugin

#### events
The events command will output all events for the current stack.

#### params
The params command will output all parameters for the current stack.

#### tags
The tags command will output all tags for the current stack. (Individual resources comming)

#### outputs
The outputs command will output all the outputs for the current stack.

## EC2 Plugin

#### info
The info command is currently only supported on nodes of type 'Instance'. It lists all AWS data of the current ec2 node.

#### stats
The stats command will use ssh to run the top command on the ec2 instance. This will output some basic statistics about the
cpu and memory of the instance.

#### cat \<path\>
The cat command can only be used on a node of type 'Instance'. This command cats the path specified by '\<path\>' on the instance of the current selected node.

#### ssh \<path\>
The ssh command simply opens a new terminal tab that will be sshed into the instance using the ssh user specified in settings.js. In order to use this command your current selected node needs to be of type 'Instance'. The ssh command also optionally takes in a path parameter to a given instance node.

#### sshall
The sshall command will open up a ssh session in a new tab for every instance in the current selected stack. The tabs get opened in the order that the stack resources are listed using the ls command, recursively. Inside the new terminal tabs, the Logical Id or Resource Name is echoed at the top so you can track what resource it belongs to.

#### vols
The vols command outputs the volumes that are attached to the instances in an Auto Scaling Group along with the LifecycleState and HealthStaus of the instance that its attached to. This command currently only looks for devices named '/dev/sdd'. This command can only be used on nodes of type 'Asg'. If this command gains interest then I can add paramaterized device names.

#### health \<health state\>
The health command allows you to set the health of an instance in an Auto Scaling Group. The options are 'Unhealthy' and 'Healthy'. This command is currently only supported on nodes of type 'Instance'.

#### cud 
The cud command will use ssh to output the /var/log/cloud-init-output.log file from the ec2 instance.

ls
cd volpe-5-2j1j4ow5
params
outputs
ls
cd A
ls
cd i
info
stats
cat some/file
ssh
history 12

mk solr_cloud MySolrCloud
ls
up other_solr_cloud
ls
rm some_other_solr_cloud
