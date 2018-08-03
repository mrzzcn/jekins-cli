const console = require('better-console');

const build = require('./build.js');

// build.viewBuildInfo('https://zhen.zhang2:9c77c3b8e7508f7d380877b030df61f0@jenkins.intra.im/view/%E5%89%8D%E7%AB%AF/job/f2e/job/beta/job/app-bee-tms/266/');

let index = 0;

function sto() {
  console.log(index++);
  setTimeout(function() {
    sto();
  }, 300);
}

sto();

process.on('SIGINT', function() {
  console.log("Caught interrupt signal");

  process.exit();
});