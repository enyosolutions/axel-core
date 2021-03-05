// const mongo =  require('mongodb');
const crypto = require('crypto');
const stringify = require('json-stringify-safe');
const Sequelize = require('sequelize');
const _ = require('lodash');
const { ExtendedError } = require('./ExtendedError');

// declare const Sequelize;


const ErrorUtils = {
  stringToError(code = 500, message) {
    const err = new ExtendedError({ code, message });
    return err;
  },

  sendError(code = 500, message, response) {
    const err = ErrorUtils.stringToError(code, message, response);
    if (response) {
      ErrorUtils.errorCallback(err, response);
    }
    return err;
  },


  safeError(err) {
    try {
      err = JSON.parse(stringify(err));
      return err;
    } catch (e) {
      err = {
        name: err.name,
        message: err.message,
        code: err ? err.code : undefined,
      };
      return err;
    }
  },

  errorCallback(err, response) {
    console.log('err recived', err);

    if (!err) {
      axel.logger.error(err);
      throw new Error('error_handler_called_without_error_arg');
    }
    if (err.name === 'SequelizeValidationError') {
      if (err.errors && Array.isArray(err.errors)) {
        // @ts-ignore
        err.errors = err.errors.map(e => e.message);
      }
      err.message = 'validation_error';
    }

    if (err.name === 'SequelizeDatabaseError') {
      if (err.errors && Array.isArray(err.errors)) {
        // @ts-ignore
        err.errors = err.errors.map(e => e.sqlMessage);
      } else {
        // @ts-ignore
        err.errors = [err.sqlMessage || err.message];
      }
      err.message = 'database_error';
    }

    if (err.message === 'Validation error') {
      if (err.errors && Array.isArray(err.errors)) {
        // @ts-ignore
        err.errors = err.errors.map(e => `${e.path}_${e.validatorKey}`);
      }
      err.message = err.errors && err.errors[0]
        ? (_.isString(err.errors[0])
          ? err.errors[0]
          : err.errors[0].message)
        : 'validation_error';
    }
    let errors;
    if (err.errors && Array.isArray(err.errors)) {
      if (axel.config.env === 'production') {
        errors =
          // @ts-ignore
          err.errors.map(e => (_.isString(e) ? e : e.message));
      } else {
        // @ts-ignore
        errors = err.errors.map(ErrorUtils.safeError);
      }
    }

    if (typeof err === 'string') {
      err = new Error(err);
    }
    if (response && !response.headersSent) {
      return response.status(err.code && parseInt(err.code) < 504 ? parseInt(err.code) : 400).json({
        message: err.message || 'global_error',
        errors,
      });
    }
    return {
      code: err.code || 422,
      message: err.message || 'global_error',
      errors,
    };
    /*
    if (Raven.getContext()) {
      Raven.mergeContext({
        user: axel.session && axel.session.token,
        app: axel.config && axel.config.env,
        env: axel.config && axel.config.env,
        tags: {
          app: axel.config && axel.config.env,
          env: axel.config && axel.config.env,
        },
      });
    }
    Raven.captureException(err);
    */
  },

};

module.exports = ErrorUtils;
