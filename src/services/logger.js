const pino = require('pino')
const colada = require('pino-colada')

const l = pino({
  prettyPrint: true,
  prettifier: colada,
  name: process.env.APP_ID,
  level: process.env.LOG_LEVEL || 'info',
  // @ts-ignore
  hooks: {
    logMethod (args, method) {
      if (args.length > 1) {
        let interpolation = ''
        for (let i = 1; i < args.length; i++) {
          interpolation += ' %j'
        }
        args[0] = `${args[0]} ${interpolation}`
      }
      method.apply(this, args)
    }
  }
})

l.log = l.info
l.verbose = l.trace

module.exports = l
