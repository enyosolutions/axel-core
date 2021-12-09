/**
 * /AxelModelConfig
 *
 * @description :: Server-side logic for managing AxelModelConfig entities
 */

const _ = require('lodash')
const Utils = require('../services/Utils.js') // adjust path as needed
const ErrorUtils = require('../services/ErrorUtils.js') // adjust path as needed
const { ExtendedError } = require('../services/ExtendedError.js') // adjust path as needed
const AxelAdmin = require('../services/AxelAdmin.js') // adjust path as needed
/*
Uncomment if you need the following features:
- Create import template for users
- Import from excel
- Export to excel
*/

// const DocumentManager =  require('../../services/DocumentManager');
// const ExcelService =  require('../../services/ExcelService');

const entity = 'axelModelConfig'
const primaryKey = axel.models[entity] && axel.models[entity].primaryKeyField
  ? axel.models[entity].primaryKeyField
  : axel.config.framework.primaryKey

class AxelModelConfigController {
  list(req, resp) {
    let items = []

    const {
      listOfValues, startPage, limit, offset, order
    } = Utils.injectPaginationQuery(req)
    let query = Utils.injectQueryParams(req)
    const repository = Utils.getEntityManager(entity, resp)
    if (!repository) {
      return
    }
    if (req.query.search) {
      query = Utils.injectSqlSearchParams(req, query, {
        modelName: req.params.entity
      })
    }
    query = Utils.cleanSqlQuery(query)
    repository
      .findAndCountAll({
        // where: req.query.filters,
        where: query,
        order,
        limit,
        offset
      })
      .then((result) => {
        items = result.rows
        items = items.map(item => AxelAdmin.mergeData(
          AxelAdmin.jsonSchemaToFrontModel(axel.models[item.identity] || {}),
          item.config
        ))
        if (listOfValues) {
          items = items.map(item => ({
            [primaryKey]: item[primaryKey],
            label: item.title || item.name || item.label || `${item.firstname} ${item.lastname}`
          }))
        }
        return result.count || 0
      })

      .then(totalCount => resp.status(200).json({
        body: items,
        page: startPage,
        count: limit,
        totalCount
      }))
      .catch((err) => {
        ErrorUtils.errorCallback(err, resp)
      })
  }

  get(req, resp) {
    const id = req.params.id
    if (!id) {
      return false
    }
    const listOfValues = req.query.listOfValues ? req.query.listOfValues : false

    const repository = Utils.getEntityManager(entity, resp)
    if (!repository) {
      return
    }
    const pKey = typeof id === 'string' && isNaN(parseInt(id)) ? 'identity' : primaryKey
    repository
      .findOne({
        where: { [pKey]: id },
        raw: false
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          axel.logger.warn(err)
        }
        throw new ExtendedError({
          code: 400,
          errors: [
            {
              message: err.message || 'not_found'
            }
          ],
          message: err.message || 'not_found'
        })
      })
      .then(async (item) => {
        if (item) {
          item = item.get()
          if (axel.models[item.identity]) {
            item = AxelAdmin.mergeData(
              AxelAdmin.jsonSchemaToFrontModel(axel.models[item.identity]),
              item.config
            )
          }
          if (listOfValues) {
            item = {
              [primaryKey]: item[primaryKey],
              label: item.title || item.name || item.label || `${item.firstname} ${item.lastname}`
            }
          }
          return resp.status(200).json({
            body: item
          })
        } if (pKey === 'identity' && axel.models[pKey]) {
          await axel.models[pKey].em.create(axel.models[pKey])
          return resp.status(200).json({
            body: {
              ...axel.models[pKey],
              apiUrl: axel.models[pKey].apiUrl
            }
          })
        }
        throw new ExtendedError({
          code: 404,
          errors: [
            {
              message: 'not_found'
            }
          ],
          message: 'not_found'
        })
      })
      .catch((err) => {
        ErrorUtils.errorCallback(err, resp)
      })
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
    const id = req.params.id
    const data = req.body

    const repository = Utils.getEntityManager(entity, resp)
    if (!repository) {
      return
    }
    const pKey = typeof id === 'string' && isNaN(parseInt(id)) ? 'identity' : primaryKey
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
              message: err.message || 'not_found'
            }
          ],
          message: err.message || 'not_found'
        })
      })
      .then((result) => {
        if (result) {
          return repository.update({ config: data }, {
            where: {
              [pKey]: id
            }
          })
        }
        throw new ExtendedError({
          code: 404,
          message: 'not_found',
          errors: ['not_found']
        })
      })
      .then(() => repository.findOne({
        where: { [pKey]: id },
        raw: false
      }))
      .then((result) => {
        if (result) {
          return resp.status(200).json({
            body: result.config
          })
        }
        return resp.status(404).json({
          errors: ['not_found'],
          message: 'not_found'
        })
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          axel.logger.warn(err)
        }
        if (err && err.name === 'SequelizeValidationError') {
          resp.status(400).json({
            // @ts-ignore
            errors: err.errors && err.errors.map(e => e.message),
            message: 'sql_validation_error'
          })
          return false
        }
        ErrorUtils.errorCallback(err, resp)
      })
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
    const id = req.params.id

    const repository = Utils.getEntityManager(entity, resp)
    const pKey = typeof id === 'string' && isNaN(parseInt(id)) ? 'identity' : primaryKey
    if (!repository) {
      return
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
        })
      })
      .then((a) => {
        if (!a) {
          return resp.status(404).json()
        }
        resp.status(200).json({
          status: 'OK'
        })
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          axel.logger.warn(err)
        }
        ErrorUtils.errorCallback(err, resp)
      })
  }
}

module.exports = new AxelModelConfigController()
