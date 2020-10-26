

import async from 'async';
import fs from 'fs';
import _ from 'lodash';
import d from 'debug';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const debug = d('axel:models');

export const loadSchemaModels = () => {
  debug('loadSchemaModels');
  return new Promise((resolve, reject) => {
    /*
  if (!(axel.config && axel.config.models && axel.config.models.schema)) {
    return next();
  }
  */
    axel.logger.info('ORM :: loading schema models');
    const modelsLocation = `${process.cwd()}/src/api/models/schema`;

    if (!axel.models) {
      axel.models = {};
    }
    fs.readdir(modelsLocation, (err, files) => {
      if (err) {
        axel.logger.warn(err);
        return reject(err);
      }
      files = files.filter(
        (file) => _.endsWith(file, '.js') || _.endsWith(file, '.ts')
      );
      axel.logger.info('ORM :: found %s schemas files', files.length);
      debug('Loading schema models: ', files.length, 'files');
      async.each(
        files,
        (file, cb) => {
          const filePath = `${modelsLocation}/${file}`;
          axel.logger.verbose('ORM :: loading schema model', filePath);
          loadSchemaModel(filePath);
          cb();
        },
        (errAsync) => {
          axel.logger.debug('ORM :: schema final callback');
          debug('ORM :: schema final callback');
          if (errAsync) {
            axel.logger.warn(errAsync);
            debug(errAsync);
            return reject(errAsync);
          }
          resolve();
        }
      );
    });
  });
};

export const loadSchemaModel = async (filePath) => {
  debug('Loading schema model', filePath);
  /* eslint-disable */
  let model = await import(`file://${path.resolve(filePath)}`);
  model = model.default || model;
  /* eslint-enable */
  debug('Loading schema model');
  if (!model.identity) {
    throw new Error(`ORM ::  missing identity for ${filePath}`);
  }
  if (model.collectionName && axel.mongodb) {
    console.log(model.collectionName);
    model.collection = axel.mongodb.get(model.collectionName);
  }
  axel.logger.debug(model.identity);
  debug(model.identity);
  axel.models[model.identity] = model;
};

export const loadSqlModel = async (filePath, sequelize) => {
  if (sequelize) {
    axel.logger.verbose('ORM :: loading sequelize model  %s', filePath);
    /* eslint-disable */
    let model;
    try {
      model = await import(`file://${path.resolve(filePath)}`);
    } catch (err) {
      console.warn('[WARN] ', filePath, err);
    }
    if (!model) {
      throw new Error('missing_model_' + filePath);
    }
    model = model.default || model;
    /* eslint-enable */
    const tableName =
      model.entity &&
      model.entity.options &&
      model.entity.options &&
      model.entity.options.tableName;
    axel.logger.verbose('Loading identity', model);
    debug('Loading entity', model.identity);
    if (!model.identity) {
      throw new Error(`ORM ::  missing sql identity for ${filePath}`);
    }

    if (!model.entity) {
      throw new Error(`ORM ::  missing sql entity for ${filePath}`);
    }

    if (!tableName) {
      throw new Error(`ORM ::  missing sql tableName for ${filePath}`);
    }

    if (!model.entity.options) {
      model.entity.options = {};
    }
    model.entity.options = _.merge(
      {
        freezeTableName: true,
        query: {
          raw: true,
        },
      },
      model.entity.options
    );

    const SqlModel = sequelize.define(
      _.upperFirst(_.camelCase(model.identity)),
      model.entity.attributes,
      model.entity.options
    );
    // SqlModel.sequelize = Sequelize;

    if (!axel.models[model.identity]) {
      axel.models[model.identity] = model;
    } else {
      axel.models[model.identity].entity = model.entity;
    }
    axel.models[model.identity].em = SqlModel;
    // @deprecated
    axel.models[model.identity].repository = SqlModel;

    axel.models[model.identity].tableName = tableName;

    return axel.models[model.identity];
  } else {
    axel.logger.verbose('ORM :: skipping file %s', filePath);
  }
};
export const loadSqlModels = () => {
  debug('loadSqlModels');
  return new Promise(async (resolve, reject) => {
    const sqlModels = {};
    debug('ORM : loading sql models');
    console.log('ORM : loading sql models');
    if (!(axel.config && axel.config.sqldb && axel.config.sqldb.host)) {
      debug('ORM : ⚠️ no sql configured');
      return resolve();
    }
    debug('boom');
    let sequelize;
    try {
      sequelize = await import('./services/SqlDB.js');

      axel.sqldb = sequelize.default || sequelize;
      if (axel.sqldb.then) {
        axel.sqldb = await axel.sqldb;
        sequelize = axel.sqldb;
      }
    } catch (err) {
      console.error(err);
    }
    debug('bye bye');

    const modelsLocation = `${process.cwd()}/src/api/models/sequelize`;
    debug('ORM :: sql models location', modelsLocation);
    if (!axel.models) {
      axel.models = {};
    }
    let files = fs.readdirSync(modelsLocation);
    files = files.filter(
      (file) => _.endsWith(file, '.js') || _.endsWith(file, '.ts')
    );
    axel.logger.info('ORM :: found %s sequelize models files', files.length);
    debug('MODELS :: found %s sequelize models files', files.length);
    const promises = files.map(async (file) => {
      const filePath = `${modelsLocation}/${file}`;
      return loadSqlModel(filePath, sequelize)
        .then((model) => {
          sqlModels[model.identity] = model.em;
          return model;
        })
    });
    Promise.all(promises)
      .then((models) => {
        axel.logger.verbose('ORM :: loading associations');
        debug('ORM :: loading associations', models.map(m => m.identity));
        Object.keys(models).forEach((key) => {
          const model = models[key];
          if (model.entity && model.entity.attributes) {
            Object.keys(model.entity.attributes).forEach((field) => {
              const fieldDefinition = model.entity.attributes[field];
              if (fieldDefinition['references']) {
                // console.log('Auto linking ', model.identity, field, fieldDefinition);
                // sqlModels[model.identity].belongsTo(sqlModels[fieldDefinition.references.model], {
                //   foreignKey: field,
                //   sourceKey: fieldDefinition.references.key,
                // });
                // only do the inverse link if there is no existing
                /*
                if (
                  !sqlModels[fieldDefinition.references.model].associations[
                    fieldDefinition.references.model.name
                  ]
                )
                  sqlModels[fieldDefinition.references.model].hasMany(
                    sqlModels[model.identity],
                    {
                      foreignKey: field,
                      targetKey: fieldDefinition.references.key,
                    }
                  );
                  */
              }
            });
          }
          if (model.entity && model.entity.associations) {
            model.entity.associations(sqlModels);
          }
          if (
            model.entity &&
            model.entity.defaultScope &&
            model.entity.defaultScope instanceof Function
          ) {
            model.repository.addScope(
              'defaultScope',
              model.entity.defaultScope(sqlModels),
              {
                override: true,
              }
            );
          }
        });


        axel.logger.verbose('ORM :: sequelize final callback');
        resolve();
      }).catch((errAsync) => {
        axel.logger.warn(errAsync);
        return reject(errAsync);
      });
  });
};



