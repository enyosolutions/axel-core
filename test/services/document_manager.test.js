// const model = require('../../src/api/models/schema/user');
const DocumentManager = require('../../src/services/DocumentManager');


// @ts-ignore
// const testConfig = require(`${axel.rootPath}/tmp/testConfig.json`);

global.testStore = {};

describe('user APIS TESTING :: ', () => {
  // const entity = 'user';
  // const entityApiUrl = '/api/user';
  // const primaryKey = axel.config.framework.primaryKey;

  // POST
  describe('#METHODS() :: ', () => {
    describe('WITHOUT TOKEN :: ', () => {
      it('should have a POST method', () => {
        expect(DocumentManager.httpUpload).toBeDefined();
        expect(DocumentManager.base64Upload).toBeDefined();
        expect(DocumentManager.delete).toBeDefined();
        expect(DocumentManager.deleteFile).toBeDefined();
      });
    });
  });
});
