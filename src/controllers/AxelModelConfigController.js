/**
 * /AxelModelConfig
 *
 * @description :: Server-side logic for managing AxelModelConfig entities
 */

const Utils = require('../services/Utils.js'); // adjust path as needed
const ErrorUtils = require('../services/ErrorUtils.js'); // adjust path as needed
const { ExtendedError } = require('../services/ExtendedError.js'); // adjust path as needed
const AxelAdmin = require('../services/AxelAdmin.js'); // adjust path as needed
const ExcelService = require('../services/ExcelService.js'); // adjust path as needed
const SchemaValidator = require('../services/SchemaValidator.js');
const { saveModel } = require('../services/ws/utils');
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
  list(req, resp) {
    let items = [];

    const {
      listOfValues, startPage, limit, offset, order
    } = Utils.injectPaginationQuery(req);
    let query = Utils.injectQueryParams(req);
    const repository = Utils.getEntityManager(entity, resp);
    if (!repository) {
      return;
    }
    if (req.query.search) {
      query = Utils.injectSqlSearchParams(req, query, {
        modelName: req.params.entity || entity
      });
    }
    query = Utils.cleanSqlQuery(query);
    repository
      .findAndCountAll({
        // where: req.query.filters,
        where: query,
        order,
        limit,
        offset
      })
      .then((result) => {
        items = result.rows;
        items = items.map(item => AxelAdmin.mergeData(
          AxelAdmin.jsonSchemaToFrontModel(axel.models[item.identity] || {}),
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

  get(req, resp) {
    const id = req.params.id;
    if (!id) {
      return false;
    }
    const listOfValues = req.query.listOfValues ? req.query.listOfValues : false;

    const repository = Utils.getEntityManager(entity, resp);
    if (!repository) {
      return;
    }
    const pKey = typeof id === 'string' && Number.isNaN(parseInt(id)) ? 'identity' : primaryKey;
    repository
      .findOne({
        where: { [pKey]: id },
        raw: true
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          axel.logger.warn(err);
        }
        throw new ExtendedError({
          code: 400,
          errors: [
            {
              message: err.message || 'item_not_found'
            }
          ],
          message: err.message || 'item_not_found'
        });
      })
      .then(async (itemFound) => {
        if (itemFound) {
          let item = itemFound;
          if (axel.models[item.identity]) {
            item = AxelAdmin.mergeData(
              AxelAdmin.jsonSchemaToFrontModel(axel.models[item.identity]),
              item.config
            );
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
        } if (pKey === 'identity' && axel.models[pKey]) {
          await axel.models[pKey].em.create(axel.models[pKey]);
          return resp.status(200).json({
            body: {
              ...axel.models[pKey],
              apiUrl: axel.models[pKey].apiUrl
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
      })
      .catch((err) => {
        ErrorUtils.errorCallback(err, resp);
      });
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
