/**
@description Exports the global axel object.
*/

const ejs = require('ejs');
const { readdirSync } = require('fs');
const path = require('path');
const _ = require('lodash');
const d = require('debug');
const debug = d('axel:config');


async function loadConfig() {
  const dir = `${process.cwd()}/src/config/`;
  const files = readdirSync(path.resolve(dir));
  const fileToMerge = files
    .filter(
      file =>
        (
          file.endsWith('.mjs')
          || file.endsWith('.js')
          || file.endsWith('.ts')
        ) &&
        !file.endsWith('index.ts')
    )
    .sort((a, b) => {
      if (a === 'local.js') {
        return 1;
      }
      return -1;
    });

  let config = {};
  const proms = fileToMerge.map(async e => {
    return import(`file://${path.resolve(dir, e)}`)
      .then(data => {
        debug("merge", e);
        config = _.merge(config, data.default || data);
      }).catch(e => {
        console.warn(e);
        process.exit(-1);
      })
  });
  await Promise.all(proms).catch(console.error)
  return config;
}
const axel = {
  port: 3333,
  config: {},
  models: {},
  controllers: {},
  routes: {},
  services: {},
  policies: {},
  logger: null,
  log: null,
  rootPath: path.resolve(process.cwd(), '..'),
  init: async () => {
    debug('init requested');
    let p;
    if (axel.initCompleted && Object.keys(axel.config).length > 0) {
      return Promise.resolve();
    }
    if (axel.initPromise) {
      return axel.initPromise;
    }
    axel.initPromise = loadConfig().then(config => {
      axel.config = config;
      debug('init completed');
      axel.initCompleted = true;
      return config;
    });
    return axel.initPromise;
  },
  renderView: (relPath, ...args) =>
    ejs.renderFile(
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
module.exports.axel = axel;

