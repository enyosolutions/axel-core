const debug = require('debug')('axel:manager');

module.exports.catchSignal = (signal, times = 1) => new Promise((resolve, reject) => {
  process.once(signal, () => {
    try {
      debug('[AXELMANAGER] Captured interruption signal....', times--);
      if (times <= 0) {
        setTimeout(() => {
          process.kill(process.pid, signal);
          if (times < -10) {
            process.exit();
          }
        }, 1000);
        resolve();
      }
    } catch (err) {
      reject(err);
    }
  });
});
