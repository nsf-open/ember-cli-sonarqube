const { join } = require('path');

/**
 * Rewrites the JSON of ember-template-lint into ESLint formatted JSON so
 * that it can be read by Sonar.
 *
 * @param {string} projectRoot
 * @param {string} jsonString
 * @returns {string}
 */
module.exports = function convertTemplateLintFinding(projectRoot, jsonString) {
  const contents = JSON.parse(jsonString);
  const results  = [];

  Object.keys(contents).forEach(function(key) {
    const original = contents[key];
    const updated  = {};

    updated.filePath     = join(projectRoot, key);
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
