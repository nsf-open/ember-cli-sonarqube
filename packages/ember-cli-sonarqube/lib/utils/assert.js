const chalk = require('chalk');

/**
 * @param {string}  message
 * @param {boolean} condition
 */
module.exports = function assert (message, condition) {
  if (condition) {
    throw new Error(chalk.red(message));
  }
}
