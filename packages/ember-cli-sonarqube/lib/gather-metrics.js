const fs = require('fs');
const execa = require('execa');
const logProgress = require('./utils/log-progress');
const convertLintOut = require('./utils/convert-template-lint-findings');

/**
 * @param {EmberCliSonarqubeConfig} config
 * @returns {Promise<void>}
 */
module.exports = async function gatherProjectMetrics(config) {
  if (config['only-analysis']) {
    logProgress('The `--only-analysis` flag is set, so no new metrics will be gathered. Moving on.', undefined, true);
    return;
  }

  const execaOptions = { cwd: config.projectRoot, reject: false, env: { SONAR: 'true' } };

  let codeLintExitCode = 0;
  let tmplLintExitCode = 0;
  let coverageExitCode = 0;

  // -------------------
  // ESLint
  // -------------------
  if (config.hasCodeLint) {
    const log = logProgress('Getting ESLint Report', `npx ${config.codeLintArgs.join(' ')}`);
    const { exitCode } = await execa('npx', config.codeLintArgs, execaOptions);

    log.finish(exitCode, config.reject);
    codeLintExitCode = exitCode;

    if (config.verbose) {
      log.verbose(config.codeLintOut, fs.readFileSync(config.codeLintOut, 'utf8'));
    }
  }
  else {
    logProgress('eslint is not available in the project\'s bin. Moving on.', undefined, true);
  }

  // -------------------
  // TemplateLint
  // -------------------
  if (config.hasTmplLint) {
    const log = logProgress('Getting TemplateLint Report', `npx ${config.tmplLintArgs.join(' ')}`);
    const { stdout, exitCode } = await execa('npx', config.tmplLintArgs, execaOptions);

    fs.writeFileSync(config.tmplLintOut, convertLintOut(config.projectRoot, stdout || '[]'), 'utf8');

    log.finish(exitCode, config.reject);
    tmplLintExitCode = exitCode;

    if (config.verbose) {
      log.verbose(config.tmplLintOut, fs.readFileSync(config.tmplLintOut, 'utf8'));
    }
  }
  else {
    logProgress('ember-template-lint is not available in the project\'s bin. Moving on.', undefined, true);
  }

  // -------------------
  // Test Coverage
  // -------------------
  const testCmd = config['test-cmd'][0];
  const testArg = config['test-cmd'].slice(1);
  const testOpt = {
    ...execaOptions,
    stdio: config.quiet ? undefined : 'inherit',
    env: { ...execaOptions.env, [config.coverageEnvVar]: 'true', SONAR_TEST_REPORT: config.reporterOut },
  };

  const log = logProgress('Running Test Command', config['test-cmd'].join(' '), !config.quiet);
  const { exitCode } = await execa(testCmd, testArg, testOpt);

  log.finish(exitCode, config.reject);
  coverageExitCode = exitCode;

  // -------------------
  // Exit Code Check
  // -------------------
  if (config.reject && (codeLintExitCode || tmplLintExitCode || coverageExitCode)) {
    const err = new Error('One or more metrics tests failed.');
    err.code  = Math.max(codeLintExitCode, tmplLintExitCode, coverageExitCode);

    throw err;
  }
}
