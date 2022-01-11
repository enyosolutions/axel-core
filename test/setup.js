const debug = require('debug')('app:test:setup');
const runtime = require('regenerator-runtime/runtime');
module.exports = async () => {
  return runtime;
}
