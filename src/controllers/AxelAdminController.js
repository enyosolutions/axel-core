/**
 * /AxelModelConfig
 *
 * @description :: Server-side logic for managing AxelModelConfig entities
 */

const AxelModelsService = require('../services/AxelModelsService.js'); // adjust path as needed
const { execHook } = require('../services/ControllerUtils.js');

const entity = 'axelModelConfig';

class AxelAdminController {
  /**
   * @description formats and serves the app schemas for the use of axel admin
   */
  async listModels(req, res, next) {
    try {
      await execHook('axelModelConfig', 'beforeApiFind', { request: req, sequelizeQuery: {} });
      const models = await AxelModelsService.serveModels();
      await execHook('axelModelConfig', 'afterApiFind', { request: req, sequelizeQuery: {} });
      return res.json({
        body: models
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * @description formats and serves a single schemas for the use of axel admin
   * @param model id
   */
  async getModel(req, resp) {
    if (!req.params.id) {
      return resp.json({ message: 'missing_model_identifier' });
    }
    if (!axel.models[req.params.id] || !axel.models[req.params.id].schema) {
      return resp.json({
        message: 'unknown_model_identifier'
      });
    }
    try {
      await execHook('axelModelConfig', 'beforeApiFindOne', { request: req, sequelizeQuery: {} });
      const body = AxelModelsService.mergeModel(req.params.id, false);
      await execHook('axelModelConfig', 'afterApiFindOne', { request: req, sequelizeQuery: {} });
      resp.json({
        body
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
