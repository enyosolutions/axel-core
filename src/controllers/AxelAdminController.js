/**
 * /AxelModelConfig
 *
 * @description :: Server-side logic for managing AxelModelConfig entities
 */

const { response } = require('express');
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
const primaryKey = axel.models[entity] && axel.models[entity].primaryKeyField
  ? axel.models[entity].primaryKeyField
  : axel.config.framework.primaryKey;

class AxelAdminController {
  /**
   * @description formats and serves the app schemas for the use of axel admin
   */
  listModels(req, res) {
    AxelAdmin.serveModels(req, res);
  }

  /**
   * @description formats and serves a single schemas for the use of axel admin
   * @param model id
   */
  getModel(req, resp) {
    if (!req.body.modelId) {
      return resp.json({ message: 'missing_model_identifier' });
    }
    if (!axel.models[req.body.modelId] || !axel.models[req.body.modelId].schema) {
      return resp.json({
        message: 'unknown_model_identifier'
      });
    }
    try {
      resp.json({
        body: AxelAdmin.mergeModel(req.params.modelId, false),
      });
    } catch (err) {
      console.warn(err);
      resp.json({
        message: 'error_in_model_merging'
      });
    }
  }
}

module.exports = new AxelAdminController();
