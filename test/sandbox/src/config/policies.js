/**
 * Policy Mappings
 * (App.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://App.s.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://App.s.org/#!/documentation/reference/App.config/App.config.policies.html
 */

module.exports.policies = {
  /*
   **************************************************************************
   *                                                                          *
   * Default policy for all controllers and actions (`true` allows public     *
   * access)                                                                  *
   *                                                                          *
   **************************************************************************
   */

  // '*': true,

  'core/AppController': {
    models: ['isAuthorized'],
    createController: true,
  },
  UserController: {
    list: ['isAuthorized'],
    update: ['isAuthorized'],
    get: ['isAuthorized'],
    delete: ['isAuthorized'],
    create: true,
    getByResetToken: true,
    reset: true,
    exists: true,
  },
  CrudSqlController: {
    '*': ['isAuthorized'],
  },
  AuthController: {
    login: [],
    forgot: [],
    get: ['isAuthorized'],
  },
};
