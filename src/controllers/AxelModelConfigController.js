/**
 * /AxelModelConfig
 *
 * @description :: Server-side logic for managing AxelModelConfig entities
 */

const { identity } = require('lodash');
const Utils = require('../services/Utils.js'); // adjust path as needed
const ErrorUtils = require('../services/ErrorUtils.js'); // adjust path as needed
const { ExtendedError } = require('../services/ExtendedError.js'); // adjust path as needed
const AxelModelsService = require('../services/AxelModelsService.js'); // adjust path as needed
const ExcelService = require('../services/ExcelService.js'); // adjust path as needed
const SchemaValidator = require('../services/SchemaValidator.js');
const { saveModel } = require('../services/ws/utils');
const axel = require('../axel.js');
const AxelAdminController = require('./AxelAdminController.js');
/*
Uncomment if you need the following features:
- Create import template for users
- Import from excel
- Export to excel
*/

// const DocumentManager =  require('../../services/DocumentManager');
// const ExcelService =  require('../../services/ExcelService');

const entity = 'axelModelConfig';
const primaryKey = axel.models[entity] && axel.models[entity].primaryKeyField
  ? axel.models[entity].primaryKeyField
  : axel.config.framework.primaryKey;

class AxelModelConfigController {
  /*
  list(req, resp) {
    let items = [];

    const {
      listOfValues, startPage, limit, offset, order
    } = Utils.injectPaginationQuery(req);
    let query = Utils.injectQueryParams(req);
    resp.json({})
    const repository = Utils.getEntityManager(entity, resp);
    if (!repository) {
      return;
    }
    if (req.query.search) {
      query = Utils.injectSqlSearchParams(req.query.search, query, {
        modelName: req.params.entity || entity
      });
    }
    query = Utils.cleanSqlQuery(query);
    repository
      .findAndCountAll({
        // where: req.query.filters,
        where: query,
        raw: true,
        order,
        limit,
        offset
      })
      .then((result) => {
        items = result.rows;
        items = items.map(item => AxelModelsService.mergeData(
          AxelModelsService.jsonSchemaToFrontModel(axel.models[item.identity] || {}),
          item.config
        ));
        if (listOfValues) {
          items = items.map(item => ({
            identity: item.identity,
            name: item.name,
            label: item.name
          }));
        }
        return result.count || 0;
      })

      .then(totalCount => resp.status(200).json({
        body: items,
        page: startPage,
        count: limit,
        totalCount
      }))
      .catch((err) => {
        ErrorUtils.errorCallback(err, resp);
      });
  }

  async get(req, resp) {
    const id = req.params.id;
    if (!id) {
      return false;
    }
    const listOfValues = req.query.listOfValues ? req.query.listOfValues : false;

    const pKey = typeof id === 'string' && Number.isNaN(parseInt(id)) ? 'identity' : primaryKey;
    const itemFound = !axel.models.axelModelConfig ? {} : await axel.models.axelModelConfig.em
      .findOne({
        where: { [pKey]: id },
        raw: true
      });
    let item = itemFound;
    const models = {};

    Object.keys(axel.models).forEach((modelName) => {
      models[modelName] = AxelModelsService.jsonSchemaToFrontModel(axel.models[modelName]);
    });

    if (itemFound && itemFound.identity) {
      item = itemFound;
      if (axel.models[item.identity]) {
        item = AxelModelsService.mergeData(
          AxelModelsService.jsonSchemaToFrontModel(axel.models[item.identity]),
          item.config
        );
        if (item.nestedModels) {
          item.nestedModels = AxelModelsService.prepareNestedModels(item.nestedModels, models);
        }
      }


      if (listOfValues) {
        item = {
          [primaryKey]: item[primaryKey],
          identity: item.identity,
          name: item.name,
          label: item.name
        };
      }
      return resp.status(200).json({
        body: item
      });
    }
    if (pKey === 'identity' && axel.models[id]) {
      if (axel.models.axelModelConfig) {
        await axel.models.axelModelConfig.em.create({
          identity: id, name: id, config: {}
        });
      }
      item = AxelModelsService.jsonSchemaToFrontModel(axel.models[id]);
      if (item.nestedModels) {
        item.nestedModels = AxelModelsService.prepareNestedModels(item.nestedModels, models);
      }
      return resp.status(200).json({
        body: {
          ...item,
          apiUrl: axel.models[id].apiUrl
        }
      });
    }
    throw new ExtendedError({
      code: 404,
      errors: [
        {
          message: 'item_not_found'
        }
      ],
      message: 'item_not_found'
    });
  }
*/
  get(...args) {
    AxelAdminController.getModel(...args);
  }

