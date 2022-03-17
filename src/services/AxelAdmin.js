const _ = require('lodash');
const { dirname } = require('path');
const { fileURLToPath } = require('url');
const ErrorUtils = require('../services/ErrorUtils.js'); // adjust path as needed
const axel = require('../axel.js');

const SchemaValidator = require('./SchemaValidator.js');
const { loadSqlModel, loadSchemaModel } = require('../models.js');


/**
 * COntains all the code necessary for bootstrapping the admin.
 *
 * @class AxelAdmin
 */
class AxelAdmin {
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
   * @memberof AxelAdmin
   */
  async init(app) { // eslint-disable-line no-unused-vars
    if (!axel.sqldb) {
      return Promise.reject(new Error('missing_sqldb'));
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
   * @memberof AxelAdmin
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
    axel.logger.debug('[AxelAdmin] insertModelsIntoDb');
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
    axel.logger.debug('[AxelAdmin] insertSingleModelIntoDb');
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
    axel.logger.debug('[AxelAdmin] clearModelsInDb');
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
* @memberof AxelAdmin
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
        console.warn('[AxelAdmin] nested models extension failed for',
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
* @memberof AxelAdmin
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

  mergeDbModelsWithInMemory(mappedSavedConfig, options = {
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
              console.warn('[AXEL CORE][SCHEMA VALIDATION ERROR]', modelId, result, merged);
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

  serveModels(req, res) {
    const promise = Promise.resolve([]);
    // for now i don't need this feature
    // if (axel.config.framework.axelAdmin && axel.config.framework.axelAdmin.editableModels) {
    //   promise = Promise.all([
    //     axel.models.axelModelConfig.em.findAll({
    //       logging: false
    //     }),
    //     axel.models.axelModelFieldConfig.em
    //       .findAll({ logging: false })
    //   ]);
    // } else {
    //   console.warn('[AXEL admin] ⚠️ editable models is not enabled');
    // }
    return promise
      .then(this.loadDbModelsInMemory) // noop
      .then(mappedSavedConfig => this.mergeDbModelsWithInMemory(mappedSavedConfig))
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
}

module.exports = new AxelAdmin();
