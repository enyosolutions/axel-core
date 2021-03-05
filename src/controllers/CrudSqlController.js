/**
 * Api/CrudSqlController
 *
 * @description :: Server-side logic for managing all endpoints
 * @help        :: See http://axel.s.org/#!/documentation/concepts/Controllers
 */
const d = require('debug');
const Utils = require('../services/Utils.js');
const ErrorUtils = require('../services/ErrorUtils.js'); // adjust path as needed
const { ExtendedError } = require('../services/ExtendedError.js');
const DocumentManager = require('../services/DocumentManager.js');
const ExcelService = require('../services/ExcelService.js');
const SchemaValidator = require('../services/SchemaValidator.js');

const debug = d('axel:CrudSqlController');

class CrudSqlController {
  stats(req, resp, next) {
    const output = {};
    const endpoint = req.params.endpoint;

    if (!axel.models[endpoint] || !axel.models[endpoint].repository) {
      return resp.status(404).json({
        errors: ['endpoint_not_found'],
        message: 'endpoint_not_found',
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
            type: axel.sqldb.QueryTypes.SELECT,
          },
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
            type: axel.sqldb.QueryTypes.SELECT,
          },
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
            type: axel.sqldb.QueryTypes.SELECT,
          },
        );
      })
      .then((data) => {
        if (data && data.length > 0 && data[0].today) {
          output.today = data[0].today;
        } else {
          output.today = 0;
        }

        return resp.status(200).json({
          body: output,
        });
      })
      .catch(next);
  }

  list(req, resp, next) {
    const endpoint = req.params.endpoint;
    const primaryKey = axel.models[endpoint] && axel.models[endpoint].em.primaryKeyField
      ? axel.models[endpoint].em.primaryKeyField
      : axel.config.framework.primaryKey;

    let items = [];
    const {
      listOfValues, startPage, limit, offset, order
    } = Utils.injectPaginationQuery(req, {
      primaryKey,
    });
    let query = Utils.injectQueryParams(req);

    const repository = Utils.getEntityManager(req, resp);
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
        raw: false,
        nested: true,
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
      .catch(next);
  }

  get(req, resp, next) {
    const id = req.params.id;
    if (!id) {
      return false;
    }
    const listOfValues = req.query.listOfValues ? req.query.listOfValues : false;
    const endpoint = req.params.endpoint;
    const primaryKey = axel.models[endpoint] && axel.models[endpoint].em.primaryKeyField
      ? axel.models[endpoint].em.primaryKeyField
      : axel.config.framework.primaryKey;
    const repository = Utils.getEntityManager(req, resp);
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
      .catch(next);
  }

  post(req, resp, next) {
    const data = req.body;
    const repository = Utils.getEntityManager(req, resp);
    if (!repository) {
      resp.status(400).json({ message: 'error_model_not_found_for_this_url' });
      return;
    }
    try {
      const result = SchemaValidator.validate(data, req.params.endpoint);
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

    repository
      .create(data)
      .then(result => resp.status(200).json({
        body: result,
      }))
      .catch(next);
  }

  /**
   * [put description]
   * [description]
   * @method
   * @param  {[type]} req  [description]
   * @param  {[type]} resp [description]
   * @return {[type]}      [description]
   */
  put(req, resp, next) {
    const id = req.params.id;
    const data = req.body;

    const endpoint = req.params.endpoint;
    const primaryKey = axel.models[endpoint] && axel.models[endpoint].em.primaryKeyField
      ? axel.models[endpoint].em.primaryKeyField
      : axel.config.framework.primaryKey;
    const repository = Utils.getEntityManager(req, resp);

    if (!repository) {
      resp.status(400).json({ message: 'error_model_not_found_for_this_url' });
      return;
    }
    if (axel.config.framework && axel.config.framework.validateDataWithJsonSchema) {
      try {
        const result = SchemaValidator.validate(data, req.params.endpoint);
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
      .findOne({ where: { [primaryKey]: id }, raw: false })
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
      .then(() => repository.findOne({ where: { [primaryKey]: id }, raw: false }))
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
      .catch(next);
  }

  /**
   * [delete Item]
   * [description]
   * @method
   * @param  {[type]} req  [description]
   * @param  {[type]} resp [description]
   * @return {[type]}      [description]
   */
  delete(req, resp, next) {
    const id = req.params.id;

    const repository = Utils.getEntityManager(req, resp);
    if (!repository) {
      resp.status(400).json({ message: 'error_model_not_found_for_this_url' });
      return;
    }
    const endpoint = req.params.endpoint;
    const primaryKey = axel.models[endpoint] && axel.models[endpoint].em.primaryKeyField
      ? axel.models[endpoint].em.primaryKeyField
      : axel.config.framework.primaryKey;
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
      .catch(next);
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
      resp.status(400).json({ message: 'error_model_not_found_for_this_url' });
      return;
    }
    Promise.resolve()
      .then(() => repository.findAll({
        where: query,
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
              message: 'export_failed',
            });
          }

          return resp.status(200).json({
            status: 'OK',
            url: result,
          });
        }
        return resp.status(404).json({
          errors: ['not_found'],
          message: 'not_found',
        });
      })
      .catch(next);
  }

  getImportTemplate(req, resp, next) {
    const endpoint = req.params.endpoint;

    const repository = Utils.getEntityManager(req, resp);
    if (!repository) {
      resp.status(400).json({ message: 'error_model_not_found_for_this_url' });
      return;
    }

    let data = [];
    const url = `${endpoint}_template`;
    const options = {};
    const query = {};

    Promise.resolve()
      .then(() => repository.findAll({
        limit: 1,
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
              message: 'export_failed',
            });
          }

          return resp.status(200).json({
            status: 'OK',
            url: result,
          });
        }
        return resp.status(404).json({
          errors: ['not_found'],
          message: 'not_found',
        });
      })
      .catch(next);
  }

  import(req, resp, next) {
    const repository = Utils.getEntityManager(req, resp);
    if (!repository) {
      resp.status(400).json({ message: 'error_model_not_found_for_this_url' });
      return;
    }
    const properData = [];
    const improperData = [];
    let doc;
    DocumentManager.httpUpload(req, resp, {
      path: 'uploads/excel',
    })
      // @ts-ignore
      .then((document) => {
        if (document && document.length > 0) {
          doc = document[0];
          return ExcelService.parse(doc.fd, {
            columns: {},
            eager: false,
          });
        }
        throw new ExtendedError({
          code: 404,
          message: 'no_file_uploaded',
          errors: ['no_file_uploaded'],
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
          errors: ['parse_error'],
        });
      })
      .catch((err) => {
        axel.logger.warn(err && err.message ? err.message : err);
        throw new ExtendedError({
          errors: [
            {
              message: err.message || 'create_error',
            },
          ],
          message: err.message || 'create_error',
        });
      })
      .then(() => DocumentManager.delete(doc[0].fd))
      .catch((err) => {
        axel.logger.warn(err && err.message ? err.message : err);
        throw new ExtendedError({
          code: 500,
          errors: [
            {
              message: err.message || 'delete_error',
            },
          ],
          message: err.message || 'delete_error',
        });
      })
      .then(() => resp.json({
        body: 'ok',
        properData,
        improperData,
      }))
      .catch(next);
  }
}

module.exports = new CrudSqlController();
