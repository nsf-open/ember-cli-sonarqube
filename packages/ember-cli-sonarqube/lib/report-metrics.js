const fs = require('fs');
const path = require('path');
const sonarqubeScanner = require('sonarqube-scanner');
const logProgress = require('./utils/log-progress');

/**
 * @param {EmberCliSonarqubeConfig} config
 * @returns {Record<string, unknown>}
 */
function getSonarConfiguration(config) {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(config.projectRoot, 'package.json'), 'utf8'));

  const sources = (Array.isArray(pkgJson.keywords) && pkgJson.keywords.includes('ember-addon'))
    ? 'addon,addon-test-support,public'
    : 'app,public';

  const executionReport = fs.existsSync(config.reporterOut) ? config.reporterOut : undefined;

  const eslintReports = [config.codeLintOut, config.tmplLintOut]
    .filter(item => fs.existsSync(item))
    .join(',');

  const defaultProps = {
    'sonar.projectName': pkgJson.name,
    'sonar.projectDescription': pkgJson.description,
    'sonar.projectVersion': pkgJson.version,
    'sonar.sources': sources,
    'sonar.tests': 'tests',
    'sonar.testExecutionReportPaths': executionReport,
    'sonar.javascript.lcov.reportPaths': config.coverageOut,
    'sonar.eslint.reportPaths': eslintReports,
    'sonar.coverage.exclusions': '**/tests/**/*.*,**/mirage/**/*.*,**/vendor/**/*.*,**/public/**.*'
  };

  if (pkgJson) {
    if (typeof pkgJson.repository === 'string') {
      defaultProps['sonar.links.homepage'] = pkgJson.repository;
      defaultProps['sonar.links.scm']      = pkgJson.repository;
    }
    else if (pkgJson.repository.url === 'string') {
      defaultProps['sonar.links.homepage'] = pkgJson.repository.url;
      defaultProps['sonar.links.scm']      = pkgJson.repository.url;
    }
  }

  const mergedProps     = Object.assign(defaultProps, config.sonarConfig);
  const normalizedProps = {};

  Object.keys(mergedProps).sort().forEach(key => {
    const value = mergedProps[key];

    if (value && typeof value === 'string' && value.trim().length) {
      normalizedProps[key] = value;
    }
  });

  return {
    serverUrl: config.sonarConfig['sonar.host.url'] || config['sonar-url'],
    token :    config['sonar-token'],
    options:   normalizedProps,
  };
}


/**
 * @param {EmberCliSonarqubeConfig} config
 * @returns {Promise<void>}
 */
module.exports = function reportSonarMetrics(config) {
  return new Promise((resolve) => {
    const sonarConfig = getSonarConfiguration(config);

    if (config['dry-run']) {
      logProgress(
        'The `--dry-run` flag is set, so no metrics will be uploaded to Sonarqube. Moving on.',
        '\n' + JSON.stringify(sonarConfig, null, 2),
        true,
      );

      return resolve();
    }

    sonarqubeScanner(sonarConfig, resolve);
  });
}
