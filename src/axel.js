/**
@description Exports the global axel object.
*/

const ejs = require('ejs');
const path = require('path');
const _ = require('lodash');
const d = require('debug');
const fs = require('fs');
const l = require('./services/logger.js');
const { loadPlugins } = require('./services/AxelPlugin');

const debug = d('axel:config');
const cache = {};
function loadConfig() {
  if (cache.config) {
    return cache.config;
  }
  const dir = `${process.cwd()}/src/config/`;
  const files = fs.readdirSync(path.resolve(dir));
  const fileToMerge = files
    .filter(
      file => (
        file.endsWith('.mjs')
        || file.endsWith('.js')
        || file.endsWith('.ts')
      )
        && !file.endsWith('index.js')
    )
    .sort((a) => {
      if (a === 'local.js') {
        return 1;
      }
      return -1;
    });

  let config = {};
  fileToMerge.forEach((e) => {
    // eslint-disable-next-line
    const data = require(`${path.resolve(dir, e)}`);
    debug('merge', e);
    config = _.merge(config, data || data);
  });
  cache.config = config;
  return config;
}


if (global.axel) {
  throw new Error('axel is already defined globally');
}
const axel = {
  port: 3333,
  app: null, /** express app object */
  config: loadConfig(),
  models: {},
  controllers: {},
  routes: {},
  services: {},
  policies: {},
  logger: l,
  log: l,
  plugins: {},
  enabledPlugins: [],

  rootPath: path.resolve(process.cwd()),
  init() {
    debug('Init started');
    if (axel.initCompleted && Object.keys(axel.config).length > 0) {
      return Promise.resolve();
    }
    if (axel.initPromise) {
      return axel.initPromise;
    }
    // console.count('Init started');
    const plugins = loadPlugins(axel);
    axel.plugins = plugins.reduce((acc, current) => {
      acc[current.name] = current;
      return acc;
    }, {});
    axel.initPromise = Promise.resolve(loadConfig()).then((config) => {
      if (config) {
        axel.config = config;
      }

      debug('Config Init completed');
      axel.initCompleted = true;
      return config;
    });
    return axel.initPromise;
  },
  // ejs.renderFile(
  renderView: (relPath, data, callback) => new Promise((resolve, reject) => {
    try {
      if (!relPath) {
        reject(new Error('template file is required'));
        if (callback) {
          callback(new Error('template file is required'));
        }
        return;
      }
      if (!axel.app) {
        console.warn('axel.app is not defined. Check that the server app is started');
        reject(new Error('axel.app is not defined'));
        if (callback) {
          callback(new Error('axel.app is not defined'));
        }
        return;
      }
      axel.app.render(relPath.indexOf('.ejs') > -1 ? relPath : `${relPath}.ejs`, {
        ...data,
        // eslint-disable-next-line
        __: data.__ || axel.app && axel.app.locals && axel.app.locals.i18n && axel.app.locals.i18n.__,
        i18n: data.i18n || (axel.app.locals && axel.app.locals.i18n),
        locale: data.locale || (axel.app.locals && axel.app.locals.i18n && axel.app.locals.i18n.getLocale())
      }, (err, html) => {
        if (err) {
          reject(err);
          if (callback) {
            callback(err);
          }
          return;
        }
        resolve(html);
        if (callback) {
          callback(null, html);
        }
      });
    } catch (err) {
      if (callback) {
        callback(err);
      }
      reject(err);
    }
  })
};

global.axel = axel;

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = (axel.config && axel.config.node_env) || 'production';
}
axel.init();

module.exports = axel;
