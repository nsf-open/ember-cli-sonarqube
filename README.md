[![Coverage Status](https://coveralls.io/repos/github/nsf-open/ember-cli-sonarqube/badge.svg?branch=main)](https://coveralls.io/github/nsf-open/ember-cli-sonarqube?branch=main)

@nsf-open/ember-cli-sonarqube
==============================================================================
Sonarqube analysis integration for Ember projects.


Installation
------------------------------------------------------------------------------
```bash
npm install @nsf-open/ember-cli-sonarqube --save-dev
```


Usage
------------------------------------------------------------------------------
This package provides the `sonar` executable. Depending on what is available in the project
being analyzed, the following steps are taken to gather metrics:

- Run `eslint`
- Run `ember-template-lint`
- Run project tests with `ember-cli-code-coverage` enabled
- Run `sonar-scanner`

```bash
npx sonar [options]
```

| Argument             | Type    | Default    | Description                                                                                                                                                                                                                                                   |
|----------------------|---------|------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| --help               | boolean | false      | Show help                                                                                                                                                                                                                                                     |
| --version            | boolean | false      | Show version number                                                                                                                                                                                                                                           |
| --cleanup            | boolean | true       | Delete analysis files after uploading.                                                                                                                                                                                                                        |
| --verbose            | boolean | false      | Output the full results of each gathered metric.                                                                                                                                                                                                              |
| --quiet              | boolean | false      | If true, test progression will not be logged.                                                                                                                                                                                                                 |
| --reject             | boolean | false      | If true, the process will exit with a non-zero code if any steps failed. This allows the results to also be used as part of a pipeline or quality gate, but note that this does not fail-fast; all steps will run regardless of how the previous step exited. |
| --test-cmd           | string  | "npm test" | The testing script that will be run to gather coverage info. This command does not need to include the `COVERAGE` environment flag needed by `ember-cli-code-coverage`.                                                                                       |
| --sonar-url          | string  | undefined  | The URL of the Sonarqube server. If not provided by this argument, the `sonar.host.url` property will need to be set in the project's `sonar-scanner.properties` file.                                                                                        |
| --sonar-token        | string  | undefined  | An access token for the Sonarqube server, if required.                                                                                                                                                                                                        |
| --dry-run            | boolean | false      | If true, metrics will be gathered but not uploaded to Sonarqube.                                                                                                                                                                                              |
| --only-analysis      | boolean | false      | If true, no new metrics will be gathered but any existing will be uploaded to Sonarqube.                                                                                                                                                                      |
| --eslinst-args       | string  | undefined  | Additional arguments that will be passed to ESLint.                                                                                                                                                                                                           |
| --template-lint-args | string  | undefined  | Additional arguments that will be passed to Ember Template Lint.                                                                                                                                                                                              |



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


Generic Test Data (QUnit)
------------------------------------------------------------------------------
If you'd like to record test results then this package provides a Testem reporter that outputs in the 
[SonarQube Generic Test Data](https://docs.sonarqube.org/latest/analysis/generic-test/) format. In order to use, 
you'll need to configure a few things.

In the project's `testem.js` config file, add the following to your existing configuration:

```javascript
// testem.js
const { SonarReporter } = require('@nsf-open/ember-cli-sonarqube/testem');

module.exports = {
  reporter: SonarReporter
}
```

In the project's `tests/test-helper.js` add the following:

```javascript
// tests/test-helper.js
import * as QUnit from 'qunit';
import { setupQunitReporting } from '@nsf-open/ember-cli-sonarqube/test-support';
setupQunitReporting(QUnit);
```
