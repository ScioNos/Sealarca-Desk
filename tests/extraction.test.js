const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function handler(window = {}) {
  const context = { window, console };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/doc-handler.js'), 'utf8'), context);
  return window.sealarcaDocHandler;
}

test('CSV keeps exactly 100 rows, reports truncation and preserves provenance', async () => {
  const h = handler();
  for (const count of [99, 100, 101]) {
    const parsed = await h._parseCsv({ name: 'fiction.csv', text: async () => Array.from({ length: count }, (_, i) => `row${i + 1};value`).join('\n') });
    assert.equal(parsed.warnings.length, count > 100 ? 1 : 0);
    assert.equal(parsed.sourceMap[0].locator.endRow, Math.min(count, 100));
    assert.equal(parsed.markdown.includes('row101'), false);
    if (count > 100) assert.equal(parsed.warnings[0].total, 101);
  }
});

function odsTable(name, repeats) {
  return {
    getAttribute: key => key === 'table:name' ? name : null,
    getElementsByTagName: () => repeats.map((repeat, i) => ({
      getAttribute: () => String(repeat),
      children: [{ nodeName: 'table:table-cell', getAttribute: () => null, getElementsByTagName: () => [{ textContent: `${name}-${i}` }] }],
    })),
  };
}

test('ODS limits each sheet independently, including compressed repeated rows', () => {
  const h = handler();
  const parsed = h._extractOds({ getElementsByTagName: () => [odsTable('A', [101]), odsTable('B', [2, 3])] }, 'fiction.ods');
  assert.equal(parsed.sourceMap.filter(s => s.locator.sheet === 'A').length, 100);
  assert.equal(parsed.sourceMap.filter(s => s.locator.sheet === 'B').length, 5);
  assert.equal(parsed.warnings.length, 1);
  assert.equal(parsed.warnings[0].sheet, 'A');
  assert.equal(parsed.warnings[0].total, 101);
  assert.equal(parsed.sourceMap[99].locator.endRow, 100);
  const normal = h._normalizeParsedDocument(parsed);
  for (const source of normal.sourceMap) assert.ok(normal.markdown.slice(source.markdownStart, source.markdownEnd).includes(source.locator.sheet));
});

function pdfWindow(pages) {
  return { pdfjsLib: { GlobalWorkerOptions: {}, getDocument: () => ({ promise: Promise.resolve({ numPages: pages.length, getPage: async n => ({ getTextContent: async () => ({ items: pages[n - 1] ? [{ str: pages[n - 1], transform: [1, 0, 0, 1, 0, 1] }] : [] }) }) }) }) } };
}

test('mixed PDF reports missing text while a scan-only PDF is rejected explicitly', async () => {
  const file = { name: 'fiction.pdf', arrayBuffer: async () => new ArrayBuffer(0) };
  const parsed = await handler(pdfWindow(['Text', '', 'Text 3']))._parsePdf(file);
  assert.equal(parsed.warnings[0].pages, '2');
  assert.equal(parsed.sourceMap.length, 2);
  assert.equal(parsed.sourceMap[1].locator.page, 3);
  await assert.rejects(handler(pdfWindow(['']))._parsePdf(file), error => error.code === 'pdf_no_text');
  await assert.rejects(handler(pdfWindow(Array(101).fill('text')))._parsePdf(file), /100 pages/);
});

test('oversized documents are rejected before parsing or persistence', async () => {
  await assert.rejects(handler().parseFile({ name: 'large.txt', size: 20 * 1024 * 1024 + 1 }), /20 Mo/);
  await assert.rejects(handler().parseFile({ name: 'large.txt', size: 500001, text: async () => 'x'.repeat(500001) }), /500 000/);
});
