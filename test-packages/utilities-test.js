const { join, normalize } = require('path');
const { getCliDefaults, getConfiguration } = require('@nsf-open/ember-cli-sonarqube/lib/configuration');
const findProjectRoot = require('@nsf-open/ember-cli-sonarqube/lib/utils/find-project-root');

const configuredAddon = join(__dirname, 'my-addon');

describe('Utility Methods', function() {
  it('will find the root directory of the project', function () {
    // Should find the workspace root
    expect(findProjectRoot()).toEqual(normalize(join(__dirname, '..')));
    expect(findProjectRoot(__dirname)).toEqual(normalize(join(__dirname, '..')));

    // Shouldn't find anything... I hope.
    expect(findProjectRoot('/tmp')).toEqual(null);
  });

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

  it('requires a Sonarqube server URL', function () {
    expect(
      () => getConfiguration(configuredAddon, {}),
    ).toThrow(/no Sonarqube server URL has been provided/i);
  });

  it('does not require a Sonarqube server URL when the --dry-run flag is set', function () {
    expect(
      () => getConfiguration(configuredAddon, { 'dry-run': true }),
    ).not.toThrow();
  });

  it('constructs a configuration object', function () {
    let config = getConfiguration(configuredAddon, { 'sonar-url': 'abc' });

    expect(config).toMatchObject({
      projectRoot: configuredAddon,
      coverageFolder: join(configuredAddon, 'coverage'),
      coverageEnvVar: 'COVERAGE',
      coverageOut: join(configuredAddon, 'coverage', 'lcov.info'),
      reporterOut: join(configuredAddon, 'coverage', 'test-report.xml'),
      codeLintOut: join(configuredAddon, 'coverage', 'eslint-out.json'),
      tmplLintOut: join(configuredAddon, 'coverage', 'template-lint-out.json'),
      sonarConfigFile: join(configuredAddon, 'sonar-scanner.properties'),
      hasCodeLint: true,
      hasTmplLint: true,
      cleanup: true,
      verbose: false,
      quiet: false,
      reject: false,
      codeLintArgs: expect.arrayContaining(['eslint', '-f', 'json', '-o', join(configuredAddon, 'coverage', 'eslint-out.json'), '.']),
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