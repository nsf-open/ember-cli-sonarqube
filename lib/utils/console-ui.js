const ora   = require('ora');
const chalk = require('chalk');


function genericSpinner() {
	return ora({ prefixText: chalk.cyan.bold('SONAR') });
}


module.exports = {
	startProgress(text) {
		const spinner = genericSpinner();
		spinner.color = 'yellow';

		return spinner.start(text);
	},

	logInfo(text) {
		return genericSpinner().info(text);
	},
};
