const ErrorUtils = require('../services/ErrorUtils');

function developmentErrorHandler(
  err,
  req,
  res,
  next
) {
  const { code, message, errors } = ErrorUtils.errorCallback(err);
  axel.logger.error(err);
  if (res.headersSent) {
    return next(err);
  }

  return res.status(code || 422).json({
    message, code, stack: err.stack, errors
  });
}

function productionErrorHandler(
  err,
  req,
  res,
  next
) {
  const { message, errors, code } = ErrorUtils.errorCallback(err);
  if (res.headersSent) {
    return next(err);
  }

  return res.status(code || 422).json({ message, errors, code });
}

module.exports = process.env.NODE_ENV === 'development' ? developmentErrorHandler : productionErrorHandler;
module.exports.productionErrorHandler = productionErrorHandler;
module.exports.developmentErrorHandler = developmentErrorHandler;
