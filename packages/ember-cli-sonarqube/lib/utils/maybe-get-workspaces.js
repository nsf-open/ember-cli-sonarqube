const findProjectRoot = require('./find-project-root');
const { join } = require('path');
const { readFileSync } = require('fs');

/**
 * Checks a package.json for a workspaces array, returning either it or undefined.
 *
 * @returns {string[] | undefined}
 */
module.exports = function getWorkspaces(projectDirectory = undefined) {
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