const path = require('path');
const fs = require('fs');
const getCoverageConfig = require('./utils/get-coverage-config');
const getNpmBinPath = require('./utils/get-npm-bin-path');
const assert = require('./utils/assert');
const { parseCommand } = require('execa/lib/command');
const propertiesReader = require('properties-reader');

/**
 * @param {string[]} prefix
 * @param {string}   [maybeMerge]
 * @param {string[]} [suffix]
 *
 * @returns {string[]}
 */
function parseAndMergeCommandArgs(prefix, maybeMerge, suffix = []) {
  const cmdArgs = [...prefix];

  if (typeof maybeMerge === 'string') {
    cmdArgs.push(...parseCommand(maybeMerge));
  }

  cmdArgs.push(...suffix);
  return cmdArgs;
}

/**
 * Default CLI parameters, in the style of a Yargs options object.
 *
 * @returns {Record<string, { type: string, default: unknown, description: string }>}
 */
function getCliDefaults() {
  return {
    cleanup: {
      type:        'boolean',
      default:     true,
      description: 'Delete analysis files after uploading.',
    },
    verbose: {
      type:        'boolean',
      default:     false,
      description: 'Output the full results of each gathered metric.'
    },
    quiet: {
      type:        'boolean',
      default:     false,
      description: 'If true, test progression will not be logged.',
    },
    reject: {
      type:        'boolean',
      default:     false,
      description: 'If true, the process will exit with a non-zero code if any steps failed. This allows the ' +
        'results to also be used as part of a pipeline or quality gate, but note that this does not fail-fast; all ' +
        'steps will run regardless of how the previous step exited.',
    },
    'test-cmd': {
      type:        'string',
      default:     'npm test',
      description: 'The testing script that will be run to gather coverage info. This command does not need to ' +
        'include the `COVERAGE` environment flag needed by `ember-cli-code-coverage`.',
    },
    'sonar-url': {
      type:        'string',
      default:     undefined,
      description: 'The URL of the Sonarqube server. If not provided by this argument, the `sonar.host.url` property ' +
        'will need to be set in the project\'s `sonar-scanner.properties` file.',
    },
    'sonar-token': {
      type:        'string',
      default:     undefined,
      description: 'An access token for the Sonarqube server, if required.',
    },
    'dry-run': {
      type:        'boolean',
      default:     false,
      description: 'If true, metrics will be gathered but not uploaded to Sonarqube.',
    },
    'only-analysis': {
      type:        'boolean',
      default:     false,
      description: 'If true, no new metrics will be gathered but any existing will be uploaded to Sonarqube.',
    },
    'eslint-args': {
      type:        'string',
      default:     undefined,
      description: 'Additional arguments that will be passed to ESLint.',
    },
    'template-lint-args': {
      type:        'string',
      default:     undefined,
      description: 'Additional arguments that will be passed to Ember Template Lint.'
    },
  }
}

/**
 * @typedef {Object} EmberCliSonarqubeConfig
 *
 * @property {string}   projectRoot
 * @property {string}   coverageFolder
 * @property {string}   coverageEnvVar
 * @property {string}   codeLintOut
 * @property {boolean}  hasCodeLint
 * @property {string[]} codeLintArgs
 * @property {string}   tmplLintOut
 * @property {boolean}  hasTmplLint
 * @property {string[]} tmplLintArgs
 * @property {string}   coverageOut
 * @property {string}   reporterOut
 * @property {object}   sonarConfig
 * @property {string}   sonarConfigFile
 * @property {boolean}  cleanup
 * @property {boolean}  verbose
 * @property {boolean}  quiet
 * @property {boolean}  reject
 * @property {string[]} test-cmd
 * @property {boolean}  dry-run
 * @property {string}   eslint-args
 * @property {string}   template-lint-args
 * @property {string}   sonar-url
 * @property {string}   sonar-token
 * @property {boolean}  only-analysis
 */

/**
 * @param {string} projectRoot
 * @param {Record<string, unknown>} [cliArgs]
 *
 * @returns {EmberCliSonarqubeConfig}
 */
function getConfiguration(projectRoot, cliArgs) {
  const binPath = getNpmBinPath(projectRoot);
  const { coverageFolder, coverageEnvVar } = getCoverageConfig(projectRoot);

  const codeLintCmd = 'eslint';
  const tmplLintCmd = 'ember-template-lint';
  const hasCodeLint = fs.existsSync(path.join(binPath, codeLintCmd));
  const hasTmplLint = fs.existsSync(path.join(binPath, tmplLintCmd));

  const codeLintOut = path.join(coverageFolder, 'eslint-out.json');
  const tmplLintOut = path.join(coverageFolder, 'template-lint-out.json');
  const coverageOut = path.join(coverageFolder, 'lcov.info');
  const reporterOut = path.join(coverageFolder, 'test-report.xml');
  const sonarConfigFile = path.join(projectRoot, 'sonar-scanner.properties');

  const sonarConfig = fs.existsSync(sonarConfigFile)
    ? propertiesReader(sonarConfigFile).getAllProperties()
    : {};

  assert(
    'No Sonarqube server URL has been provided. Set "sonar.host.url" in the project\'s ' +
    'sonar-scanner.properties config, or use the `--sonar-url` CLI argument.',
    !(cliArgs['sonar-url'] || sonarConfig['sonar.host.url']) && !cliArgs['dry-run']
  );

  const config = {
    projectRoot,
    coverageFolder,
    coverageEnvVar,
    coverageOut,
    reporterOut,
    hasCodeLint,
    hasTmplLint,
    codeLintOut,
    tmplLintOut,
    sonarConfig,
    sonarConfigFile,
  };

  const defaults = getCliDefaults();

  Object.keys(defaults).forEach((key) => {
    config[key] = cliArgs && cliArgs[key] !== undefined ? cliArgs[key] : defaults[key].default;
  });

  config['test-cmd'] = parseAndMergeCommandArgs([], config['test-cmd']);

  config.codeLintArgs = parseAndMergeCommandArgs(
    [codeLintCmd, '-f', 'json', '-o', codeLintOut],
    config['eslint-args'],
    ['.'],
  );

  config.tmplLintArgs = parseAndMergeCommandArgs(
    [tmplLintCmd, '--format=json'],
    config['template-lint-args'],
    ['.'],
  );

  return config;
}

module.exports = {
  getCliDefaults,
  getConfiguration,
}