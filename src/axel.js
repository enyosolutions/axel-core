/**
@description Exports the global axel object.
*/


import l from './services/logger.js';
import ejs from 'ejs';
import { readdirSync } from 'fs';
import path from 'path';
import _ from 'lodash';
import d from 'debug';
const debug = d('axel:config');


async function loadConfig() {
  const dir = `${process.cwd()}/src/config/`;
  const files = readdirSync(path.resolve(dir));
  const fileToMerge = files
    .filter(
      file =>
        (file.endsWith('.js') || file.endsWith('.ts')) &&
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
export const axel = {
  port: 3333,
  config: {},
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
    let p;
    if (axel.init && Object.keys(axel.config).length > 0) {
      return Promise.resolve();
    }
    if (axel.initPromise) {
      return axel.initPromise;
    }
    axel.initPromise = loadConfig().then(config => {
      axel.config = config;
      debug('init completed');
      axel.init = true;
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


export default axel;
