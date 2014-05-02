var _ = require('underscore-node');

var Config = require('../utils/config');
var FileSystem = require('../utils/filesystem');

var fileNames = FileSystem.listFiles(Config.resultsDirectory);
var filesData = FileSystem.getFilesData(fileNames);
var result = readAgentResults(filesData);

writeReport(result);

function readAgentResults(filesData) {
    var result = {
        agents: [],
        https: [],
        methods: [],
        subscriptions: []
    };
    _.forEach(filesData, function(fileData) {
        var lines = fileData.split('\n');
        var agentNumber = lines[0].split(';')[1];
        result.agents.push(
            {
                number: agentNumber,
                totalTime: lines[1].split(';')[1]
            }
        );
        var index = 2;
        var currentRequest = null;
        while(index < lines.length) {
            var columns = lines[index].split(';');

            var regularLine = true;
            var http = false;
            var method = false;
            var subscription = false;

            if (columns[0] === 'http') {
                http = true;
                regularLine = false;
            } else if (columns[0] === 'method') {
                method = true;
                regularLine = false;
            } else if (columns[0] === 'subscription') {
                subscription = true;
                regularLine = false;
            }

            if (regularLine === false) {
                var name = columns[1];
                if (http === true) {
                    currentRequest = result.https[name];
                } else if (method === true) {
                    currentRequest = result.methods[name];
                } else if (subscription === true) {
                    currentRequest = result.subscriptions[name];
                }

                if (currentRequest === undefined) {
                    currentRequest = {
                        name: name,
                        agentData: [],
                        executions: []
                    }
                    if (http === true) {
                        result.https[name] = currentRequest;
                    } else if (method === true) {
                        result.methods[name] = currentRequest;
                    } else if (subscription === true) {
                        result.subscriptions[name] = currentRequest;
                    }
                }

                currentRequest.agentData.push({
                    number: agentNumber,
                    calls: columns[3],
                    errors: columns[5],
                    timeouts: columns[7],
                    mean: columns[9]
                });
                // skipping the header
                index++;
            } else {
                currentRequest.executions.push({
                    agentNumber: agentNumber,
                    startingDate: columns[0],
                    executionTime: columns[1],
                    isError: columns[2],
                    isTimeout: columns[3]
                });
            }

            index++;
        }
    });
    return result;
};

function writeReport(result) {
    var string = '';

    var agentNumbersLine = 'agent number';
    var agentTotalTimeLine = 'total time';
    _.forEach(result.agents, function(agent) {
        agentNumbersLine += ';' + agent.number;
        agentTotalTimeLine += ';' + agent.totalTime;
    });
    string += agentNumbersLine + '\n' + agentTotalTimeLine;

    string += '\n\nhttp';
    for (var index in result.https) {
        var http = result.https[index];
        string += '\nurl;' + index;

        var agentNumbersLine = 'agent number';
        var agentCallsLine = 'calls';
        var agentErrorsLine = 'errors';
        var agentTimeoutsLine = 'timeouts';
        var agentMeansLine = 'mean times';

        _.forEach(http.agentData, function(agent) {
            agentNumbersLine += ';' + agent.number;
            agentCallsLine += ';' + agent.calls;
            agentErrorsLine += ';' + agent.errors;
            agentTimeoutsLine += ';' + agent.timeouts;
            agentMeansLine += ';' + agent.mean;
        });
        string += '\n' + agentNumbersLine + '\n' + agentCallsLine + '\n' + agentErrorsLine + '\n' + agentTimeoutsLine + '\n' + agentMeansLine;

        string += '\nagent number;starting date;execution time;error;timeout';
        http.executions = _.sortBy(http.executions, function(execution) { return execution.startingDate; });
        _.forEach(http.executions, function(execution) {
            string += '\n' + execution.agentNumber + ';' + execution.startingDate + ';' + execution.executionTime + ';' + execution.isError + ';' + execution.isTimeout;
        });
    }

    string += '\n\nmethods';
    for (var index in result.methods) {
        var method = result.methods[index];
        string += '\nmethod name;' + index;

        var agentNumbersLine = 'agent number';
        var agentCallsLine = 'calls';
        var agentErrorsLine = 'errors';
        var agentTimeoutsLine = 'timeouts';
        var agentMeansLine = 'mean times';

        _.forEach(method.agentData, function(agent) {
            agentNumbersLine += ';' + agent.number;
            agentCallsLine += ';' + agent.calls;
            agentErrorsLine += ';' + agent.errors;
            agentTimeoutsLine += ';' + agent.timeouts;
            agentMeansLine += ';' + agent.mean;
        });
        string += '\n' + agentNumbersLine + '\n' + agentCallsLine + '\n' + agentErrorsLine + '\n' + agentTimeoutsLine + '\n' + agentMeansLine;

        string += '\nagent number;starting date;execution time;error;timeout';
        method.executions = _.sortBy(method.executions, function(execution) { return execution.startingDate; });
        _.forEach(method.executions, function(execution) {
            string += '\n' + execution.agentNumber + ';' + execution.startingDate + ';' + execution.executionTime + ';' + execution.isError + ';' + execution.isTimeout;
        });
    }

    string += '\n\nsubscriptions';
    for (var index in result.subscriptions) {
        var subscription = result.subscriptions[index];
        string += '\nsubscription name;' + index;

        var agentNumbersLine = 'agent number';
        var agentCallsLine = 'calls';
        var agentErrorsLine = 'errors';
        var agentTimeoutsLine = 'timeouts';
        var agentMeansLine = 'mean times';

        _.forEach(subscription.agentData, function(agent) {
            agentNumbersLine += ';' + agent.number;
            agentCallsLine += ';' + agent.calls;
            agentErrorsLine += ';' + agent.errors;
            agentTimeoutsLine += ';' + agent.timeouts;
            agentMeansLine += ';' + agent.mean;
        });
        string += '\n' + agentNumbersLine + '\n' + agentCallsLine + '\n' + agentErrorsLine + '\n' + agentTimeoutsLine + '\n' + agentMeansLine;

        string += '\nagent number;starting date;execution time;error;timeout';
        subscription.executions = _.sortBy(subscription.executions, function(execution) { return execution.startingDate; });
        _.forEach(subscription.executions, function(execution) {
            string += '\n' + execution.agentNumber + ';' + execution.startingDate + ';' + execution.executionTime + ';' + execution.isError + ';' + execution.isTimeout;
        });
    }

    FileSystem.writeFile('results.csv', string);
};