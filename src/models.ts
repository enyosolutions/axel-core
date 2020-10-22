import async from 'async';
import { Axel } from './axel';
import { Application } from 'express';
const fs = require('fs');
const _ = require('lodash');
const debug = require('debug')('axel:models');

declare const axel: Axel;

const loadSchemaModels = () => {
  debug('loadSchemaModels');
  return new Promise((resolve, reject) => {
    /*
  if (!(axel.config && axel.config.models && axel.config.models.schema)) {
    return next();
  }
  */
    axel.logger.info('ORM :: loading schema models');
    const modelsLocation = `${__dirname}/../api/models/schema`;

    if (!axel.models) {
      axel.models = {};
    }
    fs.readdir(modelsLocation, (err: Error, files: string[]) => {
      if (err) {
        axel.logger.warn(err);
        return reject(err);
      }
      files = files.filter(file => _.endsWith(file, '.js') || _.endsWith(file, '.ts'));
      axel.logger.info('ORM :: found %s schemas files', files.length);
      debug('Loading schema models: ', files.length, 'files');
      async.each(
        files,
        (file, cb) => {
          const filePath = `${modelsLocation}/${file}`;
          axel.logger.verbose('ORM :: loading schema model %s', filePath);
          debug('Loading schema model', filePath);
          /* eslint-disable */
          const model = require(filePath);
          /* eslint-enable */
          debug('Loading schema model');
          if (!model.identity) {
            console.log(model);
            throw new Error(`ORM ::  missing identity for ${file}`);
          }
          if (model.collectionName && axel.mongodb) {
            console.log(model.collectionName);
            model.collection = axel.mongodb.get(model.collectionName);
          }
          axel.logger.debug(model.identity);
          debug(model.identity);
          axel.models[model.identity] = model;
          cb();
        },
        errAsync => {
          axel.logger.debug('ORM :: schema final callback');
          debug('ORM :: schema final callback');
          if (errAsync) {
            axel.logger.warn(errAsync);
            debug(errAsync);
            return reject(errAsync);
          }
          resolve(err);
        },
      );
    });
  });
};

const loadSqlModels = () => {
  debug('loadSqlModels');
  return new Promise(async (resolve, reject) => {
    const sqlModels: Obj = {};
    debug('ORM : loading sql models');
    if (!(axel.config && axel.config.sqldb && axel.config.sqldb.host)) {
      debug('ORM : no sql configured');
      return resolve();
    }
    debug('boom');
    let sequelize: any;
    try {
      sequelize = require('./services/SqlDB');

      axel.sqldb = sequelize.default || sequelize;
      if (axel.sqldb.then) {
        axel.sqldb = await axel.sqldb;
        sequelize = axel.sqldb;
      }
      console.log(axel.sqldb.define);
    } catch (err) {
      console.error(err);
    }
    debug('bye bye');

    const modelsLocation = `${__dirname}/../api/models/sequelize`;
    debug('ORM :: sql models location', modelsLocation);
    if (!axel.models) {
      axel.models = {};
    }
    fs.readdir(modelsLocation, (err: Error, files: string[]) => {
      if (err) {
        axel.logger.warn(err);
        reject(err);
        return;
      }
      files = files.filter(file => _.endsWith(file, '.js') || _.endsWith(file, '.ts'));
      axel.logger.info('ORM :: found %s sequelize models files', files.length);
      debug('MODELS :: found %s sequelize models files', files.length);
      async.each(
        files,
        async (file, cb) => {
          const filePath = `${modelsLocation}/${file}`;

          if (sequelize) {
            axel.logger.verbose('ORM :: loading sequelize model  %s', filePath);
            /* eslint-disable */
            let model = require(filePath);
            /* eslint-enable */
            const tableName =
              model.entity &&
              model.entity.options &&
              model.entity.options &&
              model.entity.options.tableName;
            axel.logger.verbose('Loading identity', model);
            debug('Loading entity', model.identity);
            if (!model.identity) {
              console.log(model);
              throw new Error(`ORM ::  missing sql identity for ${file}`);
            }

            if (!model.entity) {
              throw new Error(`ORM ::  missing sql entity for ${file}`);
            }

            if (!tableName) {
              throw new Error(`ORM ::  missing sql tableName for ${file}`);
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
              model.entity.options,
            );

            const SqlModel: Obj = sequelize.define(
              _.upperFirst(_.camelCase(model.identity)),
              model.entity.attributes,
              model.entity.options,
            );
            sqlModels[model.identity] = SqlModel;
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
          } else {
            axel.logger.verbose('ORM :: skipping file %s', filePath);
          }
          cb();
        },
        errAsync => {
          axel.logger.verbose('ORM :: loading associations');
          if (errAsync) {
            axel.logger.warn(errAsync);
            return reject(errAsync);
          }

          Object.keys(axel.models).forEach(key => {
            const model = axel.models[key];
            if (model.entity && model.entity.attributes) {
              Object.keys(model.entity.attributes).forEach(field => {
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
              model.repository.addScope('defaultScope', model.entity.defaultScope(sqlModels), {
                override: true,
              });
            }
          });

          axel.logger.verbose('ORM :: sequelize final callback');
          resolve();
        },
      );
    });
  });
};

const findModelsDifferences = () => {
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
      model.em.unifiedFind = function(query: Obj, options: Obj = {}) {
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
      model.em.unifiedFindOne = function(query: Obj, options: Obj) {
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
      model.em.unifiedUpdate = function(query: Obj | undefined, options: Obj | undefined) {
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
      model.em.unifiedFindOneAndUpdate = function(
        query: Obj | undefined,
        options: Obj | undefined,
      ) {
        return model.em.unifiedUpdate(query, options);
      };

      // COUNT
      model.em.unifiedCount = function(query: Obj | undefined, options: Obj | undefined) {
        return model.em.count(
          {
            where: query,
          },
          options,
        );
      };

      // INSERT
      model.em.unifiedInsert = function(
        query: Obj | undefined,
        options: Obj | undefined,
        moreOptions: Obj | undefined,
      ) {
        return this.create(query, options, moreOptions);
      };

      // DELETE
      model.em.unifiedRemove = function(query: Obj | undefined) {
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

export async function models(app: Application): Promise<any> {
  await loadSchemaModels();
  await loadSqlModels();
  await findModelsDifferences();
  await unifyEntityManagers();
  return Promise.resolve();
}

export default models;
