/**
 * axel-model-config
 *
 * @description :: This is model file that connects with sequelize.
 *                 TODO: You might write a short summary of
 *                 how this model works and what it represents here.
 */

const Sequelize = require('sequelize');

const {
  jsonStringifyHook,
  bulkJsonStringifyHook,
  jsonParseHook,
  bulkJsonParseHook
} = require('../../services/SequelizeHooks.js');
/*
  // event hooks => http://docs.sequelizejs.com/manual/tutorial/hooks.html
  const eventCallback = () => { // items, options
    // do something like stringifying data...
  };
*/
const jsonFields = ['config'];
/** @type import('../../../types/main.js').AxelSequelizeModel */
const AxelModelConfig = {
  identity: 'axelModelConfig',
  entity: {
    attributes: {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      identity: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      config: {
        type: Sequelize.TEXT
      }
    },
    options: {
      // disable the modification of tablenames; By default, sequelize will automatically
      // transform all passed model names (first parameter of define) into plural.
      // if you don't want that, set the following
      freezeTableName: true,
      // Table Name
      tableName: 'axel-model-config',
      // Enable TimeStamp
      timestamps: true,
      // createdAt should be createdOn
      createdAt: 'createdOn',
      // updatedAt should be lastModifiedOn
      updatedAt: 'lastModifiedOn',
      // Hooks. see => http://docs.sequelizejs.com/manual/tutorial/hooks.html
      hooks: {
        // beforeSave: jsonStringifyHook(['options', 'layout', 'actions'], {}),
        afterSave: jsonParseHook(jsonFields, {}),
        beforeValidate: jsonStringifyHook(jsonFields, {}),
        afterFind: bulkJsonParseHook(jsonFields, {}),
        beforeBulkCreate: bulkJsonStringifyHook(jsonFields, {}),
        beforeBulkUpdate: bulkJsonStringifyHook(jsonFields, {})
      },
      indexes: [
        // {
        //  unique: false,
        //  fields: ['userId'],
        // },
        {
          unique: true,
          fields: ['identity']
        }
      ]
    },
    // Create relations
    // @ts-ignore
    associations: (models) => {
      models.axelModelConfig.hasMany(models.axelModelFieldConfig, {
        foreignKey: 'parentIdentity',
        sourceKey: 'identity'
      });
    },
  }
};

module.exports = AxelModelConfig;
module.exports.AxelModelConfig = AxelModelConfig;
