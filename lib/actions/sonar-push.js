const fs         = require('fs');
const path       = require('path');
const scanner    = require('sonarqube-scanner');
const propReader = require('properties-reader');

const { logInfo } = require('../utils/console-ui');


/**
 * @method buildSonarConfig
 * @param {SonarScriptConfig} config
 * @returns {object}
 */
function buildSonarConfig(config) {
	const scannerFilePath  = path.join(config.root, 'sonar-scanner.properties');
	const scannerFileProps = fs.existsSync(scannerFilePath)
		? propReader(scannerFilePath).getAllProperties()
		: {};

	const properties = {
		serverUrl: scannerFileProps['sonar.host.url'] || 'https://sonarqube.nsf.gov',
		options: {
			'sonar.javascript.lcov.reportPaths': config.files.coverageFile,
			'sonar.tests': 'tests',
			'sonar.sources': !!config.pkg['ember-addon'] ? 'addon' : 'app',
			'sonar.projectName': config.pkg.name,
		},
	};

	if (typeof config.pkg.repository === 'string') {
		properties.options['sonar.links.homepage'] = config.pkg.repository;
		properties.options['sonar.links.scm'] = config.pkg.repository;
	}

	if (config.files.eslintResultFile || config.files.templateLintResultFile) {
		properties.options['sonar.eslint.reportPaths'] = [
			config.files.eslintResultFile,
			config.files.templateLintResultFile
		].filter(Boolean).join(',');
	}

	if (config.files.testResultFile) {
		properties.options['testExecutionReportPaths'] = config.files.testResultFile;
	}

	properties.options = Object.assign(properties.options, scannerFileProps);
	return properties;
}


/**
 * @method pushMetricsToSonarqube
 * @param {SonarScriptConfig} config
 * @returns {Promise<void>}
 */
module.exports = function pushMetricsToSonarqube(config) {
	const scannerConfig = buildSonarConfig(config);

	if (config.cmdOpts['dry-run'] === true) {
		logInfo('This is a dry-run, so nothing will be uploaded to Sonar. Here is the built config that would have been used.');
		console.log(JSON.stringify(scannerConfig, null, 2));

		return Promise.resolve();
	}

	return new Promise(function(resolve) {
		logInfo('Starting SonarScanner (it\'s chatty)\n');
		scanner(scannerConfig, resolve);
		console.log('\n');
	});
}
