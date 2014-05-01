var _ = require('underscore-node');

var Config = require('../utils/config');
var FileSystem = require('../utils/filesystem');

ResponseChecker = function() {

    this.requests[ResponseChecker.SUBSCRIPTION] = {
        number: 0,
        calls: []
    };
    this.requests[ResponseChecker.METHOD] = {
        number: 0,
        calls: []
    };

    var self = this;

    _.forEach(Config.methods, function(method) {
        self.prepareCalls(ResponseChecker.METHOD, method.callNumber);
    });

    _.forEach(Config.subscriptions, function(subscription) {
        self.prepareCalls(ResponseChecker.SUBSCRIPTION, subscription.callNumber);
    });
};

ResponseChecker.SUBSCRIPTION = 0;
ResponseChecker.METHOD = 1;

ResponseChecker.getFinishingTime = function(startingDate) {
    return (new Date()).getTime() - startingDate.getTime();
};


ResponseChecker.prototype.startingDate = null;
ResponseChecker.prototype.executionTime = null;


ResponseChecker.prototype.connection = {
    isFinished: false,
    executionTime: null
};


ResponseChecker.prototype.requests = [];


ResponseChecker.prototype.start = function() {
    this.startingDate = new Date();
};
ResponseChecker.prototype.end = function() {
    this.executionTime = ResponseChecker.getFinishingTime(this.startingDate);
};


ResponseChecker.prototype.endConnection = function() {
    this.connection.executionTime = ResponseChecker.getFinishingTime(this.startingDate);
    this.connection.isFinished = true;
};

ResponseChecker.prototype.prepareCalls = function(type, callNumber) {
    var request = this.requests[type];
    request.number += callNumber;
};

ResponseChecker.prototype.startCallSubscription = function(name, id, endProcess) {
    this.startCall(ResponseChecker.SUBSCRIPTION, name, id, endProcess);
};
ResponseChecker.prototype.startCallMethod = function(name, id, endProcess) {
    this.startCall(ResponseChecker.METHOD, name, id, endProcess);
};
ResponseChecker.prototype.startCall = function(type, name, id, endProcess) {
    var request = this.requests[type];
    var call = {
        id: id,
        name: name,
        isFinished: false,
        startingDate: new Date(),
        executionTime: null,
        isTimeout: false,
        isError: false,
        errorMessage: null
    };
    request.calls.push(call);
    setTimeout(function() {
        if (!call.isFinished) {
            call.isFinished = true;
            call.executionTime = Config.timeout;
            call.isTimeout = true;
            endProcess();
        }
    }, Config.timeout);
};
ResponseChecker.prototype.endCallSubscription = function(id, error) {
    this.endCall(ResponseChecker.SUBSCRIPTION, id, error);
};
ResponseChecker.prototype.endCallMethod = function(id, error) {
    this.endCall(ResponseChecker.METHOD, id, error);
};
ResponseChecker.prototype.endCall = function(type, id, error) {
    var request = this.requests[type];

    var call = _.find(request.calls, function(call) {
        return call.id === id;
    });
    if (!call.isFinished) {
        // if the response has been received before the timeout
        call.executionTime = ResponseChecker.getFinishingTime(call.startingDate);
        call.isFinished = true;
        if (error !== undefined) {
            call.isError = true;
            call.errorMessage = error;
        }
    }
};


ResponseChecker.prototype.isConnectionFinished = function() {
    return this.connection.isFinished;
};
ResponseChecker.prototype.isRequestsFinished = function(type) {
    var request = this.requests[type];

    if (request.calls.length !== request.number) {
        return false;
    }
    var finished = true;
    _.forEach(request.calls, function(call) {
        finished = finished && (call.executionTime !== null);
    });
    return finished;
};
ResponseChecker.prototype.isAllFinished = function() {
    return this.isConnectionFinished() && this.isRequestsFinished(ResponseChecker.SUBSCRIPTION) && this.isRequestsFinished(ResponseChecker.METHOD);
};

ResponseChecker.prototype.display = function() {

    var methods = ResponseChecker.formatData(this.requests[ResponseChecker.METHOD]);
    var subscriptions = ResponseChecker.formatData(this.requests[ResponseChecker.SUBSCRIPTION]);

    var string = '';
    string += 'agent;' + Config.clientNumber;
    string += '\ntotal time;' + this.executionTime;

    for(var index in methods) {
        var methodResult = methods[index];
        string += '\nmethod;' + index + ';';
        string += 'calls;' + methodResult.executions.length + ';';
        string += 'errors;' + methodResult.errors + ';';
        string += 'timeouts;' + methodResult.timeouts + ';';
        string += 'mean;' + (methodResult.totalTime / methodResult.executions.length);
        string += '\nstarting date;time;error;timeout';
        _.forEach(methodResult.executions, function(execution) {
            string += '\n' + execution.startingDate.getTime() + ';' + execution.executionTime + ';' + execution.isError + ';' + execution.isTimeout;
        });
    };

    for(var index in subscriptions) {
        var subscriptionResult = subscriptions[index];
        string += '\nsubscription;' + index + ';';
        string += 'calls;' + subscriptionResult.executions.length + ';';
        string += 'errors;' + subscriptionResult.errors + ';';
        string += 'timeouts;' + subscriptionResult.timeouts + ';';
        string += 'mean;' + (subscriptionResult.totalTime / subscriptionResult.executions.length);
        string += '\nstarting date;time;error;timeout';
        _.forEach(subscriptionResult.executions, function(execution) {
            string += '\n' + execution.startingDate.getTime() + ';' + execution.executionTime + ';' + execution.isError + ';' + execution.isTimeout;
        });
    };

    FileSystem.writeFile('agent' + Config.clientNumber + '.csv', string);
};

ResponseChecker.formatData = function(results) {
    var resultsMap = [];
    _.forEach(results.calls, function(call) {
        var currentResult = resultsMap[call.name];
        if (currentResult === undefined) {
            resultsMap[call.name] = {
                totalTime: 0,
                errors: 0,
                timeouts: 0,
                executions: []
            };
            currentResult = resultsMap[call.name];
        }
        currentResult.totalTime += call.executionTime;
        if (call.isError) {
            currentResult.errors++;
        }
        if (call.isTimeout) {
            currentResult.timeouts++;
        }
        currentResult.executions.push({
            startingDate: call.startingDate,
            executionTime: call.executionTime,
            isError: call.isError,
            isTimeout: call.isTimeout
        });
    });
    return resultsMap;
};

module.exports = ResponseChecker;