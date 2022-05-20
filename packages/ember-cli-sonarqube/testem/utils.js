const fs = require('fs');
const glob = require('glob');
const findProjectRoot = require('../lib/utils/find-project-root');


/**
 * A MatcherEntry instance is created for each test file, and stores information
 * about that file such as its raw text content, and test metadata that has been
 * matched to that content.
 */
class MatcherEntry {
  constructor(filePath) {
    this.filePath   = filePath;
    this.moduleName = new Set();
    this.metadata   = [];
    this.contents   = undefined;
  }

  getContents() {
    if (!this.contents) {
      this.contents = fs.readFileSync(this.filePath, 'utf8');
    }

    return this.contents;
  }

  matchContents(searchTerms) {
    const contents = this.getContents();

    for (const term of searchTerms) {
      if (!contents.includes(term)) {
        return false;
      }
    }

    return true;
  }

  addMetadata(metadata) {
    this.moduleName.add(metadata.module);
    this.metadata.push(metadata);
  }

  toXML(document) {
    const file = document.createElement('file');
    file.setAttribute('path', this.filePath);

    this.metadata.forEach((metadata) => {
      const testcase = document.createElement('testCase');
      testcase.setAttribute('name', `${ metadata.module }: ${ metadata.name }`);
      testcase.setAttribute('duration', metadata.runtime);

      if (metadata.skipped) {
        const condition = document.createElement('skipped');
        condition.setAttribute('message', 'Test Skipped');
        testcase.appendChild(condition);
      }
      else if (metadata.failed) {
        const condition = document.createElement('failure');
        condition.setAttribute('message', metadata.assertions[0].message);
        condition.appendChild(document.createTextNode(metadata.stack));
        testcase.appendChild(condition);
      }

      file.appendChild(testcase);
    });

    return file;
  }
}


/**
 * The TestFileMatcher attempts to correlate test metadata to an actual on disk file
 * using the test's module and name.
 */
class TestFileMatcher {
  constructor() {
    const testFilePaths = glob.sync('tests/**/*-test@(.js|.ts)', {
      cwd: findProjectRoot(),
      absolute: true,
    });

    this.testFiles = testFilePaths.map(filePath => new MatcherEntry(filePath));
  }

  getFileByModuleName(moduleName) {
    return this.testFiles.find(testFile => testFile.moduleName.has(moduleName));
  }

  searchFileContents(searchTerms) {
    return this.testFiles.find(entry => entry.matchContents(searchTerms));
  }

  matchMetadataToFile(metadata) {
    const file = this.getFileByModuleName(metadata.module)
      || this.searchFileContents([...metadata.module.split(' > '), metadata.name]);

    if (file) {
      file.addMetadata(metadata);
    }

    return file;
  }
}


module.exports = {
  TestFileMatcher,
}