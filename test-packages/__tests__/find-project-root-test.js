const path = require('path');
const os = require('os');
const findProjectRoot = require('@nsf-open/ember-cli-sonarqube/lib/utils/find-project-root');


describe('findProjectRoot Utilities', function () {
  it('will find the root directory of the project', function () {
    const workspaceRoot = path.normalize(path.join(__dirname, '..', '..'));

    expect(findProjectRoot()).toEqual(workspaceRoot);
    expect(findProjectRoot(__dirname)).toEqual(workspaceRoot);
    expect(findProjectRoot(os.tmpdir())).toEqual(null);
  });
});