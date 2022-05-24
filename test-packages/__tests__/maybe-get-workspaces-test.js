const maybeGetWorkspaces = require('@nsf-open/ember-cli-sonarqube/lib/utils/maybe-get-workspaces');
const { getTestPackage } = require('./test-helpers');

describe('maybeGetWorkspaces Utilities', function () {
  const testPackage = getTestPackage('my-addon');

  it('returns undefined for projects that are not workspaces', function () {
    expect(maybeGetWorkspaces(testPackage.toPath())).toEqual(undefined);
  });
});