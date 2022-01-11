/* eslint-disable */
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { Sequelize } = require('sequelize');
const { config } = require('axel-core');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const db = {};
let sequelize;
sequelize = new Sequelize(config.sqldb.database, config.sqldb.user, config.sqldb.password, config.sqldb);
const modelsLocation = _.get(config, 'framework.modelsLocation', `${process.cwd()}/src/api/models/sequelize`);
fs.readdirSync(modelsLocation)
  .filter(file => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js')
  .forEach(file => {
    const model = require(path.resolve(modelsLocation, file));

    if (model.entity.attributes) {
      Object.entries(model.entity.attributes).forEach(([, attr]) => {
        if (typeof attr.type === 'string') {
          const type = attr.type.replace('DataTypes.', '').replace('sequelize.', '').replace(/\(.+\)/, '');
          const args = attr.type.match(/\(.+\)/);
          const resolvedType = _.get(Sequelize.DataTypes, type);
          if (resolvedType) {
            attr.type = resolvedType;
            if (args && args[0]) {
              attr.type = attr.type(...args[0].replace(/\(|\)/g, '').split(',').map(s => s.replace(/["']/g, '').trim()));
            }
          }
        }
      });
    }

    const SqlModel = sequelize.define(
      _.upperFirst(_.camelCase(model.identity)),
      model.entity.attributes,
      model.entity.options,
    );
    db[model.identity] = SqlModel;
    db[model.identity].associations = model.associations;
  });
Object.keys(db).forEach(identity => {
  if (db[identity].associations) {
    db[identity].associations(db);
  }
}),
  (db.Sequelize = Sequelize);
db.sequelize = sequelize;
module.exports = db;
