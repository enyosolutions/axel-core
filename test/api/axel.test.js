// const model = require('../../src/api/models/schema/user');



// @ts-ignore
// const testConfig = require(`${axel.rootPath}/tmp/testConfig.json`);
const path = require('path');
const process = require('process');

process.cwd = () => path.resolve(__dirname, '../sandbox');

describe('axel.js :: ', () => {
  it('axel structure', () => {
    const axel = require('../../src/axel');
    expect(axel.port).toBeDefined();
    expect(axel.config).toBeDefined();
    expect(axel.config.framework).toBeDefined();
    expect(axel.routes).toBeDefined();
    expect(axel.services).toBeDefined();
    expect(axel.policies).toBeDefined();
    expect(axel.plugins).toBeDefined();
    expect(axel.rootPath).toBeDefined();
    expect(axel.logger).toBeDefined();
    expect(axel.init).toBeDefined();
    expect(axel.renderView).toBeDefined();
  });
});


describe("global.Axel", () => {

  it("should breaks on pre existing global.axel", () => {
    try {
      const sandboxApp = require('../sandbox');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toBe('axel.app is not defined');
    }
  })
})


describe("axel.renderView", () => {
  test("renderview", async () => {
    try {
      const axel = require('../../src/axel');
      await axel.renderView('home', {})
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toBe('axel.app is not defined');
    }
  })
})
