/**
 * Axel Framework module.
 * The axel framework is a library for implementing some sensible default on expressjs
 * @module axel-core
 */

const axel = require('./axel.js');

const AuthService = require('./services/AuthService.js');

if (!axel.initCompleted) {
  axel.init();
}

module.exports = axel;
module.exports.axel = axel;

module.exports.Server = require('./Server.js').Server;
module.exports.router = require('./router.js').router;
module.exports.modelsLoader = require('./models.js').modelsLoader;

module.exports.SchemaValidator = require('./services/SchemaValidator.js');
module.exports.AxelAdmin = require('./services/AxelAdmin.js');
module.exports.AxelManager = require('./services/AxelManager.js');
module.exports.DocumentManager = require('./services/DocumentManager.js');

module.exports.AuthService = AuthService;
module.exports.tokenDecryptMiddleware = AuthService.tokenDecryptMiddleware;
module.exports.ExtendedError = require('./services/ExtendedError.js');
