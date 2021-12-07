const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const _ = require('lodash')
const d = require('debug');

const debug = d('axel:AuthService');


const {
  VerifyCallback, VerifyErrors, sign, verify: jverify
} = jwt
if (!axel.config.tokenSecret) {
  throw new Error('missing tokenSecret in your config');
}

const primaryKey = (axel.config.framework && axel.config.framework.primaryKey) || 'id'
const saltRounds = 10

const issue = (payload, expiry = '7d') => sign(
  payload,
  axel.config.tokenSecret, // Token Secret that we sign it with
  {
    expiresIn: expiry // Token Expire time
  }
)

// @fixme only id should be inserted in the token. The rest should fetched from the database / cache  with each request
const generateToken = (user, fields = null, expiry = '7d') => issue(
  fields && Array.isArray(fields) ? _.pick(user, fields)
    : {
      [primaryKey]: user[primaryKey],
      username: user.username,
      email: user.email,
      roles: user.roles
    }, expiry
)

// Verifies token on a request
function verify(token, callback) {
  return jverify(
    token, // The token to be verified
    axel.config.tokenSecret, // Same token we used to sign
    {}, // No Option,
    // for more see https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
    callback // Pass errors or decoded token to callback
  )
}

function beforeCreate(user) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(user.password, saltRounds, (error, hash) => {
      if (error) {
        return reject(error)
      }
      user.encryptedPassword = hash
      delete user.password
      delete user.cPassword
      delete user.confirmPassword
      resolve(user)
    })
  })
}

function beforeUpdate(user) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(saltRounds, (err, salt) => {
      if (err) return reject(err)
      if (user.password) {
        bcrypt.hash(user.password, salt, (err2, hash) => {
          if (err2) {
            return reject(err2)
          }
          user.encryptedPassword = hash
          delete user.password
          delete user.cPassword
          delete user.confirmPassword
          resolve(true)
        })
      } else {
        resolve(true)
      }
    })
  })
}

function comparePassword(password, user) {
  return new Promise((resolve, reject) => {
    if (!user || !user.encryptedPassword) {
      reject(new Error('error_invalid_credentials'))
    }
    bcrypt.compare(password, user.encryptedPassword, (err, match) => {
      if (err) resolve(err)
      if (match) {
        resolve(true)
      } else {
        reject(new Error('error_invalid_credentials'))
      }
    })
  })
}

// @todo add support for injection of roles checking methods
function tokenDecryptMiddleware(req, res, next) {

  let hasHeader = false
  if (
    req.headers &&
    req.headers.authorization &&
    req.headers.authorization.indexOf('Bearer') > -1
  ) {

    const parts = req.headers.authorization.split(' ')
    if (parts.length === 2) {
      const scheme = parts[0];
      const credentials = parts[1];
      if (/^Bearer$/i.test(scheme)) {
        const token = credentials;
        hasHeader = true;
        verify(token, (err, decryptedToken) => {
          if (err) {
            debug('err', err.message);
          }
          if (!err) {
            req.user = decryptedToken // This is the decrypted token or the payload you provided
            // App.session.token = decryptedToken;
            // This is the decrypted token or the payload you provided
            // You should add more validation here
            // >> token is not blacklisted
            // >> user still exists and is still allowed to use the api.
            // get the user from the database
          }
          next()
        })
      }
    }
  }
  // TODO add support for api_key in the query params

  // if there is no token
  if (!hasHeader) {
    next()
  }
}

function getExtendedRoles(role) {
  let myRoles = []
  if (
    axel.config.framework.roles[role] &&
    axel.config.framework.roles[role].inherits &&
    Array.isArray(axel.config.framework.roles[role].inherits)
  ) {
    myRoles = myRoles.concat(axel.config.framework.roles[role].inherits)
    axel.config.framework.roles[role].inherits.forEach((r) => {
      myRoles = myRoles.concat(getExtendedRoles(r))
    })
  }
  return _.uniq(myRoles)
}

function hasRole(user, role) {
  return user && user.roles && user.roles.indexOf(role) > -1
}

function hasAnyRole(user, _requiredRoles) {
  if (!user || !user.roles) {
    return false
  }
  let requiredRoles = []
  if (typeof _requiredRoles === 'string') {
    requiredRoles = [_requiredRoles]
  } else {
    requiredRoles = _requiredRoles
  }
  let myRoles = (user && user.roles) || user

  if (typeof (myRoles) === 'string') {
    myRoles = JSON.parse(myRoles)
  }
  // Check if role exists
  for (let i = 0; i < requiredRoles.length; i++) {
    const role = requiredRoles[i]
    if (!axel.config.framework.roles[role]) {
      axel.logger.warn(
        'ACTION REQUIRES AN EXISTING ROLE',
        role,
        Object.keys(axel.config.framework.roles)
      )
      return false
    }
  }
  if (!Array.isArray(myRoles)) {
    return false
  }
  myRoles.forEach((role) => {
    myRoles = myRoles.concat(getExtendedRoles(role))
  })
  let canAccess = false
  for (let i = 0; i < requiredRoles.length; i++) {
    const role = requiredRoles[i]
    if (myRoles.indexOf(role) > -1) {
      canAccess = true
      break
    }
  }

  return canAccess
}

module.exports = {
  beforeCreate,
  beforeUpdate,
  comparePassword,
  generateToken,
  generateFor: generateToken, // deprecated
  hasAnyRole,
  hasRole,
  issue,
  tokenDecryptMiddleware,
  verify
}
