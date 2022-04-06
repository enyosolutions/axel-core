/**
 * /AxelModelConfig
 *
 * @description :: Server-side logic for managing AxelModelConfig entities
 */

const AxelAdmin = require('../services/AxelAdmin.js'); // adjust path as needed

const entity = 'axelModelConfig';

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
    if (!req.params.id) {
      return resp.json({ message: 'missing_model_identifier' });
    }
    if (!axel.models[req.params.id] || !axel.models[req.params.id].schema) {
      return resp.json({
        message: 'unknown_model_identifier'
      });
    }
    try {
      resp.json({
        body: AxelAdmin.mergeModel(req.params.id, false)
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
