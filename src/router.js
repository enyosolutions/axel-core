/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/**
 * Connects all the config in routes.ts to the express router.
 */
const fs = require('fs');
const _ = require('lodash');
const express = require('express');
const d = require('debug');
const { fileURLToPath } = require('url');
const path = require('path');
const serialize = require('serialize-javascript');
const { flatMap } = require('lodash');
// type VerbTypes = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head' | 'all';
const debug = d('axel:router');

/**
 * Models that will not be connected to the automatic api
 */
const forbiddenAutoConnectModels = ['axelModelConfig'];

/**
 *  @param {function} middleware function to be wrapped
 *  @param {object} route config from route.js
 *
 *
*/
function injectTargetRouteMiddleware(targetConfig) {
  return (req, res, next) => {
    if (targetConfig && !req.routeConfig) {
      req.routeConfig = targetConfig;
    }
    next();
  };
}


function wrapRoute(fn) {
  if (Array.isArray(fn)) {
    const lastMiddleware = fn[fn.length - 1];
    fn[fn.length - 1] = wrapRoute(lastMiddleware);
    return fn;
  }
  return (req, res, next) => {
    const p = fn(req, res, next);
    if (p && p.then && p.catch) {
      p.then((result) => {
        if (!res.headersSent && result !== undefined) {
          res.set('x-axel-auto-response', 1);
          if (!res.get('Content-Type') || res.get('Content-Type') === 'application/json') {
            res.json(result);
          } else {
            res.send(result);
          }
        }
        return result;
      })
        .catch(next);
    }
    return p;
  };
}

// Load policies from the policy files
function loadControllerPolicies(target, policies) {
  if (axel.config.policies) {
    let policyControllerName = '';
    if (target.controller) {
      const policyControllerNameParts = target.controller.split('/');
      policyControllerName = policyControllerNameParts[policyControllerNameParts.length - 1];
    }

    const controllerPolicies = axel.config.policies[target.controller] || axel.config.policies[policyControllerName];
    if (controllerPolicies) {
      const policy = controllerPolicies[target.action];
      if (policy) {
        const policyType = typeof policy;
        if (!['array', 'boolean', 'string'].includes(policyType) && !Array.isArray(policy)) {
          console.warn('policy', target.controller, policy);
          throw new Error(`Policy definition in config must not be ${policyType} provided`);
        }
        if (Array.isArray(policy)) {
          policies = policies.concat(policy);
        } else if (policyType === 'string') {
          policies.push(policy);
        } else if (policyType === 'boolean') {
          // remove the default security policy
          target.secure = false;
        } else {
          console.warn('warning weird policy detected', policy, policyType);
        }
      } else if (controllerPolicies['*']) {
        if (!Array.isArray(controllerPolicies['*'])) {
          throw new Error('Policy definition in config must be an array');
        }
        policies = policies.concat(controllerPolicies['*']);
      }
    }
  }

  return policies;
}

function loadRoutePolicies(target, policies = []) {
  if (target.policy && !target.policies) {
    target.policies = [target.policy];
  }


  if (target.policies && !Array.isArray(target.policies)) {
    throw new Error(`Policy should be an array (${JSON.stringify(target)})`);
  }
  policies = policies.concat(target.policies || []);
  policies = _.uniq(policies).filter(p => p && (typeof p === 'function' || typeof p === 'string'));
  // turn  string named policies into functions
  return policies;
}

function transformStringPolicies(target, policies = []) {
  return policies.map((p) => {
    if (typeof p === 'function') {
      return p;
    } if (axel.policies[p]) {
      return axel.policies[p];
    }
    throw new Error(`[ROUTER] unknown policy [${p}] => Make sure it exists in your policy folder`);
    //   axel.logger.warn('[ROUTER] unknown policy [', p, '] => Make sure it exists in your policy folder');
  });
}

