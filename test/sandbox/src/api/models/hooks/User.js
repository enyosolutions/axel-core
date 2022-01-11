/* eslint no-unused-vars: ["error", { "args": "none" }] */
/**
* User  hooks. See https://sequelize.org/master/manual/hooks.html
* for more infos.
* LIst of hooks can be found here https://github.com/sequelize/sequelize/blob/v6/lib/hooks.js#L7
* Be sure sure to set the hooks for both individual and bulkUpdates
*/
// before
module.exports.beforeCreate = (user, options) => { };
module.exports.beforeDestroy = (user, options) => { };
module.exports.beforeUpdate = (user, options) => { };
module.exports.beforeSave = (user, options) => { };
module.exports.beforeUpsert = (values, options) => { };

module.exports.beforeBulkCreate = (users, options) => { };
module.exports.beforeBulkDestroy = (options) => { };
module.exports.beforeBulkUpdate = (options) => { };

module.exports.beforeFind = (users, options) => { };

// After
module.exports.afterCreate = (user, options) => { };
module.exports.afterDestroy = (user, options) => { };
module.exports.afterUpdate = (user, options) => { };
module.exports.afterSave = (user, options) => { };
module.exports.afterUpsert = (created, options) => { };

module.exports.afterBulkCreate = (users, options) => { };
module.exports.afterBulkDestroy = (options) => { };
module.exports.afterBulkUpdate = (options) => { };

module.exports.afterFind = (users, options) => { };
