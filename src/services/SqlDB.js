const Sequelize = require('sequelize');
const axel = require('../axel.js');

async function loadSequelize() {
  if (axel.config.sqldb) {
    const datastore = axel.config.sqldb;
    axel.logger.debug('[ORM] Connecting to database ', datastore.database);
    const config = {
      host: datastore.host,
      port: datastore.port,
      dialect: datastore.options.dialect,
      logging: datastore.options.logging,
      options: datastore.options,
      retry: datastore.retry,
      query: {
        raw: false
      },
      pool: {
        max: 10,
        min: 1,
        acquire: 30000,
        idle: 20000,
        handleDisconnects: true
      },
      define: {
        charset: 'utf8',
        collate: 'utf8_general_ci'
      },
      ...datastore,
    };
    let sequelize;
    if (datastore.connectionString) {
      sequelize = new Sequelize(datastore.connectionString, config);
    } else {
      sequelize = new Sequelize(datastore.database, datastore.user, datastore.password, config);
    }

    try {
      await sequelize.authenticate();
      axel.logger.warn(
        '[ORM] ✅ SQL DB Connection has been established successfully. %o',
        datastore.connectionString || datastore.options
      );
      return sequelize;
    } catch (err) {
      axel.logger.error('[ORM] Unable to connect to the database:', err);
      process.exit(-1);
    }
  }
}
const sqlDB = loadSequelize();
module.exports = sqlDB;
