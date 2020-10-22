import pino from 'pino';
import chalk from 'chalk';
import config from '../../config';

const l = pino({
  prettyPrint: true,
  name: process.env.APP_ID,
  level: process.env.LOG_LEVEL || 'info',
  // @ts-ignore
  hooks: {
    logMethod: function(args: any, method: any) {
      if (args.length > 1) {
        let interpolation = '';
        for (let i = 1; i < args.length; i++) {
          interpolation += ' %j';
        }
        args[0] = `${args[0]} ${interpolation}`;
      }
      method.apply(this, args);
    },
  },
});

l.log = l.info;
l.verbose = l.trace;

export default l;
