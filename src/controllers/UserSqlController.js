/**
 * UserSqlController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.axel.s.org/docs/controllers
 */

const moment = require('moment');
const _ = require('lodash');
const Utils = require('../services/Utils');
const ErrorUtils = require('../services/ErrorUtils.js'); // adjust path as needed
const { ExtendedError } = require('../index');
const AuthService = require('../services/AuthService');
const MailService = require('../services/MailService');

const primaryKey = axel.models.user && axel.models.user.em && axel.models.user.em.primaryKeyField
  ? axel.models.user.em.primaryKeyField
  : axel.config.framework.primaryKey;

module.exports = {
  initDefaultUser(req, res) {
    if (['PROD', 'prod', 'production'].indexOf(axel.config.env) > -1) {
      res.json('NOPE');
      return;
    }
    req.body = {};
    req.body.email = 'dev@enyosolutions.com';
    req.body.firstName = 'Tony';
    req.body.lastName = 'Stark';
    req.body.username = 'enyosolutions';
    req.body.password = 'Test1234';
    req.body.roles = ['USER', 'ADMIN', 'DEVELOPER'];
    axel.getActions()['user/create'](req, res);
  },

  /**
   * @swagger
   *
   * /user:
   *   post:
   *     description: Create a user (registration)
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: user
   *         description: User object
   *         in:  body
   *         required: true
   *         type: string
   *         schema:
   *           $ref: '#/definitions/User'
   *     responses:
   *       200:
   *         description: users
   *         schema:
   *           $ref: '#/definitions/User_ItemResponse'
   */
  create(req, res) { // eslint-disable-line max-lines-per-function
    let token;
    if (!req.body.email) {
      return res.status(400).json({
        errors: ['error_missing_email'],
        message: 'error_missing_email'
      });
    }

    if (!req.body.password) {
      return res.status(400).json({
        errors: ['error_missing_password'],
        message: 'error_missing_password'
      });
    }

    if (!req.body.username) {
      if (axel.config.framework.user.username) {
        return res.status(400).json({
          errors: ['error_missing_username'],
          message: 'error_missing_username'
        });
      }
      req.body.username = req.body.email;
    }

    let newUser = req.body;
    newUser.email = newUser.email.toLowerCase();
    newUser.username = newUser.username.toLowerCase();

    axel.models.user.em
      .findOne({
        where: {
          email: newUser.email
        }
      })
      .then((user) => {
        if (user) {
          throw new ExtendedError({
            code: 400,
            stack: 'error_conflict_email',
            message: 'error_conflict_email',
            errors: ['error_conflict_email']
          });
        }
        user = user.get();
        if (!newUser.roles) {
          newUser.roles = JSON.stringify(['USER']);
        }
        newUser.isActive = !axel.config.framework.emailConfirmationRequired && !axel.config.framework.accountManualVerification;

        return AuthService.beforeCreate(newUser);
      })
      .then((data) => {
        if (data) {
          return axel.models.user.em.create(newUser, {
            raw: true
          });
        }
        throw new Error('password_encoding_error');
      })
      .then((result) => {
        if (result && result.dataValues) {
          newUser = result.dataValues;

          if (newUser.roles && typeof newUser.roles === 'string') {
            try {
              newUser.roles = JSON.parse(newUser.roles);
            } catch (e) {
              axel.logger.warn(e);
            }
          }

          // If user created successfuly we return user and token as response
          token = AuthService.generateToken(newUser);

          if (axel.config.framework.user.emailConfirmationRequired) {
            newUser.activationToken = Utils.md5(`${Date.now() + Math.random() * 1000}`);
            newUser.isActive = false;
          } else {
            newUser.isActive = true;
          }

          if (newUser.activationToken) {
            delete newUser.activationToken;
          }

          return axel.models.user.em.update(newUser, {
            where: {
              [primaryKey]: newUser[primaryKey]
            }
          });
        }
        throw new Error('user_not_created');
      })
      .then(() => {
        if (newUser && newUser[primaryKey] && axel.config.framework.user.emailConfirmationRequired) {
          return MailService.sendEmailConfirmation(
            Object.assign(
              {
                activationToken: Utils.md5(`${Date.now() + Math.random() * 1000}`)
              },
              newUser
            )
          );
        }
        return true;
      })
      // eslint-disable-next-line no-undef
      .then(() => {
        if (newUser[primaryKey]) {
          res.status(200).json({
            user: newUser,
            token
          });
        } else {
          res.status(503).json({
            errors: ['user_not_saved'],
            message: 'user_not_saved'
          });
        }
      })
      .catch((err) => {
        axel.logger.warn(err && err.message ? err.message : err);
        ErrorUtils.errorCallback(err, res);
      });
  },

  /**
   *
   */
  getByResetToken(req, res) {
    const resetToken = req.param('resetToken');

    if (!resetToken) {
      return res.status(404).json({
        errors: ['missing_argument'],
        message: 'missing_argument'
      });
    }

    axel.models.user.em
      .findOne({
        where: {
          resetToken
        }
      })
      .then((data) => {
        if (!data) {
          throw new ExtendedError({
            code: 401,
            stack: 'invalid_token',
            message: 'invalid_token',
            errors: ['invalid_token']
          });
        }
        if (
          !data.passwordResetRequestedOn
          || moment(data.passwordResetRequestedOn)
            .add(10, 'm')
            .isBefore(new Date())
        ) {
          throw new ExtendedError({
            code: 401,
            stack: 'expired_token',
            message: 'The password reset request has expired, please try again.',
            errors: ['expired_token']
          });
        }
        res.json({
          resetToken: data.resetToken,
          [primaryKey]: data[primaryKey]
        });
      })
      .catch((err) => {
        res.status(err.code ? parseInt(err.code) : 400).json({
          errors: [err.message || 'global_error'],
          message: err.message || 'global_error'
        });
      });
  },

  reset(req, res) {
    const resetToken = req.param('resetToken');

    if (!resetToken) {
      return res.status(404).json({
        errors: ['missing_argument'],
        message: 'missing_argument'
      });
    }

    if (!req.body.password) {
      return res.status(404).json({
        errors: ['error_missing_password'],
        message: 'error_missing_password'
      });
    }

    let user;
    axel.models.user.em
      .findOne({
        where: {
          resetToken
        }
      })
      .then((u) => {
        if (!u || u.length < 1) {
          throw new ExtendedError({
            code: 401,
            message: 'invalid_token',
            errors: ['invalid_token']
          });
        }
        user = u.get();
        if (
          !user.passwordResetRequestedOn
          || moment(user.passwordResetRequestedOn)
            .add(20, 'm')
            .isBefore(new Date())
        ) {
          throw new ExtendedError({
            code: 401,
            message: 'The password reset request has expired, please try again.',
            errors: ['expired_token']
          });
        }
        user.password = req.body.password;
        return AuthService.beforeUpdate(user);
      })
      .catch((err) => {
        res.status(err.code ? parseInt(err.code) : 400).json({
          errors: [err.message || 'not_found'],
          message: err.message || 'not_found'
        });
      })
      .then((result) => {
        if (result) {
          user.resetToken = '';
          return axel.models.user.em.update(user, {
            where: {
              [primaryKey]: user[primaryKey]
            }
          });
        }
      })
      .catch((err) => {
        res.status(err.code ? parseInt(err.code) : 400).json({
          errors: [err.message || 'update_error'],
          message: err.message || 'update_error'
        });
      })
      .then((success) => {
        if (success) {
          res.status(200).json({
            body: 'password_reset_success'
          });
        }
      })
      .catch((err) => {
        res.status(400).json({
          message: 'global_error',
          errors: [err.message]
        });
      });
  },

  list(req, resp) {
    const { listOfValues, startPage, limit } = Utils.injectPaginationQuery(req);

    const options = {
      limit,
      skip: startPage * limit
    };

    let query = Utils.injectQueryParams(req);

    if (req.query.search) {
      query = Utils.injectSqlSearchParams(req, query, {
        modelName: 'user'
      });
    }
    if (req.query.roles) {
      query.roles = {
        [axel.sqldb.Op.like]: axel.sqldb.literal(`'%"${req.query.roles}"%'`)
      };
    }
    query = Utils.cleanSqlQuery(query);

    axel.models.user.em
      .findAndCountAll({ where: query, raw: false, nested: true }, options)
      .then((result) => {
        let data;
        if (result && Array.isArray(result.rows)) {
          data = result.rows.map((user) => {
            delete user.encryptedPassword;
            if (user.roles && typeof user.roles === 'string') {
              try {
                user.roles = JSON.parse(user.roles);
              } catch (e) {
                axel.logger.warn(e);
              }
            }
            return user;
          });

          if (listOfValues) {
            data = data.map(item => ({
              [primaryKey]: item[primaryKey].toString(),
              label: Utils.formatName(item.firstname, item.lastname, item.username, true)
            }));
          }
          return resp.status(200).json({
            body: data,
            page: startPage,
            count: limit,
            totalCount: result.count
          });
        }
        return resp.status(200).json({
          body: []
        });
      })
      .catch((err) => {
        resp.status(500).json({
          errors: [err.message],
          message: err.message
        });
      });
  },

  get(req, resp) {
    const id = req.param('userId');
    if (axel.mongodb) {
      if (!Utils.checkIsMongoId(id, resp)) {
        return false;
      }
    }
    const listOfValues = req.query.listOfValues ? req.query.listOfValues : false;
    axel.models.user.em
      .findByPk({
        [primaryKey]: id
      })
      .then((doc) => {
        if (!doc) {
          return resp.status(404).json({
            message: 'not_found',
            errors: ['not_found']
          });
        }
        doc = doc.get();
        if (doc.roles && typeof doc.roles === 'string') {
          try {
            doc.roles = JSON.parse(doc.roles);
          } catch (e) {
            axel.logger.warn(e);
          }
        }

        if (listOfValues) {
          return resp.status(200).json({
            body: {
              [primaryKey]: doc[primaryKey].toString(),
              label: Utils.formatName(doc.firstname, doc.lastname, doc.username, true)
            }
          });
        }

        delete doc.password;
        delete doc.encryptedPassword;
        return resp.status(200).json({
          body: doc
        });
      })
      .catch((err) => {
        resp.status(500).json({
          errors: [err],
          message: err.message
        });
      });
  },

  exists(req, resp) {
    const username = req.query.username;
    const email = req.query.email;
    if (!username && !email) {
      return resp.status(400).json({
        errors: ['missing_argument'],
        message: 'missing_argument'
      });
    }
    axel.models.user.em
      .findOne(username ? { where: { username: `${username}` } } : { where: { email: `${email}` } })
      .then((doc) => {
        if (doc) {
          return resp.status(200).json({
            body: true
          });
        }
        return resp.status(200).json({
          body: false
        });
      })
      .catch((err) => {
        ErrorUtils.errorCallback(err, resp);
      });
  },

  update(req, res) {
    let user;
    const newUser = req.body;
    let data;
    const id = req.params.userId;
    if (axel.mongodb) {
      if (!Utils.checkIsMongoId(id, res)) {
        return false;
      }
    }

    if (req.body.email === null) {
      if (axel.config.framework.user.email) {
        return res.status(404).json({
          errors: ['error_missing_email'],
          message: 'error_missing_email'
        });
      }
    }

    if (req.body.username === null) {
      if (axel.config.framework.user.username) {
        return res.status(404).json({
          errors: ['error_missing_username'],
          message: 'error_missing_username'
        });
      }
      req.body.username = req.body.email;
    }

    axel.models.user.em
      .findByPk(id)
      .then((u) => {
        user = u;
        if (!user) {
          throw new ExtendedError({
            code: 404,
            stack: 'not_found',
            message: 'not_found',
            errors: ['not_found']
          });
        }

        if (typeof user.roles === 'string') {
          try {
            user.roles = JSON.parse(user.roles);
          } catch (e) {
            user.roles = ['USER'];
          }
        }

        // prevent frontend from hijacking encrypted password
        delete req.body.encryptedPassword;

        // PREVENT USERS FROM MODIFYING USERS ROLES·
        if (!(req.user && AuthService.hasRole(req.user, 'ADMIN'))) {
          delete newUser.roles;
        }
        if (user.roles.indexOf('DEVELOPER') > -1 && newUser.roles && newUser.roles.indexOf('DEVELOPER') === -1) {
          newUser.roles.push('DEVELOPER');
        }

        data = _.merge({}, user, newUser);
        data.roles = newUser.roles;
        // Delete if not required
        // data.lastModifiedOn = new Date();

        if (!axel.mongodb) {
          data.roles = JSON.stringify(data.roles);
        }

        if (data.password) {
          return AuthService.beforeUpdate(data);
        }
        return data;
      })
      .then(() => {
        if (data) {
          return axel.models.user.em.update(data, {
            where: {
              [primaryKey]: id
            }
          });
        }
      })
      .then((doc) => {
        if (doc) {
          if (data.roles && typeof data.roles === 'string') {
            try {
              data.roles = JSON.parse(data.roles);
            } catch (e) {
              axel.logger.warn(e);
            }
          }
        }
      })
      .then(() => axel.models.user.em.findByPk(parseInt(id)))
      .then((userModel) => {
        delete userModel.encryptedPassword;
        userModel = userModel.get();
        res.json({
          user: userModel
        });
      })
      .catch((err) => {
        ErrorUtils.errorCallback(err, res);
      });
  },

  delete(req, resp) {
    const id = req.param('userId');
    if (!Utils.checkIsMongoId(id, resp)) {
      return false;
    }

    const collection = axel.models.user.em;
    collection
      .findByPk(id)
      .then((user) => {
        if (!user) {
          throw new ExtendedError({
            code: 404,
            message: `User with id ${id} wasn't found`,
            errors: [`User with id ${id} wasn't found`]
          });
        }

        const deletedSuffix = `deleted-${Date.now()}-${Math.floor(Math.random() * 100000 + 1)}`;
        return collection.destroy({
          where: {
            [primaryKey]: user[primaryKey]
          }
        });
        /*
        // this section is in case of soft deletion
        return collection
          .update(
            {
              email: `${user.email}-${deletedSuffix}`,
              phonenumber: `${user.phonenumber}-${deletedSuffix}`,
              facebookId: null,
              googleId: null,
              deactivated: true,
              deactivatedOn: new Date(),
            },
            {
              where: {
                [primaryKey]: user[primaryKey],
              },
            },
          );
          */
      })
      .then(() => {
        resp.status(200).json({
          body: true
        });
      })
      .catch((err) => {
        ErrorUtils.errorCallback(err, resp);
      });
  }
};
