/* eslint-disable max-lines-per-function */
const debug = require('debug')('axel:manager');
const {
  generateController,
  generateModel,
  generateApi,
  generateRoute,
  cliFieldToSequelizeField,
  sequelizeFieldToSchemaField,
} = require('axel-cli');

module.exports = (socket) => {
  const counter = 3;
  socket.on('/axel-manager/api', async (req = { method: 'GET', query: {}, body: {} }, cb) => {
    if (typeof req === 'function') {
      cb = req;
    }
    switch (req.method) {
      case 'GET':
      default:
        break;
      case 'POST':
        const {
          name, type, force, fields, withSchema
        } = req.body;
        if (!name) {
          return cb('missing_param_name');
        }
        try {
          await generateApi({
            name,
            type,
            force,
            fields,
            withSchema,
          });
          let count = withSchema ? 4 : 3;
          // catching api signals in order for the file to generate properly
          process.once('SIGUSR2', () => {
            debug('[AXELMANAGER] Captured interruption signal....', count--);

            if (count <= 0) {
              setTimeout(() => {
                process.kill(process.pid, 'SIGUSR2');
                if (count < -10) {
                  process.exit();
                }
              }, 1000);
            }
          });
          cb(null, { body: 'OK' });
        } catch (err) {
          console.warn('[AXELMANAGER]', err);
          cb({ message: err.message });
        }
    }
  });

  socket.on('/axel-manager/controllers', (req = { method: 'GET', query: {}, body: {} }, cb) => {
    if (typeof req === 'function') {
      cb = req;
    }

    switch (req.method) {
      case 'GET':
      default:
        cb(null, { body: axel.controllers });
        break;
      case 'POST':
        const { name, type, force } = req.body;
        if (!name) {
          return cb('missing_param_name');
        }
        try {
          generateController({ name, type: type || 'bare', force });
          cb(null, {
            body: 'ok',
          });
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            axel.logger.warn(err);
          }
          if (err && err.name === 'SequelizeValidationError') {
            cb({
              // @ts-ignore
              errors: err.errors && err.errors.map(e => e.message),
              message: 'sql_validation_error',
            });
            return false;
          }
          cb(err);
        }
    }
  });

  socket.on('/axel-manager/routes', (req = { method: 'GET', query: {}, body: {} }, cb) => {
    if (typeof req === 'function') {
      cb = req;
    }
    switch (req.method) {
      case 'GET':
        cb(null, { body: axel.config.routes });
        break;
      case 'POST':
        // cb(null, { body: axel.models });
        const { name } = req.body;

        if (!name) {
          return cb(new Error('missing_param_name'));
        }

        try {
          generateRoute(name);
          cb(null, {
            body: 'ok',
          });
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            axel.logger.warn(err);
          }
          if (err && err.name === 'SequelizeValidationError') {
            cb({
              // @ts-ignore
              errors: err.errors && err.errors.map(e => e.message),
              message: 'sql_validation_error',
            });
            return false;
          }
          cb(err);
        }
    }
  });
};
