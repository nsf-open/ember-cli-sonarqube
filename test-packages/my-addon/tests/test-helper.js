import Application from 'dummy/app';
import config from 'dummy/config/environment';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start } from 'ember-qunit';
import {
  forceModulesToBeLoaded,
  sendCoverage,
} from 'ember-cli-code-coverage/test-support';
import { setupQunitReporting } from '@nsf-open/ember-cli-sonarqube/test-support';

setApplication(Application.create(config.APP));

QUnit.done(async function () {
  forceModulesToBeLoaded();
  await sendCoverage();
});

setupQunitReporting(QUnit);
setup(QUnit.assert);

start();
