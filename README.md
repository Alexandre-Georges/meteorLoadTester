# Load tester for Meteor

Meteor is a HTTP server and a websocket server too. It handles websockets via [SockJS](https://github.com/sockjs).
The purpose of this project is to simulate users with HTTP and websocket requests.

This project can be used to call Meteor methods and to subscribe and retrieve Meteor collections. A scenario (set of subscription and method calls) can be defined in the configuration file ```utils/config.js```

## Important
In the configuration or in the results, all times and dates (timestamps) are in milliseconds.

Durations in the config files are indicatives, in a perfect world calls would be done at the specified time but as Node JS is single threaded, requests are started when they can.
Therefore sometimes the duration in the results might be slightly greater than the timeout, it means that the timeout function as been delayed and the response has been received before the timeout execution.

This phenomenon should also be visible if there are a huge number of calls, calls must be processed one by one. To prevent a too big difference choose carefully the duration between calls.

## Scenario configuration
 In utils/config.js multiple properties can be defined, let's take a quick look to them :

* config.serverUrl : URL of your server, if you use Meteor defaults you do not need to change it
* config.httpUrl : you may want to use a specific URL to reach your server
* config.ddpUrl : URL used for websocket requests
* config.timeout : we wait for a server response during this time, once the timeout is reached we flag the call as timeout
* config.ddpVersion : Meteor uses a custom 'protocol' called DDP, the version sometimes changes
* config.resultsDirectory : where result files should be stored
* config.subscriptions : this property contains the subscriptions you want to make, it will be explained later
* config.methods : it follows the same scheme than the subscriptions for methods

Subscriptions and methods have sub-properties to create a scenario :

* name : name of the subscription or method
* parameters : optional parameters (null if none)
* callNumber : number of calls to perform
* delayBetweenCalls : delay between each call
* startDelay : when the 1st call should start

## Processes configuration
The script loadTest.sh can be parametrized to launch multiple users using the property : ```USER_NUMBER```

## Process description
The process follows the following steps :
* the shell script delete and create needed directories
* then it launches a node process for each user
* each node process will perform the scenario and writes its own results in a CSV file
* the shell script waits for all node processes
* when all are finished, it reads results of each process, gathers all information and generate a summary

## Setup
This project requires some libraries (underscore and uuid), to import them run the command : ```npm install```
Dependencies are defined in packages.json.

## Launch
Launch the load tester with the following command : ```./loadTest.sh```