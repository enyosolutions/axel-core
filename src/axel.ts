import { Application, NextFunction } from 'express';

import l from './services/logger';
import config from '../config';
const ejs = require('ejs');
import * as path from 'path';

declare const global: any;

export type Axel = {
  port: number;
  config: { [key: string]: any };
  app?: Application;
  logger: any;
  log: any;
  models: { [key: string]: any };
  routes: { [key: string]: any };
  controllers: { [key: string]: any };
  policies: { [key: string]: NextFunction };
  mongodb?: any;
  sqldb?: any;
  rootPath: string;
  renderView: Function;
};

export type ServerInitFunction = (app: Application) => Promise<any>;


export const axel: Axel = {
         port: 3333,
         config,
         models: {},
         controllers: {},
         routes: {},
         policies: {},
         logger: l,
         log: l,
         rootPath: path.resolve(process.cwd(), '..'),
         renderView: (relPath: string, ...args: any) =>
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
