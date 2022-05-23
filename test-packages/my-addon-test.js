const { sonar, readFile } = require('./test-helpers');

describe('for a fully configured addon', function () {
  jest.setTimeout(10000000);

  it('it generates files for Sonarqube', async function () {
    await expect(
      sonar('my-addon', ['--test-cmd="npx ember test"'])
    ).resolves.not.toThrow();

    expect(readFile('my-addon', 'coverage/eslint-out.json')).not.toBeFalsy();
    expect(readFile('my-addon', 'coverage/template-lint-out.json')).not.toBeFalsy();
    expect(readFile('my-addon', 'coverage/lcov.info')).not.toBeFalsy();
    expect(readFile('my-addon', 'coverage/test-report.xml')).not.toBeFalsy();
  });
});
