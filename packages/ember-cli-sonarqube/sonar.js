#!/usr/bin/env node

const yargs = require('yargs/yargs');
const findProjectRoot = require('./lib/utils/find-project-root');
const gatherMetrics = require('./lib/gather-metrics');
const reportMetrics = require('./lib/report-metrics');
const assert = require('./lib/utils/assert');
const { hideBin } = require('yargs/helpers');
const { getCliDefaults, getConfiguration } = require('./lib/configuration');

const args = yargs(hideBin(process.argv))
  .usage('$0 [options]')
  .options(getCliDefaults())
  .wrap(140)
  .argv;

const projectRoot = findProjectRoot();

assert('A valid package.json could not be found. The sonar command can ' +
  'only be ran within an NPM project or workspace.', !projectRoot);

const config = getConfiguration(projectRoot, args);

(async function emberCliSonarqube() {
  let metricsError;

  try {
    await gatherMetrics(config);
  } catch (e) {
    metricsError = e;
  }

  await reportMetrics(config);

  if (config.reject && metricsError) {
    process.exitCode = metricsError.code;
  }
})();
