//@ts-nocheck
/**
 * Api/CrudController
 *
 * @description :: Server-side logic for managing all endpoints
 * @help        :: See http://App.s.org/#!/documentation/concepts/Controllers
 */

const Utils = require('../services/Utils');
const ExtendedError = require('../services/ExtendedError');

const primaryKey = axel.config.framework.primaryKey;

module.exports = {
  stats(req, resp) {
    const output = {};
    const endpoint = req.param('endpoint');
    const collection = App.mongodb.get(endpoint);

    const currentDate = new Date();
    const now = Date.now();
    const oneDay = 1000 * 60 * 60 * 24;
    const today = new Date(now - (now % oneDay));
    const tomorrow = new Date(today.valueOf() + oneDay);
    const monthStartDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const weekStartDay = new Date(
      currentDate.setDate(currentDate.getDate() - currentDate.getDay()),
    );

    if (!collection) {
      return resp.status(404).json({
        errors: ['not_found'],
        message: 'not_found',
      });
    }

    collection
      .count()
      .then(data => {
        // TOTAL
        output.total = data;

        // THIS MONTH
        return collection.count({
          createdOn: {
            $gte: monthStartDay,
            $lt: tomorrow,
          },
        });
      })
      .then(data => {
        output.month = data;

        // THIS WEEK
        return collection.count({
          createdOn: {
            $gte: weekStartDay,
            $lt: tomorrow,
          },
        });
      })
      .then(data => {
        output.week = data;

        // TODAY
        return collection.count({
          createdOn: {
            $gte: today,
            $lt: tomorrow,
          },
        });
      })
      .then(data => {
        output.today = data;

        resp.status(200).json({
          body: output,
        });
      })
      .catch(err => {
        App.logger.warn(err);
        Utils.errorCallback(err, resp);
      });
  },

  list(req, resp) {
    const endpoint = req.param('endpoint');
    const collection = App.mongodb.get(endpoint);

    let query = {};

    const listOfValues = req.query.listOfValues ? req.query.listOfValues : false;
    const startPage = parseInt(req.query.page ? req.query.page : 0);
    const limit = Utils.getPagination(req);
    const skip = startPage * limit;

    let output = [];
    let options = {
      limit,
      skip,
    };
    if (req.query) {
      if (req.query.search) {
        collection.ensureIndex(
          {
            '$**': 'text',
          },
          {
            default_language: 'en',
            language_override: 'en',
          },
        );
        query.$text = {
          $search: req.query.search,
          $language: 'en',
        };
      }

      query = Utils.injectQueryParams(req, query);
      options = Utils.injectSortParams(req, options);
    }

    collection
      .find(query, options)
      .then(data => {
        if (data && data.length) {
          output = data;
          if (listOfValues) {
            output = output.map(item => ({
              [primaryKey]: item[primaryKey].toString(),
              label: item.title || item.name || item.label || `${item.firstname} ${item.lastname}`,
            }));
          }
          return collection.count(query);
        }
        return 0;
      })
      .then(totalCount => {
        resp.status(200).json({
          body: output,
          page: startPage,
          perPage: limit,
          totalCount,
        });
      })
      .catch(err => {
        Utils.errorCallback(err, resp);
      });
  },

  get(req, resp) {
    const endpoint = req.param('endpoint');
    const id = req.param('id');
    if (!Utils.checkIsMongoId(id, resp)) {
      return false;
    }
    const listOfValues = req.query.listOfValues ? req.query.listOfValues : false;
    const collection = App.mongodb.get(endpoint);
    collection
      .findOne({
        [primaryKey]: App.mongodb.id(id),
      })
      .then(doc => {
        if (doc) {
          if (listOfValues) {
            return resp.status(200).json({
              body: {
                [primaryKey]: doc[primaryKey].toString(),
                label: doc.title || doc.name || doc.label || `${doc.firstname} ${doc.lastname}`,
              },
            });
          }
          resp.status(200).json({
            body: doc,
          });
        } else {
          App.logger.info('FILE NOT FOUND');
          resp.status(404).json({
            errors: ['not_found'],
            message: 'not_found',
          });
        }
      })
      .catch(err => {
        Utils.errorCallback(err, resp);
      });
  },

  post(req, resp) {
    const endpoint = req.param('endpoint');
    App.logger.info('CRUD :: post request:', endpoint);
    const data = Utils.injectUserId(req.body, req.user);
    const collection = App.mongodb.get(endpoint);
    // prevent inject of ids in the create form to steal other peoples entities
    delete data[primaryKey];
    collection
      .insert(data)
      .then(() => {
        resp.status(200).json({
          body: data,
        });
        const userId = req.user ? req.user[primaryKey] : 'ANONYMOUS';

        EventManager.bus.publish(`${endpoint.toUpperCase()}_CREATED`, {
          userId,
          data,
          entity: endpoint,
          entityId: data[primaryKey],
        });

        ActivityLog.log(null, data, {
          userId,
          entityId: data[primaryKey],
          entity: endpoint,
        });
      })
      .catch(err => {
        Utils.errorCallback(err, resp);
      });
  },

  /**
   * [put description]
   * [description]
   * @method
   * @param  {[type]} req  [description]
   * @param  {[type]} resp [description]
   * @return {[type]}      [description]
   */
  put(req, resp) {
    const endpoint = req.param('endpoint');
    App.logger.info('CRUD: PUT request:', endpoint);
    const id = req.param('id');
    let original;
    let updatee;
    if (!Utils.checkIsMongoId(id, resp)) {
      return false;
    }

    const collection = App.mongodb.get(endpoint);
    collection
      .findOne({
        [primaryKey]: id,
      })
      .catch(err => {
        App.logger.warn(err);
        resp.status(404).json({
          errors: [err.message],
          message: 'not_found',
        });
      })
      .then(o => {
        original = o;
        if (original) {
          updatee = _.merge(req.body, {
            createdOn: updatee.createdOn,
            lastModifiedOn: updatee.lastModifiedOn,
          });
          updatee[primaryKey] = id;
          return collection.update(
            {
              [primaryKey]: id,
            },
            updatee,
          );
        }
      })
      .catch(err => {
        App.logger.warn(err);
        resp.status(err.code < 504 ? err.code : 500).json({
          errors: err.errors || [err.message],
          message: err.message || 'updating_error',
        });
        return false;
      })
      .then(d => {
        if (!d) {
          return;
        }
        App.logger.debug('update status', d, {
          [primaryKey]: id,
        });
        App.logger.info('RETURNING RESULTS', updatee);
        resp.status(200).json({
          body: updatee,
        });
        const userId = req.user ? req.user[primaryKey] : 'ANONYMOUS';
        EventManager.bus.publish(`${endpoint.toUpperCase()}_MODIFIED`, {
          userId,
          data: updatee,
          entity: endpoint,
          entityId: id,
        });

        ActivityLog.log(original, updatee, {
          userId,
          entityId: id,
          entity: endpoint,
        });
      })
      .catch(err => {
        Utils.errorCallback(err, resp);
      });
  },

  /**
   * @param  {[type]}
   * @param  {[type]}
   * @return {[type]}
   */
  patch(req, resp) {
    const endpoint = req.param('endpoint');
    App.logger.info('CRUD :: PATCH request:', endpoint);
    const collection = App.mongodb.get(endpoint);
    collection
      .findOne({
        [primaryKey]: req.param('id'),
      })
      .then(o => {
        if (o) {
          const original = o;
          const data = _.merge({}, original, req.body, {
            lastModifiedOn: new Date(),
          });

          collection
            .update(
              {
                [primaryKey]: data[primaryKey],
              },
              data,
            )
            .then(d => {
              resp.status(200).json({
                body: d,
              });

              const userId = req.user ? req.user[primaryKey] : 'ANONYMOUS';

              EventManager.bus.publish(`${endpoint.toUpperCase()}_MODIFIED`, {
                userId,
                data,
                entity: endpoint,
                entityId: data[primaryKey],
              });
              ActivityLog.log(original, data, {
                userId,
                entityId: req.param('id'),
                entity: endpoint,
              });
            })
            .catch(err => {
              App.logger.warn(err);
            });
        } else {
          return resp.status(404).json({
            errors: ['not_found'],
            message: 'not_found',
          });
        }
      })
      .catch(err => {
        Utils.errorCallback(err, resp);
      });
  },

  /**
   * [delete Item]
   * [description]
   * @method
   * @param  {[type]} req  [description]
   * @param  {[type]} resp [description]
   * @return {[type]}      [description]
   */
  delete(req, resp) {
    const endpoint = req.param('endpoint');

    App.logger.info('CRUD :: DELETE request:', endpoint);
    const id = req.param('id');
    if (!Utils.checkIsMongoId(id, resp)) {
      return false;
    }
    const collection = App.mongodb.get(endpoint);
    collection
      .remove({
        [primaryKey]: id,
      })
      .then(data => {
        resp.status(200).json({
          status: 'OK',
        });

        const userId = req.user ? req.user[primaryKey] : 'ANONYMOUS';
        EventManager.bus.publish(`${endpoint.toUpperCase()}_DELETED`, {
          userId,
          data,
          entity: endpoint,
          entityId: id,
        });

        ActivityLog.log(
          {
            [primaryKey]: req.param('id'),
          },
          null,
          {
            userId,
            entityId: id,
            entity: endpoint,
          },
        );
      })
      .catch(err => {
        Utils.errorCallback(err, resp);
      });
  },

  import(req, resp) {
    const endpoint = req.param('endpoint');
    const repository = App.models[endpoint].em;
    if (!repository) {
      return;
    }
    const properData = [];
    const improperData = [];
    let doc;

    DocumentManager.httpUpload(req, {
      path: 'updloads/excel',
    })
      .then(document => {
        if (document && document.length > 0) {
          doc = document;
          return ExcelService.parse(doc[0].fd, {
            columns: {},
            eager: false,
          });
        }
        throw new ExtendedError({
          code: 404,
          stack: 'no_file_uploaded',
          message: 'no_file_uploaded',
          errors: ['no_file_uploaded'],
        });
      })
      .catch(err => {
        App.logger.warn(err && err.message ? err.message : err);
        resp.status(400).json({
          errors: [err.message || 'update_error'],
          message: err.message || 'update_error',
        });
      })
      .then(result => {
        if (result) {
          // return repository.bulkCreate(result);
          if (result) {
            result.forEach(item => {
              if (!item.code || !item.designation || !item.family || !item.numberOfPoints) {
                improperData.push(item);
              } else {
                item.title = item.designation;
                properData.push(item);
              }
            });
            if (properData.length > 0) {
              const properDataQuery = properData.map(p => ({
                insertOne: { document: p },
              }));
              return repository.bulkWrite(properDataQuery);
            }
            return true;
          }
        }
      })
      .catch(err => {
        App.logger.warn(err && err.message ? err.message : err);
        resp.status(400).json({
          errors: [err.message || 'create_error'],
          message: err.message || 'create_error',
        });
      })
      .then(result => {
        if (result) {
          return DocumentManager.delete(doc[0].fd);
        }
      })
      .catch(err => {
        App.logger.warn(err && err.message ? err.message : err);
        resp.status(500).json({
          errors: [err.message || 'delete_error'],
          message: err.message || 'delete_error',
        });
      })
      .then(result => {
        if (result) {
          resp.json({
            body: 'ok',
            properData,
            improperData,
          });
        }
      })
      .catch(err => {
        App.logger.warn(err && err.message ? err.message : err);
        Utils.errorCallback(err, resp);
      });
  },

  importTemplate(req, resp) {
    const endpoint = req.param('endpoint');
    const repository = App.models[endpoint].em;
    if (!repository) {
      return;
    }
    const properData = [];
    const improperData = [];
    let doc;

    DocumentManager.httpUpload(req, {
      path: 'updloads/excel',
    })
      .then(document => {
        if (document && document.length > 0) {
          doc = document;
          return ExcelService.parse(doc[0].fd, {
            columns: {},
            eager: false,
          });
        }
        throw new ExtendedError({
          code: 404,
          stack: 'no_file_uploaded',
          message: 'no_file_uploaded',
          errors: ['no_file_uploaded'],
        });
      })
      .catch(err => {
        App.logger.warn(err && err.message ? err.message : err);
        resp.status(400).json({
          errors: [err.message || 'update_error'],
          message: err.message || 'update_error',
        });
      })
      .then(result => {
        if (result) {
          // return repository.bulkCreate(result);
          if (result) {
            result.forEach(item => {
              if (!item.code || !item.designation || !item.family || !item.numberOfPoints) {
                improperData.push(item);
              } else {
                item.title = item.designation;
                properData.push(item);
              }
            });
            if (properData.length > 0) {
              const properDataQuery = properData.map(p => ({
                insertOne: { document: p },
              }));
              return repository.bulkWrite(properDataQuery);
            }
            return true;
          }
        }
      })
      .catch(err => {
        App.logger.warn(err && err.message ? err.message : err);
        resp.status(400).json({
          errors: [err.message || 'create_error'],
          message: err.message || 'create_error',
        });
      })
      .then(result => {
        if (result) {
          return DocumentManager.delete(doc[0].fd);
        }
      })
      .catch(err => {
        App.logger.warn(err && err.message ? err.message : err);
        resp.status(500).json({
          errors: [err.message || 'delete_error'],
          message: err.message || 'delete_error',
        });
      })
      .then(result => {
        if (result) {
          resp.json({
            body: 'ok',
            properData,
            improperData,
          });
        }
      })
      .catch(err => {
        App.logger.warn(err && err.message ? err.message : err);
        Utils.errorCallback(err, resp);
      });
  },
};
