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
                    totalTime: columns[9],
                    mean: columns[11],
                    std: columns[13]
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
    string += getTypeResult('url', result.https);

    string += '\n\nmethods';
    string += getTypeResult('method name', result.methods);

    string += '\n\nsubscriptions';
    string += getTypeResult('subscription name', result.subscriptions);

    FileSystem.writeFile('results.csv', string);
};

function getTypeResult(typeName, results) {
    var string = '';
    for (var index in results) {
        var result = results[index];
        string += '\n' + typeName + ';' + index;

        var agentNumbersLine = 'agent number';
        var agentCallsLine = 'calls';
        var agentErrorsLine = 'errors';
        var agentTimeoutsLine = 'timeouts';
        var agentTotalsLine = 'total times';
        var agentMeansLine = 'mean times';
        var agentStdsLine = 'stds times';

        var executionNumber = result.executions.length;
        var totalErrors = 0;
        var totalTimeouts = 0;
        var totalTime = 0;

        _.forEach(result.agentData, function(agent) {
            totalErrors += parseInt(agent.errors);
            totalTimeouts += parseInt(agent.timeouts);
            totalTime += parseInt(agent.totalTime);
            agentNumbersLine += ';' + agent.number;
            agentCallsLine += ';' + agent.calls;
            agentErrorsLine += ';' + agent.errors;
            agentTimeoutsLine += ';' + agent.timeouts;
            agentTotalsLine += ';' + agent.totalTime;
            agentMeansLine += ';' + agent.mean;
            agentStdsLine += ';' + agent.std;
        });
        string += '\n' + agentNumbersLine + '\n' + agentCallsLine + '\n' + agentErrorsLine + '\n' + agentTimeoutsLine + '\n' + agentTotalsLine + '\n' + agentMeansLine + '\n' + agentStdsLine + '\n';

        var mean = totalTime / executionNumber;

        string += 'calls;' + executionNumber + ';';
        string += 'errors;' + totalErrors + ';';
        string += 'timeouts;' + totalTimeouts + ';';
        string += 'total time;' + totalTime + ';';
        string += 'mean;' + Math.round(mean * 100) / 100 + ';';

        var std = 0;
        var executionString = '';
        result.executions = _.sortBy(result.executions, function(execution) { return execution.startingDate; });
        _.forEach(result.executions, function(execution) {
            std += Math.pow(execution.executionTime - mean, 2);
            executionString += '\n' + execution.agentNumber + ';' + execution.startingDate + ';' + execution.executionTime + ';' + execution.isError + ';' + execution.isTimeout;
        });

        std = Math.sqrt(std / executionNumber);
        string += 'std;' + Math.round(std * 100) / 100;

        string += '\nagent number;starting date;execution time;error;timeout';
        string += executionString;
    }
    return string;
};