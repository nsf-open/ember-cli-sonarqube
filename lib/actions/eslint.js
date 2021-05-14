const fs    = require('fs');
const path  = require('path');

const { endProgress, logInfo } = require('../utils/console-ui');
const runCommand = require('../utils/run-cmd');


/**
 * @function gatherESLintFindings
 * @param {SonarScriptConfig} config
 * @returns {Promise<string|null>}
 */
module.exports = async function gatherESLintFindings(config) {
	if (!fs.existsSync(path.join(config.binPath, 'eslint'))) {
		logInfo('ESLint is not available in this project. Skipping.');
		return null;
	}

	const outPath = path.join(config.coverageFolder, 'eslint-out.json');
	const cmdName = 'npx eslint';
	const cmdArgs = `-f json .`;

	let resultOrError;

	try {
		resultOrError = await runCommand(cmdName, cmdArgs, {}, config);
	}
	catch (e) {
		resultOrError = e;
	}

	try {
		if (JSON.parse(resultOrError.stdout)) {
			fs.writeFileSync(outPath, resultOrError.stdout, 'utf-8');
			endProgress(resultOrError);
		}

		return outPath;
	}
	catch (e) {
		endProgress(resultOrError, true);
	}

	return null;
}
