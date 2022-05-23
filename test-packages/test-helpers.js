const execa = require("execa");
const { join } = require('path');
const { readFileSync, writeFileSync } = require('fs');

/**
 * Put together an absolute path to the named test addon.
 *
 * @param {string} testPackage
 * @param {...string} rest
 *
 * @returns {string}
 */
function getTestPackagePath(testPackage, ...rest) {
  return join(__dirname, testPackage, ...rest);
}

/**
 * Get the contents of a file, optionally parsing it as JSON.
 *
 * @param {string} testPackage  The name of the test addon.
 * @param {string} relativePath The file path, relative to the test addon root.
 * @param {{
 *    parseAsJSON: boolean,
 *    doRequire: boolean
 * }} [options]
 *
 * @returns {string}
 */
function readFile(testPackage, relativePath, { parseAsJSON = false, doRequire = false } = {}) {
  const filePath = getTestPackagePath(testPackage, relativePath);

  if (doRequire) {
    return require(filePath);
  }

  const contents = readFileSync(filePath, { encoding: 'utf-8' });

  if (parseAsJSON) {
    return JSON.parse(contents);
  }

  return contents;
}

/**
 * Adds configuration to the ember-cli-build.js file of a test addon package.
 *
 * @param {string} testPackage The name of the test addon.
 * @param {string} fileName    The name of the file to write.
 * @param {string} contents
 *
 * @returns {void}
 */
function writeFile(testPackage, fileName, contents) {
  const filePath = getTestPackagePath(testPackage, fileName);
  writeFileSync(filePath, contents, { encoding: 'utf-8' });
}

/**
 * Runs git clean and git restore against the provided test addon.
 *
 * @param {string} testPackage The name of the test addon.
 *
 * @returns {Promise<void>}
 */
async function gitReset(testPackage) {
  await execa('git', ['clean', '-f', testPackage], { cwd: __dirname });
  await execa('git', ['restore', testPackage], { cwd: __dirname });
}

/**
 * Deletes (rm -rf) a directory within the provided test addon.
 *
 * @param {string} testPackage The name of the test addon.
 * @param {string} directory   The subdirectory to remove.
 *
 * @returns {Promise<void>}
 */
async function deleteDirectory(testPackage, directory) {
  const directoryPath = getTestPackagePath(testPackage, directory);
  await execa('rm', ['-rf', directoryPath], { stdio: 'inherit' }
  );
}

/**
 * Runs the `sonar` command against the provided test addon. This will always run with
 * `--dry-run` set to true.
 *
 * @param {string} testPackage     The name of the test addon.
 * @param {string[]} [commandArgs] Additional arguments for the command.
 *
 * @returns {Promise<void>}
 */
async function sonar(testPackage, commandArgs = []) {
  const cwd  = getTestPackagePath(testPackage);
  const args = ['sonar', ...commandArgs, '--dry-run=true', '--quiet=true'];

  await execa('npx', args, { cwd, stdio: 'inherit' });
}

module.exports = {
  getTestPackagePath,
  readFile,
  writeFile,
  gitReset,
  deleteDirectory,
  sonar,
}