const { join } = require('path');
const { existsSync } = require('fs');
const execa = require('execa');
const nopt = require('nopt');


/**
 * @typedef SonarScriptConfig
 * @type {object}
 *
 * @property {string} root           The root directory of the project being analyzed.
 * @property {object} pkg            The package.json contents of the project being analyzed.
 * @property {string} coverageEnvVar Typically "COVERAGE", this is the environment variable that ember-cli-code-coverage looks for when determining whether or not it should instrument a build.
 * @property {string} coverageFolder Typically "/coverage", this is the directory that analysis results will be written to.
 * @property {string} binPath        The full path to the .bin directory of the project.
 *
 * @property {SonarScriptCmdOpts} cmdOpts
 * @property {SonarScannerFiles} files
 */


/**
 * Command line arguments provided to the script.
 *
 * @typedef SonarScriptCmdOpts
 * @type {object}
 *
 * @property {boolean|undefined} help        Display help content.
 * @property {boolean|undefined} verbose     Attach stdio to executed commands when possible.
 * @property {boolean|undefined} cleanup     Delete analysis files/folders after uploading to Sonar.
 * @property {boolean|undefined} dry-run     Execute all steps except uploading to Sonar.
 * @property {"pipe"|"inherit"}  stdioConfig Either "inherit" or "pipe" depending on whether the `verbose` flag was provided.
 *
 * @property {function} getHelpText Returns information about available command line arguments.
 */


/**
 * @typedef SonarScannerFiles
 * @type {object}
 *
 * @property {string|null} eslintResultFile
 * @property {string|null} templateLintResultFile
 * @property {string|null} testResultFile
 * @property {string|null} coverageFile
 */


/**
 * @function getProjectRoot
 * @returns {string}
 */
function getProjectRoot() {
	return process.cwd();
}


/**
 * @function getNodeBinPath
 * @returns {string}
 */
function getNodeBinPath() {
	const { stdout } = execa.sync('npm', ['bin']);
	return stdout;
}


/**
 * @function getProjectPackage
 * @returns {object}
 */
function getProjectPackage() {
	const pkgPath = join(getProjectRoot(), 'package.json');

	if (!existsSync(pkgPath)) {
		throw new Error(`Cannot find "${pkgPath}". This script must be ran from the project root.`);
	}

	return require(pkgPath);
}


/**
 * Read the ember-cli-code-coverage config for the project containing information
 * about how to trigger coverage instrumentation and where the raw coverage data will be
 * collected.
 *
 * @function getCoverageConfig
 * @returns {{ coverageFolder: string, coverageEnvVar: string }}
 */
function getCoverageConfig() {
	const root = getProjectRoot();
	const pkg  = getProjectPackage();

	const configPath = join(root, (pkg['ember-addon'] && pkg['ember-addon'].configPath) || 'config');
	const configFile = join(configPath, 'coverage.js');

	let coverageEnvVar = 'COVERAGE';
	let coverageFolder = 'coverage';

	if (existsSync(configFile)) {
		const config = require(configFile);

		// The default config for ember-cli-code-coverage includes the lcov reporter by default.
		// This checks to ensure it is present if the reporters have been customized.
		if (Array.isArray(config.reporters) && !config.reporters.includes('lcov')) {
			throw new Error('The ember-cli-code-coverage lcov reporter must be configured for Sonar reporting.');
		}

		const mixedConfig = Object.assign({ coverageEnvVar, coverageFolder }, config);
		coverageEnvVar    = mixedConfig.coverageEnvVar;
		coverageFolder    = mixedConfig.coverageFolder;
	}

	coverageFolder = join(root, coverageFolder);

	return { coverageFolder, coverageEnvVar };
}


/**
 * @function getCommandLineArguments
 * @returns {SonarScriptCmdOpts}
 */
function getCommandLineArguments() {
	const opts = nopt({
		help:      Boolean,
		verbose:   Boolean,
		cleanup:   Boolean,
		'dry-run': Boolean,
	}, {
		h: ['--help'],
		v: ['--verbose'],
		c: ['--cleanup'],
		d: ['--dry-run'],
	});

	opts.getHelpText = function getHelpText() {
		return `
--help       (alias: -h):  Display help content.
--verbose    (alias: -v):  Attach stdio to executed commands when possible (default false).
--cleanup    (alias: -c):  Delete analysis files/folders after uploading to Sonar (default true).
--dry-run    (alias: -d):  Execute all steps except uploading to Sonar.
		`;
	}

	opts.stdioConfig = opts.verbose === true ? 'inherit' : 'pipe';

	return opts;
}


/**
 * @function buildSonarScriptConfig
 * @returns {SonarScriptConfig}
 */
module.exports = function buildSonarScriptConfig() {
	const config = getCoverageConfig();

	return Object.assign(config, {
		root:    getProjectRoot(),
		pkg:     getProjectPackage(),
		binPath: getNodeBinPath(),
		cmdOpts: getCommandLineArguments(),

		files: {
			eslintResultFile: null,
			templateLintResultFile: null,
			testResultFile: null,
			coverageFile: null,
		}
	});
}
