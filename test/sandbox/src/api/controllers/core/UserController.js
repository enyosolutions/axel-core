/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.axel.s.org/docs/controllers
 */

const moment = require('moment');
const _ = require('lodash');
const core = require('axel-core');

const {
  ExtendedError, AuthService, DocumentManager, Utils
} = core;
const MailService = require('../../services/common/MailService');


const primaryKey = axel.models.user && axel.models.user.em && axel.models.user.em.primaryKeyField
  ? axel.models.user.em.primaryKeyField
  : axel.config.framework.primaryKey;

module.exports = {
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
  create(req, res) {
    let token;
    if (!req.body.email) {
      return res.status(400).json({
        errors: ['error_missing_email'],
        message: 'error_missing_email',
      });
    }

    if (!req.body.password) {
      return res.status(400).json({
        errors: ['error_missing_password'],
        message: 'error_missing_password',
      });
    }

    if (!req.body.username) {
      if (axel.config.framework.user.username) {
        return res.status(400).json({
          errors: ['error_missing_username'],
          message: 'error_missing_username',
        });
      }
      req.body.username = req.body.email;
    }

    let newUser = req.body;
    if (newUser.email) {
      newUser.email = newUser.email.toLowerCase();
    }
    if (newUser.username) {
      newUser.username = newUser.username.toLowerCase();
    }
    axel.models.user.em
      .findOne({
        where: {
          email: newUser.email,
        },
      })
      .then((user) => {
        if (user) {
          throw new ExtendedError({
            code: 409,
            stack: 'error_conflict_email',
            message: 'error_conflict_email',
            errors: ['error_conflict_email'],
          });
        }

        if (!newUser.roles) {
          newUser.roles = ['USER'];
        }
        newUser.isActive = !axel.config.framework.emailConfirmationRequired
          && !axel.config.framework.accountManualVerification;

        return AuthService.beforeCreate(newUser);
      })
      .then((data) => {
        if (data) {
          return axel.models.user.em.create(newUser, {
            raw: false,
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
          return newUser;
        }
        throw new Error('user_not_created');
      })
      .then(() => {
        // If user created successfuly we return user and token as response
        if (axel.config.framework.user.emailConfirmationRequired) {
          newUser.activationToken = Utils.md5(`${Date.now() + Math.random() * 1000}`);
          newUser.isActive = false;
        } else {
          newUser.isActive = true;
        }
        return newUser;
      })
      .then(() => {
        if (
          newUser
          && newUser[primaryKey]
          && axel.config.framework.user.emailConfirmationRequired
        ) {
          return MailService.sendEmailConfirmation(newUser);
        }
        return true;
      })
      // eslint-disable-next-line no-undef
      .then(() => {
        delete newUser.encryptedPassword;
        if (newUser[primaryKey]) {
          res.status(201).json({
            user: newUser,
            token,
          });
        } else {
          res.status(503).json({
            errors: ['user_not_saved'],
            message: 'user_not_saved',
          });
        }
      })
      .catch((err) => {
        axel.logger.warn(err && err.message ? err.message : err);
        Utils.errorCallback(err, res);
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
        message: 'missing_argument',
      });
    }

    axel.models.user.em
      .findOne({
        where: {
          passwordResetToken: resetToken,
        },
      })
      .then((data) => {
        if (!data) {
          throw new ExtendedError({
            code: 401,
            stack: 'invalid_token',
            message: 'invalid_token',
            errors: ['invalid_token'],
          });
        }
        if (
          !data.passwordResetRequestedAt
          || moment(data.passwordResetRequestedAt)
            .add(10, 'm')
            .isBefore(new Date())
        ) {
          throw new ExtendedError({
            code: 401,
            stack: 'expired_token',
            message: 'The password reset request has expired, please try again.',
            errors: ['expired_token'],
          });
        }
        res.json({
          resetToken: data.passwordResetToken,
          [primaryKey]: data[primaryKey],
        });
      })
      .catch((err) => {
        res.status(err.code ? parseInt(err.code) : 400).json({
          errors: [err.message || 'global_error'],
          message: err.message || 'global_error',
        });
      });
  },

  reset(req, res) {
    const resetToken = req.param('resetToken');

    if (!resetToken) {
      return res.status(404).json({
        errors: ['missing_argument'],
        message: 'missing_argument',
      });
    }

    if (!req.body.password) {
      return res.status(404).json({
        errors: ['error_missing_password'],
        message: 'error_missing_password',
      });
    }

    let user;
    axel.models.user.em
      .findOne({
        where: {
          passwordResetToken: resetToken,
        },
      })
      .then((u) => {
        if (!u || u.length < 1) {
          throw new ExtendedError({
            code: 401,
            message: 'invalid_token',
            errors: ['invalid_token'],
          });
        }
        user = u;
        if (
          !user.passwordResetRequestedAt
          || moment(user.passwordResetRequestedAt)
            .add(20, 'm')
            .isBefore(new Date())
        ) {
          throw new ExtendedError({
            code: 401,
            message: 'The password reset request has expired, please try again.',
            errors: ['expired_token'],
          });
        }
        user.password = req.body.password;
        return AuthService.beforeUpdate(user);
      })
      .catch((err) => {
        res.status(err.code ? parseInt(err.code) : 400).json({
          errors: [err.message || 'item_not_found'],
          message: err.message || 'item_not_found',
        });
      })
      .then((result) => {
        if (result) {
          user.passwordResetToken = '';
          return axel.models.user.em.update(user, {
            where: {
              [primaryKey]: user[primaryKey],
            },
          });
        }
      })
      .catch((err) => {
        res.status(err.code ? parseInt(err.code) : 400).json({
          errors: [err.message || 'update_error'],
          message: err.message || 'update_error',
        });
      })
      .then((success) => {
        if (success) {
          res.status(200).json({
            body: 'password_reset_success',
          });
        }
      })
      .catch((err) => {
        res.status(400).json({
          message: 'global_error',
          errors: [err.message],
        });
      });
  },

  /**
   * @swagger
   *
   * /user:
   *   get:
   *     description: List the users
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: users
   *         schema:
   *           $ref: '#/definitions/User_ListResponse'
   */
  list(req, resp) {
    const { listOfValues, startPage, limit } = Utils.injectPaginationQuery(req);

    const options = {
      limit,
      skip: startPage * limit,
    };

    let query = Utils.injectQueryParams(req);

    if (req.query.search) {
      query = Utils.injectSqlSearchParams(req, query, {
        modelName: 'user',
      });
    }
    if (req.query.roles) {
      query.roles = {
        [axel.sqldb.Op.like]: axel.sqldb.literal(`'%"${req.query.roles}"%'`),
      };
    }
    query = Utils.cleanSqlQuery(query);

    axel.models.user.em
      .findAndCountAll(
        {
          where: query,
          include: [],
          raw: false,
        },
        options,
      )
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
              label: Utils.formatName(item.firstname, item.lastname, item.username, true),
            }));
          }

          return resp.status(200).json({
            body: data,
            page: startPage,
            count: limit,
            totalCount: result.count,
          });
        }
        return resp.status(200).json({
          body: [],
        });
      })
      .catch((err) => {
        resp.status(500).json({
          errors: [err.message],
          message: err.message,
        });
      });
  },
  /**
   * @swagger
   *
   * /user/{id}:
   *   get:
   *     description: get a user by it's id
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: id
   *         description: User object
   *         in:  url
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: users
   *         schema:
   *           $ref: '#/definitions/User_ItemResponse'
   */
  get(req, resp) {
    const id = req.param('userId');
    if (axel.mongodb) {
      if (!Utils.checkIsMongoId(id, resp)) {
        return false;
      }
    }
    const listOfValues = req.query.listOfValues ? req.query.listOfValues : false;
    const isLoggedIn = !!req.user;

    const queryParams = {
      include: [],
      raw: false,
    };

    if (!isLoggedIn) {
      queryParams.attributes = ['id', 'firstName', 'lastName', 'email', 'phonenumber', 'createdOn'];
    }

    axel.models.user.em
      .findOne({ where: { [primaryKey]: id } }, queryParams)
      .then((doc) => {
        if (!doc) {
          return resp.status(404).json({
            message: 'item_not_found',
            errors: ['item_not_found'],
          });
        }

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
              label: Utils.formatName(doc.firstname, doc.lastname, doc.username, true),
            },
          });
        }

        delete doc.password;
        delete doc.encryptedPassword;
        return resp.status(200).json({
          body: _.omit(doc, ['password', 'encryptedPassword', 'passwordResetRequestedAt', 'passwordResetToken', 'googleToken', 'facebookToken'])
          ,
        });
      })
      .catch((err) => {
        resp.status(500).json({
          errors: [err],
          message: err.message,
        });
      });
  },

  exists(req, resp) {
    const username = req.query.username;
    const email = req.query.email;
    if (!username && !email) {
      return resp.status(400).json({
        errors: ['missing_argument'],
        message: 'missing_argument',
      });
    }
    axel.models.user.em
      .findOne(username ? { where: { username: `${username}` } } : { where: { email: `${email}` } })
      .then((doc) => {
        if (doc) {
          return resp.status(200).json({
            body: true,
          });
        }
        return resp.status(200).json({
          body: false,
        });
      })
      .catch((err) => {
        Utils.errorCallback(err, resp);
      });
  },

  update(req, res) {
    let user;
    const newUser = req.body;
    let data;
    const id = req.params.userId;

    if (newUser.email === null) {
      if (axel.config.framework.user.email) {
        return res.status(404).json({
          errors: ['error_missing_email'],
          message: 'error_missing_email',
        });
      }
    }

    if (newUser.username === null) {
      if (axel.config.framework.user.username) {
        return res.status(404).json({
          errors: ['error_missing_username'],
          message: 'error_missing_username',
        });
      }
      newUser.username = newUser.email;
    }

    axel.models.user.em
      .findOne({ where: { [primaryKey]: id } }, {
        include: [],
        raw: false,
      })
      .then((u) => {
        if (!u) {
          throw new ExtendedError({
            code: 404,
            stack: 'item_not_found',
            message: 'item_not_found',
            errors: ['item_not_found'],
          });
        }

        //  u = u.get();
        user = u;

        if (!user.roles) {
          user.roles = [];
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
        delete req.body.password;

        // PREVENT USERS FROM MODIFYFING USERS ROLES·
        if (!(req.user && AuthService.hasRole(req.user, 'ADMIN'))) {
          delete newUser.roles;
        }
        if (
          user.roles.indexOf('DEVELOPER') > -1
          && newUser.roles
          && newUser.roles.indexOf('DEVELOPER') === -1
        ) {
          newUser.roles.push('DEVELOPER');
        }

        data = _.merge({}, user, newUser);

        data.roles = newUser.roles;

        // Delete if not required
        // data.lastModifiedOn = new Date();


        if (data.password) {
          return AuthService.beforeUpdate(data);
        }

        return data;
      })
      .then(() => {
        if (data) {
          return axel.models.user.em.update(data, {
            where: {
              [primaryKey]: data[primaryKey],
            },
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
      .then(() => axel.models.user.em.findOne({ where: { [primaryKey]: parseInt(id) } }, {
        include: [],
        raw: false,
      }))
      .then((userModel) => {
        if (userModel) {
          //   userModel = userModel.get();
          delete userModel.encryptedPassword;
        }

        res.json({
          user: userModel,
        });
      })
      .catch((err) => {
        Utils.errorCallback(err, res);
      });
  },

  delete(req, resp) {
    const id = req.param('userId');

    const collection = axel.models.user.em;
    collection
      .findOne({ where: { [primaryKey]: id } })
      .then((user) => {
        if (!user) {
          throw new ExtendedError({
            code: 404,
            message: `User with id ${id} wasn't found`,
            errors: [`User with id ${id} wasn't found`],
          });
        }

        const deletedSuffix = `deleted-${Date.now()}-${Math.floor(Math.random() * 100000 + 1)}`;

        return collection
          .destroy(
            {
              where: {
                [primaryKey]: user[primaryKey],
              },
            },
          );
      })
      .then(() => {
        resp.status(200).json({
          body: true,
        });
      })
      .catch((err) => {
        Utils.errorCallback(err, resp);
      });
  },

  uploadAvatar(req, resp) {
    const id = req.param('userId');
    if (axel.mongodb) {
      if (!Utils.checkIsMongoId(id, resp)) {
        return false;
      }
    }

    let user = null;
    let resultFilePath = '';

    const collection = axel.models.user.em;
    collection
      .findOne({ where: { [primaryKey]: id } })
      .then((u) => {
        if (!u) {
          throw new Error('error_user_not_found');
        }

        user = u;

        if (user.avatarUrl) {
          return DocumentManager.delete(user.avatarUrl);
        }
      })
      .then(() => DocumentManager.httpUpload(req, resp, {
        path: 'uploads/avatar',
        filePrefix: Date.now(),
      }))
      .then((filePath) => {
        if (filePath) {
          resultFilePath = filePath;

          return collection.update(
            {
              avatarUrl: filePath,
            },
            {
              where: {
                [primaryKey]: user[primaryKey],
              },
            },
          );
        }

        throw new ExtendedError({
          code: 404,
          stack: 'no_file_uploaded',
          message: 'no_file_uploaded',
          errors: ['no_file_uploaded'],
        });
      })
      .then(() => resp.status(200).json({
        body: resultFilePath,
      }))
      .catch((err) => {
        Utils.errorCallback(err, resp);
      });
  },
};
