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
      await execHook('axelModelConfig', 'beforeApiFind', { request: req, sequelizeQuery: {}, response: res });
      let models = [];
      // if list of values is requested, we only return the identity, name, namePlural, title, primaryKeyField and displayField
      if (req.query.listOfValues) {
        models = Object.values(axel.models).map(model => ({
          identity: model.identity,
          name: model.admin && model.admin.name,
          namePlural: model.admin && model.admin.namePlural,
          title: model.admin && model.admin.title,
          primaryKeyField: model.primaryKeyField,
          displayField: model.displayField,
        }));
      } else {
        models = await AxelModelsService.serveModels(req); // req is needed to get the locale
      }
      const totalCount = models.length;
      // use pagnination to limit the number of results
      if (req.query.perPage) {
        let page = req.query.page ? parseInt(req.query.page) : 1;
        page = page < 1 ? 1 : page;
        const perPage = req.query.perPage ? parseInt(req.query.perPage) : 1000;
        models = models.slice(perPage * (page - 1), perPage * page);
      }
      const results = {
        body: models,
        totalCount,
      };
      await execHook('axelModelConfig', 'afterApiFind', results, { request: req, sequelizeQuery: {}, response: res });
      return res.json(results);
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
      const body = await AxelModelsService.serveModel(req.params.id, req.locale);
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
