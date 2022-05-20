const ora   = require('ora');
const chalk = require('chalk');

const prefixText = '[ember-cli-sonarqube]';
const color = 'blue';

function formatMessage(color, text, command, wasInfo) {
  let message = chalk[color](text);

  if (command && !wasInfo) {
    message += '\n' + chalk.gray(` >> ${command}`);
  }

  return message;
}

/**
 * A bit of default config for an Ora spinner.
 */
module.exports = function logProgress(message, command, info = false) {
  const rawText = message;
  const rawCmd  = command;
  const wasInfo = info;
  const spinner = ora({ prefixText, color });

  if (info) {
    spinner.info(formatMessage('blue', message, command));
  }
  else {
    spinner.start(formatMessage('blue', message, command));
  }

  return {
    succeed(msg) {
      spinner.succeed(formatMessage('green', msg || rawText, rawCmd, wasInfo));
    },

    warn(msg) {
      spinner.warn(formatMessage('yellow', msg || rawText, rawCmd, wasInfo));
    },

    fail(msg) {
      spinner.fail(formatMessage('red', msg || rawText, rawCmd, wasInfo));
    },

    finish(exitCode, reject = false) {
      if (!exitCode) {
        this.succeed();
      }
      else if (reject) {
        this.fail();
      }
      else {
        this.warn();
      }
    },

    verbose(title, text) {
      const delimiter = '*'.repeat(title.length);
      console.debug(`\n${title}\n${delimiter}\n${text}\n${delimiter}\n`);
    }
  }
}
