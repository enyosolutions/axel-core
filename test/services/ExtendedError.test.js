const ExtendedError = require('../../src/services/ExtendedError');


// @ts-ignore
// const testConfig = require(`${axel.rootPath}/tmp/testConfig.json`);

global.testStore = {};

describe('user APIS TESTING :: ', () => {
  // const entity = 'user';
  // const entityApiUrl = '/api/user';
  // const primaryKey = axel.config.framework.primaryKey;

  // POST
  describe('#METHODS() :: ', () => {
    describe('EXTENDED ERROR :: ', () => {
      it('Basic methods', () => {
        const error = new ExtendedError();
        expect(error.name).toBeDefined();
        expect(error.code).toBeDefined();
        expect(error.message).toBeDefined();
        expect(error.errors).toBeDefined();
      });

      it('should have a POST method', () => {
        const data = {
          code: 404,
          message: 'not_found'
        };
        const error = new ExtendedError(data);
        expect(error.code).toBeDefined();
        expect(error.code).toBe(404);
        expect(error.message).toBe(data.message);
        expect(error.errors).toMatchObject([]);
      });

      it('should have a POST method', () => {
        const error = new ExtendedError();
        expect(error.code).toBeDefined();
        expect(error.message).toBeDefined();
      });
    });
  });
});
