/* eslint-disable */
require('dotenv').config();
const { Sequelize } = require('sequelize');
const { loadSqlModels } = require('axel-core/src/models');

module.exports = loadSqlModels({ loadHooks: false }).then((axel) => {
  return {
    sequelize: axel.sqldb,
    Sequelize,
  };;
});
