const debug = require('debug')('app:boostrap');
const core = require('axel-core');
const I18n = require('./api/services/I18n');
const CronService = require('./api/services/CronService');

const { AxelAdmin, AxelManager, SchemaValidator } = core;

// eslint-disable-next-line
module.exports.beforeFn = (app) => {
  return new Promise((resolve, reject) => {
    // add the functions that you'd like to run before the app has started
    // Example the db connection if it's crucial to some startup operation
    try {
      app.use(I18n.init);
      app.locals.i18n = I18n;
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports.afterFn = app => new Promise((resolve, reject) => {
  // add the function that you'd like to run after the app has started
  // Example the cron services.
  try {
    if (SchemaValidator) {
      SchemaValidator.init();
    }

    if (AxelAdmin) {
      AxelAdmin.init(app);
    }

    if (process.env.NODE_ENV !== 'test') {
      AxelManager.init(app);
    }

    resolve();
  } catch (error) {
    reject(error);
  }
});
