const debug = require('debug')('axel:api:hooks');
const { has, get } = require('lodash');
const axel = require('../axel');

module.exports.execHook = async (modelName, hookName, context, ...rest) => {
  if (axel.hooks._global && axel.hooks._global[hookName]) {
    if (hookName.startsWith('before')) {
      context.modelName = modelName;
      context.hookName = hookName;
    }
    else {
      rest[0].modelName = modelName;
      rest[0].hookName = hookName;
    }
    await axel.hooks._global[hookName](context, ...rest);
  }
  if (has(axel, `models.${modelName}.hooks.${hookName}`)) {
    debug('executing hook', `models.${modelName}.hooks.${hookName}`);
    const func = get(axel, `models.${modelName}.hooks.${hookName}`);
    const output = func(context, ...rest);
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
