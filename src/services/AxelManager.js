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
      debug('Copying manager to the front project', `${process.cwd()}/views/axel-manager.html`);
      app.get('/',
        (req, res) => {
          try {
            res.sendFile(resolve(__dirname, '../../axel-manager/dist/axel-manager.html'));
          } catch (e) {
            console.error(e.message);
            res.status(500).json({
              errors: ['not_found'],
              message: 'not_found',
            });
          }
        });
    } catch (err) {
      console.warn('[AXELMANAGER][WARNING]', err.message);
    }
    debug('\n\n\n');
    debug('[AXELMANAGER] WS is opening');
    const io = socketIO(app.locals.server, { path: '/axel-admin-ws' });
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
            cb(null, { body: axel.config });
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
