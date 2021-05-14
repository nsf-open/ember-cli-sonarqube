const fs    = require('fs');
const path  = require('path');

const { endProgress } = require('../utils/console-ui');
const runCommand = require('../utils/run-cmd');


/**
 * @method gatherCodeCoverageMetrics
 * @param {SonarScriptConfig} config
 * @returns {Promise<{ coverageFile: string, testResultFile: string|null }>}
 */
module.exports = async function gatherCodeCoverageMetrics(config) {
	let coverageFile   = path.join(config.coverageFolder, 'lcov.info');
	let testResultFile = path.join(config.coverageFolder, 'test-report.xml');

	const cmdName = 'npm run';
	const cmdArgs = config.cmdOpts['test-cmd'] || 'test';
	const envArgs = {
		[config.coverageEnvVar]: 'true',
		SONAR_TEST_REPORT: testResultFile,
	};

	let resultOrError;

	try {
		resultOrError = await runCommand(cmdName, cmdArgs, envArgs, config);

		if (!fs.existsSync(testResultFile)) {
			testResultFile = null;
		}

		endProgress(resultOrError);
	}
	catch (e) {
		resultOrError = e;
		endProgress(resultOrError, true);
	}

	return { coverageFile, testResultFile };
}