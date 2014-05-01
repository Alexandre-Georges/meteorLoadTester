var ClientListener = require('./logic/clientListener');
var Config = require('./utils/config');

Config.clientNumber = process.argv[2];


new ClientListener();