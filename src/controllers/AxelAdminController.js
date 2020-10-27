/**
 * /AxelModelConfig
 *
 * @description :: Server-side logic for managing AxelModelConfig entities
 */

const _ = require('lodash');
const AxelAdmin = require('../services/AxelAdmin.js'); // adjust path as needed
/*
Uncomment if you need the following features:
- Create import template for users
- Import from excel
- Export to excel
*/

// const DocumentManager =  require('../../services/DocumentManager');
// const ExcelService =  require('../../services/ExcelService');

const entity = 'axelModelConfig';
const primaryKey =
  axel.models[entity] && axel.models[entity].primaryKeyField
    ? axel.models[entity].primaryKeyField
    : axel.config.framework.primaryKey;

class AxelAdminController {
  /**
   * @param  {[type]}
   * @param  {[type]}
   * @return {[type]}
   */
  models(req, res) {
    AxelAdmin.serveModels(req, res);
  }
}

module.exports = new AxelAdminController();
