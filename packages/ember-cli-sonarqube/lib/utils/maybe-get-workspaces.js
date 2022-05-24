const { join } = require('path');
const { readFileSync } = require('fs');

/**
 * Checks a package.json for a workspaces array, returning either it or undefined.
 *
 * @param {string} projectRoot
 * @returns {string[] | undefined}
 */
module.exports = function getWorkspaces(projectRoot) {
  try {
    const pkgJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));

    if (Array.isArray(pkgJson.workspaces) && pkgJson.workspaces.length > 0) {
      return pkgJson.workspaces;
    }
  } catch { /* noop */ }

  return undefined;
}