export const findModelsDifferences = () => {
  return new Promise((resolve, reject) => {
    /* eslint-disable */
    axel.logger.verbose('ORM :: compare definitions');
    axel.logger.info('\n\n\n');
    axel.logger.info('___________________________');
    Object.keys(axel.models).forEach(key => {
      const model = axel.models[key];
      if (model.entity && model.schema) {
        const sqlProperties = Object.keys(model.entity.attributes);
        const jsonProperties = Object.keys(model.schema.properties);

        if (model.entity.options && model.entity.options.timestamps) {
          const options = model.entity.options;
          sqlProperties.push(options.createdAt || 'createdAt');
          sqlProperties.push(options.updatedAt || 'updatedAt');
        }

        let diff1 = _.difference(sqlProperties, jsonProperties);
        let diff2 = _.difference(jsonProperties, sqlProperties);
        if (diff1.length) {
          console.warn('ORM :: model : ', key, ' => Fields present in sql but not in json');
          // diff1 = diff1.unshift('ORM ::', 'Fields present in sql but not in json');
          console.warn(diff1);
        }
        if (diff2.length) {
          axel.logger.warn('ORM :: model : ', key, ' => Fields present in json but not in sql');
          console.warn(diff2);
        }
      }
    });
    /* eslint-enable */
    axel.logger.info('___________________________');
    axel.logger.info('\n\n\n');
    resolve();
  });
};

function unifyEntityManagers() {
  /* eslint-disable */
  Object.keys(axel.models).forEach(key => {
    const model = axel.models[key];
    if (model.repository) {
      model.em = model.repository;
      model.em.unifiedFind = function (query, options = {}) {
        if (!query) {
          return this.find(query, options);
        }
        query = {
          where: query,
          limit: options && options[1] ? options[1].limit : undefined,
          offset: options && options[1] ? options[1].skip : 0,
        };

        return this.findAll(query, options);
      };
      // FIND ONE
      model.em.unifiedFindOne = function (query, options) {
        if (!query) {
          return this.find(query, options);
        }
        query = {
          where: query,
          returning: true,
          limit: options && options[1] ? options[1].limit : undefined,
          offset: options && options[1] ? options[1].skip : 0,
        };

        return this.findOne(query, options);
      };
      // UPDATE
      model.em.unifiedUpdate = function (query, options) {
        try {
          if (!query || !options) {
            return this.update(query, options);
          }
          const newQuery = {
            where: query,
            returning: true,
          };
          const itemToUpdate = options.$set ? options.$set : options;

          return this.update(itemToUpdate, newQuery);
        } catch (err) {
          console.error(err);
          return err;
        }
      };

      // UPDATE
      model.em.unifiedFindOneAndUpdate = function (
        query,
        options,
      ) {
        return model.em.unifiedUpdate(query, options);
      };

      // COUNT
      model.em.unifiedCount = function (query, options) {
        return model.em.count(
          {
            where: query,
          },
          options,
        );
      };

      // INSERT
      model.em.unifiedInsert = function (
        query,
        options,
        moreOptions,
      ) {
        return this.create(query, options, moreOptions);
      };

      // DELETE
      model.em.unifiedRemove = function (query) {
        if (!query) {
          return this.destroy(query);
        }
        const newQuery = {
          where: query,
        };
        return this.destroy(newQuery);
      };
    }
    if (model.collection) {
      model.em = model.collection;
      model.em.unifiedFind = model.em.find;
      model.em.unifiedFindOne = model.em.findOne;
      model.em.unifiedUpdate = model.em.update;
      model.em.unifiedInsert = model.em.insert;
      model.em.unifiedRemove = model.em.remove;
      model.em.unifiedFindOneAndUpdate = model.em.findOneAndUpdate;
      model.em.unifiedCount = model.em.count;
    }
  });
  return;
}

export async function models(app) {
  await loadSchemaModels();
  await loadSqlModels();
  await findModelsDifferences();
  await unifyEntityManagers();
  return Promise.resolve();
}

export default models;
