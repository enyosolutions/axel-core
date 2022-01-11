const glob = require('glob');
const fs = require('fs');

// options is optional
glob('src/**/*.mjs', {}, (er, files) => {
  files.forEach((f) => {
    console.log('rename', f);
    fs.renameSync(f, f.replace('.mjs', '.js'));
  });
});
