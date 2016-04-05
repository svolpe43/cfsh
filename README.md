### CFSH

Cfsh stands for cloud formation shell. This is a new type of shell that traverses aws resources in an AWS account. Imagine bash but instead of each node being a file or directory, each node is a AWS resource (i.e cf stack, ec2 instance, VPC, ect.). If you are comfortable inside the Unix shell then you should feel right at home when inside cfsh.

As you use the various commands available a tree structure is created that represents your cloud formation. Each node that is created has a type associated with it and a set of functions that belong to that type. For instance the node of type "Instance" has the `ssh` command. If you have more ideas for commands please let me know.

##### Installation
Cfsh is a NodeJs project that uses npm for package management. So to install do the following.
```
$git clone https://github.com/svolpe43/rtools
$cd rtools
$npm install -g cfsh
$npm link
```
Then the project should be installed. And to run it use the following.
```
$cfsh
```
You can exit the execution with 2 commands.
```
exit
quit
```
##### What does this thing do?

You will find that most commands mimmick the behaviour of bash with a few minor improvments.

###### Commands

```
ls
cd
mk
rm
ssh
up
```

###### ls [path]
Path is an optional parameter to ls on a certain node. If path is not specified it will list the children of the current node.

###### cd <path>
cd will change your current node to the node specified by <path>. cd currently supports some of the syntax of the original cd command such as `..` to go to the previous node and `/` to move to the root node.

###### mk <type> <stack_name>
We can think of cf stacks to be immutable so the only AWS resource you can `mk` is a cf stack. The `mk` command will create a stack of type <type> with the name <stack_name>.

`mk` can make a stack of any type as long as a cf template exists for that type. To create your own stack type simply drop a cf template file into the the cf directory of the project with the name of the file following this convention `<type>.json`. This ensures that the mk command can find your cf template. For example, if you were to put a cf template in the cf directory named logging.json. By running `mk logging my-logging-stack` will create a stack based on that cf template named my-logging-stack. Once the stack is complete you can cd into that stack and ls to see its resources.

A parameters file feature is coming soon. 

###### rm <stack_name>
rm deletes the stack specified by <stack_name>

###### up <stack_name>
This feature is coming soon.
`up` updates the stack specified by <stack_name>.

###### ssh
the ssh command simply opens a new terminal tab that will be sshed into the instance. In order to use this command your current selected node needs to be of type 'Instance'. These nodes have names that look like this i-4rr4tgq2.