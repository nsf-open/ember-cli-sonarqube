/* global Testem */

/**
 * Tools QUnit to provide additional testing telemetry for the Testem XML sonar-reporter.
 */
export function setupQunitReporting() {
	// Testem's QUnit adapter merges the module and test names together with a colon (:) before passing
	// it along as "name". If using Ember Exam, partition information may also be prepended to the name
	// as well. Instead of trying to parse all that, this seems like a more reliable way to get at the
	// original pieces.
	if (typeof Testem !== 'undefined') {
		try {
			const QUnit = require('qunit').default;

			if (QUnit) {
				Testem.useCustomAdapter(function(socket) {
					QUnit.testDone(function(details) {
						socket.emit('test-metadata', 'test-result-meta', {
							testId: details.testId,
							module: details.module,
							name:   details.name,
						});
					});
				});
			}
		}
		catch (e) {
			// noop, not using QUnit it seems
		}
	}
}
