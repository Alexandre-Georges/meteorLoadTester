var config = {};

config.serverUrl = 'http://localhost:3000';
config.httpUrl = config.serverUrl + '/';
config.ddpUrl = config.serverUrl + '/sockjs';
config.timeout = 5000;
config.ddpVersion = 'pre2';
config.resultsDirectory = 'results';

config.subscriptions = [
    {
        name: 'subscription1',
        parameters: '[\"params1\", \"params2\"]',
        callNumber: 50,
        delayBetweenCalls: 2,
        startDelay: 4000
    },
    {
        name: 'subscription2',
        parameters: null,
        callNumber: 10,
        delayBetweenCalls: 1000,
        startDelay: 0
    }
];
config.methods = [
    {
        name: 'method1',
        parameters: '[\"param1\"]',
        callNumber: 1,
        delayBetweenCalls: 200,
        startDelay: 0
    }
];

module.exports = config;