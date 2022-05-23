const { join, normalize } = require('path');
const { getTestPackagePath, readFile, writeFile, gitReset } = require('./test-helpers');
const { getCliDefaults, getConfiguration } = require('@nsf-open/ember-cli-sonarqube/lib/configuration');
const findProjectRoot = require('@nsf-open/ember-cli-sonarqube/lib/utils/find-project-root');
const getCoverageConfig = require('@nsf-open/ember-cli-sonarqube/lib/utils/get-coverage-config');
const convertTemplateLintFindings = require('@nsf-open/ember-cli-sonarqube/lib/utils/convert-template-lint-findings');


describe('Utility Methods', function() {
  describe('findProjectRoot', function () {
    it('will find the root directory of the project', function () {
      // Should find the workspace root
      expect(findProjectRoot()).toEqual(normalize(join(__dirname, '..')));
      expect(findProjectRoot(__dirname)).toEqual(normalize(join(__dirname, '..')));

      // Shouldn't find anything... I hope.
      expect(findProjectRoot('/tmp')).toEqual(null);
    });
  });

  describe('getCliDefaults', function () {
    it('describes the expected CLI arguments', function () {
      const defaults = getCliDefaults();

      expect(defaults).toHaveProperty('cleanup.default',            true);
      expect(defaults).toHaveProperty('verbose.default',            false);
      expect(defaults).toHaveProperty('quiet.default',              false);
      expect(defaults).toHaveProperty('reject.default',             false);
      expect(defaults).toHaveProperty('test-cmd.default',           'npm test');
      expect(defaults).toHaveProperty('sonar-url.default',          undefined);
      expect(defaults).toHaveProperty('sonar-token.default',        undefined);
      expect(defaults).toHaveProperty('dry-run.default',            false);
      expect(defaults).toHaveProperty('only-analysis.default',      false);
      expect(defaults).toHaveProperty('eslint-args.default',        undefined);
      expect(defaults).toHaveProperty('template-lint-args.default', undefined);
    });
  });

  describe('getConfiguration', function () {
    it('requires a Sonarqube server URL', function () {
      expect(
        () => getConfiguration(getTestPackagePath('my-addon'), {}),
      ).toThrow(/no Sonarqube server URL has been provided/i);
    });

    it('does not require a Sonarqube server URL when the --dry-run flag is set', function () {
      expect(
        () => getConfiguration(getTestPackagePath('my-addon'), { 'dry-run': true }),
      ).not.toThrow();
    });

    it('constructs a configuration object', function () {
      let config = getConfiguration(getTestPackagePath('my-addon'), { 'sonar-url': 'abc' });

      expect(config).toMatchObject({
        projectRoot: getTestPackagePath('my-addon'),
        coverageFolder: getTestPackagePath('my-addon', 'coverage'),
        coverageEnvVar: 'COVERAGE',
        coverageOut: getTestPackagePath('my-addon', 'coverage', 'lcov.info'),
        reporterOut: getTestPackagePath('my-addon', 'coverage', 'test-report.xml'),
        codeLintOut: getTestPackagePath('my-addon', 'coverage', 'eslint-out.json'),
        tmplLintOut: getTestPackagePath('my-addon', 'coverage', 'template-lint-out.json'),
        sonarConfigFile: getTestPackagePath('my-addon', 'sonar-scanner.properties'),
        hasCodeLint: true,
        hasTmplLint: true,
        cleanup: true,
        verbose: false,
        quiet: false,
        reject: false,
        codeLintArgs: expect.arrayContaining(['eslint', '-f', 'json', '-o', getTestPackagePath('my-addon', 'coverage', 'eslint-out.json'), '.']),
        tmplLintArgs: expect.arrayContaining(['ember-template-lint', '--format=json', '.']),
        'test-cmd': expect.arrayContaining(['npm', 'test']),
        'sonar-url': 'abc',
        'sonar-token': undefined,
        'dry-run': false,
        'only-analysis': false,
        'eslint-args': undefined,
        'template-lint-args': undefined,
      });

      expect(config.sonarConfig).toMatchObject({
        'sonar.projectKey': 'nsf-ember-cli-sonarqube-test-my-addon',
        'sonar.projectName': 'My Test Addon',
      });
    });
  });

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

  describe('convertTemplateLintFindings', function () {
    it('converts Ember Template Lint JSON into ESLint JSON', function () {
      const tmplLintJson = readFile('__fixtures__', 'template-lint-example.json');
      const convertedJson = readFile('__fixtures__', 'converted-eslint-example.json');

      expect(convertTemplateLintFindings(tmplLintJson)).toEqual(convertedJson);
    });
  });
});