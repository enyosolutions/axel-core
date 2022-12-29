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
const axel = require('../axel.js');
const { saveModel } = require('../services/ws/utils');

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

const schemaKeywords = [
  '$id',
  '$ref',
  'column',
  'contains',
  'default',
  'description',
  'enum',
  'examples',
  'field',
  'foreignKey',
  'format',
  'items',
  'maxItems',
  'maxLength',
  'minItems',
  'minLength',
  'nullable',
  'pattern',
  'properties',
  'relation',
  'relationKey',
  'relationLabel',
  'relationUrl',
  'required',
  'title',
  'type',
  'uniqueItems',
];

class AxelModelFieldConfigController {
  listFields(req, resp) {
    let items = [];
    const {
      listOfValues, startPage, limit, offset, order
    } = Utils.injectPaginationQuery(req, {
      primaryKey
    });
    let query = Utils.injectQueryParams(req);

    const repository = Utils.getEntityManager(entity, resp);
    if (!repository) {
      resp.status(400).json({ message: 'error_model_not_found_for_this_url' });
      return;
    }

    const parentIdentity = req.query && req.query.filters && req.query.filters.parentIdentity;
    if (req.query.search) {
      query = Utils.injectSqlSearchParams(req.query.search, query, {
        modelName: entity
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
        raw: false
      })
      .then((result) => {
        items = result.rows;
        if (parentIdentity && typeof parentIdentity === 'string' && axel.models[parentIdentity] && axel.models[parentIdentity].schema) {
          // merge existing fields with the ones in the DB
          Object.entries(axel.models[parentIdentity].schema.properties).forEach(([field, definition]) => {
            const savedField = items.find(item => item.name === field);
            if (!savedField) {
              items.push({
                id: null,
                parentIdentity,
                name: field,
                config: definition
              });
            } else {
              savedField.config = { ...definition, ...savedField.config };
            }
          });
        }
        if (listOfValues) {
          items = items.map(item => ({
            [primaryKey]: item[primaryKey],
            label: item.identity,
            name: item.name
          }));
        } else {
          items = items.map(item => ({
            id: item.id, parentIdentity: item.parentIdentity, name: item.name, ...item.config
          }));
        }
        return result.count || 0;
      })

      .then(totalCount => resp.status(200).json({
        body: items,
        page: startPage,
        perPage: limit,
        count: limit,
        totalCount
      }))
      .catch((err) => {
        axel.logger.warn(err);
        ErrorUtils.errorCallback(err, resp);
      });
  }

  list(req, resp) {
    try {
      let items = [];
      const parentIdentity = req.query && req.query.filters && req.query.filters.parentIdentity;
      if (parentIdentity && typeof parentIdentity === 'string' && axel.models[parentIdentity] && axel.models[parentIdentity].schema) {
        // merge existing fields with the ones in the DB
        Object.entries(axel.models[parentIdentity].schema.properties).forEach(([field, definition]) => {
          const savedField = items.find(item => item.name === field);
          if (!savedField) {
            items.push({
              id: null,
              parentIdentity,
              name: field,
              config: definition
            });
          } else {
            savedField.config = { ...definition, ...savedField.config };
          }
        });
      }

      if (req.query.listOfValues) {
        items = items.map(item => ({
          [primaryKey]: item[primaryKey],
          label: item.identity,
          name: item.name
        }));
      } else {
        items = items.map(item => ({
          id: item.id, parentIdentity: item.parentIdentity, name: item.name, ...item.config
        }));
      }

      resp.status(200).json({
        body: items,
        page: 0,
        perPage: items.length,
        count: items.length,
        totalCount: items.length,
      });
    } catch (err) {
      axel.logger.warn(err);
      ErrorUtils.errorCallback(err, resp);
    }
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
        raw: false
      })
      .catch((err) => {
        axel.logger.warn(err);
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
      .then((item) => {
        if (item) {
          item = item.get();
          item = {
            id: item.id,
            parentIdentity: item.parentIdentity,
            name: item.name,
            ...item.config
          };

          return resp.status(200).json({
            body: item
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

    const body = _.pick(data, schemaKeywords);

    repository
      .create({
        parentIdentity: data.parentIdentity,
        name: `additionalField__${data.name}`,
        config: body
      })
      .then((result) => {
        axel.models[result.parentIdentity].schema.properties[result.name] = result.config;
        saveModel(axel.models[result.parentIdentity]);

        resp.status(200).json({
          body: {
            id: result.id,
            parentIdentity: result.parentIdentity,
            name: result.name,
            ...result.config
          }
        });
      })
      .catch((err) => {
        axel.logger.warn(err);
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
    try {
      const result = SchemaValidator.validate(data, entity);
      if (!result.isValid) {
        console.warn('[SCHEMA VALIDATION ERROR] ENDPOINT', entity, result, data);
        resp.status(400).json({
          message: 'data_validation_error',
          errors: result.formatedErrors
        });
        return;
      }
    } catch (err) {
      console.warn('[SCHEMA VALIDATION ERROR]', err);
      throw new Error('error_wrong_json_format_for_model');
    }
    const body = _.pick(data, schemaKeywords);
    repository
      .findByPk(id)
      .then((result) => {
        if (result) {
          return repository.update({
            config: body
          }, {
            where: {
              [primaryKey]: id
            }
          });
        }
        return repository.create({ ...data, config: body }, {
          where: {
            [primaryKey]: id
          }
        });
      })
      .then(() => repository.findByPk(id))
      .then((result) => {
        if (result) {
          axel.models[result.parentIdentity].schema.properties[result.name] = result.config;
          saveModel(axel.models[result.parentIdentity]);
          return resp.status(200).json({
            body: {
              id: result.id,
              parentIdentity: result.parentIdentity,
              name: result.name,
              ...result.config
            }
          });
        }
        return resp.status(404).json({
          errors: ['item_not_found'],
          message: 'item_not_found'
        });
      })
      .catch((err) => {
        axel.logger.warn(err);
        if (err && err.name === 'SequelizeValidationError') {
          resp.status(400).json({
            // @ts-ignore
            errors: err.errors && err.errors.map(e => e.message),
            message: 'validation_error'
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
          [primaryKey]: id
        }
      })
      .catch((err) => {
        axel.logger.warn(err);
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
        axel.logger.warn(err);
        ErrorUtils.errorCallback(err, resp);
      });
  }
}

module.exports = new AxelModelFieldConfigController();
