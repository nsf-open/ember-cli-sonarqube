@nsf/ember-cli-sonarqube
==============================================================================
Sonarqube analysis integration for Ember projects.


Installation
------------------------------------------------------------------------------
```bash
npm install @nsf/ember-cli-sonarqube --save-dev
```


Usage
------------------------------------------------------------------------------
The highlight of this package is the `sonar` executable. Depending on what is available in the project
being analyzed, the following steps are taken to gather metrics:

- Run `eslint`
- Run `ember-template-lint`
- Run project tests with `ember-cli-code-coverage` enabled
- Run `sonar-scanner`

```bash
# (Super) basic usage
npx sonar
```
```
# Available CLI arguments

--help       (alias: -h):  Display help content.
--verbose    (alias: -v):  Attach stdio to executed commands when possible (default false).
--cleanup    (alias: -c):  Delete analysis files/folders after uploading to Sonar (default true).
--dry-run    (alias: -d):  Execute all steps except uploading to Sonar.
```


Environment Variables
------------------------------------------------------------------------------
The `SONAR` flag is provided with each child process, so it is easy to provide configuration specific to
the analysis task. For example, you might want to toggle linting rules to capture more information in Sonar.

For example:

```javascript
// .eslintrc.js

module.exports = {
  rules: {
    'ember/new-module-imports': process.env.SONAR ? 'error' : 'off',
  }
}
```


Generic Test Data
------------------------------------------------------------------------------
If you'd like to record test results then this package provides a Testem reporter that outputs in the 
[SonarQube Generic Test Data](https://docs.sonarqube.org/latest/analysis/generic-test/) format. In order 
to use, you'll need to configure a few things.

In the project's `testem.js` config file, add the following to your existing configuration:

```javascript
// testem.js
const SonarReporter = require('@nsf/ember-cli-sonarqube/testem/sonar-reporter');

module.exports = {
  reporter: process.env.SONAR ? SonarReporter : 'tap',
  report_file: process.env.SONAR_TEST_REPORT,
}
```

If using QUnit, then in the project's `tests/test-helper.js` add the following:

```javascript
// tests/test-helper.js
import { setupQunitReporting } from '@nsf/ember-cli-sonarqube/test-support';
setupQunitReporting();
```