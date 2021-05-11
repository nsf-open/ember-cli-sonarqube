const fs    = require('fs');
const path  = require('path');
const execa = require('execa');
const chalk = require('chalk');

const { startProgress, logInfo } = require('../utils/console-ui');


/**
 * @method gatherESLintFindings
 * @param {SonarScriptConfig} config
 * @returns {Promise<string|null>}
 */
module.exports = async function gatherESLintFindings(config) {
	if (fs.existsSync(path.join(config.binPath, 'eslint'))) {
		const spinner = startProgress('Running ESLint');
		const outPath = path.join(config.coverageFolder, 'eslint-out.json');

		try {
			await execa('npx', ['eslint', '-f', 'json', '-o', outPath, '.'], {
				env:   { SONAR: 'true' },
				stdio: config.cmdOpts.stdioConfig,
			});

			spinner.succeed('ESLint Complete');
		}
		catch (e) {
			if (fs.existsSync(outPath)) {
				spinner.warn('ESLint Complete (w/ linting errors)');
			}
			else {
				spinner.fail('ESLint Failed w/ message ' + chalk.red(e.message));
			}
		}

		return outPath;
	}
	else {
		logInfo('ESLint is not available in this project. Skipping.');
	}

	return null;
}
