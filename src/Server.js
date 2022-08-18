const express = require('express');
const path = require('path');
const { statSync, existsSync } = require('fs');
const _ = require('lodash');
const bodyParser = require('body-parser');
const http = require('http');
const os = require('os');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const debug = require('debug')('axel:server');
const axel = require('./axel.js');
const defaultRouter = require('./router.js').router;
const defaultModelsLoader = require('./models.js').modelsLoader;

const l = require('./services/logger.js');
const defaultErrorHandler = require('./middlewares/error-handler');
const pagination = require('./middlewares/pagination');
const AxelManager = require('./services/AxelManager.js');
// const AxelAdmin = require('./services/AxelAdmin.js');

console.time('[axel] STARTUP TIME');
const app = express();
const exit = process.exit;
const root = path.normalize(process.cwd());

class Server {
  constructor() {
    this.modelsFn = defaultModelsLoader;
    this.router = defaultRouter;
    this.beforeFn = [];
    this.afterFn = [];
    this.errorHandler = defaultErrorHandler;
    this.app = app;
    this.initCompleted = false;
    this.middlewares = {};
    this.registeredPluginNames = [];
    this.pluginSequelizeModels = {};
    this.pluginSchemaModels = {};

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
        if (_.get(axel, 'config.security.cors')) {
          app.use(cors(axel.config.security.cors));
        }
        const adminConfig = _.get(axel, 'config.plugins.admin');
        // eslint-disable-next-line promise/always-return
        if (adminConfig) {
          this.after((theApp) => {
            if (adminConfig && adminConfig.enabled) {
              debug('starting admin panel init');
              AxelManager.init(theApp);
            } else {
              debug('admin panel is disabled');
            }
          });
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

  /**
 * Set the middlewares for handling errors
 * @param {*} handler func | func[]
 * @returns
 * @memberof Server
 */
  setErrorHandler(handler) {
    this.errorHandler = handler;
    return this;
  }

  models(modelsFn) {
    this.modelsFn = modelsFn;
    debug('models fn defined');
    return this;
  }

  before(callback) {
    this.beforeFn.push(callback);
    debug('beforeFn fn added');
    return this;
  }

  after(callback) {
    this.afterFn.push(callback);
    return this;
  }

  async executeCallbackFunctions(functionsArray, myApp) {
    for (let index = 0; index < functionsArray.length; index++) {
      const func = functionsArray[index];
      if (typeof func === 'function') {
        // eslint-disable-next-line no-await-in-loop
        await func(myApp);
      }
    }
  }

  loadModels() {
    return this.modelsFn(app, this.pluginSequelizeModels, this.pluginSchemaModels);
  }

  registerPlugins() {
    // Get the sorted plugin list
    const plugins = (axel.config && axel.config.plugins && _.isArray(axel.config.plugins) ? axel.config.plugins : [])
      .sort((pluginA, pluginB) => {
        const priorityA = pluginA ? pluginA.priority : null;
        const priorityB = pluginB ? pluginB.priority : null;

        if (priorityA < priorityB) {
          return -1;
        }

        if (priorityA > priorityB) {
          return 1;
        }

        return 0;
      });

    const enabledPlugins = [];

    for (let i = 0; i < plugins.length; i++) {
      // Load the plugin data from the specified location
      const plugin = plugins[i];

      if (!plugin) {
        debug(`Plugin at index ${i} has no data, skipping`);
        continue;
      }

      if (!plugin.name) {
        debug(`Plugin at index ${i} has no associated name, skipping`);
        continue;
      }

      if (this.registeredPluginNames.includes(plugin.name)) {
        debug(`Plugin ${plugin.name} has been registered already, skipping`);
        continue;
      }

      if (!plugin.location) {
        debug(`Plugin ${plugin.name} has no location path, skipping`);
        continue;
      }

      debug(`Loading plugin ${plugin.name}`);

      let pathToPlugin;

      try {
        if (plugin.relative) {
          pathToPlugin = path.resolve(process.cwd(), plugin.location);
        } else {
          pathToPlugin = path.dirname(require.resolve(plugin.location));
        }
      } catch (e) {
        l.error(e);
      }

      if (!existsSync(pathToPlugin) || !statSync(pathToPlugin).isDirectory()) {
        continue;
      }

      const pluginData = require(pathToPlugin);

      if (!pluginData) {
        debug(`Failed to load plugin ${plugin.name}, data not found`);
        continue;
      }

      plugin.resolvedPath = pathToPlugin;
      enabledPlugins.push(plugin);

      // Invoke plugin register function if it is defined
      if (pluginData.register && _.isFunction(pluginData.register)) {
        pluginData.register(app);
      } 

      // Handle beforeFn/afterFn if any
      if (pluginData.beforeFn && _.isFunction(pluginData.beforeFn)) {
        this.beforeFn.push(pluginData.beforeFn);
      }

      if (pluginData.afterFn && _.isFunction(pluginData.afterFn)) {
        this.afterFn.push(pluginData.afterFn);
      }

      this.registeredPluginNames.push(plugin.name);
      
      debug(`Loaded plugin ${plugin.name} successfully`);
    }

    axel.enabledPlugins = enabledPlugins;

    return this;
  }

  async start() {
    axel.init();

    if (this.beforeFn.length) {
      await this.executeCallbackFunctions(this.beforeFn, app);
    }

    return (
      this.modelsFn(app)
        // .then(() => installValidator(app, this.routes))
        .then(() => this.router(app))
        .then(async () => {
          if (!process.env.NODE_ENV) {
            process.env.NODE_ENV = 'development';
          }
          if (this.afterFn.length) {
            this.executeCallbackFunctions(this.afterFn, app);
          }

          app.use(this.errorHandler);
          app.emit('app-ready', { axel });
          return app;
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
      console.timeEnd('[axel] STARTUP TIME');
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
