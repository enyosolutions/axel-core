const { has, get } = require('lodash');
const axel = require('../axel');
const debug = require('debug')('axel:api:hooks');

module.exports.execHook = async (modelName, hookName, ...rest) => {
  if (axel.hooks._global && axel.hooks._global[hookName]) {
    await axel.hooks._global[hookName](...rest);
  }
  if (has(axel, `models.${modelName}.hooks.${hookName}`)) {
    debug('executing hook', `models.${modelName}.hooks.${hookName}`);
    const func = get(axel, `models.${modelName}.hooks.${hookName}`);
    const output = func(...rest);
    if (output && output.then) {
      await output;
      return null;
    }
    return null;
  }
  return null;
};
module.exports.getPrimaryKey = (endpoint) => {
  if (!axel.models[endpoint]) {
    return;
  }
  return axel.models[endpoint].primaryKeyField || axel.models[endpoint].em.primaryKeyField
    || axel.config.framework.primaryKeyField || axel.config.framework.primaryKey;
};
