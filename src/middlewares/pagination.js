const debug = require('debug')('axel:middleware:pagination');
const Utils = require('../services/Utils');


module.exports = (req, res, next) => {
  if (req.pagination || req.method !== 'GET') {
    next();
    return;
  }
  debug('[pagination] Injecting', req.method, req.url, req.params);
  req.pagination = Utils.injectPaginationQuery(req);
  req.parsedQuery = Utils.injectQueryParams(req);
  debug('[pagination] Injecting', req.url, req.pagination, req.parsedQuery);
  next();
};
