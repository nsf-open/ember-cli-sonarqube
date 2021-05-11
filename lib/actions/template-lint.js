const fs    = require('fs');
const path  = require('path');
const execa = require('execa');
const chalk = require('chalk');

const { startProgress, logInfo } = require('../utils/console-ui');


/**
 * @method gatherTemplateLintFindings
 * @param {SonarScriptConfig} config
 * @returns {Promise<string|null>}
 */
module.exports = async function gatherTemplateLintFindings(config) {
	if (fs.existsSync(path.join(config.binPath, 'ember-template-lint'))) {
		const spinner = startProgress('Running TemplateLint');
		const outPath = path.join(config.coverageFolder, 'template-lint-out.json');

		let withError  = false;
		let jsonString = '{}';

		try {
			const { stdout } = await execa('npx', ['ember-template-lint', '--json', '.'], {
				env:   { SONAR: 'true' } ,
				stdio: config.cmdOpts.stdioConfig,
			});
			jsonString = stdout;
		}
		catch (e) {
			withError  = true;
			jsonString = e.stdout;
		}

		try {
			// Rewrites the JSON of ember-template-lint into ESLint formatted JSON so
			// that it can be read by Sonar.
			const contents = JSON.parse(jsonString);
			const results  = [];

			Object.keys(contents).forEach(function(key) {
				const original = contents[key];
				const updated  = {};

				updated.filePath     = key;
				updated.messages     = [];
				updated.errorCount   = original.filter(item => item.severity === 2).length;
				updated.warningCount = original.filter(item => item.severity === 1).length;

				original.forEach(function(entry) {
					updated.messages.push({
						ruleId:   entry.rule,
						severity: entry.severity,
						message:  entry.message,
						line:     entry.line,
						column:   entry.column,
					});
				});

				results.push(updated);
			});

			fs.writeFileSync(outPath, JSON.stringify(results), 'utf8');

			if (withError) {
				spinner.warn('TemplateLint Complete (w/ linting errors)');
			}
			else {
				spinner.succeed('TemplateLint Complete');
			}
		}
		catch (e) {
			if (fs.existsSync(outPath)) {
				spinner.warn('TemplateLint Complete (w/ linting errors)');
			}
			else {
				spinner.fail('TemplateLint Failed w/ message ' + chalk.red(e.message));
			}
		}

		return outPath;
	}
	else {
		logInfo('TemplateLint is not available in this project. Skipping.');
	}

	return null;
}