function loadDefaultSecurityPolicIES(target, policies) {
  if (!target) {
    debug('Policy', policies);
    throw new Error('error_missing_policy_target');
  }

  if (axel.config.security.secureAllEndpoints && target.secure !== false) {
    if (!axel.config.security.securityPolicy) {
      axel.logger.warn('[ROUTER] missing config default security policy middleware');
    } else {
      if (!axel.policies[axel.config.security.securityPolicy]) {
        throw new Error(`Error policy [${axel.config.security.securityPolicy}] does not exists in the policy folder`);
      }
      policies.push(axel.config.security.securityPolicy);
    }
  }
  // LOADING THE * policy in policies folder
  if (axel.config.policies['*']) {
    if (Array.isArray(axel.config.policies['*'])) {
      policies = policies.concat(axel.config.policies['*']);
    } else if (_.isString(axel.config.policies['*'])
      || _.isFunction(axel.config.policies['*'])
    ) {
      policies.push(axel.config.policies['*']);
    }
  }

  return policies;
}

function connectRoute(app, source, _target) {
  let verb = 'all';
  let route;
  let target = {};
  let policies = [];
  const sourceArray = source.split(' ');
  if (typeof _target === 'string') {
    const [controller, action] = _target.split('.');
    target.controller = controller;
    target.action = action;
  } else {
    target = _target;
    if (target.controller) {
      target.controller = `${target.controller}${_.endsWith(target.controller, 'Controller') ? '' : 'Controller'}`;
    }
  }
  if (sourceArray.length === 2) {
    verb = sourceArray[0].toLowerCase();
    route = sourceArray[1];
  } else {
    route = sourceArray[0];
  }
  policies = loadDefaultSecurityPolicIES(target, policies);
  policies = loadControllerPolicies(target, policies);
  policies = loadRoutePolicies(target, policies);

  const routePolicies = transformStringPolicies(target, policies);

  if (typeof target === 'function') {
    app[verb](source, injectTargetRouteMiddleware({}), wrapRoute(target));
    return Promise.resolve();
  }
  if (target && target.use && typeof target.use === 'function') {
    app.use(source, injectTargetRouteMiddleware(target), routePolicies, wrapRoute(target.use));
    return Promise.resolve(app);
  }
  if (target.view) {
    app[verb](
      route,
      injectTargetRouteMiddleware(target),
      routePolicies,
      wrapRoute((req, res) => res.render(target.view, {
        axel,
      }), target)
    );
    return Promise.resolve();
  }
  // Replace aliased routes
  const controllerRoute = target.controller && target.controller[0] === '@'
    ? `${__dirname}${target.controller.replace('@axel', '').replace('@app', '..')}.js`
    : `${process.cwd()}/src/api/controllers/${target.controller}.js`;
  axel.logger.trace('[ROUTING] connecting route', route, verb.toUpperCase(), {
    ...target,
    controllerRoute,
  });

  const controller = axel.controllers[target.controller]
    ? axel.controllers[target.controller]
    : require(`${path.resolve(controllerRoute)}`);
  Promise.resolve(controller)
    .then((c) => {
      axel.controllers[target.controller] = c;
      if (c[target.action]) {
        try {
          app[verb](route, injectTargetRouteMiddleware(target), routePolicies, wrapRoute(c[target.action], target));
        } catch (e) {
          console.error('[ROUTING]', target.controller, target.action, e.message);
        }
      } else {
        axel.logger.warn('[ROUTING] missing Action for', controllerRoute, target.policies, target.action, target.route);
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


  return function modelMiddleware(req, res, next) {
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
        message:
          'this api model has automatic api disabled. Add `automaticApi: true` '
          + 'in the schema definition to enable it OR set the correct `apiUrl` in '
          + `src/api/models/schema/${endpoint}`,
      });
      return;
    }
    if (!req.params) {
      req.params = {};
    }
    req.params.endpoint = endpoint;
    req.endpoint = endpoint;
    req.modelName = endpoint;
    next();
  };
};

