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

const jsonFields = ['config'];

const AxelModelFieldConfig = {
  identity: 'axelModelFieldConfig',
  entity: {
    attributes: {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      parentIdentity: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
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
      tableName: 'axel-model-field-config',
      // Enable TimeStamp
      timestamps: true,
      // createdAt should be createdOn
      createdAt: 'createdOn',
      // updatedAt should be lastModifiedOn
      updatedAt: 'lastModifiedOn',
      // Hooks. see => http://docs.sequelizejs.com/manual/tutorial/hooks.html
      hooks: {
        afterSave: jsonParseHook(jsonFields, {}),
        beforeValidate: jsonStringifyHook(jsonFields, {}),
        afterFind: bulkJsonParseHook(jsonFields, {}),
        beforeBulkCreate: bulkJsonStringifyHook(jsonFields, {}),
        beforeBulkUpdate: bulkJsonStringifyHook(jsonFields, {})
      },
      indexes: [
        {
          unique: true,
          fields: ['parentIdentity', 'name']
        },
        {
          unique: false,
          fields: ['parentIdentity']
        },
        {
          unique: false,
          fields: ['name']
        }
      ]
    },
    // Create relations
    associations: (models) => {
      models.axelModelFieldConfig.belongsTo(models.axelModelConfig, {
        targetKey: 'identity',
        foreignKey: 'parentIdentity'
      });
    },
  }
};

module.exports = AxelModelFieldConfig;
module.exports.AxelModelFieldConfig = AxelModelFieldConfig;
