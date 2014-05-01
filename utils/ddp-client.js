var CONFIG = require('./config');

DDPClient = function() {};
DDPClient.connect = function(client) {
    client.write('{\"msg\":\"connect\", \"version\":\"' + CONFIG.ddpVersion + '\"}');
};
DDPClient.callMethod = function(client, name, id, parameters) {
    var parametersString = '';
    if (parameters) {
        parametersString = ',\"params\":' + parameters;
    }
    client.write('{\"msg\":\"method\",\"id\":\"' + id + '\",\"method\":\"' + name + '\"' + parametersString + '}');
};
DDPClient.subscribe = function(client, name, id, parameters) {
    var parametersString = '';
    if (parameters) {
        parametersString = ',\"params\":' + parameters;
    }
    client.write('{\"msg\":\"sub\",\"id\":\"' + id + '\",\"name\":\"' + name + '\"' + parametersString + '}');
};

module.exports = DDPClient;