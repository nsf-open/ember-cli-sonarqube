#!/usr/bin/env node
const execa = require('execa');


const { startProgress, logInfo } = require('./lib/utils/console-ui');
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
	let spinner = startProgress('Create folder for analysis findings');
	await execa('mkdir', ['-p', `"${config.coverageFolder}"`], { stdio: config.cmdOpts.stdioConfig });
	spinner.succeed();


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
		spinner = startProgress('Clean Up');
		await execa('rm', ['-rf', config.coverageFolder], { stdio: config.cmdOpts.stdioConfig });
		spinner.succeed();
	}
	else {
		logInfo('Skipping Clean Up');
	}

	logInfo('All Done!');
})();
