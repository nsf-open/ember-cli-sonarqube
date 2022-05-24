const { getTestPackage, escapeRegExp } = require('./test-helpers');

describe('for an addon', function () {
  jest.setTimeout(1000 * 60 * 5);

  const testPackage = getTestPackage('my-addon');

  afterEach(function () {
    return testPackage.reset();
  });

  it('it generates files for Sonarqube', async function () {
    await testPackage.sonar(['--test-cmd="npx ember test"', '--no-cleanup']);

    await expect(testPackage.getFile('coverage/eslint-out.json').read()).not.toBeFalsy();
    await expect(testPackage.getFile('coverage/template-lint-out.json').read()).not.toBeFalsy();
    await expect(testPackage.getFile('coverage/lcov.info').read()).not.toBeFalsy();
    await expect(testPackage.getFile('coverage/test-report.xml').read()).not.toBeFalsy();
  });

  it('respects the --cleanup flag', async function () {
    await testPackage.sonar(['--test-cmd="npx ember test"']);
    expect(testPackage.directoryExists('coverage')).toEqual(false);
  });

  it('respects the --dry-run flag', async function () {
    const { stderr } = await testPackage.sonar(['--test-cmd="npx ember test"', '--dry-run']);
    expect(stderr).toMatch(/The `--dry-run` flag is set, so no metrics will be uploaded to Sonarqube\. Moving on\./i);
  });

  it('respects the --only-analysis flag', async function () {
    const { stderr } = await testPackage.sonar(['--test-cmd="npx ember test"', '--only-analysis', '--no-cleanup']);
    expect(stderr).toMatch(/The `--only-analysis` flag is set, so no new metrics will be gathered\. Moving on\./i);
    expect(testPackage.directoryExists('coverage')).toEqual(false);
  });

  it('respects the --reject flag', async function () {
    await testPackage.getFile('tests/dummy/app/templates/application.hbs').update('The cow says {{moo}}');
    await expect(testPackage.sonar(['--test-cmd="npx ember test"', '--reject'])).rejects.toThrow();
  });

  it('does not throw an exception when tests fail', async function () {
    await testPackage.getFile('tests/dummy/app/templates/application.hbs').update('The cow says {{moo}}');
    await expect(testPackage.sonar(['--test-cmd="npx ember test"'])).resolves.not.toThrow();
  });

  it('respects the --verbose flag', async function () {
    const { stdout } = await testPackage.sonar(['--test-cmd="npx ember test"', '--verbose'])
    const codeLint = testPackage.toPath('coverage/eslint-out.json');
    const tmplLint = testPackage.toPath('coverage/template-lint-out.json');

    expect(stdout).toMatch(new RegExp(escapeRegExp(`${codeLint}\n${'*'.repeat(codeLint.length)}`), 'i'));
    expect(stdout).toMatch(new RegExp(escapeRegExp(`${tmplLint}\n${'*'.repeat(tmplLint.length)}`), 'i'));
  });
});
