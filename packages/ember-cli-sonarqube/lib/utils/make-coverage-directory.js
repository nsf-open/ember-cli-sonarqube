const { existsSync, rmSync, mkdirSync } = require('fs');
const getCoverageConfig = require('./get-coverage-config');

/**
 * Verify that the coverage output directory exists and is empty.
 *
 * @param {string} projectDirectory
 *
 * @returns {string} The absolute path of the coverage output directory.
 */
module.exports = function makeCoverageDirectory(projectDirectory) {
  const { coverageFolder } = getCoverageConfig(projectDirectory);

  if (coverageFolder === projectDirectory || !coverageFolder.startsWith(projectDirectory)) {
    throw new Error('The ember-cli-sonarqube coverage output directory needs to be a subdirectory of the project directory.');
  }

  if (existsSync(coverageFolder)) {
    rmSync(coverageFolder, { recursive: true, force: true });
  }

  mkdirSync(coverageFolder);

  return coverageFolder;
}
