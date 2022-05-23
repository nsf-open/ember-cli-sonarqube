const rimraf = require('rimraf');
const logProgress = require('./utils/log-progress');


/**
 * @param {EmberCliSonarqubeConfig} config
 * @returns Promise<void>
 */
module.exports = function cleanupCoverageReporting(config) {
  if (!config.cleanup) {
    logProgress('The `--no-cleanup` flag is set. Moving on.', undefined, true);
    return Promise.resolve();
  }

  return new Promise(resolve => rimraf(config.coverageFolder, resolve));
}
