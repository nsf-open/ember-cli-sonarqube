const fs    = require('fs');
const path  = require('path');
const execa = require('execa');

const { startProgress } = require('../utils/console-ui');


/**
 * @method gatherCodeCoverageMetrics
 * @param {SonarScriptConfig} config
 * @returns {Promise<{ coverageFile: string, testResultFile: string|null }>}
 */
module.exports = async function gatherCodeCoverageMetrics(config) {
	const spinner = startProgress('Running Tests (this will take awhile)');

	let coverageFile   = path.join(config.coverageFolder, 'lcov.info');
	let testResultFile = path.join(config.coverageFolder, 'test-report.xml');

	try {
		await execa('npm', ['test', '--', '--silent'], {
			env: {
				[config.coverageEnvVar]: 'true',
				SONAR: 'true',
				SONAR_TEST_REPORT: testResultFile,
			},
			stdio: config.cmdOpts.stdioConfig,
		});

		spinner.succeed('Tests Complete');
	}
	catch (e) {
		spinner.warn('Tests Complete (w/ failures)');
	}

	if (!fs.existsSync(testResultFile)) {
		testResultFile = null;
	}

	return { coverageFile, testResultFile };
}