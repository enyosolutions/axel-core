import l from './services/logger.js';
import ejs from 'ejs';
import * as path from 'path';



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


export default axel;
