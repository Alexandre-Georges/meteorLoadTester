var http = require('http');

var HTTP_CODE_SUCCESS = 200;
var SRC_REGEXP = /src="(.*)"|href="(.*\.css.*)"/g;

var HttpClient = function() {};
HttpClient.get = function(path, callback) {
    var request = http.get(path, function(response) {
        if (response.statusCode !== HTTP_CODE_SUCCESS) {
            console.log('bad status code (' + response.statusCode + ') during HTTP call for resource : ' + path);
            callback(undefined, 'bad status code (' + response.statusCode + ')');
        } else {
            var responseContent = '';
            response.setEncoding('UTF-8');
            response.on('data', function(content) {
                responseContent += content;
            });
            response.on('end', function() {
                callback(responseContent, undefined);
            });
        }
    });

    request.on('error', function(error) {
        console.log('error (' + error.message + ') during HTTP call for resource ' + path);
        callback(undefined, error);
    });

    request.end();
};

HttpClient.extractSrcs = function(content) {
    var srcs = [];
    var result;
    while(result = SRC_REGEXP.exec(content)) {
        var index = 1;
        var url;
        while((url = result[index]) === undefined) {
            index++;
        }
        srcs.push(url);
    }
    return srcs;
};

module.exports = HttpClient;