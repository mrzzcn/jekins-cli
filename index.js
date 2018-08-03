#!/usr/bin/env node

/*
 * @Author: Jack
 * @Date:   2018-08-01 14:25:34
 * @Last Modified by: Taco
 * @Last Modified time: 2018-08-03 12:06:39
 */
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const os = require('os');
const program = require('commander');
const jenkinsApi = require('jenkins-api');
const axios = require('axios');
const chalk = require('chalk');

const packageJson = require('./package.json');
const { viewBuildInfo } = require('./build.js');

let commandName = 'jekins';
let jekinsConfig = null;
let jekinsConfigSample;
let jekins;
let jekinsUrl;
try {
  jekinsConfigSample = yaml.safeLoad(fs.readFileSync('.config.yaml', 'utf8'));
  if (fs.existsSync(getConfigFile())) {
    jekinsConfig = yaml.safeLoad(fs.readFileSync(getConfigFile(), 'utf8'));
  }
} catch (e) {
  console.log(chalk.red(e));
}


function getConfigFile() {
  return path.join(os.homedir(), '.jekins.conf.yaml');
}

function getJekins(cmd) {
  if (jekins) {
    return jekins;
  }

  const env = getEnv(cmd);
  if (!env) {
    return;
  }
  if (!jekinsConfig.env[env]) {
    console.error(`Please config env: ${env}`);
  }

  const envPrefix = encodeURI(jekinsConfig.env[env]);
  try {
    jekinsUrl = jekinsConfig.url.replace('://', `://${jekinsConfig.user.name}:${jekinsConfig.user.token}@`);
    jekinsUrl = `${jekinsUrl}${envPrefix}`;
    jekins = jenkinsApi.init(jekinsUrl);
    console.log('Initialized: ', jekinsUrl);
    return jekins;
  } catch (e) {
    console.log(e);
  }
}

function getEnv(cmd) {
  let env;

  if (cmd.development) {
    env = 'development';
  } else if (cmd.beta) {
    env = 'beta';
  } else if (cmd.production) {
    env = 'production';
  }
  return env;
}

function checkConfigFile() {
  if(!jekinsConfig) {
    console.log(chalk.red('Config has not been initialized. RUN: '));
    console.log(chalk.green(`${commandName} init`));
    process.exit(1);
  }
}

program
  .version(packageJson.version)
  .command('build <target>')
  .description('trigger new building of <target>')
  .option('-p, --production', 'Production Enviroment')
  .option('-b, --beta', 'Beta Enviroment')
  .option('-d, --development', 'Development Enviroment')
  .action(function(target, cmd) {
    checkConfigFile();
    console.log('building %s', target);
    getJekins(cmd).build(target, function(err, data) {
      if (err) {
        return console.error('Error: ', err);
      }
      console.log('Finished: ', data.location);

      const targetUrl = `${jekinsUrl}/job/${target}`;
      const targetApi = `${targetUrl}/api/json`;
      let buildId = '';
      axios.get(targetApi)
        .then(function(response) {
          const { lastBuild } = response.data;
          buildId = lastBuild.number;
          const buildUrl = lastBuild.url.replace(/^https?:\/\//, `https://${jekinsConfig.user.name}:${jekinsConfig.user.token}@`);
          console.log('Building Started: ', buildUrl);
          viewBuildInfo(buildUrl);
        });

      process.on('SIGINT', function() {
        console.log(chalk.yellow('\nThe building already started, if you want stop current building, RUN: '));
        const command = `jekins stop ${cmd.parent.rawArgs[3]} ${target} ${buildId}`;
        console.log(chalk.green(command));
        process.exit();
      });
    });
  });

program.command('stop <target> <buildId>')
  .description('stop speciafic building<buildId> of <target>')
  .option('-p, --production', 'Production Enviroment')
  .option('-b, --beta', 'Beta Enviroment')
  .option('-d, --development', 'Development Enviroment')
  .action(function(target, buildId, cmd) {
    checkConfigFile();
    console.log('stoping %s/%d', target, buildId);
    getJekins(cmd).stop_build(target, buildId, function(err, data) {
      if (err) {
        return console.error('Error: ', err);
      }
      console.log('Stoped: ', data.body);
    });
  });

program.command('init')
  .description('Init config file.')
  .action(function(cmd) {
    const object = Object.assign({}, jekinsConfigSample, jekinsConfig);
    const file = getConfigFile();
    fs.writeFileSync(file, yaml.safeDump(object));
    console.log('Initialized config file at %s', chalk.green(file));
  });

program.parse(process.argv);