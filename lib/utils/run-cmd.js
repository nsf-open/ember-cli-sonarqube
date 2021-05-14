const execa = require('execa');
const { startProgress, logInfo, logDivider } = require('../utils/console-ui');


/**
 * Run a command asynchronously inside a child process.
 *
 * @function runCommand
 *
 * @param {string} cmdName
 * @param {string} cmdArgs
 * @param {object} envOpts
 * @param {SonarScriptConfig} config
 *
 * @returns {Promise<execa.ExecaReturnValue & { spinner: ora.Ora }>}
 */
module.exports = async function runCommand(cmdName, cmdArgs, envOpts, config) {
	const fullCmd = `${cmdName} ${cmdArgs}`.trim();
	const spinner = config.cmdOpts.verbose ? logInfo(fullCmd) : startProgress(fullCmd);
	const envVars = Object.assign({ SONAR: 'true' }, envOpts || {});

	const childProcess = execa.command(fullCmd, { env: envVars, all: true });

	if (config.cmdOpts.verbose) {
		logDivider();
		console.log(JSON.stringify(envVars, null ,2));

		childProcess.stdout.pipe(process.stdout);
		childProcess.stderr.pipe(process.stderr);
	}

	let resultOrError;

	try {
		resultOrError = await childProcess;
	}
	catch (e) {
		resultOrError = e;
	}

	if (config.cmdOpts.verbose) {
		logDivider();
	}

	return Object.assign({ spinner }, resultOrError);
}
