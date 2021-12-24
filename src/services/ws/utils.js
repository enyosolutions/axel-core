const debug = require('debug')('axel:manager');
const fs = require('fs');
const serialize = require('serialize-javascript');
const _ = require('lodash');

module.exports.catchSignal = (signal, times = 1) => new Promise((resolve, reject) => {
  process.once(signal, () => {
    try {
      times -= 1;
      debug('[AXELMANAGER] Captured interruption signal....', times);
      if (times <= 0) {
        setTimeout(() => {
          process.kill(process.pid, signal);
          if (times < -10) {
            process.exit();
          }
        }, 1000);
        resolve();
      }
    } catch (err) {
      reject(err);
    }
  });
});


module.exports.serializeSchema = (name, schema) => {
  const schemaPath = `${process.cwd()}/src/api/models/schema/${_.upperFirst(name)}.js`;

  fs.writeFileSync(
    schemaPath,
    `module.exports = ${_.unescape(serialize({ ...schema, em: undefined, entity: undefined }, { space: 2, unsafe: false }))}`,
    { encoding: 'utf8' }
  );
};
module.exports.serializeModel = (name, schema) => {
  const modelPath = `${process.cwd()}/src/api/models/sequelize/${_.upperFirst(name)}.js`;

  fs.writeFileSync(
    modelPath,
    `module.exports = ${_.unescape(serialize({ ...schema, em: undefined, entity: undefined }, { space: 2, unsafe: false }))}`,
    { encoding: 'utf8' }
  );
};
