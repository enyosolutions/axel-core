const * as path = require('path');
const express, { Application } = require('express');
const errorHandler = require('../../api/middlewares/error.handler');
const { OpenApiValidator } = require('express-openapi-validator');

module.exports = function (app, routes: (app) => void): Promise<void> {
  const apiSpec = path.join(__dirname, 'api.yml');
  const validateResponses = !!(
    process.env.OPENAPI_ENABLE_RESPONSE_VALIDATION &&
    process.env.OPENAPI_ENABLE_RESPONSE_VALIDATION.toLowerCase() === 'true'
  );
  return new OpenApiValidator({
    apiSpec,
    validateResponses,
  })
    .install(app)
    .then(() => {
      app.use(process.env.OPENAPI_SPEC || '/spec', express.static(apiSpec));
      routes(app);
      app.use(errorHandler);
    });
};
