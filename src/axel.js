/**
@description Exports the global axel object.
*/

const ejs = require('ejs');
const path = require('path');
const _ = require('lodash');
const d = require('debug');
const fs = require('fs');
const l = require('./services/logger.js');

const debug = d('axel:config');
const cache = {};
function loadConfig() {
  if (cache.config) {
    return cache.config;
  }
  console.log('\\\\\\\nloadConfigloadConfig');
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

function loadPlugins(axel) {
  debug('loadPlugins: start');
  if (!axel.config.plugins || !_.isObject(axel.config.plugins)) {
    return {};
  }

  const allPlugins = [];

  Object.entries(axel.config.plugins).forEach(([name, pluginData]) => {
    if (!name || !pluginData || !_.isObject(pluginData)) {
      return;
    }

    pluginData.name = name;
    debug('found plugin:', name);
    allPlugins.push(pluginData);
  });

  // Get the sorted plugin list
  const plugins = allPlugins
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
    console.log('PLUGIN', plugin);

    if (!plugin.enabled && plugin.enabled !== undefined) {
      debug(`Plugin at index ${i} is disabled, skipping`);
      continue;
    }

    if (!plugin.name) {
      debug(`Plugin at index ${i} has no associated name, skipping`);
      continue;
    }

    if (axel.plugins[plugin.name]) {
      console.warn(`Plugin ${plugin.name} has been registered already, skipping`);
      continue;
    }

    if (!plugin.location) {
      plugin.location = `node_modules/${plugin.name}`;
      debug(`Plugin ${plugin.name} has no location path, setting to node_modules`);
    }

    debug(`Loading plugin ${plugin.name}`);

    let pathToPlugin;

    try {
      //  if (plugin.relative) {
      pathToPlugin = path.resolve(process.cwd(), plugin.location);
      // } else {
      //   pathToPlugin = path.dirname(require.resolve(plugin.location));
      // }
    } catch (e) {
      l.error(e);
    }

    if (!fs.existsSync(pathToPlugin) || !fs.statSync(pathToPlugin).isDirectory()) {
      console.warn(`Plugin ${plugin.name} not found at ${pathToPlugin}, skipping.`);
      continue;
    }

    const pluginData = require(pathToPlugin);

    if (!pluginData) {
      debug(`Failed to load plugin ${plugin.name}, data not found`);
      continue;
    }

    plugin.resolvedPath = pathToPlugin;

    enabledPlugins.push(plugin);

    debug(`Loaded plugin ${plugin.name} successfully`);
  }

  return enabledPlugins;
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
    console.count('Init started');
    if (axel.initCompleted && Object.keys(axel.config).length > 0) {
      return Promise.resolve();
    }
    if (axel.initPromise) {
      return axel.initPromise;
    }
    loadPlugins(axel);
    axel.initPromise = Promise.resolve(loadConfig()).then((config) => {
      if (config) {
        axel.config = config;
      }
      loadPlugins(axel);

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
