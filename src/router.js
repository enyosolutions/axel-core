/**
 * Connects all the config in routes.ts to the express router.
 */
import fs, { createWriteStream } from 'fs';
import _ from 'lodash';
import express from 'express';
import d from 'debug'
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// type VerbTypes = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head' | 'all';
const debug = d('axel:router');

async function connectRoute(app, source, _target) {
  let verb = 'all';
  let route;
  let policies = [];
  let target = {};
  const _source = source.split(' ');
  if (typeof _target === 'string') {
    const [controller, action] = _target.split('.');
    target.controller = controller;
    target.action = action;
  } else {
    target = _target;
    if (target.controller) {
      target.controller = `${target.controller}${_.endsWith(target.controller, 'Controller') ? '' : 'Controller'
        }`;
    }
  }
  if (_source.length === 2) {
    verb = _source[0].toLowerCase();
    route = _source[1];
  } else {
    route = _source[0];
  }
  debug('connecting route', _source);
  // load security policy if enabled, unless its disabled specifically or that route.
  if (axel.config.security.secureAllEndpoints && target.secure !== false) {
    if (!axel.config.security.securityPolicy) {
      axel.logger.warn('[ROUTER] missing config default security policy middleware');
    } else {
      if (!axel.policies[axel.config.security.securityPolicy]) {
        throw new Error(
          `Error policy ${axel.config.security.securityPolicy} is does not exists in the policy folder`,
        );
      }
      policies.push(axel.config.security.securityPolicy);
    }
  }

  // Load policies from the policy files
  if (axel.config.policies && axel.config.policies[target.controller]) {
    if (axel.config.policies[target.controller][target.action]) {
      if (!Array.isArray(axel.config.policies[target.controller][target.action])) {
        throw new Error('Policy definition in config must be an array');
      }
      policies = policies.concat(axel.config.policies[target.controller][target.action]);
    } else if (axel.config.policies[target.controller]['*']) {
      if (!Array.isArray(axel.config.policies[target.controller]['*'])) {
        throw new Error('Policy definition in config must be an array');
      }
      policies = policies.concat(axel.config.policies[target.controller]['*']);
    }
  }

  // Finally load route policies.
  policies = policies.concat(target.policies || []);
  policies = _.uniq(policies);
  // turn  string named policies into functions
  const routePolicies = policies.map(p => (typeof p === 'function' ? p : axel.policies[p]));

  // if route is mapped to a function link it directly
  if (typeof target === 'function') {
    app[verb](source, target);
    return Promise.resolve();
  }

  if (target && target.use && typeof target.use === 'function') {
    app.use(source, routePolicies, target.use);
    return Promise.resolve(app);
  }

  if (target.view) {
    app[verb](route, routePolicies, (req, res) => {
      res.render(target.view, {
        axel,
      });
    });
    return Promise.resolve();
  }

  if (!target.controller) {
    console.warn('target.controller', target);
  }

  // Replace aliased routes
  let controllerRoute =
    target.controller[0] === '@'
      ? `${__dirname}${target.controller.replace('@axel', '').replace('@app', '..')}.js`
      : `${process.cwd()}/src/api/controllers/${target.controller}.js`;
  axel.logger.trace('[ROUTING] connecting route', route, verb.toUpperCase(), {
    ...target,
    controllerRoute,
  });

  // controllerRoute = controllerRoute.replace(/\\\\/g, '/');

  const prom = axel.controllers[target.controller]
    ? Promise.resolve(axel.controllers[target.controller])
    : import(`file://${path.resolve(controllerRoute)}`);
  prom
    .then(c => {
      if (c && c.default) {
        c = c.default;
      }
      axel.controllers[target.controller] = c;
      if (c[target.action]) {
        app[verb](route, routePolicies, c[target.action]);
      } else {
        axel.logger.warn(
          '[ROUTING] missing Action for',
          controllerRoute,
          target.policies,
          target.action,
          target.route,
        );
      }
    })
    .catch((err) => {
      axel.logger.warn('[ROUTING] Error while loading', controllerRoute, err.message, err);
      throw err;
      process.exit(-1);
    });
  return prom;
}

function loadPolicies() {
  return new Promise((resolve, reject) => {
    const folder = `${process.cwd()}/src/api/policies`;
    fs.readdir(folder, (err, files) => {
      if (err) {
        return reject(err);
      }
      const promises = files
        .filter(file => _.endsWith(file, '.ts') || _.endsWith(file, '.js'))
        .map(file => {
          return import(`file://${folder}/${file}`).then(func => {
            axel.policies[file.split('.')[0]] = func.default || func;
          });
        });
      Promise.all(promises)
        .then(resolve)
        .catch(reject);
    });
  });
}

