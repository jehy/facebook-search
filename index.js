const path = require('path'),
  childProcess = require('child_process'),
  phantomjs = require('phantomjs-prebuilt'),
  binPath = phantomjs.path;
/*
const childArgs = [
  path.join(__dirname, 'facebook-login.js'),
  'some other argument (passed to phantomjs script)',
];

childProcess.execFile(binPath, childArgs, (err, stdout, stderr) => {
  // handle results
  console.log(stdout);
  console.log(stderr);
  console.log(err);
  process.exit(0);
});
*/
const program = phantomjs.exec('facebook-login.js')
program.stdout.pipe(process.stdout);
program.stderr.pipe(process.stderr);
program.on('exit', (code) => {
  console.log(`Exit code ${code}`);
});
