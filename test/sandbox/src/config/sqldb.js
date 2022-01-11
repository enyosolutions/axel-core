module.exports = {
  sqldb: {
    dialect: process.env.DATABASE_DIALECT || 'mysql',
    user: process.env.DATABASE_USER || 'root',
    host: process.env.DATABASE_HOST || 'localhost',
    database: process.env.DATABASE_NAME || 'app_database_env',
    port: process.env.DATABASE_PORT || 3306,
    password: process.env.DATABASE_PASSWORD || 'password',
    options: {
      dialect: 'mysql', // 'mysql'|'sqlite'|'postgres'|'mssql'
      // eslint-disable-next-line
      logging: false, // USE DEBUG=sequielize || specify App.log level to use ('info', 'warn', 'verbose', etc)
    },
  },
};
