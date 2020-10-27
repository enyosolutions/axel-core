/**
@description Exports the global axel object.
*/

const ejs = require('ejs');
const { readdirSync } = require('fs');
const path = require('path');
const _ = require('lodash');
const d = require('debug');
const l = require('./services/logger.js');

const debug = d('axel:config');


function loadConfig() {
  const dir = `${process.cwd()}/src/config/`;
  const files = readdirSync(path.resolve(dir));
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

  let config;
  fileToMerge.forEach((e) => {
    // eslint-disable-next-line
    const data = require(`${path.resolve(dir, e)}`);
    debug('merge', e);
    config = _.merge(config, data.default || data);
  });
  return config;
}
const axel = {
  port: 3333,
  config: loadConfig(),
  models: {},
  controllers: {},
  routes: {},
  services: {},
  policies: {},
  logger: l,
  log: l,
  rootPath: path.resolve(process.cwd(), '..'),
  init: async () => {
    debug('init requested');
    if (axel.initCompleted && Object.keys(axel.config).length > 0) {
      return Promise.resolve();
    }
    if (axel.initPromise) {
      return axel.initPromise;
    }
    axel.initPromise = Promise.resolve(loadConfig()).then((config) => {
      axel.config = config;
      debug('init completed');
      axel.initCompleted = true;
      return config;
    });
    return axel.initPromise;
  },
  renderView: (relPath, ...args) => ejs.renderFile(
    path.resolve(
      process.cwd(),
      'views',
      relPath.indexOf('.ejs') > -1 ? relPath : `${relPath}.ejs`,
    ),
    ...args,
  ),
};

global.axel = axel;

axel.init();


module.exports = axel;
