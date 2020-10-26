import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import http from 'http';
import os from 'os';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import d from 'debug';
const debug = d('axel:server');

import l from './services/logger.js';


console.time('STARTUP TIME');
const app = express();
const exit = process.exit;
const root = path.normalize(process.cwd());


export class Server {
  routes;
  modelsFn;
  beforeFn;
  afterFn;
  app = app;
  middlewares = {};

  constructor() {
    axel.init()
    .then(()=> {
      debug('', "init in server.js");
      axel.app = app;
    // app.set('appPath', root + 'client');
    app.set('appPath', root);
    if (this.middlewares) {
      Object.keys(this.middlewares).forEach((m) => app.use(this.middlewares[m]));
    }

    app.disable('x-powered-by');

    app.set('view engine', 'ejs');
    app.use(
      bodyParser.json({
        limit: process.env.REQUEST_LIMIT || '100mb',
      }),
      );
    app.use(
      bodyParser.urlencoded({
        extended: true,
        limit: process.env.REQUEST_LIMIT || '100mb',
      }),
      );
    app.use(
      bodyParser.text({
        limit: process.env.REQUEST_LIMIT || '100mb',
      }),
      );
    if (axel.config && axel.config.security && axel.config.security.cors) {
      app.use(cors(axel.config.security.cors));
    }

    app.use(cookieParser(process.env.SESSION_SECRET));
  })
    .catch(console.warn);

  }

  setMiddlewares(middlewares) {
    this.middlewares = middlewares;
    return this;
  }

  router(routes) {
    this.routes = routes;
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

  async listen(port) {
    const welcome = (p) => () => {
      l.info(
        `up and running in ${process.env.NODE_ENV ||
          'development'} @: ${os.hostname()} on port: ${p}}  => http://localhost:${p}`,
          );
      debug(
        `up and running in ${process.env.NODE_ENV ||
          'development'} @: ${os.hostname()} on port: ${p}}  => http://localhost:${p}`,
          );
      l.info('\n');
      l.info('__________________________________');
      l.info(`http://localhost:${p}`);
      l.info('__________________________________');
      console.timeEnd('STARTUP TIME');
      l.info('__________________________________');
      app.emit('server-ready', { axel });
      if (this.afterFn) {
        this.afterFn(app);
      }
    };

    await axel.init();
    this.modelsFn(app)
      // .then(() => installValidator(app, this.routes))
      .then(() => this.routes(app))
      .then(async () => {
        if (!process.env.NODE_ENV) {
          process.env.NODE_ENV = 'development';
        }
        debug('modelFn fn completed');
        console.log('"process.env.NODE_ENV', process.env.NODE_ENV);

        if (this.beforeFn) {
          await this.beforeFn(app);
        }
        app.locals.server = http.createServer(app);
        app.locals.server.listen(port, welcome(port));
      })
      .catch(e => {
        l.error(e);
        exit(1);
      });

      return app;
    }
  }
  export default Server;