const express = require('express');
const path = require('path');
const _ = require('lodash');
const bodyParser = require('body-parser');
const http = require('http');
const os = require('os');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const debug = require('debug')('axel:server');
const l = require('./services/logger.js');
const errorHandler = require('./middlewares/error-handler');
const pagination = require('./middlewares/pagination');

console.time('STARTUP TIME');
const app = express();
const exit = process.exit;
const root = path.normalize(process.cwd());

class Server {
  constructor(axel) {
    this.axel = axel || global.axel;
    this.modelsFn = null;
    this.router = null;
    this.beforeFn = null;
    this.afterFn = null;
    this.app = app;
    this.initCompleted = false;
    this.middlewares = {};

    axel
      .init()
      .then(() => {
        debug('', 'init in server.js');
        axel.app = app;
        // app.set('appPath', root + 'client');
        app.set('appPath', root);

        if (this.middlewares) {
          Object.keys(this.middlewares).forEach((m) => {
            debug('Loading middleware', m, this.middlewares[m]);
            if (!this.middlewares[m] || !_.isFunction(this.middlewares[m])) {
              throw new Error(`middleware ${m} is not a function`);
            }
            app.use(this.middlewares[m]);
          });
        }

        app.disable('x-powered-by');

        app.set('view engine', 'ejs');
        app.use(
          bodyParser.json({
            limit: process.env.REQUEST_LIMIT || '100mb',
          })
        );
        app.use(
          bodyParser.urlencoded({
            extended: true,
            limit: process.env.REQUEST_LIMIT || '100mb',
          })
        );
        app.use(
          bodyParser.text({
            limit: process.env.REQUEST_LIMIT || '100mb',
          })
        );
        if (axel.config && axel.config.security && axel.config.security.cors) {
          app.use(cors(axel.config.security.cors));
        }

        app.use(cookieParser(process.env.SESSION_SECRET));
        app.use(pagination);
      })
      .catch(console.warn);
  }

  setMiddlewares(middlewares) {
    this.middlewares = middlewares;
    return this;
  }

  setRouter(router) {
    this.router = router;
    return this;
  }

  models(modelsFn) {
    this.modelsFn = modelsFn;
    debug('models fn defined');
    return this;
  }

  before(callback) {
    this.beforeFn = callback;
    debug('beforeFn fn defined');
    return this;
  }

  after(callback) {
    this.afterFn = callback;
    return this;
  }

  async start() {
    axel.init();

    if (this.beforeFn) {
      await this.beforeFn(app);
    }

    return (
      this.modelsFn(app)
        // .then(() => installValidator(app, this.routes))
        .then(() => this.router(app))
        .then(async () => {
          if (!process.env.NODE_ENV) {
            process.env.NODE_ENV = 'development';
          }
          if (this.afterFn) {
            this.afterFn(app);
          }

          app.use(errorHandler);
          app.emit('app-ready', { axel });
        })
        .catch((e) => {
          l.error(e);
          exit(1);
        })
    );
  }

  async listen(port) {
    const welcome = p => () => {
      l.info(
        `up and running in ${process.env.NODE_ENV
        || 'development'} @: ${os.hostname()} on port: ${p}}  => http://localhost:${p}`
      );
      debug(
        `up and running in ${process.env.NODE_ENV
        || 'development'} @: ${os.hostname()} on port: ${p}}  => http://localhost:${p}`
      );
      l.info('\n');
      l.info('__________________________________');
      l.info('__________________________________');
      l.info(' ');
      l.log('          ヽ(o＾▽＾o)ノ        ');
      l.info(' ');
      l.info(`HOST: http://localhost:${p}`);
      l.info(`NODE_ENV: ${process.env.NODE_ENV}`);
      l.info('__________________________________');
      l.info('__________________________________');
      console.timeEnd('STARTUP TIME');
      app.emit('server-ready', { axel });
    };
    try {
      app.locals.server = http.createServer(app);
      app.locals.server.listen(port, welcome(port));
      return app;
    } catch (err) {
      console.warn(err.message);
      process.exit(-1);
    }
  }
}
module.exports = Server;
module.exports.Server = Server;
