/**
 * Api/CrudSqlController
 *
 * @description :: Server-side logic for managing all endpoints
 * @help        :: See http://axel.s.org/#!/documentation/concepts/Controllers
 */
const { get, has } = require('lodash');
const d = require('debug');
const path = require('path');

const Utils = require('../services/Utils.js');
const ErrorUtils = require('../services/ErrorUtils.js'); // adjust path as needed
const ExtendedError = require('../services/ExtendedError.js');
const DocumentManager = require('../services/DocumentManager.js');
const ExcelService = require('../services/ExcelService.js');
const SchemaValidator = require('../services/SchemaValidator.js');
const { execHook, getPrimaryKey } = require('../services/ControllerUtils');

const debug = d('axel:CrudSqlController');

class CrudSqlController {
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
        createdOn >= SUBDATE(CURDATE(), DAYOFMONTH(CURDATE())-1)`,
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
        YEARWEEK(createdOn) = YEARWEEK(CURRENT_TIMESTAMP)`,
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
        DATE(createdOn) = DATE(NOW())`,
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
      .catch(next);
  }

  async list(req, resp, next) {
    const endpoint = req.endpoint || req.params.endpoint;
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
        query = Utils.injectSqlSearchParams(req, query, {
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
      await execHook(endpoint, 'beforeApiFind', { request: req, sequelizeQuery });
      const { rows, count } = await repository
        .findAndCountAll(sequelizeQuery);


      items = rows.map(item => item.get());
      const result = {
        body: items,
        page: startPage,
        perPage: limit,
        count: limit,
        totalCount: count
      };
      await execHook(endpoint, 'afterApiFind', result, { request: req, response: resp });

      resp.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async get(req, resp, next) {
    const id = req.params.id;
    const endpoint = req.params.endpoint;
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
      console.log('execHook', 'beforeApiFindOne');
      await execHook(endpoint, 'beforeApiFindOne', { request: req, sequelizeQuery });
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
        body: item.get()
      };
      execHook(endpoint, 'afterApiFindOne', result, { request: req, response: resp });
      return resp.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async post(req, resp, next) {
    const data = req.body;
    const endpoint = req.endpoint || req.params.endpoint;
    try {
      await execHook(endpoint, 'beforeApiCreate', { request: req, sequelizeQuery: {} });
      const repository = Utils.getEntityManager(req, resp);
      if (!repository) {
        throw new ExtendedError({ code: 400, message: 'error_model_not_found_for_this_url' });
      }
      await SchemaValidator.validateAsync(data, endpoint);

      const result = {};
      result.body = await repository
        .create(data);
      await execHook(endpoint, 'afterApiCreate', result, { request: req, response: resp });

      resp.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
  * [put description]
  * [description]
  * @method
  * @param  {[type]} req  [description]
  * @param  {[type]} resp [description]
  * @return {[type]}      [description]
  */
  async put(req, resp, next) {
    const id = req.params.id;
    const data = req.body;

    const endpoint = req.params.endpoint || req.endpoint;
    try {
      const primaryKey = getPrimaryKey(endpoint);
      const repository = Utils.getEntityManager(req, resp);
      if (!repository) {
        throw new ExtendedError({ code: 400, message: 'error_model_not_found_for_this_url' });
      }

      const sequelizeQuery = { where: { [primaryKey]: id } };
      await execHook(endpoint, 'beforeApiUpdate', { request: req, sequelizeQuery });
      await SchemaValidator.validateAsync(data, endpoint);

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
      await repository.update(data, sequelizeQuery);

      const result = {};
      result.body = await repository.findOne(sequelizeQuery);
      result.body = result.body.get();
      await execHook(endpoint, 'afterApiUpdate', result, { request: req, response: resp });

      return resp.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
  * [delete Item]
  * [description]
  * @method
  * @param  {[type]} req  [description]
  * @param  {[type]} resp [description]
  * @return {[type]}      [description]
  */
  async delete(req, resp, next) {
    try {
      const id = req.params.id;
      const endpoint = req.params.endpoint || req.endpoint;
      const primaryKey = getPrimaryKey(endpoint);
      const repository = Utils.getEntityManager(req, resp);

      if (!repository) {
        throw new ExtendedError({ code: 400, message: 'error_model_not_found_for_this_url' });
      }
      const sequelizeQuery = { where: { [primaryKey]: id } };

      await execHook(endpoint, 'beforeApiDelete', { request: req, sequelizeQuery });
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

  export(req, resp, next) {
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
  }

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
  }

  import(req, resp, next) {
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
  }
}

module.exports = new CrudSqlController();
