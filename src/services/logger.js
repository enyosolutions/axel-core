const pino = require('pino');

const l = pino({
  prettyPrint: false,
  transport: process.env.LOG_DISABLE_PRETTY_PRINT ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
    }
  },
  // prettifier: colada,
  name: process.env.APP_ID,
  enabled: process.env.LOG_ENABLED || true,
  level: process.env.LOG_LEVEL || 'info',
  // @ts-ignore
  hooks: {

  },
},);

l.log = l.info;
l.verbose = l.trace;

module.exports = l;
