#!/usr/bin/env node
const execa = require('execa');


const { startProgress, endProgress, logInfo } = require('./lib/utils/console-ui');

const runCommand                 = require('./lib/utils/run-cmd');
const buildSonarScriptConfig     = require('./lib/utils/config');
const gatherESLintFindings       = require('./lib/actions/eslint');
const gatherTemplateLintFindings = require('./lib/actions/template-lint');
const gatherCodeCoverageMetrics  = require('./lib/actions/test-coverage');
const pushMetricsToSonarqube     = require('./lib/actions/sonar-push');




(async function run() {
	const config = buildSonarScriptConfig();


	// ----------------------------------------
	// Show help content and bail, if requested
	// ----------------------------------------
	if (config.cmdOpts.help) {
		console.log(config.cmdOpts.getHelpText());
		process.exit(0);
		return;
	}


	// ----------------------------------------
	// Prep the coverage directory
	// ----------------------------------------
	let resultOrError = await runCommand('mkdir', `-p ${config.coverageFolder}`, {}, config);
	endProgress(resultOrError);


	// ----------------------------------------
	// Run ESLint, if available
	// ----------------------------------------
	config.files.eslintResultFile = await gatherESLintFindings(config);


	// ----------------------------------------
	// Run TemplateLint, if available
	// ----------------------------------------
	config.files.templateLintResultFile = await gatherTemplateLintFindings(config);


	// ----------------------------------------
	// Run tests - this provides the LCOV report
	// ----------------------------------------
	const metrics = await gatherCodeCoverageMetrics(config);
	config.files.testResultFile = metrics.testResultFile;
	config.files.coverageFile   = metrics.coverageFile;


	// ----------------------------------------
	// Push to Sonarqube
	// ----------------------------------------
	await pushMetricsToSonarqube(config);


	// ----------------------------------------
	// Cleanup
	// ----------------------------------------
	if (config.cmdOpts.cleanup !== false) {
		resultOrError = await runCommand('rm', `-rf ${config.coverageFolder}`, {}, config);
		endProgress(resultOrError);
	}
	else {
		logInfo('Skipping Clean Up');
	}

	logInfo('All Done!');
})();
