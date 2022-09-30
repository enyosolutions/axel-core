require('dotenv').config();
const core = require('axel-core');
const d = require('debug');

const middlewares = require('./src/middlewares');
const { beforeFn, afterFn } = require('./src/bootstrap');
const MailService = require('./src/api/services/common/MailService');

const {
  axel, Server, modelsLoader, router
} = core;

const debug = d('axel:init');

// eslint-disable-next-line`
const port = (process.env.PORT ? parseInt(process.env.PORT) : 0)
  || axel.config.port
  || 3333;

axel.port = port;
axel.services.mailService = MailService;

const server = new Server(core)
  .setMiddlewares(middlewares)
  .setRouter(router)
  .before(beforeFn)
  .after(afterFn)
  .models(modelsLoader);

server.start();
server.listen(port);

module.exports = server;