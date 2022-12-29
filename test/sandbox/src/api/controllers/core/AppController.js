/**
 *
 * @description :: Server-side logic for managing apps
 * @help        :: See http://Appjs.org/#!/documentation/concepts/Controllers
 * AppController
 */
const path = require('path');
const yaml = require('js-yaml');
const swaggerJSDoc = require('swagger-jsdoc');
const { Utils, ErrorUtils } = require('axel-core');
const { response } = require('express');
const SwaggerService = require('../../services/common/SwaggerService');

const swaggerSpec = swaggerJSDoc(axel.config.swagger);
SwaggerService.generateModels(swaggerSpec);
/** Class Basic controller of the instance */
class AppController {
  /**
   * @description Get the status of the app, along with the current api versions.
   * `AppController.status()`
   */
  status(req, res) {
    res.json({
      status: 'OK',
    });
  }

  index(req, res) {
    console.log('NODE_ENV', process.env.NODE_ENV);
    if (process.env.NODE_ENV === 'development') {
      return res.sendFile(`${process.cwd()}/public/admin-panel.html`);
    }
    res.render('home');
  }

  /**
   *
   * @param  {[type]}
   * @param  {[type]}
   * @return {[type]}
   */
  ok(req, res) {
    res.status(204);
  }

  debug(req, res) {
    res.json({ status: new Date(), axel });
  }

  /**
   *
   *
   * @param {Request} req
   * @param {Response} res
   * @memberof AppController
   */
  swaggerJson(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  }

  /**
   *
   *
   * @param {Request} req
   * @param {Response} res
   * @memberof AppController
   */
  async statistics(req, res) {
    const promises = [];
    const results = {};
    Object.keys(axel.models).filter(idx => axel.models[idx].em).forEach((idx) => {
      const p = axel.models[idx].em.count().then((c) => {
        results[idx] = c;
      });
      promises.push(p);
    });
    Promise.all(promises)
      .then(() => (res.json({ body: results })))
      .catch(err => ErrorUtils.errorCallback(err, res));
  }

  /**
   *
   * @description get the swagger definition of the api in yaml
   * @param {Request} req
   * @param {Response} res
   * @memberof AppController
   */
  swaggerYml(req, res) {
    res.setHeader('Content-Type', 'text/plain');
    res.send(yaml.dump(swaggerSpec));
  }

  app(req, res) {
    try {
      res.sendFile(path.resolve(process.cwd(), '../admin/dist/index.html'));
    } catch (e) {
      console.error(e);
      res.status(500).json({
        errors: ['not_found'],
        message: 'not_found',
      });
    }
  }
}

module.exports = new AppController();
