import { Application, NextFunction, IRoute } from 'express';
import { ExtendedError } from '../src/services/ExtendedError';
import { SchemaValidator } from '../src/services/SchemaValidator';
import { JSONSchemaType } from 'ajv';

import { Sequelize } from 'sequelize/types';

export type ExtendedErrorType = typeof ExtendedError;
export type SchemaValidatorType = typeof SchemaValidator;

export type AxelModel = {
  identity: String;
  apiUrl: String;
  additionalProperties: Boolean;
  autoValidate: Boolean;
  primaryKeyField: String;
  displayField: String;
  searchableFields: String[];
  em: any;
  schema: JSONSchemaType;
};
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
};

export default Axel;

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

declare const axel: Axel;

declare type Obj = { [key: string]: any };

declare global {
  namespace axel {
    export interface Global {
      axel: Axel;
    }
  }
}
