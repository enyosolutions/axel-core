/* eslint-disable no-underscore-dangle */
const _ = require('lodash');
const debug = require('debug')('axel:plugins');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * COntains all the code necessary for bootstrapping the admin.
 *
 * @class AxelPlugin
 */
class AxelPlugin {
  mergeData(...args) {
    return _.mergeWith(_.cloneDeep(args[0]), args[1], (a, b) => {
      if (_.isArray(a) && b !== null && b !== undefined) {
        return b;
      }

      if (b === null && a) {
        return a;
      }
    });
  }

  /**
   *
   *
   * @param {Application} app
   * @returns {Promise<any>}
   * @memberof AxelPlugin
   */
  async init(app, axel) { // eslint-disable-line no-unused-vars
    if (!axel.sqldb) {
      return Promise.reject(new Error('missing_sqldb'));
    }
    debug('Start plugin system init');
    // eslint-disable-next-line
    const { loadSqlModel } = require('../models.js'); // this is required because loading it on top overwrite the init.
    const axelPlugin = loadSqlModel(`${__dirname}/../models/sequelize/AxelPlugin.js`, axel.sqldb);
    axelPlugin.em.options.logging = false;

    if (!axel.models.axelPlugin) {
      return Promise.reject(new Error('missing_axelPlugin'));
    }

    debug('Start create table if needed');
    await Promise.all([
      axelPlugin.em.sync({ alter: true }, { logging: false }),
    ]);
    this.installPlugins(app, axel);
  }

  loadPlugins(axel) {
    debug('loadPlugins: start');
    if (!axel.config.plugins || !_.isObject(axel.config.plugins)) {
      return [];
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
      let plugin = plugins[i];

      if (!plugin) {
        debug(`Plugin at index ${i} has no data, skipping`);
        continue;
      }
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
        logger.error(e);
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
      plugin = _.merge(plugin, pluginData);
      enabledPlugins.push(plugin);

      debug(`Loaded plugin ${plugin.name} successfully`);
    }

    return enabledPlugins;
  }

  async installPlugins(app, axel) {
    let installedPlugins = await axel.models.axelPlugin.em.findAll({});
    installedPlugins = installedPlugins.reduce((acc, current) => {
      acc[current.name] = current;
      return acc;
    }, {});
    // Invoke plugin register function if it is defined
    const plugins = Object.values(axel.plugins);
    for (let i = 0; i < plugins.length; i++) {
      const pluginData = plugins[i];
      // install only if the plugin is not install or has as different version installed
      if (!installedPlugins[pluginData.name]
        || (installedPlugins[pluginData.name] && pluginData.version !== installedPlugins[pluginData.name].version)
      ) {
        if (pluginData.install && _.isFunction(pluginData.install)) {
          // eslint-disable-next-line no-await-in-loop
          await pluginData.install(app);
        }
        debug('registerPlugins: saving', pluginData.name, pluginData);
        axel.models.axelPlugin.em.upsert({
          name: pluginData.name,
          version: pluginData.version,
        }).catch(console.warn);
      }
    }
  }
}

module.exports = new AxelPlugin();
