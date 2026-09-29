const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const { buildSync } = require('esbuild');

function load(relativePath) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const { outputFiles } = buildSync({ entryPoints: [filename], bundle: true, write: false, platform: 'node', format: 'cjs' });
  const module = new Module(filename);
  module._compile(outputFiles[0].text, filename);
  return module.exports.default;
}

const postData = load('src/lib/postData.js');
const LoadOptions = load('src/lib/LoadOptions.js');

test('network failures, invalid responses, and cancellation', async (t) => {
  const original = global.XMLHttpRequest;
  t.after(() => { global.XMLHttpRequest = original; });
  let outcomes, calls;
  global.XMLHttpRequest = class {
    constructor() { this.listeners = {}; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    open(method, url) { calls.push({ method, url, request: this }); }
    setRequestHeader() {}
    send() {
      const outcome = outcomes.shift();
      assert.ok(outcome, 'Unexpected extra request');
      queueMicrotask(() => {
        this.status = outcome.status ?? 200;
        this.response = outcome.body;
        this.listeners[outcome.event || 'load']();
      });
    }
  };

  for (const first of [{ event: 'error' }, { event: 'timeout' }, { status: 503 }, { body: null }, { body: { elements: [], remark: 'runtime error' } }]) {
    outcomes = [first, { body: { elements: [{ type: 'way' }] } }];
    calls = [];
    const result = await postData('test query');
    assert.equal(result.elements.length, 1);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].request.timeout, 90000);
    assert.notEqual(calls[0].url, calls[1].url);
  }

  outcomes = [{ event: 'error' }, { event: 'timeout' }, { status: 503 }];
  calls = [];
  await assert.rejects(postData('test query'), error => error.allServersFailed && error.serversAttempted === 3);
  outcomes = [{ event: 'abort' }];
  calls = [];
  await assert.rejects(postData('test query'), error => error.cancelled === true);
  assert.equal(calls.length, 1);
});

test('query defaults are modest and remain overridable', async () => {
  const options = new LoadOptions({ areaId: 3617349746, wayFilter: 'way[highway]' });
  assert.match((await options.getQueryTemplate()).queryString, /\[timeout:60\]\[maxsize:268435456\]/);
  const custom = new LoadOptions({ areaId: 1, wayFilter: 'way', timeout: 900, maxHeapByteSize: 1073741824 });
  assert.match((await custom.getQueryTemplate()).queryString, /\[timeout:900\]\[maxsize:1073741824\]/);
});
