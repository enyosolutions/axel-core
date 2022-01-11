const cron = require('node-cron');
const debug = require('debug')('app:boostrap');

module.exports = {
  cron: null,
  init() {
    this.cron = cron;
    axel.logger.log('\n\n\n\n\n********');
    Object.keys(this.tasks).forEach((time) => {
      debug('CRON at ', time);
      const executors = Array.isArray(this.tasks[time]) ? this.tasks[time] : [this.tasks[time]];
      executors.forEach(executor => cron.schedule(time, executor));
    });
    axel.logger.log('[CRON] service initialized\n\n\n\n\n');
  },
  tasks: {
    // single task at 1am
    '00 01 * * *': async () => {
    },
    // sub second precision
    '0,15,30,45 * * * * *': async () => {
    },
    // multiple tasks at the same time
    '* * * * *': [async () => {
    },
    async () => {
    }
    ],
  }
};
