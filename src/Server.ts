import express, { Application } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import http from 'http';
import os from 'os';
import cookieParser from 'cookie-parser';
import cors from 'cors';
const debug = require('debug')('axel:server');

import l from './services/logger';
import installValidator from './services/openapi';
import { ServerInitFunction } from './axel';
import { Obj } from './types/index';

declare const axel: any;

console.time('STARTUP TIME');
const app = express();
const exit = process.exit;
const root = path.normalize(__dirname + '/../..');

export class Server {
  private routes: (app: Application) => void;
  private modelsFn: ServerInitFunction;
  private beforeFn: ServerInitFunction;
  private afterFn: ServerInitFunction;
  public app: Application = app;
  public middlewares: Obj = {};

  constructor() {
    axel.app = app;
    // app.set('appPath', root + 'client');
    app.set('appPath', root);
    if (this.middlewares) {
      Object.keys(this.middlewares).forEach((m: string) => app.use(this.middlewares[m] as any));
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
    app.use(cors(axel.config.security.cors));
    app.use(cookieParser(process.env.SESSION_SECRET));
  }

  setMiddlewares(middlewares: Obj): Server {
    this.middlewares = middlewares;
    return this;
  }

  router(routes: (app: Application) => void): Server {
    this.routes = routes;
    return this;
  }

  models(modelsFn: ServerInitFunction): Server {
    this.modelsFn = modelsFn;
    debug('models fn defined');
    return this;
  }

  before(callback: ServerInitFunction): Server {
    this.beforeFn = callback;
    debug('beforeFn fn defined');
    return this;
  }

  after(callback: ServerInitFunction): Server {
    this.afterFn = callback;
    return this;
  }

  listen(port: number): Application {
    const welcome = (p: number) => () => {
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
