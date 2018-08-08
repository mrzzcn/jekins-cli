const axios = require('axios');
const console = require('better-console');
const ora = require('ora');

let previousLog = '';


exports.viewBuildInfo = function(url) {
  const buildApi = `${url}api/json`;
  let spinner;

  axios.get(buildApi).then(function(response) {
    const causeAction = response.data.actions.find(function(action) {
      return action._class === 'hudson.model.CauseAction';
    });
    const user = causeAction.causes[0];

    const buildData = response.data.actions.find(function(action) {
      return action._class === 'hudson.plugins.git.util.BuildData';
    });
    if (!buildData) {
      if (!spinner) {
        spinner = ora('Waiting...').start();
        spinner.color = 'yellow';
      }
      return exports.viewBuildInfo(url);
    }
    if (spinner && spinner.isSpinning) {
      spinner.color = 'green';
      spinner.stopAndPersist();
      spinner.clear();
      spinner.succeed('Started');
      spinner = null;
    }
    const { lastBuiltRevision, remoteUrls } = buildData;

    const buildingInfo = `${user.userName}: ${remoteUrls}[${lastBuiltRevision.branch[0].name}](${lastBuiltRevision.branch[0].SHA1})`;
    viewBuildConsole(url);
  })
}

function viewBuildConsole(url) {
  const consoleApi = `${url}/consoleText`;
  axios.get(consoleApi, { responseType: 'text' })
    .then(function(response) {
      if (response.data.indexOf('Finished:') > 0) {
        console.clear();
        console.log(response.data.replace(previousLog, ''));
      } else {
        const newLog = response.data.replace(previousLog, '');
        if (newLog) {
          console.clear();
          console.log(response.data.replace(previousLog, ''));
          previousLog = response.data;
        }
        setTimeout(function() {
          viewBuildConsole(url);
        }, 300);
      }
    });
}