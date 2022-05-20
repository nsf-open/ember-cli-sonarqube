const { join } = require('path');
const { readFileSync } = require('fs');
const execa = require('execa');

function readFile(cwd, fileName) {
  return readFileSync(join(cwd, 'coverage', fileName), 'utf8');
}

describe('for a fully configured addon', function () {
  jest.setTimeout(10000000);

  it('it generates files for Sonarqube', async function () {
    const cwd = join(__dirname, 'my-addon');

    await expect(
      execa('npx', ['sonar', '--dry-run', '--test-cmd="npx ember test"'], { cwd }))
    .resolves.not.toThrow();

    expect(readFile(cwd, 'eslint-out.json')).toMatchSnapshot();
    expect(readFile(cwd, 'template-lint-out.json')).toMatchSnapshot();
    expect(readFile(cwd, 'lcov.info')).toMatchSnapshot();

    // The test report contains timing information that can change run over run
    // so snapshots are not useful here.
    expect(readFile(cwd, 'test-report.xml')).not.toBeFalsy();
  });
});
