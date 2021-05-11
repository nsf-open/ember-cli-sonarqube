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
# Basic usage
npx sonar
```

