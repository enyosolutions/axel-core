const morgan = require('morgan');
const helmet = require('helmet');
const addRequestId = require('express-request-id');
const compression = require('compression');
const core = require('axel-core');

const { tokenDecryptMiddleware } = core;
const middleWares = {
  'token-decrypt': tokenDecryptMiddleware,
  morgan: morgan('dev', {
    skip(req, res) {
      return res.statusCode < 400 || process.env.NODE_ENV === 'test';
    },
  }),

  helmet: helmet(),
  addRequest: addRequestId(),
  compression: compression(),
};

module.exports = middleWares;
