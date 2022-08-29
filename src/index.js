/**
 * Axel Framework module.
 * The axel framework is a library for implementing some sensible default on expressjs
 * @module axel-core
 */

const axel = require('./axel');

const AuthService = require('./services/AuthService');

if (!axel.initCompleted) {
  axel.init();
}

module.exports = axel;
module.exports.axel = axel;

module.exports.Server = require('./Server').Server;
module.exports.router = require('./router').router;
module.exports.modelsLoader = require('./models.js').modelsLoader;

module.exports.AuthService = AuthService;
module.exports.tokenDecryptMiddleware = AuthService.tokenDecryptMiddleware;
module.exports.ExtendedError = require('./services/ExtendedError.js');
module.exports.Utils = require('./services/Utils.js');
module.exports.ErrorUtils = require('./services/ErrorUtils.js');
module.exports.ControllerUtils = require('./services/ControllerUtils.js');

module.exports.SchemaValidator = require('./services/SchemaValidator.js');
module.exports.AxelAdmin = require('./services/AxelAdmin.js');
module.exports.AxelManager = require('./services/AxelManager.js');
module.exports.DocumentManager = require('./services/DocumentManager.js');
