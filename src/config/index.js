const _ = require('lodash');
const axel = require('../axel.js');

module.exports.sequelizeModelsFolder = _.get(axel, 'config.framework.modelsLocation') || `${process.cwd()}/src/api/models/sequelize`;
module.exports.schemaModelsFolder = _.get(axel, 'config.framework.schemasLocation') || `${process.cwd()}/src/api/models/schema`;
