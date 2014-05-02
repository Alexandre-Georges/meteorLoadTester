var _ = require('underscore-node');

var SockJS = require('../frameworks/sockjs-client');
var ResponseChecker = require('../logic/response-checker');
var Config = require('../utils/config');
var DDPClient = require('../utils/ddp-client');
var HttpClient = require('../utils/http-client');

var ClientListener = function() {

    var isHttp = Config.httpUrl !== null;

    var self = this;
    this.responseChecker = new ResponseChecker(isHttp);

    if (isHttp === true) {
        ClientListener.httpPrepareCall(self, Config.httpUrl);
    }

    this.responseChecker.start();
    this.ddpClient = SockJS.create(Config.ddpUrl);
    this.ddpClient.on('connection', function() {
        ClientListener.ddpConnectionFunction(self);
    });
    this.ddpClient.on('data', function(message) {
        ClientListener.ddpDataFunction(self, message);
    });
    this.ddpClient.on('error', ClientListener.ddpErrorFunction);

};

ClientListener.prototype.ddpClient = null;
ClientListener.prototype.responseChecker = null;


ClientListener.httpPrepareCall = function (self, url) {

    self.responseChecker.startCallHttp(url, function () {
        ClientListener.endProcess(self);
    });

    HttpClient.get(url, function(content, error) {
        self.responseChecker.endCallHttp(url, error);

        var pageUrls = HttpClient.extractSrcs(content);
        _.forEach(pageUrls, function(pageUrl) {
            var fullUrl = Config.serverUrl + pageUrl;
            self.responseChecker.startCallHttp(fullUrl, function () {
                ClientListener.endProcess(self);
            });
            HttpClient.get(fullUrl, function(content, error) {
                self.responseChecker.endCallHttp(fullUrl, error);
                ClientListener.endProcess(self);
            });
        });

        ClientListener.endProcess(self);
    });

};

ClientListener.ddpConnectionFunction = function (self) {

    DDPClient.connect(self.ddpClient);

    ClientListener.ddpPrepareCall(self, function(name, id) {
        self.responseChecker.startCallMethod(name, id, function () {
            ClientListener.endProcess(self);
        });
    }, DDPClient.callMethod, Config.methods);
    ClientListener.ddpPrepareCall(self, function(name, id) {
        self.responseChecker.startCallSubscription(name, id, function () {
            ClientListener.endProcess(self);
        });
    }, DDPClient.subscribe, Config.subscriptions);
};

ClientListener.ddpPrepareCall = function (self, responseCheckerFunction, ddpClientFunction, calls) {
    var totalIndex = 0;
    _.forEach(calls, function(call) {
        var currentIndex = 0;
        while (currentIndex < call.callNumber) {
            var timeoutValue = call.startDelay + currentIndex * call.delayBetweenCalls;
            setTimeout(function(index) {
                var id = index.toString();
                responseCheckerFunction(call.name, id);
                ddpClientFunction(self.ddpClient, call.name, id, call.parameters);
            }, timeoutValue, totalIndex);
            totalIndex++;
            currentIndex++;
        }
    });
};

ClientListener.ddpDataFunction = function (self, message) {
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

ClientListener.ddpErrorFunction = function (error) {
    console.log('error' + JSON.stringify(error));
};

ClientListener.endProcess = function(self) {
    if (self.responseChecker.isAllFinished()) {
        self.ddpClient.close();
        self.responseChecker.end();
        self.responseChecker.display();
    }
};

module.exports = ClientListener;
