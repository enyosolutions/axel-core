/* eslint-disable max-lines-per-function */
const fs = require('fs');
const serialize = require('serialize-javascript');
const _ = require('lodash');
const {
  generateModel,
  cliFieldToSequelizeField,
  sequelizeFieldToSchemaField,
} = require('axel-cli');
const AxelAdmin = require('../AxelAdmin');
const { catchSignal } = require('./utils');

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
module.exports = (socket) => {
  socket.on('/axel-manager/models', async (req = { method: 'GET', query: {}, body: {} }, cb) => {
    if (typeof req === 'function') {
      cb = req;
    }
    const {
      name, type, force, fields, withSchema
    } = req.body;
    switch (req.method) {
      case 'GET':
      default:
        if (!axel.sqldb) {
          return cb('sqldb_not_ready');
        }
        // eslint-disable -next-line
        let tables = await axel.sqldb.query('show tables');
        tables = tables.map(t => Object.values(t)[0]);
        try {
          const models = Object.entries(axel.models).map(([modelName, modelDef]) => ({
            name: modelName,
            fields: Object.keys(modelDef.entity.attributes).map(idx => ({
              name: idx,
              ...modelDef.entity.attributes[idx],
              type: modelDef.properties,
            })),
          }));
          cb(null, {
            body: {
              models,
              tables,
            },
          });
        } catch (err) {
          cb(err.message || err);
        }

        break;
      case 'POST':

        if (!name) {
          return cb('missing_param_name');
        }
        if (!type) {
          return cb('missing_param_type');
        }
        if (!fields || !fields.length) {
          return cb('missing_fields');
        }
        if (!fields.some(f => f.primaryKey)) {
          return cb('missing_primary_key');
        }
        try {
          let types = [type];
          if (withSchema) {
            types.push('schema');
            types = _.uniq(types);
          }
          generateModel({
            name,
            types,
            force,
            fields,
          });
          cb(null, { body: 'OK' });
        } catch (err) {
          console.warn('[AXELMANAGER]', err);
          cb(err.message || 'See terminal for more details');
        }
        break;
      case 'DELETE':
        const modelPath = `${process.cwd()}/src/api/models/sequelize/${_.upperFirst(name)}.js`;
        const schemaPath = `${process.cwd()}/src/api/models/schema/${_.upperFirst(name)}.js`;
        try {
          fs.unlinkSync(modelPath);
          fs.unlinkSync(schemaPath);
          cb(null, 'OK');
          process.kill(process.pid, 'SIGUSR2');
        } catch (err) {
          cb(err.message || err);
        }
        break;
    }
  });
  socket.on('/axel-manager/models/add-fields', async (req = { method: 'PUT', query: {}, body: {} }, cb) => {
    if (typeof req === 'function') {
      cb = req;
    }

    switch (req.method) {
      default:
        cb('Incorrect method used');
        break;
      case 'POST':
        const {
          withSchema, fields, sync
        } = req.body;
        if (!req.body || !req.body.model) {
          return cb('Missing model name');
        }

        if (!fields || !fields.length) {
          return cb('missing_fields');
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

            if (withSchema) {
              schema.schema.properties[field.name] = sequelizeFieldToSchemaField(field.name, sequelizeField);
            }
          });

          catchSignal('SIGUSR2', 5);

          fs.writeFileSync(modelPath, `module.exports = ${serialize(model, { space: 2, unsafe: false })}`, {
            encoding: 'utf8',
          });

          fs.writeFileSync(
            schemaPath,
            `module.exports = ${unescape(serialize(schema, { space: 2, unsafe: false }))}`,
            { encoding: 'utf8' }
          );
          if (sync) {
            axel.models[model.identity].em.sync({ alter: true }, { logging: true });
          }
          cb(null, { body: 'OK' });
        } catch (err) {
          console.warn('[AXELMANAGER]', err);
          cb(err.message || 'See terminal for more details');
        }
    }
  });

  socket.on('/axel-manager/models/sync', (req = { method: 'GET', query: {}, body: {} }, cb) => {
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
  });

  /** Reset all the details saved in the data base for models. */
  socket.on('/axel-manager/reset-models-config', (req = { method: 'POST', query: {}, body: {} }, cb) => {
    if (typeof req === 'function') {
      cb = req;
    }
    switch (req.method) {
      case 'GET':
      default:
        break;
      case 'POST':
        AxelAdmin.insertModelsIntoDb()
          .then(() => cb())
          .catch(cb);
    }
  });

  /** Get models definition */
  socket.on('/axel-manager/admin-models', (req = { method: 'GET', query: {}, body: {} }, cb) => {
    if (typeof req === 'function') {
      cb = req;
    }
    switch (req.method) {
      case 'GET':
        AxelAdmin.serveModels().then((models) => {
          cb(null, { body: models });
        })
          .catch(err => cb(err.message));
      default:
        break;
    }
  });
};
