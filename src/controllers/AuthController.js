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

const { ExtendedError } = require('../services/ExtendedError.js');
const AuthService = require('../services/AuthService.js');
const ErrorUtils = require('../services/ErrorUtils.js');

const primaryKey = axel.config.framework.primaryKey;
// const flatten =  require('flat');
// const unfflatten =  require('flat'.unfflatten);

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
        errors: ['error_no_token']
      });
      return;
    }

    axel.models.user.em
      .findByPk(req.user[primaryKey])
      .then((user) => {
        if (user) {
          if (!user.roles || typeof user.roles === 'string') {
            user.roles = ['USER'];
          }
          user.visits += 1;
          axel.models.user.em.update(user, {
            where: {
              id: user.id
            }
          });

          return res.status(200).json({
            user
          });
        }
        return res.status(404).json({
          message: 'no_user_found',
          errors: ['no_user_found']
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
  forgot(req, res) {
    const email = req.body.email;
    let user;
    if (!email) {
      throw new ExtendedError({
        code: 401,
        errors: ['error_email_required'],
        message: 'error_email_required'
      });
    }

    axel.models.user.em
      .findOne({
        where: { email }
      })
      .then((u) => {
        user = u;
        if (!user) {
          throw new ExtendedError({
            code: 400,
            errors: ['error_unknown_email'],
            message: 'error_unknown_email'
          });
        }

        let hash = bcrypt.hashSync(`${Date.now()} ${user.id}`, bcrypt.genSaltSync());
        hash = hash.replace(/\//g, '');
        hash = hash.replace(/\./g, '-');
        user.resetToken = hash;

        user.passwordResetRequestedOn = new Date();
        return axel.models.user.em.update(
          {
            $set: {
              resetToken: hash,
              passwordResetRequestedOn: user.passwordResetRequestedOn
            }
          },
          {
            where: {
              email
            }
          }
        );
      })
      .then((success) => {
        if (!success) {
          return res.status(403).json({
            errors: ['error_forbidden'],
            message: 'error_forbidden'
          });
        }
        if (axel.services && axel.services.mailService) {
          axel.services.mailService.sendPasswordReset(user.email, {
            user
          });
        }
        return res.status(200).json({});
      })
      .catch((err) => {
        axel.logger.warn(err);
        ErrorUtils.errorCallback(err, res);
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
        message: 'error_missing_credentials'
      });
    }

    axel.models.user.em
      .findOne({
        where: {
          email
        }
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

        token = AuthService.generateToken(user);
        if (!user.logins) {
          user.visits = 0;
          user.logins = 0;
        }

        user.logins += 1;
        user.visits += 1;
        user.lastConnexionOn = new Date();

        const updatedUser = _.cloneDeep(user);

        return axel.models.user.em.update(updatedUser, {
          where: {
            id: updatedUser.id
          }
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
        user,
        token
      }))
      .catch((errUpdate) => {
        if (errUpdate.message) {
          return res.status(401).json({
            errors: [errUpdate.message],
            message: errUpdate.message
          });
        }

        axel.logger.warn(errUpdate);

        ErrorUtils.errorCallback(errUpdate, res);
      });
  }
};
