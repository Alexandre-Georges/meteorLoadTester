var _ = require('underscore-node');

var SockJS = require('../frameworks/sockjs-client');
var ResponseChecker = require('../logic/response-checker');
var Config = require('../utils/config');
var DDPClient = require('../utils/ddp-client');

var ClientListener = function() {
    var self = this;
    this.responseChecker = new ResponseChecker();
    this.client = SockJS.create(Config.url);
    this.client.on('connection', function() {
        ClientListener.connectionFunction(self);
    });
    this.client.on('data', function(message) {
        ClientListener.dataFunction(self, message);
    });
    this.client.on('error', ClientListener.errorFunction);
};

ClientListener.prototype.client = null;
ClientListener.prototype.responseChecker = null;

ClientListener.connectionFunction = function (self) {

    self.responseChecker.start();
    DDPClient.connect(self.client);

    ClientListener.prepareCall(self, function(name, id) {
        self.responseChecker.startCallMethod(name, id, function () {
            ClientListener.endProcess(self);
        });
    }, DDPClient.callMethod, Config.methods);
    ClientListener.prepareCall(self, function(name, id) {
        self.responseChecker.startCallSubscription(name, id, function () {
            ClientListener.endProcess(self);
        });
    }, DDPClient.subscribe, Config.subscriptions);
};

ClientListener.prepareCall = function (self, responseCheckerFunction, ddpClientFunction, calls) {
    var totalIndex = 0;
    _.forEach(calls, function(call) {
        var currentIndex = 0;
        while (currentIndex < call.callNumber) {
            var timeoutValue = call.startDelay + currentIndex * call.delayBetweenCalls;
            setTimeout(function(index) {
                var id = index.toString();
                responseCheckerFunction(call.name, id);
                ddpClientFunction(self.client, call.name, id, call.parameters);
            }, timeoutValue, totalIndex);
            totalIndex++;
            currentIndex++;
        }
    });
};

ClientListener.dataFunction = function (self, message) {
    //console.log(message);
    var response = JSON.parse(message);
    if (response.server_id !== undefined) {
        return;
    }
    else if (response.msg !== undefined) {
        if (response.msg === 'added') {
            return;
        } else if (response.msg === 'updated') {
            return;
        } else if (response.msg === 'connected') {
            self.responseChecker.endConnection();
            ClientListener.endProcess(self);
            return;
        } else if (response.msg === 'ready') {
            _.forEach(response.subs, function (sub) {
                self.responseChecker.endCallSubscription(sub, response.error);
            });
            ClientListener.endProcess(self);
            return;
        } else if (response.msg === 'nosub') {
            self.responseChecker.endCallSubscription(response.id, response.error);
            ClientListener.endProcess(self);
            return;
        } else if (response.msg === 'result') {
            self.responseChecker.endCallMethod(response.id, response.error);
            ClientListener.endProcess(self);
            return;
        } else if (response.msg === 'failed') {
            console.log('message failure ' + message);
            return;
        }
    }
    console.log('unknown message ' + message);
};

ClientListener.errorFunction = function (error) {
    console.log('error' + JSON.stringify(error));
};

ClientListener.endProcess = function(self) {
    if (self.responseChecker.isAllFinished()) {
        self.client.close();
        self.responseChecker.end();
        self.responseChecker.display();
    }
};

module.exports = ClientListener;
