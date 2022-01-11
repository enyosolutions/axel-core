/* eslint-disable global-require */
let mergedConfig;
try {
  // eslint-disable-next-line
  mergedConfig = require('../../../src/config/local');
} catch (err) {
  mergedConfig = require('../../../src/config/sqldb');
}

module.exports = {
  development: {
    username: mergedConfig.sqldb.user,
    database: mergedConfig.sqldb.database,
    password: mergedConfig.sqldb.password,
    host: mergedConfig.sqldb.host,
    port: mergedConfig.sqldb.port,
    dialect: mergedConfig.sqldb.dialect || (mergedConfig.sqldb.options && mergedConfig.sqldb.options.dialect) || 'mysql',
  },
  define: {
    charset: 'utf8',
    collate: 'utf8mb4_unicode_ci',
  }
};
