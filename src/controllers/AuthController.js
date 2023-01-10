/**
 * AuthController
 *
 * @module      :: Controller
 * @description    :: Provides the base authentication
 *                 actions used to make waterlock work.
 *m
 * @docs        :: http://waterlock.ninja/documentation
 */

const bcrypt = require('bcrypt');
const _ = require('lodash');
const dayjs = require('dayjs');

const { ExtendedError } = require('../services/ExtendedError.js');
const AuthService = require('../services/AuthService.js');
const ErrorUtils = require('../services/ErrorUtils.js');
const Utils = require('../services/Utils.js');

const primaryKey = axel.config.framework && axel.config.framework.primaryKey;
const userModelName = _.get(
  axel,
  'config.plugins.admin.config.userModelName',
  'user'
);

const rolesWithAccessToBackoffice = _.get(
  axel,
  'config.plugins.admin.config.rolesWithAccessToBackoffice',
  _.get(axel, 'config.framework.rolesWithAccessToBackoffice', [])
);

module.exports = {
  /**
   * @description get the data for the current user
   * @return {User}
   * @swagger
   * /auth/user:
   *   get:
   *     description: Get the current logger user
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: success
   */
  get(req, res) {
    if (!req.user) {
      res.status(401).json({
        message: 'error_no_token',
        errors: ['error_no_token'],
      });
      return;
    }

    const userModel = axel.models[userModelName];

    userModel.em
      .findOne({
        where: { [primaryKey]: req.user[primaryKey] },
        raw: true,
      })
      .then((user) => {
        if (user) {
          if (!user.roles || typeof user.roles === 'string') {
            user.roles = ['USER'];
          }
          user.visits += 1;
          userModel.em.update(user, {
            where: {
              id: user.id,
            },
          });

          return res.status(200).json({
            user: Utils.sanitizeUser(user),
          });
        }
        return res.status(404).json({
          message: 'no_user_found',
          errors: ['no_user_found'],
        });
      })
      .catch((err) => {
        axel.logger.warn(err);
        ErrorUtils.errorCallback(err, res);
      });
  },

  /**
   * [description]
   * @param  req
   * @param  res
   * @return void
   *
   * @swagger
   *
   * /auth/forgot:
   *   get:
   *     description: sends a new password reset email
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: email
   *         description: Email/username to use for login.
   *         required: false
   *         in: formData
   *         type: string
   *     responses:
   *       200:
   *         description: success
   */
  async forgot(req, res, next) {
    try {
      const email = req.body.email;
      if (!email) {
        throw new ExtendedError({
          code: 401,
          errors: ['error_email_required'],
          message: 'error_email_required',
        });
      }
      const userModel = axel.models[userModelName];
      const user = await userModel.em.findOne({
        where: { email },
        raw: true,
      });
      if (!user) {
        return res.json({ message: 'ok' });
      }

      let hash = bcrypt.hashSync(
        `${Date.now()} ${user.id}`,
        bcrypt.genSaltSync()
      );
      hash = hash.replace(/\//g, '');
      hash = hash.replace(/\./g, '-');

      user.passwordResetToken = hash;
      user.passwordResetRequestedOn = new Date();
      const success = await userModel.em.update(
        {
          passwordResetToken: hash,
          passwordResetRequestedOn: user.passwordResetRequestedOn,
        },
        {
          where: {
            email,
          },
        }
      );
      if (!success) {
        return res.status(403).json({
          errors: ['error_forbidden'],
          message: 'error_forbidden',
        });
      }
      if (axel.services && axel.services.mailService) {
        const passwordResetUrl = `${axel.config.apiUrl}/admin-panel/reset-password/${user.passwordResetToken}`;

        await axel.services.mailService.sendPasswordReset(user.email, {
          passwordResetUrl,
          user,
        });
      } else {
        axel.logger.warn(
          'axel.services.mailService.sendPasswordReset is not defined. We need that function to send password reset emails'
        );
        res.status(200).json({ success: true });
      }
      res.status(200).json({});
    } catch (err) {
      axel.logger.warn('Forgot password error', err);
      next(err);
    }
  },

  /**
   *
   */
  getByResetToken(req, res) {
    const resetToken = req.body.resetToken || req.params.resetToken;

    if (!resetToken) {
      return res.status(404).json({
        errors: ['missing_argument'],
        message: 'missing_argument',
      });
    }
    const userModel = axel.models[userModelName];

    userModel.em
      .findOne({
        where: {
          passwordResetToken: resetToken,
        },
        raw: true,
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
          !data.passwordResetRequestedOn
          || dayjs(data.passwordResetRequestedOn).add(10, 'm').isBefore(new Date())
        ) {
          throw new ExtendedError({
            code: 401,
            stack: 'expired_token',
            message: 'expired_token',
            errors: ['expired_token'],
          });
        }
        return res.json({
          resetToken: data.resetToken,
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

  /**
   *
   */
  confirm(req, res) {
    const activationToken = req.query.token;
    const userId = req.params.userId;

    if (!activationToken) {
      return res.status(404).json({
        errors: ['missing_argument'],
        message: 'missing_argument',
      });
    }
    const userModel = axel.models[userModelName];
    let user;
    userModel.em
      .findOne({
        where: {
          [primaryKey]: userId,
          activationToken,
        },
        raw: true,
      })
      .then((data) => {
        if (!data) {
          throw new ExtendedError({
            code: 401,
            message: 'invalid_link',
            errors: ['invalid_link'],
          });
        }
        user = data;
        data.activationToken = '';
        data.isActive = true;
        data.hasConfirmedEmail = true;
        return userModel.em.update(data, {
          where: {
            activationToken,
          },
        });
      })
      .then(() => {
        if (req.xhr) {
          return res.json({
            success: true,
          });
        }
        res.redirect(`${axel.config.websiteUrl}/admin-panel/`);
      })
      .catch((err) => {
        res.status(err.code ? parseInt(err.code) : 400).json({
          errors: [err.message || 'global_error'],
          message: err.message || 'global_error',
        });
      });
  },

  reset(req, res, next) {
    const resetToken = req.body.resetToken || req.params.resetToken;

    if (req.params.resetToken) {
      axel.logger.warn(
        '@deprecated: please pass the request token via the body'
      );
    }

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
    const userModel = axel.models[userModelName];

    userModel.em
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
        user = u.get();
        if (
          !user.passwordResetRequestedOn
          || dayjs(user.passwordResetRequestedOn).add(20, 'm').isBefore(new Date())
        ) {
          throw new ExtendedError({
            code: 401,
            message:
              'The password reset request has expired, please try again.',
            errors: ['expired_token'],
          });
        }
        user.password = req.body.password;
        return AuthService.beforeUpdate(user);
      })
      .catch((err) => {
        res.status(err.code ? parseInt(err.code) : 400).json({
          errors: [err.message || 'not_found'],
          message: err.message || 'not_found',
        });
      })
      .then((result) => {
        if (result) {
          user.passwordResetToken = '';
          return userModel.em.update(user, {
            where: {
              [primaryKey]: user[primaryKey],
            },
          });
        }
        return null;
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
        return null;
      })
      .catch((err) => {
        next(err);
      });
  },

  /**
   * @swagger
   *
   * /auth/login:
   *   post:
   *     description: Login to the application
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: email
   *         description: Email/username to use for login.
   *         required: false
   *         in: body
   *         type: string
   *       - name: password
   *         description: User's password.
   *         in: body
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: user object and login token
   *         schema:
   *           type: object
   *           properties:
   *             token:
   *               type: string
   *               description: The jwt token for subsequent requests
   *             user:
   *               type: 'object'
   *               $ref: '#/definitions/User'
   */
  login(req, res) {
    const email = req.body.email;
    const password = req.body.password;
    let token;
    let user;
    if (!email || !password) {
      return res.status(401).json({
        errors: ['error_missing_credentials'],
        message: 'error_missing_credentials',
      });
    }

    const userModel = axel.models[userModelName];

    userModel.em
      .findOne({
        where: {
          email,
        },
        raw: true,
      })
      .then((u) => {
        user = u;
        if (!u) {
          throw new Error('error_unknown_email');
        }

        return AuthService.comparePassword(password, user);
      })
      .then((valid) => {
        if (!valid) {
          throw new Error('error_invalid_credentials');
        }

        if (!user.isActive || user.deactivated) {
          throw new Error('error_deactivated_user');
        }

        if (!user.roles) {
          user.roles = ['USER'];
        }

        if (typeof user.roles === 'string') {
          try {
            user.roles = JSON.parse(user.roles);
          } catch (e) {
            user.roles = ['USER'];
          }
        }

        // if the user does not have any of the roles needed for the BO
        if (
          !user.roles
          || user.roles.every(
            role => !rolesWithAccessToBackoffice.includes(role)
          )
        ) {
          throw new ExtendedError({
            code: 403,
            message: 'error_forbidden_access_to_bo',
          });
        }
        token = AuthService.generateToken(user);
        if (!user.logins) {
          user.visits = 0;
          user.logins = 0;
        }

        user.logins += 1;
        user.visits += 1;
        user.lastConnexionOn = new Date();

        const updatedUser = _.cloneDeep(user);

        return userModel.em.update(updatedUser, {
          where: {
            id: updatedUser.id,
          },
        });
      })
      // eslint-disable-next-line no-undef
      .then((valid) => {
        if (!valid) {
          throw new Error('error_deactivated_user');
        }
        return null;
      })
      .then(() => res.status(200).json({
        user: Utils.sanitizeUser(user),
        token,
      }))
      .catch((errUpdate) => {
        if (errUpdate.message) {
          return res.status(401).json({
            errors: [errUpdate.message],
            message: errUpdate.message,
          });
        }

        axel.logger.warn(errUpdate);

        ErrorUtils.errorCallback(errUpdate, res);
      });
  },
};
