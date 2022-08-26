// const model = require('../../src/api/models/schema/user');
const CrudSqlController = require('../../src/controllers/CrudSqlController.js');


// @ts-ignore
// const testConfig = require(`${axel.rootPath}/tmp/testConfig.json`);

global.testStore = {};

describe('CrudSqlController TESTING :: ', () => {
  // POST
  describe('#METHODS() :: ', () => {
    it('should have a create method', () => {
      expect(CrudSqlController.create).toBeDefined();
    });
    it('should have a findAll method', () => {
      expect(CrudSqlController.findAll).toBeDefined();
    });
    it('should have a update method', () => {
      expect(CrudSqlController.update).toBeDefined();
    });
    it('should have a deleteOne method', () => {
      expect(CrudSqlController.deleteOne).toBeDefined();
    });
    it('should have a delete method', () => {
      expect(CrudSqlController.delete).toBeDefined();
    });
  });
});
