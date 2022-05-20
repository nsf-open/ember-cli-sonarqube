const { dirname, join, normalize } = require('path');
const { readFileSync } = require('fs');

/**
 * Walks upwards through directories, stopping when it finds a package.json and
 * returning the path.
 *
 * @returns {string}
 */
module.exports = function findProjectRoot(initial = process.cwd()) {
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