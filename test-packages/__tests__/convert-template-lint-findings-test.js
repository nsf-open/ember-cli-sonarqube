const { join } = require('path');
const { readFileSync } = require('fs');
const convertTemplateLint = require('@nsf-open/ember-cli-sonarqube/lib/utils/convert-template-lint-findings');

describe('convertTemplateLintFindings Utilities', function () {
  it('converts Ember Template Lint JSON into ESLint JSON', function () {
    const tmplLintJson  = readFileSync(join(__dirname, '__fixtures__', 'template-lint-example.json'), 'utf8');
    const convertedJson = readFileSync(join(__dirname, '__fixtures__', 'converted-eslint-example.json'), 'utf8');

    expect(convertTemplateLint('/foo/bar', tmplLintJson)).toEqual(convertedJson);
  });
});
