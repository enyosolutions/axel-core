/* eslint-disable no-underscore-dangle */
const _ = require('lodash');
const { dirname } = require('path');
const { fileURLToPath } = require('url');
const ErrorUtils = require('../services/ErrorUtils.js'); // adjust path as needed
const axel = require('../axel.js');

const SchemaValidator = require('./SchemaValidator.js');
const { loadSqlModel, loadSchemaModel } = require('../models.js');
const { execHook } = require('./ControllerUtils.js');
const ExtendedError = require('./ExtendedError.js');

/**
 * COntains all the code necessary for bootstrapping the admin.
 *
 * @class AxelModelsService
 */
class AxelModelsService {
  mergeData(...args) {
    return _.mergeWith(_.cloneDeep(args[0]), args[1], (a, b) => {
      if (_.isArray(a) && b !== null && b !== undefined) {
        return b;
      }

      if (b === null && a) {
        return a;
      }
    });
  }

  /**
   *
   *
   * @param {Application} app
   * @returns {Promise<any>}
   * @memberof AxelModelsService
   */
  async init(app) { // eslint-disable-line no-unused-vars
    if (!axel.sqldb) {
      return 'missing_sqldb';
    }
    loadSchemaModel(`${__dirname}/../models/schema/AxelModelConfig.js`);
    loadSchemaModel(`${__dirname}/../models/schema/AxelModelFieldConfig.js`);

    const axelModelConfig = loadSqlModel(`${__dirname}/../models/sequelize/AxelModelConfig.js`, axel.sqldb);
    axelModelConfig.em.options.logging = false;
    axelModelConfig.em.logging = false;
    const axelModelFieldConfig = loadSqlModel(`${__dirname}}/../models/sequelize/AxelModelFieldConfig.js`, axel.sqldb);

    SchemaValidator.loadSchema(axelModelConfig);
    SchemaValidator.loadSchema(axelModelFieldConfig);

    if (!axel.models.axelModelConfig) {
      return Promise.reject(new Error('missing_axelModelConfig'));
    }

    Promise.all([
      axelModelConfig.em.sync({ alter: true }, { logging: false }),
      axelModelFieldConfig.em.sync({ alter: true }, { logging: false })
    ])
      .then(() => axelModelConfig.em
        .findAll({ logging: false }))
      .then((savedConfig) => {
        // create models that are not in db
        const insertions = Object.keys(axel.models).map((modelKey) => {
          const model = axel.models[modelKey];
          const savedModel = savedConfig.find(elm => elm.identity === model.identity);
          // if models already exists then stop
          if (savedModel) {
            return Promise.resolve();
          }
          return this.insertSingleModelIntoDb(model);
        });
        return Promise.all(insertions);
      })
      .catch(console.warn);
  }

  /**
   *
   *
   * @param {Obj} model
   * @returns {Promise<void>}
   * @memberof AxelModelsService
   */
  updateFieldsConfig(model) {
    if (!model.schema || model.identity.startsWith('axel')) {
      return Promise.resolve();
    }
    return axel.models.axelModelFieldConfig.em
      .findAll({
        where: {
          parentIdentity: model.identity
        },
        logging: false
      })
      .then(savedFields => savedFields
        .map(field => `${field.parentIdentity}-${field.name}`)
        .reduce((acc, f) => {
          acc[f] = f;
          return acc;
        }, {}))
      .then(savedFields => Promise.all(
        Object.keys(model.schema.properties).map((prop) => {
          const field = model.schema.properties[prop];
          const key = `${model.identity}-${prop}`;
          if (savedFields[key]) {
            return Promise.resolve();
          }
          return axel.models.axelModelFieldConfig.em.create({
            parentIdentity: model.identity,
            name: prop,
            config: {
              ...field,
              title: field.title || _.startCase(prop),
              id: undefined
            }
          }, { logging: false });
        })
      ));
  }

  insertModelsIntoDb() {
    axel.logger.debug('[AxelModelsService] insertModelsIntoDb');
    if (!axel.models.axelModelConfig || !axel.models.axelModelFieldConfig) {
      return Promise.resolve();
    }
    const insertableModels = Object.keys(axel.models).filter(modelKey => !['axelModelFieldConfig', 'axelModelConfig'].includes(modelKey));
    return this.clearModelsInDb().then(() => {
      const insertions = insertableModels.map((modelKey) => {
        const model = axel.models[modelKey];
        return axel.models.axelModelConfig.em.create({
          identity: model.identity,
          config: this.jsonSchemaToFrontModel(model)
        });
      });
      return Promise.all(insertions);
    })
      .then(() => Promise.all(
        insertableModels.map(([, entry]) => this.updateFieldsConfig(axel.models[entry]))
      ));
  }


