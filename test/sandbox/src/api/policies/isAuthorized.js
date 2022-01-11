/**
 * isAuthorized
 *
 * @description :: Policy to check if user is authorized with JSON web token
 */

const core = require('axel-core');

const { AuthService } = core;
const debug = require('debug')('app:policies:isAuthorized');

module.exports = function isAuthorized(req, res, next) {
  let token;
  if (
    req.headers
    && req.headers.authorization
  ) {
    if (
      req.headers.authorization.indexOf('Bearer') === -1) {
      return res.status(401).json({
        errors: ['error_no_authorization_wrong_format'],
        message: 'error_no_authorization_wrong_format',
      });
    }
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2) {
      const scheme = parts[0];
      const credentials = parts[1];

      if (/^Bearer$/i.test(scheme)) {
        token = credentials;
      }
    } else {
      return res.status(401).json({
        errors: ['error_no_authorization_wrong_format'],
        message: 'error_no_authorization_wrong_format',
      });
    }
  } else if (req.query.token) {
    token = req.query.token;
    // We delete the token from param to not mess with blueprints
    delete req.query.token;
  } else {
    return res.status(401).json({
      message: 'error_no_authorization_header',
      errors: ['error_no_authorization_header'],
    });
  }
  if (!token || typeof token !== 'string') {
    return res.status(401).json({
      errors: ['error_authorization_token_wrong_format'],
      message: 'error_authorization_token_wrong_format',
    });
  }

  AuthService.verify(token, async (error, decryptedToken) => {
    if (error) {
      axel.logger.verbose('[ISAUTHORIZED]', error.message || error);
      return res.status(401).json({
        errors: ['error_invalid_token'],
        message: 'error_invalid_token',
      });
    }

    req.user = decryptedToken; // This is the decrypted token or the payload you provided
    try {
      req.user = await axel.models.user.em.findOne({ where: { id: decryptedToken.id } }); // This is the decrypted token or the payload you provided
    } catch (err) {
      return res.status(401).json({
        errors: [err.message],
        message: 'error_invalid_token',
      });
    }
    next();
  });
};
