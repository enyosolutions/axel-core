/**
 * /AxelModelConfig
 *
 * @description :: Server-side logic for managing AxelModelConfig entities
 */

const _ = require('lodash');
const Utils = require('../services/Utils.js'); // adjust path as needed
const ErrorUtils = require('../services/ErrorUtils.js'); // adjust path as needed
const { ExtendedError } = require('../services/ExtendedError.js'); // adjust path as needed
const SchemaValidator = require('../services/SchemaValidator.js');
/*
Uncomment if you need the following features:
- Create import template for users
- Import from excel
- Export to excel
*/

// const DocumentManager =  require('../../services/DocumentManager');
// const ExcelService =  require('../../services/ExcelService');

const entity = 'axelModelFieldConfig';
const primaryKey = axel.models[entity] && axel.models[entity].primaryKeyField
  ? axel.models[entity].primaryKeyField
  : axel.config.framework.primaryKey;

class AxelModelFieldConfigController {
  list(req, resp) {
    let items = [];
    const {
      listOfValues, startPage, limit, offset, order
    } = Utils.injectPaginationQuery(req, {
      primaryKey,
    });
    let query = Utils.injectQueryParams(req);

    const repository = Utils.getEntityManager(entity, resp);
    if (!repository) {
      resp.status(400).json({ message: 'error_model_not_found_for_this_url' });
      return;
    }
    if (req.query.search) {
      query = Utils.injectSqlSearchParams(req, query, {
        modelName: req.params.endpoint,
      });
    }
    query = Utils.cleanSqlQuery(query);
    repository
      .findAndCountAll({
        // where: req.query.filters,
        where: query,
        order,
        limit,
        offset,
      })
      .then((result) => {
        items = result.rows;
        if (listOfValues) {
          items = items.map(item => ({
            [primaryKey]: item[primaryKey],
            label: item.title || item.name || item.label || `${item.firstname} ${item.lastname}`,
          }));
        }
        return result.count || 0;
      })

      .then(totalCount => resp.status(200).json({
        body: items,
        page: startPage,
        perPage: limit,
        count: limit,
        totalCount,
      }))
      .catch((err) => {
        axel.logger.warn(err);
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
      resp.status(400).json({ message: 'error_model_not_found_for_this_url' });
      return;
    }
    repository
      .findOne({
        where: { [primaryKey]: id },
        raw: false,
      })
      .catch((err) => {
        axel.logger.warn(err);
        throw new ExtendedError({
          code: 404,
          errors: [
            {
              message: err.message || 'not_found',
            },
          ],
          message: err.message || 'not_found',
        });
      })
      .then((item) => {
        if (item) {
          item = item.get();
          if (listOfValues) {
            item = {
              [primaryKey]: item[primaryKey],
              label: item.title || item.name || item.label || `${item.firstname} ${item.lastname}`,
            };
          }
          return resp.status(200).json({
            body: item,
          });
        }
        throw new ExtendedError({
          code: 404,
          errors: [
            {
              message: 'not_found',
            },
          ],
          message: 'not_found',
        });
      })
      .catch((err) => {
        axel.logger.warn(err);
        ErrorUtils.errorCallback(err, resp);
      });
  }

  post(req, resp) {
    const data = req.body;
    const repository = Utils.getEntityManager(entity, resp);
    if (!repository) {
      resp.status(400).json({ message: 'error_model_not_found_for_this_url' });
      return;
    }


    repository
      .create(data)
      .then(result => resp.status(200).json({
        body: result,
      }))
      .catch((err) => {
        axel.logger.warn(err);
        if (err && err.name === 'SequelizeValidationError') {
          resp.status(400).json({
            // @ts-ignore
            errors: err.errors && err.errors.map(e => e.message),
            message: 'sql_validation_error',
          });
          return false;
        }
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
      resp.status(400).json({ message: 'error_model_not_found_for_this_url' });
      return;
    }
    if (axel.config.framework && axel.config.framework.validateDataWithJsonSchema) {
      try {
        const result = SchemaValidator.validate(data, req.params.endpoint);
        console.log('result', result);

        if (!result.isValid) {
          console.warn('[SCHEMA VALIDATION ERROR]', req.params.endpoint, result, data);
          resp.status(400).json({
            message: 'data_validation_error',
            errors: result.formatedErrors,
          });
          debug('formatting error', result);
          return;
        }
      } catch (err) {
        throw new Error('error_wrong_json_format_for_model_definition');
      }
    }

    repository
      .findByPk(id)
      .catch((err) => {
        axel.logger.warn(err);
        throw new ExtendedError({
          code: 404,
          errors: [
            {
              message: err.message || 'not_found',
            },
          ],
          message: err.message || 'not_found',
        });
      })
      .then((result) => {
        if (result) {
          return repository.update(data, {
            where: {
              [primaryKey]: id,
            },
          });
        }
        throw new ExtendedError({
          code: 404,
          message: 'not_found',
          errors: ['not_found'],
        });
      })
      .then(() => repository.findByPk(id))
      .then((result) => {
        if (result) {
          return resp.status(200).json({
            body: result,
          });
        }
        return resp.status(404).json({
          errors: ['not_found'],
          message: 'not_found',
        });
      })
      .catch((err) => {
        axel.logger.warn(err);
        if (err && err.name === 'SequelizeValidationError') {
          resp.status(400).json({
            // @ts-ignore
            errors: err.errors && err.errors.map(e => e.message),
            message: 'validation_error',
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
    if (!repository) {
      resp.status(400).json({ message: 'error_model_not_found_for_this_url' });
      return;
    }

    repository
      .destroy({
        where: {
          [primaryKey]: id,
        },
      })
      .catch((err) => {
        axel.logger.warn(err);
        throw new ExtendedError({
          code: 400,
          errors: [err || 'delete_error'],
          message: err.message || 'delete_error',
        });
      })
      .then((a) => {
        if (!a) {
          return resp.status(404).json();
        }
        resp.status(200).json({
          status: 'OK',
        });
      })
      .catch((err) => {
        axel.logger.warn(err);
        ErrorUtils.errorCallback(err, resp);
      });
  }
}

module.exports = new AxelModelFieldConfigController();