  insertSingleModelIntoDb(model) {
    if (!axel.models.axelModelConfig || !axel.models.axelModelFieldConfig) {
      return Promise.resolve();
    }
    if (!model.schema || model.identity.startsWith('axel')) {
      return Promise.resolve();
    }

    return axel.models.axelModelConfig.em.create({
      identity: model.identity,
      config: this.jsonSchemaToFrontModel(model)
    })
      .then(() => this.updateFieldsConfig(model));
  }

  clearModelsInDb() {
    axel.logger.debug('[AxelModelsService] clearModelsInDb');
    if (!axel.models.axelModelConfig || !axel.models.axelModelFieldConfig) {
      return Promise.resolve();
    }
    return Promise.all([
      axel.models.axelModelConfig.em.sync({ drop: true, force: true, alter: true }),
      axel.models.axelModelFieldConfig.em.sync({ drop: true, force: true, alter: true })
    ]);
  }

  connectToRouter() {
    // create api routes for getting merged configurations (see AppController.models(req, res))
  }

  /**
*
*
* @param {Obj} model
* @returns {Obj}
* @memberof AxelModelsService
*/
  jsonSchemaToFrontModel(model) {
    return {
      ...model.admin,
      id: model.id,
      identity: model.identity,
      primaryKeyField: model.primaryKeyField || undefined,
      primaryKey: model.primaryKeyField || model.primaryKey || undefined, // @deprecated
      displayField: model.displayField || null,
      name: _.get(model, 'admin.name') || model.name || model.identity,
      namePlural: _.get(model, 'admin.namePlural', ''),
      pageTitle: _.get(model, 'admin.pageTitle', ''),
      apiUrl: _.get(model, 'apiUrl') || this.prefixUrl(model.identity),
      url: _.get(model, 'apiUrl') || this.prefixUrl(model.identity), // @fix removed check for side effects
      routerPath: _.get(model, 'admin.routerPath', ''),
      schema: model.schema, // todo fetch from the other config api
      options: _.get(model, 'admin.options', {}),
      actions: _.get(model, 'admin.actions', {}),
      formOptions: _.get(model, 'admin.formOptions', {}),
      listOptions: _.get(model, 'admin.listOptions', {}),
      kanbanOptions: _.get(model, 'admin.kanbanOptions', {}),
      tableOptions: _.get(model, 'admin.tableOptions', {}),
      layout: _.get(model, 'admin.layout', {})
    };
  }

  prepareNestedModel(nestedModelDefinition, models) {
    if (nestedModelDefinition.extends && models[nestedModelDefinition.extends]) {
      const sourceModel = models[nestedModelDefinition.extends];
      if (!sourceModel) {
        console.warn('[AxelModelsService] nested models extension failed for',
          nestedModelDefinition.config,
          'missing definition', nestedModelDefinition.extends);
        return;
      }
      return this.mergeData(_.cloneDeep({ ...sourceModel, nestedModels: undefined }), _.cloneDeep(nestedModelDefinition.config));
    }
    return nestedModelDefinition;
  }

  prepareNestedModels(nestedModelArray = [], models) {
    return nestedModelArray.map(model => this.prepareNestedModel(model, models));
  }


  /**
* prefix the url with the automatic api config if needed
*
* @param {string} url
* @returns {string} url
* @memberof AxelModelsService
*/
  prefixUrl(url) {
    const formatedUrl = axel.config.framework.automaticApi
      && url
      && url.indexOf(axel.config.framework.automaticApiPrefix) === -1
      ? `${axel.config.framework.automaticApiPrefix}/${url}`
      : url;
    return formatedUrl ? formatedUrl.replace(/\\/g, '/') : url;
  }

  loadDbModelsInMemory([savedConfig, savedFields]) {
    const mappedSavedConfig = {};
    if (savedConfig && savedConfig.length) {
      savedConfig = savedConfig.filter(conf => !['axelModelConfig', 'axelModelFieldConfig'].includes(conf.identity));

      savedConfig.forEach((config) => {
        delete config.id;
        delete config.createdOn;
        delete config.lastModifiedOn;
        mappedSavedConfig[config.identity] = config.config;

        if (savedFields && savedFields.length) {
          mappedSavedConfig[config.identity].schema = { properties: {} };
          savedFields = savedFields.filter(conf => !['axelModelConfig', 'axelModelFieldConfig'].includes(conf.parentIdentity));
          savedFields.forEach((field) => {
            if (field.parentIdentity === config.identity) {
              const {
                id, name, parentIdentity, ...rest
              } = field.config;
              mappedSavedConfig[config.identity].schema.properties[field.name] = {
                ...rest
              };
            }
          });
        }
      });
    }
    return mappedSavedConfig;
  }

