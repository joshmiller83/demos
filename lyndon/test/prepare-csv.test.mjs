import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import Papa from 'papaparse';
import createDOMPurify from 'dompurify';

const require = createRequire(import.meta.url);
const prepareCsv = require('../src/demo/mini-catalog/prepare-csv.js');
const DOMPurify = createDOMPurify(new JSDOM('').window);
const deps = { Papa, sanitize: html => DOMPurify.sanitize(html), notFacet: ['url', 'description'] };

test('normalizes headers and reports facet columns', () => {
  const result = prepareCsv(' Title , URL,Description,Type\nOne,#one,First,Brief\n', deps);
  assert.equal(result.ok, true);
  assert.deepEqual(result.fields, ['title', 'url', 'description', 'type']);
  assert.deepEqual(result.facets, ['type']);
  assert.equal(result.rowCount, 1);
});

test('drops fields beyond the header instead of passing __parsed_extra through', () => {
  const result = prepareCsv('title,type\nOne,Brief,surprise\nTwo,Report\n', deps);
  assert.equal(result.extraFieldRows, 1);
  assert.equal(result.csv, 'title,type\r\nOne,Brief\r\nTwo,Report');
});

test('sanitizes HTML in cells', () => {
  const result = prepareCsv('title,description\n"<img src=x onerror=alert(1)>Hi","<script>alert(1)</script><em>ok</em>"\n', deps);
  const [row] = Papa.parse(result.csv, { header: true }).data;
  assert.equal(row.title, '<img src="x">Hi');
  assert.equal(row.description, '<em>ok</em>');
});

test('rejects a CSV without a title column', () => {
  const result = prepareCsv('name,role\nAda,Fellow\n', deps);
  assert.equal(result.ok, false);
  assert.match(result.error, /No title column/);
});
