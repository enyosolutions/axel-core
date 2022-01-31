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
const core = require('axel-core');

const { ExtendedError, AuthService, Tools } = core;
const MailService = require('../../services/common/MailService');

const GoogleAuthService = require('../../services/GoogleAuthService');
const FacebookAuthService = require('../../services/FacebookAuthService');

const primaryKey = axel.config.framework.primaryKey;
// const {flatten} = require('flat');
// const {unfflatten} = require('flat');

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
    if (!req.user || !req.user[primaryKey]) {
      res.status(401).json({
        message: 'error_no_token',
        errors: ['error_no_token'],
      });
      return;
    }

    axel.models.user.em
      .findOne({
        where: { [primaryKey]: req.user[primaryKey] },
        raw: false
      })
      .then((user) => {
        if (user) {
          user = user.get();

          if (!user.roles) {
            user.roles = ['USER'];
          }

          if (user.roles && typeof user.roles === 'string') {
            try {
              user.roles = JSON.parse(user.roles);
            } catch (e) {
              user.roles = ['USER'];
            }
          }
          return res.status(200).json({
            user: _.omit(user, [
              'password',
              'encryptedPassword',
              'passwordResetRequestedAt',
              'passwordResetToken',
              'googleToken',
              'facebookToken',
            ]),
          });
        }
        return res.status(404).json({
          message: 'no_user_found',
          errors: ['no_user_found'],
        });
      })
      .catch((err) => {
        axel.logger.warn(err);
        Tools.errorCallback(err, res);
      });
  },

  /**
   * @description confirm the registration of the user
   * @return {User}
   * @swagger
   * /auth/confirm:
   *   get:
   *     description: Confirm the registration of user
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: success
   */

  confirmUserRegistration(req, res) {
    const email = req.param('email');
    const token = req.query.token;

    if (!email) {
      return res.status(404).json({
        errors: ['missing_email'],
        message: 'missing_email',
      });
    }

    if (!token) {
      return res.status(404).json({
        errors: ['missing_activation_token'],
        message: 'missing_activation_token',
      });
    }

    axel.models.user.em
      .findOne({
        where: { email },
      })
      .then((u) => {
        if (!u) {
          throw new ExtendedError({
            code: 400,
            errors: ['error_unknown_email'],
            message: 'error_unknown_email',
          });
        }

        if (token !== u.activationToken) {
          throw new ExtendedError({
            code: 404,
            errors: ['wrong_activation_token'],
            message: 'wrong_activation_token',
          });
        }

        return axel.models.user.em.update(
          {
            isActive: true,
            hasConfirmedEmail: true,
            activationToken: null,
          },
          {
            where: {
              email,
            },
          },
        );
      })
      .then(() => res.redirect(`${axel.config.websiteUrl}/register`),)
      .catch((err) => {
        axel.logger.warn(err);
        Tools.errorCallback(err, res);
      });
  },

  /**
   * [description]
   * @param  {[type]}
   * @param  {[type]}
   * @return {[type]}
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
    const email = req.body.email || req.query.email;
    let user;
    if (!email) {
      throw new ExtendedError({
        code: 401,
        errors: ['error_email_required'],
        message: 'error_email_required',
      });
    }

    axel.models.user.em
      .findOne({
        where: { email },
      })
      .then((u) => {
        user = u;
        if (!user) {
          throw new ExtendedError({
            code: 400,
            errors: ['error_unknown_email'],
            message: 'error_unknown_email',
          });
        }

        let hash = bcrypt.hashSync(`${Date.now()} ${user.id}`, bcrypt.genSaltSync());
        hash = hash.replace(/\//g, '');
        hash = hash.replace(/\./g, '-');
        user.passwordResetToken = hash;

        user.passwordResetRequestedAt = new Date();
        return axel.models.user.em.update(
          {
            passwordResetToken: hash,
            passwordResetRequestedAt: user.passwordResetRequestedAt,
          },
          {
            where: {
              email,
            },
          },
        );
      })
      .then((success) => {
        if (!success) {
          return res.status(403).json({
            errors: ['error_forbidden'],
            message: 'error_forbidden',
          });
        }
        MailService.sendPasswordReset(user.email, {
          user,
        });
        return res.status(200).json({});
      })
      .catch((err) => {
        axel.logger.warn(err);
        Tools.errorCallback(err, res);
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
    console.log('[AuthController] admin login');
    const isAdminLogin = req.path.indexOf('admin_login') > -1;

    if (!email || !password) {
      return res.status(401).json({
        errors: ['error_missing_credentials'],
        message: 'error_missing_credentials',
      });
    }

    axel.models.user.em
      .findOne({
        where: {
          email,
        },
        raw: false,
      })
      .then((u) => {
        if (u) {
          u = u.get();
        }

        user = u;
        if (!u) {
          throw new Error('error_unknown_email');
        }

        if (!u.roles || (isAdminLogin && !AuthService.hasRole(user, 'ADMIN'))) {
          throw new ExtendedError({ message: 'error_forbidden_access' });
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

        if (user.roles && typeof user.roles === 'string') {
          try {
            user.roles = JSON.parse(user.roles);
          } catch (e) {
            user.roles = ['USER'];
          }
        }

        token = AuthService.generateToken(_.pick(user, ['id']));
        user.lastConnexionOn = new Date();

        const updatedUser = _.cloneDeep(user);

        return axel.models.user.em.update({ lastConnexionOn: new Date() }, {
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
      })
      .then(() => res.status(200).json({
        user,
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

        Tools.errorCallback(errUpdate, res);
      });
  },

  /**
   * [googleAuth description]
   * [description Get the login url for google]
   * @method
   * @param  {[type]} req [description]
   * @param  {[type]} res [description]
   * @return {[type]}     [description]
   */
  gmailAuth(req, res) {
    res.json({
      body: GoogleAuthService.getGmailUrl()
    });
  },

  async googleCallback(req, res) {
    const googleToken = req.query.token || req.body;
    let email = '';
    let token;
    let newUserModel;
    let user;
    let newUserCreated = false;
    GoogleAuthService.getGoogleAccountFromToken(googleToken)
      .then((account) => {
        if (!account) {
          throw new Error('error_wrong_google_token');
        }

        email = account.email;

        newUserModel = {
          email: email.toLowerCase(),
          googleId: account.googleId,
          firstName: account.firstName,
          lastName: account.lastName,
          roles: JSON.stringify(['USER']),
          active: true,
        };

        return axel.models.user.em.findOne({
          where: {
            email,
          },
        });
      })
      .then((u) => {
        if (!u) {
          newUserCreated = true;
          return axel.models.user.em.create(newUserModel, {
          });
        }
      })
      .then(() => axel.models.user.em.findOne({
        where: {
          email,
        },
        raw: false,
        nest: true
      }))
      .then((dbUser) => {
        if (dbUser) {
          user = dbUser.get();

          if (user.roles && typeof user.roles === 'string') {
            try {
              user.roles = JSON.parse(user.roles);
            } catch (e) {
              axel.logger.warn(e);
            }
          }

          // If user created successfuly we return user and token as response
          token = AuthService.generateToken(_.pick(user, ['id']));

          user.lastConnexionOn = new Date();

          return axel.models.user.em.update({ lastConnexionOn: new Date() }, {
            where: {
              [primaryKey]: user[primaryKey],
            },
          });
        }

        throw new Error('user_not_created');
      })
      // eslint-disable-next-line no-undef
      .then(() => {
        res.status(200).json({
          user,
          token,
        });
      })
      .catch((err) => {
        console.log('googleCallback', err.response);
        axel.logger.warn(err && err.message ? err.message : err);
        Tools.errorCallback(err, res);
      });
  },

  async facebookCallback(req, res) {
    let facebookAccount;
    const facebookToken = req.query.token;
    let email = '';
    let token;
    let newUserModel;
    let user;
    let newUserCreated = false;

    FacebookAuthService.getFacebookAccountDetails(facebookToken)
      .then((account) => {
        facebookAccount = account;

        email = facebookAccount.email;

        if (!email) {
          email = `${facebookAccount.id}@facebook.com`;
        }

        const facebookId = facebookAccount.facebookId;

        if (!facebookId || !email) {
          throw new Error('error_missing_fb_profile_data');
        }

        newUserModel = {
          email: email.toLowerCase(),
          facebookId,
          firstName: facebookAccount.firstName,
          lastName: facebookAccount.lastName,
          roles: JSON.stringify(['USER']),
          active: true,
        };

        return axel.models.user.em.findOne({
          where: {
            email,
          },
          raw: false,
        });
      })

      .then(async (u) => {
        if (!u) {
          newUserCreated = true;

          await axel.models.user.em.create(newUserModel, {
            raw: true,
          });
          return axel.models.user.em.findOne({
            where: {
              email,
            },
            raw: true,
          });
        }
        return u.get();
      })
      .then((dbUser) => {
        if (dbUser) {
          user = dbUser;

          if (user.roles && typeof user.roles === 'string') {
            try {
              user.roles = JSON.parse(user.roles);
            } catch (e) {
              axel.logger.warn(e);
            }
          }

          // If user created successfuly we return user and token as response
          token = AuthService.generateToken(user);

          if (user.activationToken) {
            delete user.activationToken;
          }


          user.lastConnexionOn = new Date();

          return axel.models.user.em.update({ lastConnexionOn: new Date() }, {
            where: {
              [primaryKey]: user[primaryKey],
            },
          });
        }

        throw new Error('user_not_created');
      })
      // eslint-disable-next-line no-undef
      .then(() => {
        res.status(200).json({
          user,
          token,
        });
      })
      .catch((err) => {
        axel.logger.warn(err && err.message ? err.message : err);
        Tools.errorCallback(err, res);
      });
  },
};
