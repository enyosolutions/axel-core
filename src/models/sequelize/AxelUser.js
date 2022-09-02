/* jshint indent: 1 */
const sequelize = require('sequelize');

const { DataTypes } = sequelize;

module.exports = {
  identity: 'axelUser',
  entity: {
    attributes: {
      id: {
        type: 'DataTypes.INTEGER',
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      roles: {
        type: 'DataTypes.TEXT',
        allowNull: true,
        defaultValue: '["USER"]',
        get() {
          const roles = this.getDataValue('roles');
          if (!roles) {
            return [];
          }
          if (typeof (roles) === 'string') {
            return JSON.parse(roles);
          }
          return roles;
        },
        set(value) {
          this.setDataValue('roles', value && typeof value !== 'string' ? JSON.stringify(value) : value);
        },
      },
      firstName: {
        type: 'DataTypes.STRING(100)',
        allowNull: false,
      },
      lastName: {
        type: 'DataTypes.STRING(100)',
        allowNull: false,
      },
      email: {
        type: 'DataTypes.STRING(100)',
        allowNull: false,
      },
      username: {
        type: 'DataTypes.STRING(100)',
        allowNull: false,
      },
      avatarUrl: {
        type: 'DataTypes.TEXT',
        allowNull: true,
      },
      encryptedPassword: {
        type: 'DataTypes.STRING(100)',
        allowNull: false,
        defaultValue: '',
      },
      /*
      googleId: {
        type: 'DataTypes.STRING(50)',
        allowNull: true,
      },
      googleToken: {
        type: 'DataTypes.STRING(500)',
        allowNull: true,
      },
      microsoftId: {
        type: 'DataTypes.STRING(50)',
        allowNull: true,
      },
      microsoftToken: {
        type: 'DataTypes.STRING(2000)',
        allowNull: true,
      },
      facebookId: {
        type: 'DataTypes.STRING(50)',
        allowNull: true,
      },
      facebookToken: {
        type: 'DataTypes.STRING(500)',
        allowNull: true,
      },
      */
      isActive: {
        type: 'DataTypes.BOOLEAN',
        allowNull: true,
        defaultValue: 1,
      },
      passwordResetToken: {
        type: 'DataTypes.STRING(200)',
        allowNull: true,
      },
      passwordResetRequestedAt: {
        type: 'DataTypes.DATE',
        allowNull: true,
      },
      activationToken: {
        type: 'DataTypes.STRING(200)',
        allowNull: true,
      },
      /*
        notificationsEnabled: {
          type: 'DataTypes.BOOLEAN',
          defaultValue: 1,
          allowNull: true
        },
        emailNotificationsEnabled: {
          type: 'DataTypes.BOOLEAN',
          defaultValue: 1,
          allowNull: true
        },
        acceptedTermsId: {
          type: 'DataTypes.INTEGER',
          allowNull: true,
        },
        acceptedConditionsId: {
          type: 'DataTypes.INTEGER',
          allowNull: true,
        },
        */
      locale: {
        type: 'DataTypes.STRING',
        allowNull: true,
      },
      lastConnexionOn: {
        type: 'DataTypes.DATE',
        allowNull: true,
      },
      deletedBy: {
        type: 'DataTypes.INTEGER',
        allowNull: true,
      },
    },
    associations: () => {
    },
    options: {
      tableName: 'axel-user',
      timestamps: true,
      freezeTableName: true,
      createdAt: 'createdOn',
      updatedAt: 'lastModifiedOn',
      indexes: [{
        fields: ['email'],
        unique: true
      },
      {
        fields: ['username'],
      }
      ],
      paranoid: true,
      deletedAt: 'deletedOn'
    },
  },
};
