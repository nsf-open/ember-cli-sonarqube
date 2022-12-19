const { getConfiguration } = require('@nsf-open/ember-cli-sonarqube/lib/configuration');
const { getSonarConfiguration } = require('@nsf-open/ember-cli-sonarqube/lib/report-metrics');
const { getTestPackage } = require('./test-helpers');


describe('getSonarConfiguration', function () {
  const testPackage = getTestPackage('my-addon');

  afterEach(function () {
    jest.resetModules();
    return testPackage.reset();
  });

  it('filters the sources list to only directories that exist', function () {
    const cliConfig   = getConfiguration(testPackage.toPath(), { 'dry-run': true });
    const sonarConfig = getSonarConfiguration(cliConfig);

    expect(sonarConfig.options['sonar.sources']).toEqual('addon');
  });
});
