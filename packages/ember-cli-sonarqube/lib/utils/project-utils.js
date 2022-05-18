const { dirname, join, normalize } = require('path');
const { readFileSync } = require('fs');

/**
 * Walks upwards through directories, stopping when it finds a package.json.
 */
function findProjectRoot(initial = process.cwd()) {
  let previous = null;
  let current  = normalize(initial);

  do {
    let pkgJson = undefined;

    try {
      pkgJson = JSON.parse(readFileSync(join(current, 'package.json'), 'utf8'));
    } catch { /* noop */ }

    if (pkgJson) {
      return current;
    }

    previous = current;
    current  = dirname(current);
  } while (current !== previous);

  return null;
}

/**
 * Checks a package.json for a workspaces array, returning either it or undefined.
 */
function getWorkspaces(projectDirectory = undefined) {
  const root = projectDirectory || findProjectRoot();

  if (root) {
    try {
      const pkgJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

      if (Array.isArray(pkgJson.workspaces) && pkgJson.workspaces.length > 0) {
        return pkgJson.workspaces;
      }
    } catch { /* noop */ }
  }

  return undefined;
}

/**
 *
 */
function listWorkspacePackages(projectDirectory = undefined) {

}

module.exports = {
  findProjectRoot,
  getWorkspaces,
  listWorkspacePackages,
}
