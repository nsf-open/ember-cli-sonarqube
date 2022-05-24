const execa = require("execa");
const { join, normalize } = require('path');
const fs = require('fs');
const rimraf = require('rimraf');

/**
 * Returns a utility object for a given package in the test-packages folder.
 */
function getTestPackage(testPackage) {
  const pkg = testPackage;

  return {
    toPath(...rest) {
      return getTestPackagePath(pkg, ...rest);
    },

    getFile(fileName) {
      return getFile(pkg, fileName);
    },

    reset(...rest) {
      return gitReset(getTestPackagePath(pkg, ...rest));
    },

    directoryExists(relativePath) {
      return fs.existsSync(this.toPath(relativePath));
    },

    deleteDirectory(relativePath) {
      return deleteDirectory(pkg, relativePath);
    },

    sonar(commandArgs = []) {
      return sonar(pkg, commandArgs);
    },
  }
}

/**
 * Returns a utility object that can perform CRUD operations on a file.
 */
function getFile(testPackage, fileName) {
  const pkg  = testPackage;
  const name = fileName;

  return {
    read({ parseAsJSON = false, doRequire = false } = {}) {
      return readFile(pkg, name, { parseAsJSON, doRequire });
    },

    write(newContent) {
      return writeFile(pkg, name, newContent);
    },

    update(newContents, { searchTerm = undefined, replace = false } = {}) {
      return updateFile(pkg, name, newContents, {searchTerm, replace});
    },

    delete() {
      return deleteFile(pkg, name);
    },
  }
}

/**
 * Put together an absolute path to the named test addon.
 *
 * @param {string} testPackage
 * @param {...string} rest
 *
 * @returns {string}
 */
function getTestPackagePath(testPackage, ...rest) {
  return normalize(join(__dirname, '..', testPackage, ...rest));
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
 * @returns {Promise<string | object>}
 */
async function readFile(testPackage, relativePath, { parseAsJSON = false, doRequire = false } = {}) {
  const filePath = getTestPackagePath(testPackage, relativePath);

  if (doRequire) {
    return require(filePath);
  }

  const contents = await new Promise(resolve => {
    fs.readFile(filePath, { encoding: 'utf8' }, (err, result) => resolve(result));
  });

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
 * @returns {Promise<void>}
 */
async function writeFile(testPackage, fileName, contents) {
  const filePath = getTestPackagePath(testPackage, fileName);

  await new Promise(resolve => {
    fs.writeFile(filePath, contents, { encoding: 'utf8' }, resolve);
  });
}

/**
 * @param {string} testPackage
 * @param {string} fileName
 * @param {string} newContents
 * @param {{ searchTerm?: string, replace?: boolean }} [options]
 *
 * @returns {Promise<void>}
 */
async function updateFile(testPackage, fileName, newContents, { searchTerm = undefined, replace = false } = {}) {
  let fileContent = await readFile(testPackage, fileName);

  if (searchTerm) {
    if (replace) {
      fileContent.replace(searchTerm, newContents);
    }
    else {
      const idx = fileContent.indexOf(searchTerm) + searchTerm.length;
      fileContent = fileContent.substring(0, idx) + '\n' + newContents + fileContent.substring(idx);
    }
  }
  else {
    fileContent += '\n' + newContents;
  }

  await writeFile(testPackage, fileName, fileContent);
}

/**
 * @param {string} testPackage
 * @param {string} fileName
 */
async function deleteFile(testPackage, fileName) {
  await new Promise(
    resolve => rimraf(getTestPackagePath(testPackage, fileName), resolve)
  );
}

/**
 * Runs git clean and git restore against the provided test addon.
 *
 * @param {string} testPackage The name of the test addon.
 *
 * @returns {Promise<void>}
 */
async function gitReset(testPackage) {
  await execa('git', ['clean', '-f', testPackage], { cwd: getTestPackagePath('') });
  await execa('git', ['restore', testPackage], { cwd: getTestPackagePath('') });
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
  return new Promise(resolve => rimraf(getTestPackagePath(testPackage, directory), resolve));
}

/**
 * Runs the `sonar` command against the provided test addon. This will always run with
 * `--dry-run` set to true.
 *
 * @param {string} testPackage     The name of the test addon.
 * @param {string[]} [commandArgs] Additional arguments for the command.
 *
 * @returns {execa.ExecaChildProcess}
 */
function sonar(testPackage, commandArgs = []) {
  const cwd  = getTestPackagePath(testPackage);
  const args = ['sonar', ...commandArgs, '--dry-run=true'];

  return execa('npx', args, { cwd });
}

/**
 * Escape regular expression special characters.
 *
 * @param {string} string
 * @returns {string}
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  getTestPackage,
  getTestPackagePath,
  getFile,
  readFile,
  writeFile,
  updateFile,
  deleteFile,
  gitReset,
  deleteDirectory,
  sonar,
  escapeRegExp,
}