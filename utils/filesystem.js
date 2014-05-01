var fs = require('fs');
var _ = require('underscore-node');
var Config = require('./config');

var FileSystem = function() {};

FileSystem.prepareDirectory = function() {

    if(fs.existsSync(Config.resultsDirectory)) {
        _.forEach(fs.readdirSync(Config.resultsDirectory), function(fileName){
            fs.unlinkSync(Config.resultsDirectory + "/" + fileName);
        });
        fs.rmdirSync(Config.resultsDirectory);
    }

    fs.mkdirSync(Config.resultsDirectory);

    console.log('directory created : ' + Config.resultsDirectory);
};
FileSystem.listFiles = function() {
    return fs.readdirSync(Config.resultsDirectory);
};

FileSystem.getFilesData = function(fileNames) {
    var data = [];
    _.forEach(fileNames, function(fileName) {
        data.push(fs.readFileSync(Config.resultsDirectory + '/' + fileName, { encoding: 'UTF-8' }));
    });
    return data;
};

FileSystem.writeFile = function(fileName, data) {
    var filePath = Config.resultsDirectory + '/' + fileName;
    fs.writeFileSync(filePath, data);
    console.log('file created : ' + filePath);
};

module.exports = FileSystem;