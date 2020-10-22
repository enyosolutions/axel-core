import _ from 'lodash';

type ErrorTypeKeys = 'name' | 'code' | 'message' | 'errors';
export class ExtendedError extends Error {
  /**
   *
   *
   * @type {string}
   * @memberof ExtendedError
   */
  name: string;
  code?: string;
  message: string;
  errors?: Error[] | string[];
  constructor(message: string | object) {
    super('');
    if (!message || _.isString(message)) {
      super(message);
      this.name = 'ExtendedError';
      this.message = message || '';
    } else {
      this.message = 'ExtendedError';
      Object.keys(message).forEach((i: string) => {
        // @ts-ignore
        this[i] = message[i];
      });
    }
  }

  toString = () => (_.isString(this.message) ? this.message : JSON.stringify(this.message));
}


// @ts-ignore
global.ExtendedError = ExtendedError;