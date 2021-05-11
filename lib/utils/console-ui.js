const ora   = require('ora');
const chalk = require('chalk');


/**
 * @returns {ora.Ora}
 */
function genericSpinner() {
	return ora({ prefixText: chalk.cyan.bold('SONAR') });
}


module.exports = {
	/**
	 * @param {string} text
	 * @param {SonarScriptConfig} [config]
	 * @returns {ora.Ora}
	 */
	startProgress(text, config) {
		const spinner = genericSpinner();
		spinner.color = 'cyan';

		if (config.cmdOpts.verbose) {
			return spinner.info(text);
		}

		return spinner.start(text);
	},


	/**
	 * @param {string} text
	 * @returns {ora.Ora}
	 */
	logInfo(text) {
		return genericSpinner().info(text);
	},
};
