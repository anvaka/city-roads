// Run with: node --experimental-default-type=module test/overpass.mjs
import assert from 'node:assert/strict';
import postData from '../src/lib/postData.js';
import Progress from '../src/lib/Progress.js';
import LoadOptions from '../src/lib/LoadOptions.js';

const defaultQuery = await new LoadOptions({ areaId: 3600394037, wayFilter: 'way[highway]' }).getQueryTemplate();
assert.match(defaultQuery.queryString, /\[timeout:900\]\[maxsize:1073741824\]/);
assert.equal(defaultQuery.requestTimeout, 960000);
const customQuery = await new LoadOptions({
  bbox: [51.5, -0.125, 51.501, -0.124], wayFilter: 'way[highway]',
  timeout: 25, maxHeapByteSize: 536870912
}).getQueryTemplate();
assert.match(customQuery.queryString, /\[timeout:25\]\[maxsize:536870912\]/);
assert.equal(customQuery.requestTimeout, 85000);

let outcomes = [];
let requests = [];
globalThis.XMLHttpRequest = class {
  listeners = {};
  addEventListener(event, callback) { this.listeners[event] = callback; }
  open(method, url) { this.method = method; this.url = url; }
  setRequestHeader() {}
  abort() { this.listeners.abort(); }
  send(body) {
    requests.push(this);
    this.body = body;
    const outcome = outcomes.shift();
    assert.ok(outcome, 'Unexpected extra request');
    queueMicrotask(() => {
      this.status = outcome.status || 200;
      this.response = { elements: [] };
      this.listeners[outcome.event]();
    });
  }
};

const query = '[out:json];way(1);out;';
const updates = [];
outcomes = [{ event: 'error' }, { event: 'load' }];
assert.deepEqual(await postData(query, new Progress(p => updates.push(p))), { elements: [] });
assert.equal(requests.length, 2);
assert.equal(requests[1].url, 'https://overpass.private.coffee/api/interpreter');
assert.ok(requests.every(r => r.method === 'POST' && r.body === 'data=' + encodeURIComponent(query)));
assert.deepEqual(updates, [{ loaded: -1 }]);

requests = [];
outcomes = [{ event: 'timeout' }, { event: 'load' }];
assert.deepEqual(await postData(query, undefined, defaultQuery.requestTimeout), { elements: [] });
assert.equal(requests.length, 2);
assert.ok(requests.every(r => r.timeout === 960000));

requests = [];
outcomes = [{ event: 'timeout' }, { event: 'timeout' }, { event: 'timeout' }];
await assert.rejects(postData(query, undefined, defaultQuery.requestTimeout), error => {
  assert.equal(error.allServersFailed, true);
  assert.equal(error.serversAttempted, 3);
  assert.match(error.message, /Timed out downloading/);
  return true;
});

requests = [];
outcomes = [{ event: 'load', status: 503 }, { event: 'error' }, { event: 'error' }];
await assert.rejects(postData(query), error => {
  assert.ok(error instanceof Error);
  assert.equal(error.allServersFailed, true);
  assert.equal(error.serversAttempted, 3);
  assert.match(error.message, /Failed to download/);
  return true;
});
assert.equal(new Set(requests.map(r => r.url)).size, 3);

requests = [];
outcomes = [{ event: 'abort' }];
await assert.rejects(postData(query), error => error.cancelled === true);
assert.equal(requests.length, 1);
console.log('Overpass fallback, failure reporting, and cancellation checks passed.');
