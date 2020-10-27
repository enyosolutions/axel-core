const { NextFunction, Application } = require('express');
const { Sequelize } = require('sequelize');
const { ExtendedError } = require('../index');

declare namespace Express {
  interface Request {
    user?;
    token?: string;
  }
}

declare namespace NodeJS {
  interface Global {
    axel: Axel;
    ExtendedError;
    sqldb: Sequelize;
    testConfig;
  }
}

declare type Obj = { [key: string] };




export type Axel = {
  port;
  config: { [key: string] };
  app?;
  logger;
  log;
  models: { [key: string] };
  routes: { [key: string] };
  controllers: { [key: string] };
  policies: { [key: string] };
  mongodb?;
  sqldb?;
  rootPath: string;
  renderView: Function;
};

export type ServerInitFunction = (app) => Promise<any>;


export type SchemaValidationState = {
  isValid: boolean;
  context: string;
  errors?;
  formatedErrors?;
  rawErrors?;
};


export type WebsocketRequest = {
  method: string;
  query: { [key: string] };
  body: { [key: string] };
};



export interface ExcelServiceOptions {
  sheet;
  header?: boolean;
  columns?;
  eager?: boolean;
  parser?: 'json' | 'html' | 'json' | 'csv' | 'txt';
}
