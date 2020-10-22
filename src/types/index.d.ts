import { NextFunction, Application } from 'express';
import { Sequelize } from 'sequelize';
import {ExtendedError} from '../index';

declare namespace Express {
  interface Request {
    user?: any;
    token?: string;
  }
}

declare namespace NodeJS {
  interface Global {
    axel: Axel;
    ExtendedError: ExtendedError;
    sqldb: Sequelize;
    testConfig: Obj;
  }
}

declare type Obj = { [key: string]: any };




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