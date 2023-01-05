/* eslint-disable */
// const model = require('../../src/api/models/schema/user');

// @ts-ignore
// const testConfig = require(`${axel.rootPath}/tmp/testConfig.json`);
const path = require('path');
const process = require('process');
const runtime = require('regenerator-runtime/runtime');

// process.cwd = () => path.resolve(__dirname, '../sandbox');

describe('axel.js :: ', () => {
  it('axel structure', () => {
    const axel = require('../../src/axel.js');
    expect(axel.port).toBeDefined();
    expect(axel.config).toBeDefined();
    expect(axel.routes).toBeDefined();
    expect(axel.services).toBeDefined();
    expect(axel.policies).toBeDefined();
    expect(axel.plugins).toBeDefined();
    expect(typeof axel.plugins).toBe('object');
    expect(axel.rootPath).toBeDefined();
    expect(axel.logger).toBeDefined();
    expect(axel.init).toBeDefined();
    expect(axel.renderView).toBeDefined();
  });
});

describe('global.Axel', () => {
  it('should breaks on pre existing global.axel', () => {
    try {
      global.axel = 'pre existing';
      const axel = require('../../src/axel');
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toBe('axel.app is not defined');
    }
  });
});

describe('axel.renderView', () => {
  test('renderview requires a template', async () => {
    try {
      const axel = require('../../src/axel');
      await axel.renderView('', {});
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toBe('template file is required');
    }
  });
  test('renderview requires an app', async () => {
    try {
      const axel = require('../../src/axel');
      await axel.renderView('admin-panel', {});
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toBe('axel.app is not defined');
    }
  });

  test.skip('renderview starts', async () => {
    try {
      const { axel, Server } = require('../../src/index');
      const server = new Server();
      // await server.start();
      // server.listen(3333);
      await axel.renderView('admin-panel', {});
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toBe('axel.app is not defined');
    }
  });
});
