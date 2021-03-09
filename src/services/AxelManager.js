const fs = require('fs');
const serialize = require('serialize-javascript');
const _ = require('lodash');
const socketIO = require('socket.io');
const axelCli = require('axel-cli');
const { resolve } = require('path');
const AxelAdmin = require('./AxelAdmin');
const debug = require('debug')('axel:manager');

const {
  generateController, generateModel, generateApi, generateRoute,
  cliFieldToSequelizeField,
  sequelizeFieldToSchemaField
} = axelCli;

const requireWithoutCache = (path) => {
  const modelPath = require.resolve(path);
  const cachedModel = require.cache[modelPath];
  delete require.cache[modelPath];
  // eslint-disable-next-line
  const model = require(path);
  delete require.cache[modelPath];
  require.cache[modelPath] = cachedModel;
  return model;
};

/**
   * Contains all the code necessary for bootstrapping the code manager page.
   *
   * @class AxelAdmin
   */
class AxelManager {
  /**
     *
     *
     * @param {Application} app
     * @returns {Promise<any>}
     * @memberof AxelAdmin
     */
  init(app) {
    try {
      debug('Copying manager to the front project', `${process.cwd()}/views/axel-manager.ejs`);
      fs.copyFileSync(resolve(__dirname, '../views/axel-manager.ejs'), `${process.cwd()}/views/axel-manager.ejs`);
    } catch (err) {
      console.warn('[AXELMANAGER][WARNING]', err.message);
    }
    console.log('\n\n\n\n\n\n');
    console.log('[AXELMANAGER] WS is opening');
    const io = socketIO(app.locals.server);
    app.locals.io = io;
    io.on('connect', (socket) => {
      console.log('[AXELMANAGER] WS client connected', socket.id);
      const counter = 0;

      socket.on(
        '/axel-manager/api',
        async (req = { method: 'GET', query: {}, body: {} }, cb) => {
          if (typeof req === 'function') {
            cb = req;
          }
          switch (req.method) {
            case 'GET':
            default:
              break;
            case 'POST':
              const {
                name, type, force, fields, withSchema
              } = req.body;
              if (!name) {
                return cb('missing_param_name');
              }
              try {
                await generateApi({
                  name,
                  type,
                  force,
                  fields,
                  withSchema,
                });
                let count = withSchema ? 4 : 3;
                // catching api signals in order for the file to generate properly
                process.once('SIGUSR2', () => {
                  console.log('[AXELMANAGER] Captured interruption signal....', count--);

                  if (count <= 0) {
                    setTimeout(() => {
                      process.kill(process.pid, 'SIGUSR2');
                      if (count < -10) {
                        process.exit();
                      }
                    }, 1000);
                  }
                });
                cb(null, { body: 'OK' });
              } catch (err) {
                console.warn('[AXELMANAGER]', err);
                cb({ message: err.message });
              }
          }
        },
      );

      socket.on(
        '/axel-manager/models',
        async (req = { method: 'GET', query: {}, body: {} }, cb) => {
          if (typeof req === 'function') {
            cb = req;
          }


          switch (req.method) {
            case 'GET':
            default:
              if (!axel.sqldb) {
                return (cb('sqldb_not_ready'));
              }
              // eslint-disable -next-line
              let tables = await axel.sqldb.query('show tables');
              tables = tables.map(t => Object.values(t)[0]);
              const models = Object.entries(axel.models).map(([modelName, modelDef]) => ({
                name: modelName,
                fields: Object.keys(modelDef.entity.attributes).map(idx => ({ name: idx, ...modelDef.entity.attributes[idx], type: undefined }))
              }));
              cb(null, {
                body: {
                  models,
                  tables,
                },
              });
              break;
            case 'POST':
              const {
                name, type, force, fields, withSchema
              } = req.body;
              if (!name) {
                return cb('missing_param_name');
              }
              try {
                let types = [type];
                if (withSchema) {
                  types.push('schema');
                  types = _.uniq(types);
                }
                generateModel({
                  name, types, force, fields,
                });
                cb(null, { body: 'OK' });
              } catch (err) {
                console.warn('[AXELMANAGER]', err);
                cb(err.message || 'See terminal for more details');
              }
          }
        },
      );
      socket.on(
        '/axel-manager/models/add-fields',
        async (req = { method: 'PUT', query: {}, body: {} }, cb) => {
          if (typeof req === 'function') {
            cb = req;
          }

          switch (req.method) {
            default:
              cb('Incorrect method used');
              break;
            case 'POST':
              const {
                type, withSchema, fields
              } = req.body;
              if (!req.body || !req.body.model) {
                return cb('Missing model name');
              }
              try {
                const modelPath = `${process.cwd()}/src/api/models/sequelize/${_.upperFirst(req.body.model)}.js`;
                const model = requireWithoutCache(modelPath);
                const schemaPath = `${process.cwd()}/src/api/models/schema/${_.upperFirst(req.body.model)}.js`;
                const schema = requireWithoutCache(schemaPath);
                fields.forEach((field) => {
                  const sequelizeField = cliFieldToSequelizeField(field);
                  model.entity.attributes[field.name] = {
                    ...sequelizeField,
                  };
                  fs.writeFileSync(modelPath, `module.exports = ${serialize(model, { space: 2, unsafe: false })}`, { encoding: 'utf8' });
                  if (withSchema) {
                    schema.schema.properties[field.name] = sequelizeFieldToSchemaField(field.name, sequelizeField);
                    fs.writeFileSync(schemaPath, `module.exports = ${unescape(serialize(schema, { space: 2, unsafe: false }))}`, { encoding: 'utf8' });
                  }
                });
                cb(null, { body: 'OK' });
              } catch (err) {
                console.warn('[AXELMANAGER]', err);
                cb(err.message || 'See terminal for more details');
              }
          }
        },
      );

      socket.on(
        '/axel-manager/models/sync',
        (req = { method: 'GET', query: {}, body: {} }, cb) => {
          if (typeof req === 'function') {
            cb = req;
          }
          switch (req.method) {
            case 'POST':
            default:
              if (!req.body) {
                return cb('missing_param_body');
              }
              // @ts-ignore
              const { id, force, alter } = req.body;
              if (!id) {
                return cb('missing_param_body');
              }
              const em = id === '$ALL' ? axel.sqldb : axel.models[id] && axel.models[id].em;
              if (!em) {
                return cb(`error_while_accessing_model${JSON.stringify(id)}`);
              }
              em.sync({ force, alter })
                .then((result) => {
                  cb(null, { body: 'OK' });
                })
                .catch((err) => {
                  console.warn('[AXELMANAGER]', err);
                  cb(err.message || 'See terminal for more details');
                });
              break;
            //  cb(null, { body: axel.models });
          }
        },
      );

      socket.on(
        '/axel-manager/controllers',
        (req = { method: 'GET', query: {}, body: {} }, cb) => {
          if (typeof req === 'function') {
            cb = req;
          }

          switch (req.method) {
            case 'GET':
            default:
              cb(null, { body: axel.controllers });
              break;
            case 'POST':
              const { name, type, force } = req.body;
              if (!name) {
                return cb('missing_param_name');
              }
              try {
                generateController({ name, type: type || 'bare', force });
                cb(null, {
                  body: 'ok',
                });
              } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                  axel.logger.warn(err);
                }
                if (err && err.name === 'SequelizeValidationError') {
                  cb({
                    // @ts-ignore
                    errors: err.errors && err.errors.map(e => e.message),
                    message: 'sql_validation_error',
                  });
                  return false;
                }
                cb(err);
              }
          }
        },
      );

      socket.on(
        '/axel-manager/routes',
        (req = { method: 'GET', query: {}, body: {} }, cb) => {
          if (typeof req === 'function') {
            cb = req;
          }
          switch (req.method) {
            case 'GET':
              cb(null, { body: axel.config.routes });
              break;
            case 'POST':
              // cb(null, { body: axel.models });
              const { name } = req.body;

              if (!name) {
                return cb(new Error('missing_param_name'));
              }

              try {
                generateRoute(name);
                cb(null, {
                  body: 'ok',
                });
              } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                  axel.logger.warn(err);
                }
                if (err && err.name === 'SequelizeValidationError') {
                  cb({
                    // @ts-ignore
                    errors: err.errors && err.errors.map(e => e.message),
                    message: 'sql_validation_error',
                  });
                  return false;
                }
                cb(err);
              }
          }
        },
      );

      socket.on(
        '/axel-manager/restart-app',
        (req = { method: 'GET', query: {}, body: {} }, cb) => {
          if (typeof req === 'function') {
            cb = req;
          }
          switch (req.method) {
            default:
            case 'GET':
              break;
            case 'POST':
              // cb(null, { body: axel.models });
              const { name } = req.body;

              if (!name) {
                return cb(new Error('missing_param_name'));
              }

              try {
                process.kill(process.pid, 'SIGTERM');
                cb(null, {
                  body: 'ok',
                });
              } catch (err) {
                cb(err);
              }
          }
        },
      );

      /** Reset all the details saved in the data base for models. */
      socket.on(
        '/axel-manager/reset-models-config',
        (req = { method: 'POST', query: {}, body: {} }, cb) => {
          if (typeof req === 'function') {
            cb = req;
          }
          switch (req.method) {
            case 'GET':
            default:
              break;
            case 'POST':
              AxelAdmin.insertModelsIntoDb().then(() => cb()).catch(cb);
          }
        }
      );
    });
  }
}

module.exports = new AxelManager();
