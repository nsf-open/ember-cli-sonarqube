const { join, normalize } = require('path');
const { existsSync, readFileSync } = require('fs');

/**
 * Read the ember-cli-code-coverage config for the project containing information
 * about how to trigger coverage instrumentation and where the raw coverage data will be
 * collected.
 *
 * @returns {{ coverageFolder: string, coverageEnvVar: string }}
 */
module.exports = function getCoverageConfig(projectRoot) {
  const pkgJson    = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
  const configPath = join(projectRoot, (pkgJson['ember-addon'] && pkgJson['ember-addon'].configPath) || 'config');
  const configFile = join(configPath, 'coverage.js');

  let coverageEnvVar = 'COVERAGE';
  let coverageFolder = 'coverage';

  if (existsSync(configFile)) {
    const config    = require(configFile);
    const reporters = config.reporters;

    // The default config for ember-cli-code-coverage includes the lcov reporter by default.
    // This checks to ensure it is present if the reporters have been customized.
    if (Array.isArray(reporters) && !(reporters.includes('lcov') || reporters.includes('lcov-only'))) {
      // TODO: come up with a more useful error message
      // throw new Error('The ember-cli-code-coverage lcov reporter must be configured for Sonar reporting.');
    }

    const mixedConfig = Object.assign({ coverageEnvVar, coverageFolder }, config);
    coverageEnvVar    = mixedConfig.coverageEnvVar;
    coverageFolder    = mixedConfig.coverageFolder;
  }

  return { coverageEnvVar, coverageFolder: normalize(join(projectRoot, coverageFolder)) };
}