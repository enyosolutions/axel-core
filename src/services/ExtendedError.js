const _ = require('lodash');

class ExtendedError extends Error {
  /**
   * @type string
   * @memberof ExtendedError
   */
  constructor(message) {

    this.name = '';
    this.code = 0;
    this.message = '';
    this.errors = [];
    if (!message || _.isString(message)) {
      super(message);
      this.name = 'ExtendedError';
      this.message = message || '';
    } else {
      this.message = 'ExtendedError';
      super(this.message);
      Object.keys(message).forEach((i) => {
        // @ts-ignore
        this[i] = message[i];
      });
    }
  }

  toString = () => (_.isString(this.message) ? this.message : JSON.stringify(this.message));
}


// @ts-ignore
global.ExtendedError = ExtendedError

module.exports = ExtendedError;
module.exports.ExtendedError = ExtendedError;