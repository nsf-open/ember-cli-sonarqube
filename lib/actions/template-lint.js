const fs    = require('fs');
const path  = require('path');

const { endProgress, logInfo } = require('../utils/console-ui');
const runCommand = require('../utils/run-cmd');


// Rewrites the JSON of ember-template-lint into ESLint formatted JSON so
// that it can be read by Sonar.
function rewriteTemplateLintJson(originalJson) {
	const contents = JSON.parse(originalJson);
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

	return JSON.stringify(results);
}


/**
 * @method gatherTemplateLintFindings
 * @param {SonarScriptConfig} config
 * @returns {Promise<string|null>}
 */
module.exports = async function gatherTemplateLintFindings(config) {
	if (!fs.existsSync(path.join(config.binPath, 'ember-template-lint'))) {
		logInfo('TemplateLint is not available in this project. Skipping.');
		return null;
	}

	const outPath = path.join(config.coverageFolder, 'template-lint-out.json');
	const cmdName = 'npx ember-template-lint';
	const cmdArgs = '--json .';

	let resultOrError;

	try {
		resultOrError = await runCommand(cmdName, cmdArgs, {}, config);
	}
	catch (e) {
		resultOrError = e;
	}

	try {
		fs.writeFileSync(outPath, rewriteTemplateLintJson(resultOrError.stdout), 'utf8');
		endProgress(resultOrError);

		return outPath;
	}
	catch (e) {
		// Most likely cause is JSON.parse failing
		endProgress(resultOrError, true);
	}

	return null;
}
