/* eslint-env node */
const fs = require('fs');
const XmlDom = require('xmldom');
const { TestFileMatcher } = require('./utils');
const { tap } = require('testem/lib/reporters');

const resultsOutFile = process.env.SONAR_TEST_REPORT;
const configPolyfill = { get() { return false; } };

module.exports = class SonarReporter {
  constructor(silent, out, config) {
    this.out      = out || process.stdout;
    this.silent   = silent;
    this.id       = 1;
    this.total    = 0;
    this.passed   = 0;
    this.skipped  = 0;
    this.results  = [];
    this.metadata = {};

    this.tapReport = new tap(
      silent,
      resultsOutFile ? process.stderr : this.out,
      config || configPolyfill
    );
  }

  // Called by Testem each time it receives a metadata message via its websocket
  // with the browser.
  reportMetadata(tag, metadata) {
    if (tag === 'test-done' && metadata) {
      this.metadata[metadata.testId] = metadata;
    }
  }

  display() {
    this.tapReport.display();
  }

  report(prefix, data) {
    this.results.push({ launcher: prefix, result: data });

    this.total   += 1;
    this.skipped += (data.skipped ? 1 : 0);
    this.passed  += (data.passed  ? 1 : 0);

    this.tapReport.report(prefix, data);
  }

  finish() {
    if (!this.silent) {
      this.tapReport.finish();
    }

    if (resultsOutFile) {
      const { xml } = this.buildXmlString();
      fs.writeFileSync(process.env.SONAR_TEST_REPORT, xml, 'utf8');
    }
  }

  buildXmlString() {
    const matcher   = new TestFileMatcher();
    const unmatched = [];

    for (const { result } of this.results) {
      const testId   = result.originalResultObj.testId;
      const metadata = this.metadata[testId];

      if (metadata.module.match(/ESLint|TemplateLint|Ember\.onerror/)) {
        continue;
      }

      if (metadata) {
        if (result.error && result.error.stack) {
          metadata.stack = result.error.stack;
        }

        if (!matcher.matchMetadataToFile(metadata)) {
          unmatched.push(metadata);
        }
      }
    }

    const document = new XmlDom.DOMImplementation(null).createDocument('', 'testExecutions');
    const docRoot  = document.documentElement;

    docRoot.setAttribute('version', '1');
    matcher.testFiles.forEach(entry => docRoot.appendChild(entry.toXML(document)));

    return { unmatched, xml: docRoot.toString() };
  }
}
