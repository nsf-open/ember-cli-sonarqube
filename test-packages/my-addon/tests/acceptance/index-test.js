import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';

module('Acceptance | index', function (hooks) {
  setupApplicationTest(hooks);

  test('visiting /index', async function (assert) {
    await visit('/');
    assert.strictEqual(currentURL(), '/');
  });

  module('More Acceptance | index', function () {
    test('another visit to /index', async function (assert) {
      await visit('/foo');
      assert.strictEqual(currentURL(), '/');
    });
  });
});