const loadEndpointMiddleware = (endpoint) => {
  debug('loadEndpointMiddleware', endpoint);
  if (!endpoint) {
    throw new Error('endpoint_not_provided');
  }

  return (req, res, next) => {
    if (!axel.config.framework.automaticApi) {
      res.status(403).json({ message: 'automatic_api_disabled' });
      return;
    }
    if (!axel.config.framework.automaticApiBlacklistedModels) {
      res.status(403).json({ message: 'cant_have_automatic_api_without_blacklist_configured' });
      return;
    }
    if (axel.config.framework.automaticApiBlacklistedModels.indexOf(endpoint) > -1) {
      res.status(403).json({ message: 'model_blacklisted_from_automatic_api' });
      return;
    }

    if (!axel.models[endpoint]) {
      axel.logger.trace('[ROUTING]  MODEL ' + `${endpoint} does not exists`);
      return;
    }
    req.params.endpoint = endpoint;
    next();
  };
};

function injectAxelAdminConfig() {
  debug('injectAxelAdminConfig');
  if (!axel.config.framework || !axel.config.framework.axelAdmin) {
    return;
  }
  axel.config.routes['GET /api/automatic/axel-models-config'] = '@axel/controllers/AxelModelConfigController.list';
  axel.config.routes['GET /api/automatic/axel-models-config/:id'] = '@axel/controllers/AxelModelConfigController.get';
  axel.config.routes['PUT /api/automatic/axel-models-config/:id'] =
    '@axel/controllers/AxelModelConfigController.put';
  axel.config.routes['DELETE /api/automatic/axel-model-config/:id'] =
    '@axel/controllers/AxelModelConfigController.delete';
  axel.config.routes['GET /api/axel-admin/models'] = '@axel/controllers/AxelAdminController.models';
}

function injectCrudRoutesConfig() {
  debug('injectCrudRoutesConfig');
  if (!axel.config.framework || !axel.config.framework.automaticApi) {
    return;
  }

  // axel.controllers['@axel/controllers/CrudSqlController'] = CrudSqlController;

  const crudRoutes = {
    'GET {routeUrl}/stats': {
      controller: '@axel/controllers/CrudSqlController',
      action: 'stats',
    },
    'GET {routeUrl}/export': {
      controller: '@axel/controllers/CrudSqlController',
      action: 'export',
    },
    'GET {routeUrl}/get-import-template': {
      controller: '@axel/controllers/CrudSqlController',
      action: 'getImportTemplate',
    },
    'POST {routeUrl}/import': {
      controller: '@axel/controllers/CrudSqlController',
      action: 'import',
    },
    'GET {routeUrl}': { controller: '@axel/controllers/CrudSqlController', action: 'list' },
    'GET {routeUrl}/:id': { controller: '@axel/controllers/CrudSqlController', action: 'get' },
    'POST {routeUrl}': { controller: '@axel/controllers/CrudSqlController', action: 'post' },
    'PUT {routeUrl}/:id': { controller: '@axel/controllers/CrudSqlController', action: 'put' },
    'DELETE {routeUrl}/:id': {
      controller: '@axel/controllers/CrudSqlController',
      action: 'delete',
    },
  };
  Object.keys(axel.models).forEach(key => {
    const model = axel.models[key];
    let routeUrl = model.url || model.identity;
    routeUrl = `${axel.config.framework.automaticApiPrefix || ''}/${routeUrl}`;
    routeUrl = routeUrl.replace(/\/\//g, '/');
    axel.logger.trace('[ROUTING] WIRING', model.identity, routeUrl);
    if (axel.config.framework.automaticApiBlacklistedModels.indexOf(key) === -1) {
      model.apiUrl = routeUrl;
      Object.keys(crudRoutes).forEach(route => {
        const localRoute = route.replace('{routeUrl}', routeUrl);
        if (!axel.config.routes[localRoute]) {
          // Todo turn this into an array to support next function loading
          axel.config.routes[localRoute] = {
            ...crudRoutes[route],
            policies: [loadEndpointMiddleware(model.identity)], // @todo cache the middleware for better perf
          };
        }
      });
    } else {
      axel.logger.trace('[ROUTING] SKIPPING MODEL ' + `${model.identity} because it's blacklisted`);
    }
  });
}

export function router(app) {
  debug('connecting router');
  if (!axel.config.routes) {
    axel.config.routes = {}
  }
  return loadPolicies()
    .then(injectAxelAdminConfig)
    .then(injectCrudRoutesConfig)
    .then(() => {
      const promises = Object.entries(axel.config.routes).map(entry => {
        return connectRoute(app, entry[0], entry[1]);
      });

      app.use(express.static(`${app.get('appPath')}/public`));
      app.use(express.static(`${app.get('appPath')}/assets`));
      return Promise.all(promises);
    })
    .catch((err) => {
      throw err;
    });
}

export default router;