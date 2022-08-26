const pino = require('pino');
const colada = require('pino-colada');

const l = pino({
  prettyPrint: true,
  prettifier: colada,
  name: process.env.APP_ID,
  enabled: process.env.LOG_ENABLED || true,
  level: process.env.LOG_LEVEL || 'info',
  // @ts-ignore
  hooks: {

  },
});

l.log = l.info;
l.verbose = l.trace;

module.exports = l;