function injectAxelAdminConfig() {
  debug('injectAxelAdminConfig');
  if (!axel.config.framework || !axel.config.framework.axelAdmin || !axel.config.framework.axelAdmin.enabled) {
    debug('[AXEL ADMIN] axel admin is disabled. not mounting admin apis');
    return;
  }

  axel.config.routes['GET /api/axel-admin/models'] = '@axel/controllers/AxelAdminController.listModels';
  // axel.config.routes['GET /api/axel-admin/models/:id'] = '@axel/controllers/AxelAdminController.getModel';
  axel.config.routes['GET /api/axel-admin/models/:id'] = '@axel/controllers/AxelModelConfigController.get';

  if (axel.config.framework.axelAdmin && axel.config.framework.axelAdmin.editableModels) {
    axel.config.routes['GET /api/axel-admin/axel-model-config'] = '@axel/controllers/AxelModelConfigController.list';
    axel.config.routes['GET /api/axel-admin/axel-model-config/:id'] = '@axel/controllers/AxelModelConfigController.get';
    axel.config.routes['PUT /api/axel-admin/axel-model-config/:id'] = '@axel/controllers/AxelModelConfigController.put';
    axel.config.routes['DELETE /api/axel-admin/axel-model-config/:id'] = '@axel/controllers/AxelModelConfigController.delete';

    axel.config.routes['GET /api/axel-admin/axel-model-field-config'] = '@axel/controllers/AxelModelFieldConfigController.list';
    axel.config.routes['GET /api/axel-admin/axel-model-field-config/:id'] = '@axel/controllers/AxelModelFieldConfigController.get';
    axel.config.routes['POST /api/axel-admin/axel-model-field-config'] = '@axel/controllers/AxelModelFieldConfigController.post';
    axel.config.routes['PUT /api/axel-admin/axel-model-field-config/:id'] = '@axel/controllers/AxelModelFieldConfigController.put';
    axel.config.routes['DELETE /api/axel-admin/axel-model-field-config/:id'] = '@axel/controllers/AxelModelFieldConfigController.delete';
  }
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
      action: 'exportData',
    },
    'GET {routeUrl}/get-import-template': {
      controller: '@axel/controllers/CrudSqlController',
      action: 'getImportTemplate',
    },
    'POST {routeUrl}/import': {
      controller: '@axel/controllers/CrudSqlController',
      action: 'importData',
    },
    'GET {routeUrl}': { controller: '@axel/controllers/CrudSqlController', action: 'findAll' },
    'GET {routeUrl}/:id': { controller: '@axel/controllers/CrudSqlController', action: 'findOne' },
    'POST {routeUrl}': { controller: '@axel/controllers/CrudSqlController', action: 'create' },
    'PUT {routeUrl}/:id': { controller: '@axel/controllers/CrudSqlController', action: 'update' },
    'DELETE {routeUrl}/:id': {
      controller: '@axel/controllers/CrudSqlController',
      action: 'deleteOne',
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
      && forbiddenAutoConnectModels.indexOf(key) === -1
    ) {
      model.apiUrl = routeUrl;
      const routePolicies = [loadEndpointMiddleware(model.identity)];
      if (axel.config.security && axel.config.security.automaticApiSecurityPolicy) {
        const policyName = axel.config.security.automaticApiSecurityPolicy;
        if (!axel.policies[policyName]) {
          throw new Error(`error_missing_policy_${policyName}`);
        }
        routePolicies.push(axel.policies[policyName]);
      }

      Object.keys(crudRoutes).forEach((route) => {
        const localRoute = route.replace('{routeUrl}', routeUrl);
        if (!axel.config.routes[localRoute]) {
          // Todo turn this into an array to support next function loading
          axel.config.routes[localRoute] = {
            ...crudRoutes[route],
            policies: routePolicies, // @todo cache the middleware for better perf
          };
        } else {
          debug('[ROUTING][automaticApi] Route', localRoute, 'is already defined');
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
  Object.entries(axel.config.routes).map(([route, config]) => connectRoute(app, route, config));

  app.use(express.static(`${app.get('appPath')}/public`));
  app.use(express.static(`${app.get('appPath')}/assets`));
}

module.exports = router;
module.exports.router = router;
