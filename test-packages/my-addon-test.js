const { existsSync } = require('fs');
const rimraf = require('rimraf');
const { getTestPackagePath, sonar, readFile, updateFile, gitReset } = require('./test-helpers');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('for an addon', function () {
  jest.setTimeout(10000000);

  afterEach(function () {
    return new Promise(resolve => rimraf(getTestPackagePath('my-addon', 'coverage'), resolve));
  });

  it('it generates files for Sonarqube', async function () {
    await sonar('my-addon', ['--test-cmd="npx ember test"', '--no-cleanup']);

    expect(readFile('my-addon', 'coverage/eslint-out.json')).not.toBeFalsy();
    expect(readFile('my-addon', 'coverage/template-lint-out.json')).not.toBeFalsy();
    expect(readFile('my-addon', 'coverage/lcov.info')).not.toBeFalsy();
    expect(readFile('my-addon', 'coverage/test-report.xml')).not.toBeFalsy();
  });

  it('respects the --cleanup flag', async function () {
    await sonar('my-addon', ['--test-cmd="npx ember test"']);
    expect(existsSync(getTestPackagePath('my-addon', 'coverage'))).toEqual(false);
  });

  it('respects the --dry-run flag', async function () {
    const { stderr } = await sonar('my-addon', ['--test-cmd="npx ember test"', '--dry-run']);
    expect(stderr).toMatch(/The `--dry-run` flag is set, so no metrics will be uploaded to Sonarqube\. Moving on\./i);
  });

  it('respects the --only-analysis flag', async function () {
    const { stderr } = await sonar('my-addon', ['--test-cmd="npx ember test"', '--only-analysis', '--no-cleanup']);
    expect(stderr).toMatch(/The `--only-analysis` flag is set, so no new metrics will be gathered\. Moving on\./i);
    expect(existsSync(getTestPackagePath('my-addon', 'coverage'))).toEqual(false);
  });

  it('respects the --reject flag', async function () {
    updateFile('my-addon', 'tests/dummy/app/templates/application.hbs', 'The cow says {{moo}}');

    await expect(
      sonar('my-addon', ['--test-cmd="npx ember test"', '--reject'])
    ).rejects.toThrow();

    await gitReset('my-addon');
  });

  it('respects the --verbose flag', async function () {
    const { stdout } = await sonar('my-addon', ['--test-cmd="npx ember test"', '--verbose'])
    const codeLint = getTestPackagePath('my-addon', 'coverage/eslint-out.json');
    const tmplLint = getTestPackagePath('my-addon', 'coverage/template-lint-out.json');

    expect(stdout).toMatch(new RegExp(escapeRegExp(`${codeLint}\n${'*'.repeat(codeLint.length)}`), 'i'));
    expect(stdout).toMatch(new RegExp(escapeRegExp(`${tmplLint}\n${'*'.repeat(tmplLint.length)}`), 'i'));
  });
});
