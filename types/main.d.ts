import { Application, NextFunction, IRoute } from 'express';
import { ExtendedError } from '../src/services/ExtendedError';
export { Server } from '../src/Server';
export * as SchemaValidator from '../src/services/SchemaValidator';
export * as AuthService from '../src/services/AuthService';
export * from '../src/index';
export { JSONSchemaType } from 'ajv';
import { Sequelize } from 'sequelize/types';


export type ExtendedErrorType = typeof ExtendedError;
export type SchemaValidatorType = typeof SchemaValidator;
export type ServerType = typeof Server;

export type VacModel = {
    name?: string;
    namePlural?: string;
    title?: string;
    [key as string]: any;
    pageTitle?: string;
    routerPath?: string;
    primaryKey?: string;
    menuIsVisible?: boolean;
    options?: {
      initialDisplayMode?: 'table' | 'list' | 'kanban' | 'component';
      columnsDisplayed?: number;
    },
    actions?: {
      create: boolean | string;
      edit: boolean | string;
      view: boolean | string;
      delete: boolean | string;
      export: boolean | string;
      import: boolean | string;
    },
    detailPageMode?: 'page' | 'modal' | 'slide';
  formOptions?: {
    useTabsForUngroupedFields?: boolean;
    tabsNavType?: 'tabs' | 'pills',
  },
  layout: {
    legend: string;
    fields: string[];
    cols: string | number;
    wrapperClasses: string;
  }[];

}
export type AxelModel = AxelSequelizeModel & AxelSchema & {
  em: any;
};

export type AxelSchema = {
  additionalProperties?: Boolean;
  apiUrl?: string;
  automaticApi?: boolean;
  autoValidate?: Boolean;
  collectionName?: string;
  displayField?: string;
  em?: any;
  repository?: any;
  identity: string;
  includeInServedModels?: boolean;
  primaryKeyField?: string;
  primaryKey?: string; /** @deprecated */
  repository?: Record<string, any>;
  schema: JSONSchemaType;
  searchableFields?: string[];
  tableName?: string;
  _attributes?: Record<string, any>;
  hooks?: {
    [key as string]: function;
  };
  admin?: VacModel;
}

export type AxelSequelizeModel = {
  em?: any;
  entity?: AxelModelEntity;
  identity: string;
}

export type AxelSequelizeEntity = {
  attributes: Array;
  options: Record<string, any>;
  associations?: (models: {[key as string]: SequelizeModel}) => void | null;
  hooks?: {
    [key as string]: function;
  }
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
  _initPromise?: Promise<any>;

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
    endpoint?: string;

    query: {
      [key: string]: any;
      range?: {
        startDate?: string | Date;
        endDate?: string | Date;
      };
      options?: {
        searchMode?: 'contains' | 'startsWith' | 'endsWith';
        [key: string]: any;
      };
    }
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