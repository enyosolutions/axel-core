const Server = require('../../src/Server');

// @ponicode
describe('Server.Server.setErrorHandler', () => {
  let inst3;
  let inst;
  let inst2;

  beforeEach(() => {
    inst3 = new Server.Server();
    inst = new Server.Server();
    inst2 = new Server.Server();
  });

  test('0', () => {
    const result = inst2.setErrorHandler(() => false);
    expect(result).toMatchSnapshot();
  });

  test('1', () => {
    const result = inst.setErrorHandler(() => true);
    expect(result).toMatchSnapshot();
  });

  test('2', () => {
    const result = inst3.setErrorHandler(undefined);
    expect(result).toMatchSnapshot();
  });
});
