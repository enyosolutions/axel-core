import { resolve } from 'path';
import dotenv from 'dotenv';
import _ from 'lodash';

dotenv.config({ path: resolve(process.cwd(), '.env.test') });

import { axel } from '../src/axel';
import SqlDB from '../src/axel/services/SqlDB';

import request from 'supertest';

import faker from 'faker';
const jsf = require('json-schema-faker');
jsf.extend('faker', () => faker);
jsf.option('optionalsProbability', 0.5);
jsf.option('useExamplesValue', true);
jsf.option('ignoreProperties', ['createdOn', 'lastModifiedOn', axel.config.framework.primaryKey]);

axel.config.logger.level = 'warn';
import server from '../src/index';
import minimist from 'minimist';

const commandArgs = minimist(process.argv.slice(2));

if (commandArgs.h || commandArgs.help) {
  console.log('Load fake data into the db');
  console.log('args');
  console.log('clear: clears (drop) all tables in the db before inserting data');
  console.log('amount: the default amount of data to insert for each table');
  console.log('verbose: prints more logs while processing the data');
  console.log(commandArgs);
  process.exit(0);
}


declare const global: any;
global.server = server;
global.axel = axel;
global.testConfig = {};

const user = {
  username: faker.internet.userName(),
  email: commandArgs.clear ? 'dev@enyosolutions.com' : faker.internet.email(),
  firstName: 'john',
  lastName: 'doe',
  password: 'passpass',
  accountType: 'provider',
};
const logger = axel.logger;
logger.log('NODE_ENV', process.env.NODE_ENV);

const fakeDataAmount: { [key: string]: number } = {
  _default: commandArgs.amount ? parseInt(commandArgs.amount) : 50,
};
const fakeDataDictionnary: { [key: string]: any } = {};


async function initServer() {
  console.log('⌛');
  logger.log('CLEAN DATABASE', process.env.DATABASE_NAME, axel.sqldb.config.database);
  try {
    logger.log('...');
    await axel.sqldb.sync({ force: commandArgs.clear, alter: true, logging: false });
  } catch (err) {
    logger.warn(err);
    process.exit(-1);
  }
  logger.log('CLEAN DATABASE DONE');
  return await request(axel.app)
    .post('/api/user')
    // .set('Authorization', 'Bearer ' + axel.config.auth)
    .send(user)
    .then((data: any) => {
      if (data.status && data.status > 300) {
        if (commandArgs.verbose) {
          console.log('loadData', data.body);
        }
        throw new Error('error_' + (data.body.message || data.status));
      }
      if (data.errors) {
        if (commandArgs.verbose) {
          console.log(data.body);
        }
        throw new Error('error_' + data.body.message);
      }
      global.testConfig.user = data.body.user;
      global.testConfig.auth = data.body.token;
      axel.config.auth = data.body.token;

      logger.log('global.testConfig', global.testConfig);
    })
    .catch(err => {
      if (commandArgs.verbose) {
        console.log('err', Object.keys(err));
      }
      throw new Error('error_' + err.message);
      process.exit(-1);
    });
}

const loadAllData = () => {};

const loadData = async (modelName: string, options: any = { merge: {} }) => {
  console.log('__________________________________');
  console.log('importing ', modelName);
  console.log('__________________________________');
  if (['axelModelConfig', 'axelModelFieldConfig'].indexOf(modelName) === -1) {
    const model = axel.models[modelName];
    if (!model) {
      throw new Error('model_does_not_exists_' + modelName);
    }
    const amount: number = options.quantity || fakeDataAmount[modelName] || fakeDataAmount._default;
    const primaryKey =
      options.primaryKeyField || model.primaryKeyField
        ? model.primaryKeyField
        : axel.config.framework.primaryKey;
    Object.keys(model.schema.properties).forEach(prop => {
      const { relation, foreignKey } = model.schema.properties[prop];
      if (relation) {
        if (!fakeDataDictionnary[relation]) {
          fakeDataDictionnary[relation] = [];
        }
        const relationArray = fakeDataDictionnary[relation];
        model.schema.properties[prop].examples = relationArray
          ? relationArray.map((r: any) => _.get(r, foreignKey))
          : [];
        if (commandArgs.verbose) {
          console.log(
            'prop',
            prop,
            'foreignKey',
            foreignKey,
            'examples',
            model.schema.properties[prop].examples,
            relationArray.length,
          );
        }
      }
    });
    for (let i = 0; i < amount; i++) {
      let source = jsf.generate(model.schema);
      if (options.merge) {
        source = _.merge(source, options.merge, (objValue: any, srcValue: any) => {
          if (_.isArray(objValue)) {
            return objValue;
          }
          if (objValue !== undefined) {
            return objValue;
          }
        });

        if (commandArgs.verbose) {
          console.log('_____________________________');
        }
      }
      if (commandArgs.verbose) {
        console.log('loadData', source);
        console.log('-');
        console.log('-');
        console.log('-');
        console.log('-');
      }
      const url = model.apiUrl || (model.admin && model.admin.apiUrl) || model.url;
      await request(axel.app)
        .post(url)
        .set('Authorization', 'Bearer ' + global.testConfig.auth)
        .send(source)
        .then(resp => {
          if (resp.status > 200) {
            console.warn(i, url, resp.status, resp.body);
            process.exit(-1);
          }
          if (resp.body && resp.body) {
            const data = resp.body.user || resp.body.body;
            if (!fakeDataDictionnary[modelName]) {
              fakeDataDictionnary[modelName] = [];
            }
            if (commandArgs.verbose) {
              console.log(i, url, resp.status, data);
            }
            fakeDataDictionnary[modelName].push(data);
          }
        })
        .catch(err => {
          axel.logger.warn(source, err);
          process.exit(-1);
        });
    }
  }
};

// @ts-ignore
server.on('server-ready', async () => {
  try {
    await initServer();
    await loadData('user', {
      merge: {
        password: `${Date.now()}`,
        accountType: 'provider',
      },
    });
    await loadData('user', {
      merge: {
        password: `${Date.now()}`,
        accountType: 'client',
      },
    });
    // await loadData('provider');
    // await loadData('client');
    await loadData('tag', {
      primaryKeyField: 'code',
      merge: { parentTag: null },

      quantity: 1,
    });
    await loadData('tag', { primaryKeyField: 'code' });
    await loadData('attachment', { quantity: 20 });
    const clients = await request(axel.app)
      .get(axel.models.client.apiUrl)
      .set('Authorization', 'Bearer ' + global.testConfig.auth);
    fakeDataDictionnary['client'] = clients.body.body;
    const providers = await request(axel.app)
      .get(axel.models.provider.apiUrl)
      .set('Authorization', 'Bearer ' + global.testConfig.auth);
    fakeDataDictionnary['provider'] = providers.body.body;

    await loadData('portfolio');
    await loadData('experience');
    await loadData('mission');
    await loadData('quotation', { merge: { previousVersionId: null } });
    await loadData('quotation');
    await loadData('message');

    console.log('ALL DONE ✅');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(-1);
  }
});
