const fs = require('fs');
const socketIO = require('socket.io');
const { resolve } = require('path');
const debug = require('debug')('axel:manager');
const AuthService = require('./AuthService');
const axel = require('../axel');
const wsModel = require('./ws/wsModel');
const wsController = require('./ws/wsController');


/**
 * Contains all the code necessary for bootstrapping the code manager page.
 *
 * @class AxelAdmin
 */
class AxelManager {
  /**
   *
   *
   * @param {Application} app
   * @returns {Promise<any>}
   * @memberof AxelAdmin
   */
  init(app) {
    try {
      debug('Copying manager to the front project', `${process.cwd()}/views/axel-manager.html`);
      //   fs.copyFileSync(resolve(__dirname, '../views/axel-manager.ejs'), `${process.cwd()}/views/axel-manager.ejs`);
      fs.copyFileSync(resolve(__dirname, '../../axel-manager/dist/axel-manager.html'), `${process.cwd()}/public/axel-manager.html`);
    } catch (err) {
      console.warn('[AXELMANAGER][WARNING]', err.message);
    }
    debug('\n\n\n');
    debug('[AXELMANAGER] WS is opening');
    const io = socketIO(app.locals.server);
    app.locals.io = io;
    // https://socket.io/docs/v4/listening-to-events/#socketonanylistener
    io.on('connect', this.routing);
  }

  routing(socket) {
    debug('[AXELMANAGER] WS client connected', socket.id);

    wsModel(socket);
    wsController(socket);

    socket.on('/axel-manager/restart-app', (req = { method: 'GET', query: {}, body: {} }, cb) => {
      if (typeof req === 'function') {
        cb = req;
      }
      switch (req.method) {
        default:
        case 'GET':
          break;
        case 'POST':
          // cb(null, { body: axel.models });
          const { name } = req.body;

          if (!name) {
            return cb(new Error('missing_param_name'));
          }

          try {
            process.kill(process.pid, 'SIGUSR2');
            cb(null, {
              body: 'ok',
            });
          } catch (err) {
            process.kill(process.pid, 'SIGTERM');
            cb(err);
          }
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
            const auth = AuthService.generateToken({ id: 1, firstName: 'ADMIN', roles: ['ADMIN'] }, null, '6h');
            cb(null, { body: auth });
          } catch (err) {
            cb(err.message);
          }
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
            cb(null, { body: axel.config });
          } catch (err) {
            cb(err.message);
          }
        default:
          break;
      }
    });
  }
}

module.exports = new AxelManager();
