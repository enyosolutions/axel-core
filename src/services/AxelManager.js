const fs = require('fs');
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


/**
 * Contains all the code necessary for bootstrapping the code manager page.
 *
 * @class AxelManager
 */
class AxelManager {
  /**
   *
   *
   * @param {Application} app
   * @returns {Promise<any>}
   * @memberof AxelManager
   */
  init(app) {
    try {
      // load the axel admin user model.
      // loadSchemaModel(`${__dirname}/../models/schema/axelUser.js`);
      const axelUser = loadSqlModel(`${__dirname}/../models/sequelize/AxelUser.js`, axel.sqldb);
      axelUser.em.options.logging = false;
      axelUser.em.logging = false;

      // SchemaValidator.loadSchema(axelUser);
      axel.models.axelUser.em.sync();
      debug('Copying manager to the front project', `${process.cwd()}/views/axel-manager.html`);
      this.injectExpressRoutes(app);
    } catch (err) {
      console.warn('[AXELMANAGER][WARNING]', err.message);
    }
    debug('\n\n\n');
    debug('[AXELMANAGER] WS is opening');
    const io = socketIO(app.locals.server, { path: '/axel-admin-ws' });
    app.locals.io = io;
    // https://socket.io/docs/v4/listening-to-events/#socketonanylistener
    io.on('connect', this.routing.bind(this));
  }

  /**
   * Inject the reoutes for express admin
   *
   * @param {*} app
   * @memberof AxelManager
   */
  injectExpressRoutes(app) {
    app.get(['/admin-panel'],
      (req, res) => {
        try {
          res.sendFile(resolve(__dirname, '../../axel-manager/dist/admin-panel.html'));
        } catch (e) {
          console.error(e.message);
          res.status(500).json({
            errors: ['not_found'],
            message: 'not_found',
          });
        }
      });
    app.get('/api/axel-admin/auth/user',
      AuthService.tokenDecryptMiddleware, this.checkUserMiddleware,
      (req, res) => {
        res.json({ user: req.user });
      });
    app.get('/api/axel-admin/crud/:endpoint', AuthService.tokenDecryptMiddleware, this.checkUserMiddleware, CrudSqlController.findAll);
    app.post('/api/axel-admin/crud/:endpoint', AuthService.tokenDecryptMiddleware, this.checkUserMiddleware, CrudSqlController.create);
    app.get('/api/axel-admin/crud/:endpoint/:id', AuthService.tokenDecryptMiddleware, this.checkUserMiddleware, CrudSqlController.findOne);
    app.put('/api/axel-admin/crud/:endpoint/:id', AuthService.tokenDecryptMiddleware, this.checkUserMiddleware, CrudSqlController.update);
    app.delete('/api/axel-admin/crud/:endpoint/:id', AuthService.tokenDecryptMiddleware, this.checkUserMiddleware, CrudSqlController.deleteOne);
  }

  async checkUserMiddleware(req, res, next) {
    if (!req.user) {
      return next('user_not_set');
    }
    const user = await axel.models.axelUser.em.findOne({
      where: { id: req.user.id, email: req.user.email },
      attributes: ['id', 'email', 'firstName', 'lastName']
    });
    if (!user) {
      return next('user_not_found');
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
 * @memberof AxelManager
 */
  routing(socket) {
    debug('[AXELMANAGER] WS client connected', socket.id);
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
      AuthService.verify(socket.Authorization.token, async (err, decryptedToken) => {
        if (!err) {
          const user = await axel.models.axelUser.em.findOne({
            where: { id: decryptedToken.id, email: decryptedToken.email }
          });

          if (!user) {
            return cb('No user found');
          }

          socket.user = _.pick(user, ['id', 'firstName', 'lastName', 'username', 'role']);
          debug('joining', `user:${user.id}`);
          socket.join(`user:${user.id}`);
          self.protectedRouting(socket);
        }
        if (cb) {
          cb(err, socket.User);
        }
      });
    });


    /** Get models definition */
    socket.on('/axel-admin/auth/user', (req = { method: 'GET', query: {}, body: {} }, cb) => {
      if (typeof req === 'function') {
        cb = req;
      }
      switch (req.method) {
        case 'GET':

          AuthService.verify(req.headers.authorization, async (err, decryptedToken) => {
            if (err) {
              return cb(err);
            }
            try {
              const response = { status: 200 };
              const user = await axel.models.axelUser.em.findByPk(decryptedToken.id);
              if (!user) {
                return cb('user_not_found');
              }
              socket.user = _.pick(user, ['id', 'firstName', 'lastName', 'username', 'role']);
              req.user = socket.user;
              debug('joining', `user:${user.id}`, socket.user);
              debug('joining', `user:${user.id}`);
              socket.join(`user:${user.id}`);
              self.protectedRouting(socket);
              cb(null, { user: socket.user });
              debug('[AXELMANAGER] WS client connected', socket.id, socket.user.username);
            } catch (err2) {
              cb(err2.message);
            }
          });

          break;
        default:
          break;
      }
    });
  }

  /**
   * inject routes that should be available only when the user is connected
   *
   * @param {*} socket
   * @memberof AxelManager
   */
  protectedRouting(socket) {
    debug('[AXELMANAGER] WS protected routes', socket.id, socket.user.username);

    wsModel(socket);
    wsController(socket);

    /** Get models definition */
    socket.onAny(async (eventName, req = { method: 'GET', query: {}, body: {} }, cb) => {
      if (typeof req === 'function') {
        cb = req;
      }
      const model = Object.values(axel.models).find(m => m.apiUrl === eventName);
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
    });

    socket.on('/axel-manager/restart-app', (req = { method: 'GET', query: {}, body: {} }, cb) => {
      if (typeof req === 'function') {
        cb = req;
      }
      switch (req.method) {
        default:
        case 'GET':
          break;
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
    });


    /** Get models definition */
    socket.on('/axel-manager/auth', (req = { method: 'POST', query: {}, body: {} }, cb) => {
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
    });
    /** Get models definition */
    socket.on('/axel-manager/config', (req = { method: 'GET', query: {}, body: {} }, cb) => {
      if (typeof req === 'function') {
        cb = req;
      }
      switch (req.method) {
        case 'GET':
          try {
            cb(null, { body: { routes: axel.config.routes, plugins: axel.config.plugins } });
          } catch (err) {
            cb(err.message);
          }
          break;
        default:
          break;
      }
    });
  }
}

module.exports = new AxelManager();
