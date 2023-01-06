const _ = require('lodash');
const socketIO = require('socket.io');
const { resolve } = require('path');
const debug = require('debug')('axel:manager');
const AuthService = require('./AuthService');
const axel = require('../axel');
const wsModel = require('./ws/wsModel');
const wsController = require('./ws/wsController');
const { loadSqlModel, loadSchemaModel } = require('../models');
const AuthController = require('../controllers/AuthController');
const CrudSqlController = require('../controllers/CrudSqlController');
const SchemaValidator = require('./SchemaValidator');

const userModelName = _.get(
  axel,
  'config.plugins.admin.config.userModelName',
  'user'
);

/**
 * Contains all the code necessary for bootstrapping the Axel AdminPanel page.
 *
 * @class AxelAdminPanelManager
 */
class AxelAdminPanelManager {
  constructor() {
    this.initialized = false;
  }

  /**
   *
   *
   * @param {Application} app
   * @returns {Promise<any>}
   * @memberof AxelAdminPanelManager
   */
  init(app) {
    try {
      if (!axel.sqldb) {
        return 'missing_sqldb';
      }
      if (this.initialized) {
        console.warn(
          'AxelAdminPanelManager already initialized. Please remove initialization from your bootstrap.js'
        );
        return;
      }
      this.initialized = true;
      this.injectExpressRoutes(app);

      const axelModelConfig = loadSchemaModel(
        `${__dirname}/../models/schema/AxelModelConfig.js`
      );
      const axelModelFieldConfig = loadSchemaModel(
        `${__dirname}/../models/schema/AxelModelFieldConfig.js`
      );

      SchemaValidator.loadSchema(axelModelConfig);
      SchemaValidator.loadSchema(axelModelFieldConfig);
      // load the axel admin user model.
      // loadSchemaModel(`${__dirname}/../models/schema/axelUser.js`);
      // @TODO REPLACE by framework field allowing to choose which model (identity) to use for the user model.
      // const axelUser = loadSqlModel(`${__dirname}/../models/sequelize/AxelUser.js`, axel.sqldb);
      // axelUser.em.options.logging = false;
      // axelUser.em.logging = false;

      // SchemaValidator.loadSchema(axelUser);
      // axel.models.axelUser.em.sync();
    } catch (err) {
      console.warn('[ADMIN PANEL][WARNING]', err.message);
    }
    debug('\n\n\n');
    debug('[ADMIN PANEL] WS is opening');
    const io = socketIO(app.locals.server, { path: '/axel-admin-ws' });
    app.locals.io = io;
    // https://socket.io/docs/v4/listening-to-events/#socketonanylistener
    io.on('connect', this.wsPublicRouting.bind(this));
  }

  /**
   * Inject the reoutes for express admin
   *
   * @param {*} app
   * @memberof AxelAdminPanelManager
   */
  injectExpressRoutes(app) {
    const adminConfig = _.get(axel, 'config.plugins.admin.config');
    app.use(['/admin-panel'], (req, res) => {
      try {
        res.sendFile(
          adminConfig && adminConfig.location
            ? adminConfig.location
            : resolve(__dirname, '../../admin-panel/dist/index.html')
        );
      } catch (e) {
        console.error(e.message);
        res.status(500).json({
          errors: ['not_found'],
          message: 'not_found',
        });
      }
    });
    app.get(
      '/api/axel-admin/auth/user',
      AuthService.tokenDecryptMiddleware,
      this.checkUserMiddleware,
      (req, res) => {
        res.json({ user: req.user });
      }
    );
    app.use(
      '/api/axel-admin/crud',
      AuthService.tokenDecryptMiddleware,
      this.checkUserMiddleware
    );
    app.get('/api/axel-admin/crud/:endpoint', CrudSqlController.findAll);
    app.post('/api/axel-admin/crud/:endpoint', CrudSqlController.create);
    app.get('/api/axel-admin/crud/:endpoint/:id', CrudSqlController.findOne);
    app.put('/api/axel-admin/crud/:endpoint/:id', CrudSqlController.update);
    app.delete(
      '/api/axel-admin/crud/:endpoint/:id',
      CrudSqlController.deleteOne
    );

    app.get(
      '/api/axel-admin/status',
      AuthService.tokenDecryptMiddleware,
      async (req, res) => {
        const userExists = await axel.models[userModelName].em.count();
        res.json({
          NODE_ENV: process.env.NODE_ENV,
          env: axel.config.env || process.env.NODE_ENV,
          firstUser: !userExists,
          appName: axel.config.appName,
          primaryColor: axel.config.framework.primaryColor,
          secondaryColor: axel.config.framework.secondaryColor,
          app: axel.config.app,
          framework: axel.config.framework,
          adminConfig: _.get(axel, 'config.plugins.admin.config', {}),
        });
      }
    );
  }

