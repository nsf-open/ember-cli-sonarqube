const { join, normalize } = require('path');
const { tmpdir } = require('os');
const findProjectRoot = require('@nsf-open/ember-cli-sonarqube/lib/utils/find-project-root');
const getCoverageConfig = require('@nsf-open/ember-cli-sonarqube/lib/utils/get-coverage-config');
const convertTemplateLint = require('@nsf-open/ember-cli-sonarqube/lib/utils/convert-template-lint-findings');
const { getCliDefaults, getConfiguration } = require('@nsf-open/ember-cli-sonarqube/lib/configuration');
const {
  getTestPackagePath,
  readFile,
  writeFile,
  deleteFile,
  gitReset,
} = require('./test-helpers');


describe('Utility Methods', function() {
  /**
   * Returns an object describing the values that Yargs should provide if no arguments
   * are provided to the CLI.
   */
  function getExpectedCliDefaults(override = {}) {
    return Object.assign({
      cleanup: true,
      verbose: false,
      quiet: false,
      reject: false,
      'test-cmd': 'npm test',
      'sonar-url': undefined,
      'sonar-token': undefined,
      'dry-run': false,
      'only-analysis': false,
      'eslint-args': undefined,
      'template-lint-args': undefined,
    }, override);
  }

  /**
   * Returns an object describing the values provided by getConfiguration. These are
   * merged with CLI values, and some values are modified, but together they offer a
   * pretty thorough baseline for the start of a test.
   */
  function getExpectedConfigValues(testPkg) {
    return {
      projectRoot:     getTestPackagePath(testPkg),
      coverageFolder:  getTestPackagePath(testPkg, 'coverage'),
      coverageEnvVar:  'COVERAGE',
      coverageOut:     getTestPackagePath(testPkg, 'coverage/lcov.info'),
      reporterOut:     getTestPackagePath(testPkg, 'coverage/test-report.xml'),
      codeLintOut:     getTestPackagePath(testPkg, 'coverage/eslint-out.json'),
      tmplLintOut:     getTestPackagePath(testPkg, 'coverage/template-lint-out.json'),
      sonarConfigFile: getTestPackagePath(testPkg, 'sonar-scanner.properties'),
      hasCodeLint:     true,
      hasTmplLint:     true,
      codeLintArgs:    ['eslint', '-f', 'json', '-o', getTestPackagePath(testPkg, 'coverage/eslint-out.json'), '.'],
      tmplLintArgs:    ['ember-template-lint', '--format=json', '.'],
    }
  }


  // *************************
  // findProjectRoot
  // *************************
  describe('findProjectRoot', function () {
    it('will find the root directory of the project', function () {
      // Should find the workspace root
      expect(findProjectRoot()).toEqual(normalize(join(__dirname, '..')));
      expect(findProjectRoot(__dirname)).toEqual(normalize(join(__dirname, '..')));

      // Shouldn't find anything... I hope.
      expect(findProjectRoot(tmpdir())).toEqual(null);
    });
  });

  // *************************
  // getCliDefaults
  // *************************
  describe('getCliDefaults', function () {
    it('describes the possible CLI arguments', function () {
      const actualDefaults = Object.fromEntries(
        Object.entries(getCliDefaults()).map(entry => [entry[0], entry[1].default])
      );

      expect(actualDefaults).toMatchObject(getExpectedCliDefaults());
    });
  });

  // *************************
  // getConfiguration
  // *************************
  describe('getConfiguration', function () {
    it('requires a Sonarqube server URL', function () {
      const loadConfig = () => getConfiguration(getTestPackagePath('my-addon'), {});
      expect(loadConfig).toThrow(/no Sonarqube server URL has been provided/i);
    });

    it('does not require a Sonarqube server URL when the --dry-run flag is set', function () {
      const loadConfig = () => getConfiguration(getTestPackagePath('my-addon'), { 'dry-run': true });
      expect(loadConfig).not.toThrow();
    });

    it('constructs a configuration object', function () {
      const actualConfig = getConfiguration(getTestPackagePath('my-addon'), { 'dry-run': true });
      const expectConfig = Object.assign(
        getExpectedConfigValues('my-addon'),
        getExpectedCliDefaults({ 'dry-run': true }),
      );

      expectConfig['test-cmd'] = expectConfig['test-cmd'].split(' ');

      expect(actualConfig).toMatchObject(expectConfig);

      expect(actualConfig.sonarConfig).toMatchObject({
        'sonar.projectKey':  'nsf-ember-cli-sonarqube-test-my-addon',
        'sonar.projectName': 'My Test Addon',
      });
    });

    it ('does not require a sonar-scanner.properties file', async function () {
      deleteFile('my-addon', 'sonar-scanner.properties');

      const actualConfig = getConfiguration(getTestPackagePath('my-addon'), { 'dry-run': true });
      expect(actualConfig.sonarConfig).toMatchObject({});

      await gitReset('my-addon');
    });
  });

  // *************************
  // getCoverageConfig
  // *************************
  describe('getCoverageConfig', function () {
    it('provides defaults if no coverage config file is present', function () {
      const { coverageEnvVar, coverageFolder } = getCoverageConfig(getTestPackagePath('my-addon'));

      expect(coverageEnvVar).toEqual('COVERAGE');
      expect(coverageFolder).toEqual(getTestPackagePath('my-addon', 'coverage'));
    });

    it('provides defaults if the coverage config file exists but does not provide relevant values', async function () {
      writeFile('my-addon', 'config/coverage.js', 'module.exports = { reporters: ["lcov"] };');

      const { coverageEnvVar, coverageFolder } = getCoverageConfig(getTestPackagePath('my-addon'));

      expect(coverageEnvVar).toEqual('COVERAGE');
      expect(coverageFolder).toEqual(getTestPackagePath('my-addon', 'coverage'));

      await gitReset('my-addon');
    });

    it('will return relevant values from the coverage config file', async function () {
      writeFile(
        'my-addon',
        'tests/dummy/config/coverage.js',
        'module.exports = { reporters: ["lcov"], coverageFolder: "code-coverage", coverageEnvVar: "CODE_COVERAGE" };',
      );

      const { coverageEnvVar, coverageFolder } = getCoverageConfig(getTestPackagePath('my-addon'));

      expect(coverageEnvVar).toEqual('CODE_COVERAGE');
      expect(coverageFolder).toEqual(getTestPackagePath('my-addon', 'code-coverage'));

      await gitReset('my-addon');
    });
  });

  // *************************
  // convertTemplateLintFindings
  // *************************
  describe('convertTemplateLintFindings', function () {
    it('converts Ember Template Lint JSON into ESLint JSON', function () {
      const tmplLintJson = readFile('__fixtures__', 'template-lint-example.json');
      const convertedJson = readFile('__fixtures__', 'converted-eslint-example.json');

      expect(convertTemplateLint('/foo/bar', tmplLintJson)).toEqual(convertedJson);
    });
  });
});