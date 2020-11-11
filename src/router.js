/**
 * Connects all the config in routes.ts to the express router.
 */
const fs = require('fs');
const _ = require('lodash');
const express = require('express');
const d = require('debug');
const { fileURLToPath } = require('url');
const path = require('path');

// type VerbTypes = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head' | 'all';
const debug = d('axel:router');

/**
 * Models that will not be connected to the automatic api
 */
const forbiddenAutoConnectModels = ['axelModelConfig'];


function connectRoute(app, source, _target) {
  let verb = 'all';
  let route;
  let policies = [];
  let target = {};
  const sourceArray = source.split(' ');
  if (typeof _target === 'string') {
    const [controller, action] = _target.split('.');
    target.controller = controller;
    target.action = action;
  } else {
    target = _target;
    if (target.controller) {
      target.controller = `${target.controller}${_.endsWith(target.controller, 'Controller')
        ? '' : 'Controller'
        }`;
    }
  }
  if (sourceArray.length === 2) {
    verb = sourceArray[0].toLowerCase();
    route = sourceArray[1];
  } else {
    route = sourceArray[0];
  }
  debug('connecting route', sourceArray);
  debug('axel.policies', axel.policies);
  // load security policy if enabled, unless its disabled specifically or that route.
  if (axel.config.security.secureAllEndpoints && target.secure !== false) {
    if (!axel.config.security.securityPolicy) {
      axel.logger.warn('[ROUTER] missing config default security policy middleware');
    } else {
      if (!axel.policies[axel.config.security.securityPolicy]) {
        throw new Error(
          `Error policy [${axel.config.security.securityPolicy}] does not exists in the policy folder`,
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
  const controllerRoute = target.controller[0] === '@'
    ? `${__dirname}${target.controller.replace('@axel', '').replace('@app', '..')}.js`
    : `${process.cwd()}/src/api/controllers/${target.controller}.js`;
  axel.logger.trace('[ROUTING] connecting route', route, verb.toUpperCase(), {
    ...target,
    controllerRoute,
  });

  // controllerRoute = controllerRoute.replace(/\\\\/g, '/');


  const controller = axel.controllers[target.controller]
    ? axel.controllers[target.controller]
    // eslint-disable-next-line
    : require(`${path.resolve(controllerRoute)}`);
  Promise.resolve(controller)
    .then((c) => {
      axel.controllers[target.controller] = c;
      if (c[target.action]) {
        app[verb](route, routePolicies, c[target.action]);
        debug('[ROUTING] connected', route, target.controller, target.action);
      } else {
        axel.logger.warn(
          '[ROUTING] missing Action for',
          controllerRoute,
          target.policies,
          target.action,
          target.route,
        );
      }
      return true;
    })
    .catch((err) => {
      axel.logger.warn('[ROUTING] Error while loading', controllerRoute, err.message, err);
      throw err;
    });
}

function loadPolicies() {
  const folder = `${process.cwd()}/src/api/policies`;
  const files = fs.readdirSync(folder);

  files
    .filter(file => _.endsWith(file, '.ts') || _.endsWith(file, '.js'))
    .forEach((file) => {
      // eslint-disable-next-line
      const func = require(`${folder}/${file}`);
      axel.policies[file.split('.')[0]] = func;
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

    if (!axel.models[endpoint]) {
      axel.logger.trace(`[ROUTING] MODEL ${endpoint} does not exists`);
      return;
    }

    if (!axel.models[endpoint].automaticApi) {
      res.status(403).json({
        errors: ['model_blacklisted_from_automatic_api'],
        message: 'this api has automatic api disabled. Add `automaticApi: true` in the schema definition to enable it'
      });
      return;
    }

    req.params.endpoint = endpoint;
    next();
  };
};

function injectAxelAdminConfig() {
  debug('injectAxelAdminConfig');
  if (!axel.config.framework || !axel.config.framework.axelAdmin) {
    debug('[AXEL ADMIN] axel admin is disabled. not mounting admin apis');
    return;
  }

  axel.config.routes['GET /api/axel-admin/axel-model-config'] = '@axel/controllers/AxelModelConfigController.list';
  axel.config.routes['GET /api/axel-admin/axel-model-config/:id'] = '@axel/controllers/AxelModelConfigController.get';
  axel.config.routes['PUT /api/axel-admin/axel-model-config/:id'] = '@axel/controllers/AxelModelConfigController.put';
  axel.config.routes['DELETE /api/axel-admin/axel-model-config/:id'] = '@axel/controllers/AxelModelConfigController.delete';


  axel.config.routes['GET /api/axel-admin/axel-model-field-config'] = '@axel/controllers/AxelModelFieldConfigController.list';
  axel.config.routes['GET /api/axel-admin/axel-model-field-config/:id'] = '@axel/controllers/AxelModelFieldConfigController.get';
  axel.config.routes['PUT /api/axel-admin/axel-model-field-config/:id'] = '@axel/controllers/AxelModelFieldConfigController.put';
  axel.config.routes['DELETE /api/axel-admin/axel-model-field-config/:id'] = '@axel/controllers/AxelModelFieldConfigController.delete';

  axel.config.routes['GET /api/axel-admin/models'] = '@axel/controllers/AxelAdminController.listModels';
  axel.config.routes['GET /api/axel-admin/models/:modelId'] = '@axel/controllers/AxelAdminController.getModel';
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
  Object.keys(axel.models).forEach((key) => {
    const model = axel.models[key];
    let routeUrl = model.apiUrl;

    if (!routeUrl) {
      routeUrl = `${axel.config.framework.automaticApiPrefix || ''}/${model.identity}`;
      routeUrl = routeUrl.replace(/\/\//g, '/');
    }
    axel.logger.trace('[ROUTING] WIRING', model.identity, routeUrl);
    debug('[ROUTING] WIRING', model.identity, routeUrl);
    if (
      axel.config.framework.automaticApi
      && (axel.models[key].automaticApi || process.env.NODE_ENV !== 'production')
      // allow this in dev environment to help with debugging  where needed
      && forbiddenAutoConnectModels.indexOf(key) === -1) {
      model.apiUrl = routeUrl;
      Object.keys(crudRoutes).forEach((route) => {
        const localRoute = route.replace('{routeUrl}', routeUrl);
        if (!axel.config.routes[localRoute]) {
          // Todo turn this into an array to support next function loading
          axel.config.routes[localRoute] = {
            ...crudRoutes[route],
            policies: [loadEndpointMiddleware(model.identity)], // @todo cache the middleware for better perf
          };
        } else {
          debug('Route', localRoute, 'is already defined');
        }
      });
    } else {
      debug(`[ROUTING] SKIPPING MODEL ${model.identity} because it's blacklisted`);
    }
  });
}

function router(app) {
  debug('connecting router');
  if (!axel.config.routes) {
    axel.config.routes = {};
  }
  loadPolicies();
  injectAxelAdminConfig();
  injectCrudRoutesConfig();
  Object.entries(axel.config.routes).map(entry => connectRoute(app, entry[0], entry[1]));

  app.use(express.static(`${app.get('appPath')}/public`));
  app.use(express.static(`${app.get('appPath')}/assets`));
}

module.exports = router;
module.exports.router = router;