  async mergeDbModelsWithInMemory(mappedSavedConfig, options = {
    prepareNestedModels: true, identity: undefined
  }) {
    const models = Object.keys(axel.models)
      .filter(
        key => axel.models[key] && axel.models[key].schema
          && (!options || !options.identity || options.identity === key)
      )
      .map((modelId) => {
        const model = axel.models[modelId];
        const merged = this.mergeData(
          this.jsonSchemaToFrontModel(model),
          mappedSavedConfig[axel.models[modelId].identity] || {}
        );
        if (modelId === 'axelModelConfig' && _.isString(merged.options)) {
          try {
            const result = SchemaValidator.validate(merged, 'axelModelConfig', { strict: true });
            if (!result.isValid) {
              console.warn('[AXEL CORE][SCHEMA VALIDATION ERROR] loaded model', modelId, result, merged);
              return;
            }
          } catch (err) {
            throw new Error('error_wrong_json_format_for_model_definition');
          }
        }
        mappedSavedConfig[axel.models[modelId].identity] = merged;
        return merged;
      });
    if (!options || options.prepareNestedModels === undefined || options.prepareNestedModels) {
      models.forEach((m) => {
        m.nestedModels = this.prepareNestedModels(m.nestedModels, mappedSavedConfig);
      });
    }

    return models;
  }


  translateModels(models, locale) {
    if (axel.config.framework.axelModels && axel.config.framework.axelModels.multilang && axel.i18n && locale) {
      const options = {
        fields: ['title', 'description']
      };
      return models
        .map((model) => {
          if (model.identity.startsWith('axelModel')) {
            return model;
          }
          return {
            ...model,
            name: this.translateField('name', model.identity, locale, model.name),
            namePlural: this.translateField('namePlural', model.identity, locale, model.namePlural),
            title: this.translateField('title', model.identity, locale, model.title),
            tabTitle: this.translateField('tabTitle', model.identity, locale, model.tabTitle),
            pageTitle: this.translateField('pageTitle', model.identity, locale, model.pageTitle),
            schema: {
              ...model.schema,
              properties: {
                ...model.schema.properties,
                ...this.translateProperties(model.schema.properties, model.identity, locale, options)
              }
            }
          };
        });
    }
    return models;
  }

  translateProperties(properties, modelId, locale, options) {
    Object.keys(properties).forEach((key) => {
      const property = properties[key];
      if (options && options.fields) {
        options.fields.forEach((field) => {
          if (property[field]) {
            if (Array.isArray(property[field])) {
              property[field] = property[field].map(
                (fieldValue, index) => this.translateField(`prop.${key}.${field}.${fieldValue}`, modelId, locale, property[field][index])
              );
            } else {
              property[field] = this.translateField(`prop.${key}.${field}`, modelId, locale, property[field]);
            }
          }
        });
        if (property.properties) {
          property.properties = this.translateProperties(property.properties, modelId, locale, options);
        }
      }
    });
    return properties;
  }

  translateField(field, modelId, locale, fallback) {
    const key = `${axel.config.framework.axelModels.translationPrefix}.${modelId}.${field
      }`;
    _.set(global.translationFallbacks, key, fallback);
    const tranlation = axel.i18n.__({
      phrase: key,
      locale
    });
    return tranlation || fallback;
  }

  serveModels(req, res = null) {
    const promise = Promise.resolve([]);
    return promise
      .then(this.loadDbModelsInMemory) // noop
      .then(mappedSavedConfig => this.mergeDbModelsWithInMemory(mappedSavedConfig))
      .then(models => this.translateModels(models, req && req.locale))
      .then((models) => {
        if (res) {
          return res.json({
            body: models
          });
        }

        return models;
      })
      .catch((err) => {
        if (res) {
          return ErrorUtils.errorCallback(err, res);
        }
        throw err;
      });
  }

  /**
   * loads a model for a given identity
   * @param {string} identity
   * @param {string} locale
   *
   * @returns {Promise}
   */
  serveModel(identity, locale) {
    return this.mergeDbModelsWithInMemory({}, { identity })
      .then(models => this.translateModels(models, locale))
      .then(models => models[0])
      .catch((err) => {
        throw new ExtendedError(ErrorUtils.errorCallback(err));
      });
  }
}

module.exports = new AxelModelsService();
