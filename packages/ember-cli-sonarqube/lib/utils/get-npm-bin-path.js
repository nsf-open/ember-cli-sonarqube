const execa = require('execa');

/**
 * Returns the NPM bin path for the directory. Typically, something that end in
 * `"/node_modules/.bin"`.
 *
 * @returns {string}
 */
module.exports = function getNodeBinPath(directory = process.cwd()) {
  const { stdout } = execa.sync('npm', ['bin'], { cwd: directory });
  return stdout;
}