  /**
  * [put description]
  * [description]
  * @method
  * @param  {[type]} req  [description]
  * @param  {[type]} resp [description]
  * @return {[type]}      [description]
  */
  put(req, resp) {
    const id = req.params.id;
    const data = req.body;

    const repository = Utils.getEntityManager(entity, resp);
    if (!repository) {
      return;
    }
    const pKey = typeof id === 'string' && Number.isNaN(parseInt(id)) ? 'identity' : primaryKey;
    repository
      .findOne({
        where: { [pKey]: id },
        raw: false
      })
      .catch((err) => {
        throw new ExtendedError({
          code: 404,
          errors: [
            {
              message: err.message || 'item_not_found'
            }
          ],
          message: err.message || 'item_not_found'
        });
      })
      .then((result) => {
        const validation = SchemaValidator.validate(data, entity, { strict: true });
        if (!validation.isValid) {
          console.warn('[SCHEMA VALIDATION ERROR] ENDPOINT', validation, axel.models.axelModelConfig.schema);
          throw new ExtendedError({
            code: 400,
            message: 'data_validation_error',
            errors: validation.formatedErrors
          });
        }
        if (result) {
          return repository.update({ config: data }, {
            where: {
              [pKey]: id
            }
          });
        }
        throw new ExtendedError({
          code: 404,
          message: 'item_not_found',
          errors: ['item_not_found']
        });
      })
      .then(() => repository.findOne({
        where: { [pKey]: id },
        raw: false
      }))
      .then((result) => {
        if (result) {
          saveModel(data);
          return resp.status(200).json({
            body: result.config
          });
        }
        return resp.status(404).json({
          errors: ['item_not_found'],
          message: 'item_not_found'
        });
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          axel.logger.warn(err);
        }
        if (err && err.name === 'SequelizeValidationError') {
          resp.status(400).json({
            // @ts-ignore
            errors: err.errors && err.errors.map(e => e.message),
            message: 'sql_validation_error'
          });
          return false;
        }
        ErrorUtils.errorCallback(err, resp);
      });
  }

  /**
  * [delete Item]
  * [description]
  * @method
  * @param  {[type]} req  [description]
  * @param  {[type]} resp [description]
  * @return {[type]}      [description]
  */
  delete(req, resp) {
    const id = req.params.id;

    const repository = Utils.getEntityManager(entity, resp);
    const pKey = typeof id === 'string' && Number.isNaN(parseInt(id)) ? 'identity' : primaryKey;
    if (!repository) {
      return;
    }
    repository
      .destroy({
        where: {
          [pKey]: id
        }
      })
      .catch((err) => {
        throw new ExtendedError({
          code: 400,
          errors: [err || 'delete_error'],
          message: err.message || 'delete_error'
        });
      })
      .then((a) => {
        if (!a) {
          return resp.status(404).json();
        }
        resp.status(200).json({
          status: 'OK'
        });
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          axel.logger.warn(err);
        }
        ErrorUtils.errorCallback(err, resp);
      });
  }


  export(req, resp, next) {
    const schema = axel.models[entity].schema;
    let data = [];

    const url = `${entity}_export`;
    const options = {};
    const query = {};
    const repository = Utils.getEntityManager(req, resp);
    if (!repository) {
      resp.status(400).json({ message: 'error_model_not_found_for_this_url' });
      return;
    }
    Promise.resolve()
      .then(() => repository.findAll({
        where: query
      }))
      .then((result) => {
        data = result;
        return ExcelService.export(data, url, options);
      })
      .then((result) => {
        if (result) {
          if (result.errno) {
            return resp.status(500).json({
              errors: ['export_failed'],
              message: 'export_failed'
            });
          }

          return resp.status(200).json({
            status: 'OK',
            url: result
          });
        }
        return resp.status(404).json({
          errors: ['item_not_found'],
          message: 'item_not_found'
        });
      })
      .catch(next);
  }
}

module.exports = new AxelModelConfigController();
