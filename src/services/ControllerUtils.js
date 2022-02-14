const { has, get } = require('lodash');

module.exports.execHook = async (modelName, hookName, ...rest) => {
  if (has(axel, `models.${modelName}.hooks.${hookName}`)) {
    const func = get(axel, `models.${modelName}.hooks.${hookName}`);
    const output = func(...rest);
    if (output && output.then) {
      await output;
      return null;
    }
    return Promise.resolve(null);
  }
};
module.exports.getPrimaryKey = (endpoint) => {
  if (!axel.models[endpoint]) {
    return;
  }
  return axel.models[endpoint].primaryKeyField || axel.models[endpoint].em.primaryKeyField
    || axel.config.framework.primaryKeyField || axel.config.framework.primaryKey;
};
