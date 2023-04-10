/**
 * Api/CrudSqlController
 *
 * @description :: Server-side logic for managing all endpoints
 * @help        :: See http://axel.s.org/#!/documentation/concepts/Controllers
 */
const { get, has } = require('lodash');
const d = require('debug');
const path = require('path');
const _ = require('lodash');
const Utils = require('../services/Utils.js');
const ErrorUtils = require('../services/ErrorUtils.js'); // adjust path as needed
const ExtendedError = require('../services/ExtendedError.js');
const DocumentManager = require('../services/DocumentManager.js');
const ExcelService = require('../services/ExcelService.js');
const SchemaValidator = require('../services/SchemaValidator.js');
const { execHook, getPrimaryKey } = require('../services/ControllerUtils');

const debug = d('axel:CrudSqlController');

const CrudSqlController = {
  stats(req, resp, next) {
    const output = {};
    const endpoint = req.params.endpoint;

    if (!axel.models[endpoint] || !axel.models[endpoint].repository) {
      return resp.status(404).json({
        errors: ['endpoint_not_found'],
        message: 'endpoint_not_found'
      });
    }
    const { repository, tableName } = axel.models[endpoint];
    const createdOnField = _.get(axel, 'models[endpoint].em.options.createdAt');
    if (!createdOnField) {
      return resp.status(400).json({
        errors: ['created_on_field_not_found'],
        message: 'created_on_field_not_found'
      });
    }
    repository
      .count({})
      .then((data) => {
        // TOTAL
        output.total = data;

        // THIS MONTH
        return axel.sqldb.query(
          `SELECT COUNT(*)  as month
        FROM ${tableName}
        WHERE
        ${createdOnField} >= SUBDATE(CURDATE(), DAYOFMONTH(CURDATE())-1)`,
          {
            type: axel.sqldb.QueryTypes.SELECT
          }
        );
      })
      .then((data) => {
        if (data && data.length > 0 && data[0].month) {
          output.month = data[0].month;
        } else {
          output.month = 0;
        }

        // THIS WEEK
        return axel.sqldb.query(
          `SELECT COUNT(*) as week
        FROM ${tableName}
        WHERE
        YEARWEEK(${createdOnField}) = YEARWEEK(CURRENT_TIMESTAMP)`,
          {
            type: axel.sqldb.QueryTypes.SELECT
          }
        );
      })
      .then((data) => {
        if (data && data.length > 0 && data[0].week) {
          output.week = data[0].week;
        } else {
          output.week = 0;
        }

        // TODAY
        return axel.sqldb.query(
          `SELECT COUNT(*) as today
        FROM ${tableName}
        WHERE
        DATE(${createdOnField}) = DATE(NOW())`,
          {
            type: axel.sqldb.QueryTypes.SELECT
          }
        );
      })
      .then((data) => {
        if (data && data.length > 0 && data[0].today) {
          output.today = data[0].today;
        } else {
          output.today = 0;
        }

        return resp.status(200).json({
          body: output
        });
      })
      .catch(next); // eslint-disable-line
  },

  async findAll(req, resp, next) {
    const endpoint = req.endpoint || req.params.endpoint || req.modelName;
    try {
      let items = [];
      const {
        startPage, limit, offset, order
      } = req.pagination;
      let query = req.parsedQuery;
      const repository = Utils.getEntityManager(req, resp);
      if (!repository) {
        throw new ExtendedError({
          code: 400,
          message: 'error_model_not_found_for_this_url'
        });
      }
      if (req.query.search) {
        query = Utils.injectSqlSearchParams(req.query.search, query, {
          modelName: endpoint
        });
      }

      query = Utils.cleanSqlQuery(query);
      const sequelizeQuery = {
        where: query,
        order,
        limit,
        offset,
        raw: false,
        nested: true
      };
      await execHook(endpoint, 'beforeApiFind', { request: req, sequelizeQuery, response: resp });
      const { rows, count } = await repository
        .findAndCountAll(sequelizeQuery);
      if (resp.headersSent) {
        return;
      }

      items = rows.map(item => (item.toJSON ? item.toJSON() : item));
      const result = {
        body: items,
        page: startPage,
        perPage: limit,
        count: limit,
        totalCount: count
      };
      await execHook(endpoint, 'afterApiFind', result, { request: req, response: resp });
      resp.set('X-axel-core-endpoint', endpoint);
      resp.set('X-axel-core-action', 'list');
      resp.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },


  async findOne(req, resp, next) {
    const id = req.params.id;
    const endpoint = req.params.endpoint || req.endpoint || req.modelName;
    try {
      const primaryKey = getPrimaryKey(endpoint);
      const repository = Utils.getEntityManager(req, resp);
      if (!repository) {
        throw new ExtendedError({ code: 400, message: 'error_model_not_found_for_this_url' });
      }
      const sequelizeQuery = {
        where: { [primaryKey]: id },
        raw: false
      };
      await execHook(endpoint, 'beforeApiFindOne', { request: req, sequelizeQuery });
      if (resp.headersSent) {
        return;
      }
      const item = await repository
        .findOne(sequelizeQuery);

      if (!item) {
        throw new ExtendedError({
          code: 404,
          errors: [
            `${endpoint}_not_found_${id}`
          ],
          message: 'item_not_found'
        });
      }

      const result = {
        body: item.toJSON ? item.toJSON() : item
      };
      await execHook(endpoint, 'afterApiFindOne', result, { request: req, response: resp });
      resp.set('X-axel-core-endpoint', endpoint);
      resp.set('X-axel-core-action', 'get');
      return resp.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },


  async create(req, resp, next) {
    const data = req.body;
    const endpoint = req.endpoint || req.params.endpoint || req.modelName;
    try {
      await execHook(endpoint, 'beforeApiCreate', { request: req, sequelizeQuery: {} });
      if (resp.headersSent) {
        return;
      }
      const repository = Utils.getEntityManager(req, resp);
      if (!repository) {
        throw new ExtendedError({ code: 400, message: 'error_model_not_found_for_this_url' });
      }
      await SchemaValidator.validateAsync(data, endpoint);

      const result = {};
      result.body = await repository
        .create(data);
      await execHook(endpoint, 'afterApiCreate', result, { request: req, response: resp });
      resp.set('X-axel-core-endpoint', endpoint);
      resp.set('X-axel-core-action', 'create');
      resp.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
  * [put description]
  * [description]
  * @method
  * @param  {import('express').Request} req  [description]
  * @param  {import('express').Response} resp [description]
  * @return {Promise<import('express').Response>}      [description]
  */
  async updateOne(req, resp, next) {
    const id = req.params.id;
    const data = req.body;

    const endpoint = req.params.endpoint || req.endpoint || req.modelName;
    try {
      const primaryKey = getPrimaryKey(endpoint);
      const repository = Utils.getEntityManager(req, resp);
      if (!repository) {
        throw new ExtendedError({ code: 400, message: 'error_model_not_found_for_this_url' });
      }

      const sequelizeQuery = { where: { [primaryKey]: id } };
      await execHook(endpoint, 'beforeApiUpdate', { request: req, sequelizeQuery });
      if (resp.headersSent) {
        return;
      }
      await SchemaValidator.validateAsync(data, endpoint, { isUpdate: true });

      const exists = await repository
        .findOne(sequelizeQuery);
      if (!exists) {
        throw new ExtendedError({
          code: 404,
          message: 'item_not_found',
          errors: ['item_not_found']
        });
      }
      sequelizeQuery.individualHooks = true;
      sequelizeQuery.raw = false;
      const [success, output] = await repository.update(data, sequelizeQuery);

      const result = {};
      result.body = output && output.length ? output[0] : await repository.findOne(sequelizeQuery);
      if (result.body && result.body.toJSON) {
        result.body = result.body.toJSON();
      }
      await execHook(endpoint, 'afterApiUpdate', result, { request: req, response: resp });
      resp.set('X-axel-core-endpoint', endpoint);
      resp.set('X-axel-core-action', 'update');
      return resp.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
  * [delete Item]
  * [description]
  * @method
  * @param  {import('express').Request} req
       * @param  {import('express').Response} resp
  * @return {Promise<import('express').Response<any, Record<string, any>>>}      [description]
  */
  async deleteOne(req, resp, next) {
    try {
      const id = req.params.id;
      const endpoint = req.params.endpoint || req.endpoint || req.modelName;
      const primaryKey = getPrimaryKey(endpoint);
      const repository = Utils.getEntityManager(req, resp);

      if (!repository) {
        throw new ExtendedError({ code: 400, message: 'error_model_not_found_for_this_url' });
      }
      const sequelizeQuery = { where: { [primaryKey]: id } };

      await execHook(endpoint, 'beforeApiDelete', { request: req, sequelizeQuery });
      if (resp.headersSent) {
        return;
      }
      const exists = await repository
        .findOne(sequelizeQuery);
      if (!exists) {
        throw new ExtendedError({
          code: 404,
          message: 'item_not_found',
          errors: ['item_not_found']
        });
      }
      const result = {};
      sequelizeQuery.individualHooks = true;
      sequelizeQuery.raw = false;
      result.body = await repository
        .destroy(sequelizeQuery);
      await execHook(endpoint, 'afterApiDelete', result, { request: req, response: resp });
      resp.set('X-axel-core-endpoint', endpoint);
      resp.set('X-axel-core-action', 'delete');
      return resp.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  exportData(req, resp, next) {
    const endpoint = req.params.endpoint;
    const schema = axel.models[endpoint] && axel.models[endpoint].schema;
    let data = [];

    const url = `${endpoint}_export`;
    const options = {};
    const query = {};
    const repository = Utils.getEntityManager(req, resp);
    if (!repository) {
      throw new ExtendedError({ code: 400, message: 'error_model_not_found_for_this_url' });
    }
    Promise.resolve()
      .then(() => repository.findAll({
        where: query
      }))
      .then((result) => {
        data = result;
        if (endpoint === 'user') {
          data = data.map((item) => {
            delete item.encryptedPassword;
            delete item.resetToken;
            return item;
          });
        }
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
          errors: ['not_found'],
          message: 'not_found'
        });
      })
      .catch(next);
  },

  getImportTemplate(req, resp, next) {
    const endpoint = req.params.endpoint;

    const repository = Utils.getEntityManager(req, resp);
    if (!repository) {
      throw new ExtendedError({ code: 400, message: 'error_model_not_found_for_this_url' });
    }

    let data = [];
    const url = `${endpoint}_import_template`;
    const options = { targetFolder: path.resolve(process.cwd(), `public/data/${endpoint}`) };
    const query = {};

    Promise.resolve()
      .then(() => repository.findAll({
        limit: 1
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
          errors: ['not_found'],
          message: 'not_found'
        });
      })
      .catch(next);
  },


  importData(req, resp, next) {
    const repository = Utils.getEntityManager(req, resp);
    if (!repository) {
      throw new ExtendedError({ code: 400, message: 'error_model_not_found_for_this_url' });
    }
    const properData = [];
    const improperData = [];
    let doc;
    DocumentManager.httpUpload(req, resp, {
      path: 'uploads/excel'
    })
      // @ts-ignore
      .then((document) => {
        if (document && document.length > 0) {
          doc = document[0];
          return ExcelService.parse(doc.fd, {
            columns: {},
            eager: false
          });
        }
        throw new ExtendedError({
          code: 404,
          message: 'no_file_uploaded',
          errors: ['no_file_uploaded']
        });
      })
      .then((result) => {
        if (result) {
          result.forEach((item) => {
            // check if data is proper before pushing it
            properData.push(item);
          });
          if (properData.length > 0) {
            return repository.bulkCreate(properData);
          }
          return true;
        }
        throw new ExtendedError({
          code: 404,
          message: 'parse_error',
          errors: ['parse_error']
        });
      })
      .catch((err) => {
        axel.logger.warn(err && err.message ? err.message : err);
        throw new ExtendedError({
          errors: [
            {
              message: err.message || 'create_error'
            }
          ],
          message: err.message || 'create_error'
        });
      })
      .then(() => DocumentManager.delete(doc[0].fd))
      .catch((err) => {
        axel.logger.warn(err && err.message ? err.message : err);
        throw new ExtendedError({
          code: 500,
          errors: [
            {
              message: err.message || 'delete_error'
            }
          ],
          message: err.message || 'delete_error'
        });
      })
      .then(() => resp.json({
        body: 'ok',
        properData,
        improperData
      }))
      .catch(next);
  },


  list(req, resp, next) {
    return CrudSqlController.findAll(req, resp, next);
  },

  get(req, resp, next) {
    return CrudSqlController.findOne(req, resp, next);
  },

  post(req, resp, next) {
    return CrudSqlController.create(req, resp, next);
  },

  put(req, resp, next) {
    return CrudSqlController.updateOne(req, resp, next);
  },

  update(req, resp, next) {
    return CrudSqlController.updateOne(req, resp, next);
  },

  import(req, resp, next) {
    CrudSqlController.importData(req, resp, next);
  },

  export(req, resp, next) {
    CrudSqlController.exportData(req, resp, next);
  },

  async delete(req, resp, next) {
    try {
      const id = req.params.id;
      const endpoint = req.params.endpoint || req.endpoint || req.modelName;
      const primaryKey = getPrimaryKey(endpoint);
      const repository = Utils.getEntityManager(req, resp);

      if (!repository) {
        throw new ExtendedError({ code: 400, message: 'error_model_not_found_for_this_url' });
      }
      const sequelizeQuery = { where: { [primaryKey]: id } };

      await execHook(endpoint, 'beforeApiDelete', { request: req, sequelizeQuery });
      const exists = await repository
        .findOne(sequelizeQuery);
      if (!exists) {
        throw new ExtendedError({
          code: 404,
          message: 'item_not_found',
          errors: ['item_not_found']
        });
      }
      const result = {};
      sequelizeQuery.individualHooks = true;
      sequelizeQuery.raw = false;
      result.body = await repository
        .destroy(sequelizeQuery);
      await execHook(endpoint, 'afterApiDelete', result, { request: req, response: resp });

      return resp.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = CrudSqlController;
