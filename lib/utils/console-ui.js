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
	 * @returns {ora.Ora}
	 */
	startProgress(text) {
		const spinner    = genericSpinner();
		spinner.color    = 'cyan';
		spinner.__text__ = text;

		return spinner.start(text);
	},


	/**
	 * @param {execa.ExecaReturnValue & { spinner: ora.Ora }} cmdResultOrError
	 * @param {string|boolean} [fail]
	 */
	endProgress(cmdResultOrError, fail) {
		const spinner  = cmdResultOrError.spinner;
		const endState = fail ? 'fail' : (cmdResultOrError.failed ? 'warn' : 'succeed');
		const text     = typeof fail === 'string' ? fail : spinner.__text__;

		if (spinner.isSpinning) {
			spinner[endState].call(spinner, text);
		}
		else {
			genericSpinner()[endState](text);
		}
	},


	/**
	 * @param {string} text
	 * @returns {ora.Ora}
	 */
	logInfo(text) {
		const spinner    = genericSpinner().info(text);
		spinner.__text__ = text;

		return spinner;
	},


	/**
	 *
	 */
	logDivider() {
		console.log('\n===============================================\n');
	},
};
