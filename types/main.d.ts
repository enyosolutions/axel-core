import { Application, NextFunction, IRoute } from 'express';
import { ExtendedError } from '../src/services/ExtendedError';
import { SchemaValidator } from '../src/services/SchemaValidator';
import { JSONSchemaType } from 'ajv';

import { Sequelize } from 'sequelize/types';

export type ExtendedErrorType = typeof ExtendedError;
export type SchemaValidatorType = typeof SchemaValidator;

export type AxelModel = {
  identity: string;
  apiUrl: string;
  additionalProperties: Boolean;
  autoValidate: Boolean;
  primaryKeyField: string;
  displayField: string;
  searchableFields: string[];
  em: any;
  schema: JSONSchemaType;
  tableName?: string;
  repository?: Record<string, any>;
  entity?: AxelModelEntity;
  properties?: Record<string, any>;
  includeInServedModels?: boolean;
  automaticApi?: boolean;
  _attributes?: Record<string, any>;
};

export type AxelModelEntity = {
  attributes: Array;
  options: Record<string, any>;
}

export type AxelModels = {
  [key: string]: AxelModel;
};

export type Identity = keyof AxelModels;

export type AxelRoute =
  | string
  | {
    controller: string;
    action: string;
    secure?: boolean; // you need this if you defined you api as always secure !
  }
  | {
    view: string;
    secure?: boolean; // you need this if you defined you api as always secure !
  }
  | {
    view: string;
    secure?: boolean; // you need this if you defined you api as always secure !
  }
  | {
    use: IRoute;
  }
  | IRoute;

export type Axel = {
  port: number;
  config: { [key: string]: any };
  app?: Application;
  logger: any;
  log: any;
  models: AxelModels;
  routes: { [key: string]: any };
  controllers: { [key: string]: any };
  services: { [key: string]: any };
  policies: { [key: string]: NextFunction };
  mongodb?: any;
  sqldb?: any;
  rootPath: string;
  renderView: Function;
  hooks?: Array;
  initCompleted?: boolean;
  plugins?: Record<string, any>
  i18n?: any;
  enabledPlugins?: Array;
  init: Function;
  server?: Server;
};

export default Axel;
export type { Axel as default };

export type ServerInitFunction = (app: Application) => Promise<any>;

declare namespace Express {
  interface Request {
    user?: {
      roles: string[];
      email: string;
      username: string;
      [x: string]: any;
    };
    token?: string | { [key: string]: string };
    file: any;
    modelName?: string;
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

//declare const axel: Axel;

declare type Obj = { [key: string]: any };

declare global {
  var axel: Axel;
}