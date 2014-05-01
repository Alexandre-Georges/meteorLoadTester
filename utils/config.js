var config = {};

config.url = 'http://localhost:3000/sockjs';
config.timeout = 100;
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