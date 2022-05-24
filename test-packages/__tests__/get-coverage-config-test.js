const getCoverageConfig = require('@nsf-open/ember-cli-sonarqube/lib/utils/get-coverage-config');
const { getTestPackage } = require('./test-helpers');

describe('getCoverageConfig Utilities', function() {
  const testPackage = getTestPackage('my-addon');

  afterEach(function () {
    jest.resetModules();
    return testPackage.reset();
  });

  it('provides defaults if no coverage config file is present', function () {
    const { coverageEnvVar, coverageFolder } = getCoverageConfig(testPackage.toPath());

    expect(coverageEnvVar).toEqual('COVERAGE');
    expect(coverageFolder).toEqual(testPackage.toPath('coverage'));
  });

  it('provides defaults if the coverage config file exists but does not provide relevant values', async function () {
    await testPackage
      .getFile('tests/dummy/config/coverage.js')
      .write('module.exports = { reporters: ["lcov"] };');

    const { coverageEnvVar, coverageFolder } = getCoverageConfig(testPackage.toPath());

    expect(coverageEnvVar).toEqual('COVERAGE');
    expect(coverageFolder).toEqual(testPackage.toPath('coverage'));
  });

  it('accepts the lcov-only reporter as being valid for its needs', async function () {
    await testPackage
      .getFile('tests/dummy/config/coverage.js')
      .write('module.exports = { reporters: ["lcov-only"] };');

    const { coverageEnvVar, coverageFolder } = getCoverageConfig(testPackage.toPath());

    expect(coverageEnvVar).toEqual('COVERAGE');
    expect(coverageFolder).toEqual(testPackage.toPath('coverage'));
  });

  it('errors when neither the lcov nor lcov-only reporters are configured for use', async function () {
    await testPackage
      .getFile('tests/dummy/config/coverage.js')
      .write('module.exports = { reporters: ["html"] };');

    expect(() => getCoverageConfig(testPackage.toPath())).toThrow();
  });

  it('will return relevant values from the coverage config file', async function () {
    await testPackage
      .getFile('tests/dummy/config/coverage.js')
      .write('module.exports = { reporters: ["lcov"], coverageFolder: "code-coverage", coverageEnvVar: "CODE_COVERAGE" };');

    const { coverageEnvVar, coverageFolder } = getCoverageConfig(testPackage.toPath());

    expect(coverageEnvVar).toEqual('CODE_COVERAGE');
    expect(coverageFolder).toEqual(testPackage.toPath('code-coverage'));
  });
});