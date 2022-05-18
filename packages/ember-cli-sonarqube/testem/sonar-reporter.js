/* eslint-env node */

const XmlDom = require('xmldom');
const glob = require('glob');
const { readFileSync } = require('fs');


function compareStringOrStringArray(source, testSubject) {
	if (typeof source === 'string') {
		return source === testSubject;
	}
	else if (Array.isArray(source)) {
		return source.includes(testSubject);
	}

	return false;
}


class SonarReporter {
	constructor(silent, out /* , config */) {
		this.out          = out || process.stdout;
		this.silent       = silent;
		this.id           = 1;
		this.total        = 0;
		this.passed       = 0;
		this.skipped      = 0;
		this.results      = [];
		this.startTime    = new Date();
		this.endTime      = null;
		this.metadata     = {};
		this.fileContents = null;
	}


	report(prefix, data) {
		this.results.push({ launcher: prefix, result: data });

		this.total   += 1;
		this.skipped += (data.skipped ? 1 : 0);
		this.passed  += (data.passed  ? 1 : 0);
	}


	finish() {
		if (this.silent) {
			return;
		}

		this.endTime = new Date();
		this.out.write(this.summaryDisplay());
		this.out.write('\n');
	}


	display() {
		// As the output is XML, the SonarReporter can only
		// write its results after all tests have finished.
	}


	reportMetadata(tag, metadata) {
		if (tag === 'test-result-meta' && metadata) {
			this.metadata[metadata.testId] = metadata;
		}
	}


	summaryDisplay() {
		const doc  = new XmlDom.DOMImplementation(null).createDocument('', 'testExecutions');
		const root = doc.documentElement;

		root.setAttribute('version',  '1');
		root.setAttribute('name',     'Test Results');
		root.setAttribute('total',    `${this.total}`);
		root.setAttribute('passed',   `${this.passed}`);
		root.setAttribute('skipped',  `${this.skipped}`);
		root.setAttribute('failed',   `${this.total - this.passed - this.skipped}`);
		root.setAttribute('duration', `${this.endTime - this.startTime}`);

		this.compileModules().forEach((module) => {
			root.appendChild(this.createModuleResultNode(doc, module));
		});

		return doc.documentElement.toString();
	}


	compileModules() {
		const modules = new Map();

		for (let i = 0; i < this.results.length; i += 1) {
			const result   = this.results[i].result;
			const testId   = result.testId || (result.originalResultObj && result.originalResultObj.testId);
			const metadata = this.metadata[testId];

			if (metadata && !modules.has(metadata.module)) {
				modules.set(metadata.module, {
					name:  metadata.module,
					path:  '',
					tests: [],
				});
			}

			if (metadata) {
				const module = modules.get(metadata.module);

				if (module) {
					module.tests.push(result);
				}
			}
			else {
				// Hmm...
			}
		}

		return modules;
	}


	createModuleResultNode(doc, module) {
		const fileEl = doc.createElement('file');
		const { name, tests } = module;

		fileEl.setAttribute('path', this.findPhysicalFilePath(module));
		fileEl.setAttribute('name', name);

		tests.forEach((test) => {
			fileEl.appendChild(this.createTestResultNode(doc, test));
		});

		return fileEl;
	}


	createTestResultNode(doc, test) {
		const testEl = doc.createElement('testCase');

		testEl.setAttribute('name',     test.name);
		testEl.setAttribute('duration', `${test.runDuration}`);


		let notOkType, notOkMsg, notOkStack;

		if (test.error) {
			const { message, stack } = this.buildErrorContent(test.error);
			notOkType  = 'error';
			notOkMsg   = message;
			notOkStack = stack;
		}
		else if (test.skipped) {
			notOkType = 'skipped';
			notOkMsg  = 'Test Skipped';
		}
		else if (!test.passed) {
			notOkType = 'failure';
			notOkMsg  = 'Unspecified Test Failure';
		}

		if (notOkType) {
			const notOkEl = doc.createElement(notOkType);

			if (notOkMsg) {
				notOkEl.setAttribute('message', notOkMsg);
			}

			if (notOkStack) {
				notOkEl.appendChild(doc.createCDATASection(notOkStack));
			}

			testEl.appendChild(notOkEl);
		}

		return testEl;
	}


	buildErrorContent(error) {
		const result = { message: 'Exception Occurred', stack: undefined };

		if (error) {
			if (error && error.hasOwnProperty('actual') && error.hasOwnProperty('expected')) {
				result.message = 'Assertion Failed';
				// result.stack   = `Expected:\n${error.expected}\n\nResult:\n${(error.negative ? 'NOT ' : '') + error.actual}\n\n`;
			}

			if (error.stack) {
				result.stack = (result.stack || '') + `\n${error.stack}\n`;
			}
		}

		return result;
	}


	findPhysicalFilePath(module) {
		const { name /* , tests */ } = module;

		// It is known that these won't map back
		// to a file, so they can be ignored.
		if (['ESLint', 'TemplateLint', 'Ember.onerror'].some(value => name.includes(value))) {
			return 'virtual_test_file.js';
		}

		// Gather paths to all of the test files. At this point, no module name to file path
		// mappings have occurred.
		if (!this.fileContents) {
			this.fileContents = glob
			.sync('tests/**/*-test@(.js|.ts)', { absolute: true })
			.map(function(filePath) {
				return { filePath, moduleName: undefined, contents: undefined };
			});
		}

		// Check for a mapping and return it if it exists.
		let fileContent = this.fileContents.find(
			contents => compareStringOrStringArray(contents.moduleName, name)
		);

		if (fileContent) {
			return fileContent.filePath;
		}

		// Without a mapping we need to start working through each file to see if we get a match.
		// This is IN NO WAY a fantastic solution. Tests can come from just about anywhere though,
		// and tracking them through Ember CLI's build process, how they are loaded and executed,
		// and what information QUnit and Testem provide makes this (maybe?) the only solution I
		// can see right now. It might be more accurate if an AST were used on each file.
		for (let i = 0; i < this.fileContents.length; i += 1) {
			fileContent = this.fileContents[i];

			// We only care about entries that don't yet have a mapping,
			// as those which do were checked just a couple of lines back.
			if (fileContent.moduleName) {
				continue;
			}

			// Load the file's content if not already available.
			if (!fileContent.contents) {
				fileContent.contents = readFileSync(fileContent.filePath, 'utf8');
			}

			if (fileContent.contents.includes(name)) {
				fileContent.moduleName = name;
				return fileContent.filePath;
			}
		}


		return 'unknown_test_file.js';
	}
}

module.exports = SonarReporter;