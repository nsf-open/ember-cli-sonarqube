/* global Testem */

/**
 * Tools QUnit to provide additional testing telemetry for the Testem XML sonar-reporter.
 */
export function setupQunitReporting(QUnit) {
	// Testem's QUnit adapter merges the module and test names together with a colon (:) before passing
	// it along as "name". If using Ember Exam, partition information may also be prepended to the name
	// as well. Instead of trying to parse all that, this seems like a more reliable way to get at the
	// original pieces. The name of the game is to gather enough information that the original source file
  // can be located on disk. It is far and away from an ideal solution, but given how QUnit tests are
  // collated to be run there aren't many options.

  if (window.Testem) {
    Testem.useCustomAdapter((socket) => {
      QUnit.testDone(
        (details) => socket.emit('test-metadata', 'test-done', details)
      );
    });
  }
}
