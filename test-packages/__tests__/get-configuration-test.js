const { getCliDefaults, getConfiguration } = require('@nsf-open/ember-cli-sonarqube/lib/configuration');
const { getTestPackage } = require('./test-helpers');


describe('getConfiguration Utilities', function () {
  const testPackage = getTestPackage('my-addon');

  it('describes the possible CLI arguments', function () {
    const defaults = getCliDefaults();

    expect(defaults).toHaveProperty('cleanup.default', true);
    expect(defaults).toHaveProperty('verbose.default', false);
    expect(defaults).toHaveProperty('quiet.default', false);
    expect(defaults).toHaveProperty('reject.default', false);
    expect(defaults).toHaveProperty('test-cmd.default', 'npm test');
    expect(defaults).toHaveProperty('sonar-url.default', undefined);
    expect(defaults).toHaveProperty('sonar-token.default', undefined);
    expect(defaults).toHaveProperty('dry-run.default', false);
    expect(defaults).toHaveProperty('only-analysis.default', false);
    expect(defaults).toHaveProperty('eslint-args.default', undefined);
    expect(defaults).toHaveProperty('template-lint-args.default', undefined);
  });

  it('requires a Sonarqube server URL', function () {
    expect(
      () => getConfiguration(testPackage.toPath(), {}),
    ).toThrow(/no Sonarqube server URL has been provided/i);
  });

  it('does not require a Sonarqube server URL when the --dry-run flag is set', function () {
    expect(
      () => getConfiguration(testPackage.toPath(), { 'dry-run': true }),
    ).not.toThrow();
  });

  it ('does not require a sonar-scanner.properties file', async function () {
    await testPackage.getFile('sonar-scanner.properties').delete();

    expect(
      getConfiguration(testPackage.toPath(), { 'dry-run': true }).sonarConfig,
    ).toMatchObject({});

    await testPackage.reset();
  });

  it('constructs a configuration object', function () {
    expect(
      getConfiguration(testPackage.toPath(), { 'sonar-url': 'abc' })
    ).toMatchObject({
      projectRoot: testPackage.toPath(),
      coverageFolder: testPackage.toPath('coverage'),
      coverageEnvVar: 'COVERAGE',
      coverageOut: testPackage.toPath('coverage/lcov.info'),
      reporterOut: testPackage.toPath('coverage/test-report.xml'),
      codeLintOut: testPackage.toPath('coverage/eslint-out.json'),
      tmplLintOut: testPackage.toPath('coverage/template-lint-out.json'),
      sonarConfigFile: testPackage.toPath('sonar-scanner.properties'),
      hasCodeLint: true,
      hasTmplLint: true,
      codeLintArgs: ['eslint', '-f', 'json', '-o', testPackage.toPath('coverage/eslint-out.json'), '.'],
      tmplLintArgs: ['ember-template-lint', '--format=json', '.'],
      cleanup: true,
      verbose: false,
      quiet: false,
      reject: false,
      'test-cmd': ['npm', 'test'],
      'sonar-url': 'abc',
      'sonar-token': undefined,
      'dry-run': false,
      'only-analysis': false,
      'eslint-args': undefined,
      'template-lint-args': undefined,
      sonarConfig: {
        'sonar.projectKey':  'nsf-ember-cli-sonarqube-test-my-addon',
        'sonar.projectName': 'My Test Addon',
      }
    });
  });
});