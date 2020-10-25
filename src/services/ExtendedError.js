import _ from 'lodash';

export class ExtendedError extends Error {
  /**
   *
   *
   * @type {string}
   * @memberof ExtendedError
   */
  name;
  code;
  message;
  errors;
  constructor(message) {
    super('');
    if (!message || _.isString(message)) {
      super(message);
      this.name = 'ExtendedError';
      this.message = message || '';
    } else {
      this.message = 'ExtendedError';
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

export default ExtendedError;