  async checkUserMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: 'user_not_set' });
    }
    const user = await axel.models[userModelName].em.findOne({
      where: { id: req.user.id, email: req.user.email },
      attributes: ['id', 'email', 'firstName', 'lastName'],
    });
    if (!user) {
      return res.status(404).json({ message: 'user_not_found' });
    }
    req.user = user;
    next();
  }

  getModelFromUrl(url) {
    // todo remove id
    const model = Object.values(axel.models).find(m => m.apiUrl === url);

    return model;
  }

  /**
   * inject public routes that should be available all the time
   *
   * @param {*} socket
   * @memberof AxelAdminPanelManager
   */
  wsPublicRouting(socket) {
    debug('[ADMIN PANEL] WS client connected', socket.id);
    const self = this;
    socket.on('Authorization', (data, cb) => {
      if (!data) {
        if (cb) {
          return cb('no_authorization_header_found');
        }
        return;
      }
      socket.Authorization = data;
      if (!socket.Authorization) {
        console.warn('socket.Authorization', socket.Authorization);
      }
      AuthService.verify(
        socket.Authorization.token,
        async (err, decryptedToken) => {
          if (!err) {
            const user = await axel.models[userModelName].em.findOne({
              where: { id: decryptedToken.id, email: decryptedToken.email },
            });

            if (!user) {
              return cb('No user found');
            }

            socket.user = _.pick(user, [
              'id',
              'firstName',
              'lastName',
              'username',
              'role',
            ]);
            debug('joining', `user:${user.id}`);
            socket.join(`user:${user.id}`);
            self.wsProtectedRouting(socket);
          }
          if (cb) {
            cb(err, socket.User);
          }
        }
      );
    });

    /** Get models definition */
    socket.on(
      '/axel-admin/auth/user',
      (req = { method: 'GET', query: {}, body: {} }, cb) => {
        if (typeof req === 'function') {
          cb = req;
        }
        switch (req.method) {
          case 'GET':
            AuthService.verify(
              req.headers.authorization,
              async (err, decryptedToken) => {
                if (err) {
                  return cb(err);
                }
                try {
                  const response = { status: 200 };
                  const user = await axel.models[userModelName].em.findByPk(
                    decryptedToken.id
                  );
                  if (!user) {
                    return cb('user_not_found');
                  }
                  socket.user = _.pick(user, [
                    'id',
                    'firstName',
                    'lastName',
                    'username',
                    'role',
                  ]);
                  req.user = socket.user;
                  debug('joining', `user:${user.id}`, socket.user);
                  debug('joining', `user:${user.id}`);
                  socket.join(`user:${user.id}`);
                  self.wsProtectedRouting(socket);
                  cb(null, { user: socket.user });
                  debug(
                    '[ADMIN PANEL] WS client connected',
                    socket.id,
                    socket.user.username
                  );
                } catch (err2) {
                  cb(err2.message);
                }
              }
            );

            break;
          default:
            break;
        }
      }
    );
  }

  /**
   * inject routes that should be available only when the user is connected
   *
   * @param {*} socket
   * @memberof AxelAdminPanelManager
   */
  wsProtectedRouting(socket) {
    debug('[ADMIN PANEL] WS protected routes', socket.id, socket.user.username);

    wsModel(socket);
    wsController(socket);

    /** Get models definition */
    socket.onAny(
      async (eventName, req = { method: 'GET', query: {}, body: {} }, cb) => {
        if (typeof req === 'function') {
          cb = req;
        }
        const model = Object.values(axel.models).find(
          m => m.apiUrl === eventName
        );
        if (!model) {
          return;
        }
        switch (req.method) {
          case 'GET':
            try {
              const data = await model.em.findAll({ limit: 10 });
              cb(null, { data: { body: data } });
            } catch (err) {
              cb(err.message);
            }
            break;
          default:
            break;
        }
      }
    );

    socket.on(
      '/admin-panel/restart-app',
      (req = { method: 'GET', query: {}, body: {} }, cb) => {
        if (typeof req === 'function') {
          cb = req;
        }
        switch (req.method) {
          default:
          case 'POST':
            try {
              process.kill(process.pid, 'SIGUSR2');
              cb(null, {
                body: 'ok',
              });
            } catch (err) {
              process.kill(process.pid, 'SIGTERM');
              cb(err);
            }
            break;
        }
      }
    );

    /** Get models definition */
    socket.on(
      '/admin-panel/auth',
      (req = { method: 'POST', query: {}, body: {} }, cb) => {
        if (typeof req === 'function') {
          cb = req;
        }
        switch (req.method) {
          case 'POST':
            try {
              AuthService.verify(req.body.token, (err, result) => cb(err, { body: result }));
            } catch (err) {
              cb(err.message);
            }
            break;
          default:
            break;
        }
      }
    );
    /** Get models definition */
    socket.on(
      '/admin-panel/config',
      (req = { method: 'GET', query: {}, body: {} }, cb) => {
        if (typeof req === 'function') {
          cb = req;
        }
        switch (req.method) {
          case 'GET':
            try {
              cb(null, {
                body: {
                  routes: axel.config.routes,
                  plugins: axel.config.plugins,
                  primaryColor: axel.config.framework.primaryColor,
                  secondaryColor: axel.config.framework.secondaryColor,
                  infoColor: axel.config.framework.infoColor,
                  NODE_ENV: process.env.NODE_ENV,
                  app: process.env.app,
                  appName: process.env.appName,
                  framework: axel.config.framework,
                  adminConfig: _.get(axel, 'config.plugins.admin.config'),
                },
              });
            } catch (err) {
              cb(err.message);
            }
            break;
          default:
            break;
        }
      }
    );
  }
}

module.exports = new AxelAdminPanelManager();
