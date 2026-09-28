const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const JSZip = require('jszip');
const { DOMParser } = require('@xmldom/xmldom');
const { TextDecoder } = require('node:util');

function handler(window = {}) {
  const context = { window: { JSZip, ...window }, DOMParser, TextDecoder, console };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/doc-handler.js'), 'utf8'), context);
  return context.window.sealarcaDocHandler;
}

async function zipFixture(name, entries) {
  const zip = new JSZip();
  for (const [entry, contents] of Object.entries(entries)) zip.file(entry, contents);
  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  buffer.name = name;
  buffer.size = buffer.byteLength;
  return buffer;
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

test('CSV reads quoted separators, escaped quotes and embedded newlines', async () => {
  const h = handler();
  const raw = 'Nom;Description;Note\r\n"Société A; SA";"première ligne\r\nseconde ligne";"Il a dit ""oui"""\r\n';
  const parsed = await h._parseCsv({ name: 'quoted.csv', text: async () => `\uFEFF${raw}` });
  assert.equal(parsed.metadata.delimiter, ';');
  assert.equal(parsed.metadata.rowCount, 2);
  assert.match(parsed.markdown, /Société A; SA/);
  assert.match(parsed.markdown, /première ligne\nseconde ligne/);
  assert.match(parsed.markdown, /Il a dit "oui"/);
  assert.equal(parsed.sourceMap[0].locator.endRow, 2);
});

test('RTF extracts accented and Unicode text without control words or metadata groups', async () => {
  const h = handler();
  const parsed = await h._parseRtf({ name: 'unicode.rtf', text: async () => String.raw`{\rtf1\ansi\uc1 Bonjour \'e9tude, \u233? et \u-10179?\u-8704?\par Ligne \{visible\}. {\fonttbl\f0 Arial;} {\*\generator secret;}}` });
  assert.match(parsed.markdown, /Bonjour étude, é et 😀/);
  assert.match(parsed.markdown, /Ligne \{visible\}\./);
  assert.doesNotMatch(parsed.markdown, /fonttbl|generator|secret|\\u233/);
  assert.deepEqual(parsed.sourceMap[0].locator.type, 'rtf-line-range');
});

test('DOCX includes body, headers, footers, footnotes and endnotes with provenance', async () => {
  const file = await zipFixture('parts.docx', {
    'word/document.xml': '<w:document xmlns:w="urn:w"><w:body><w:p><w:r><w:t>corps</w:t></w:r></w:p></w:body></w:document>',
    'word/header1.xml': '<w:hdr xmlns:w="urn:w"><w:p><w:r><w:t>en-tête</w:t></w:r></w:p></w:hdr>',
    'word/footer1.xml': '<w:ftr xmlns:w="urn:w"><w:p><w:r><w:t>pied</w:t></w:r></w:p></w:ftr>',
    'word/footnotes.xml': '<w:footnotes xmlns:w="urn:w"><w:footnote w:id="0" w:type="separator"><w:p/></w:footnote><w:footnote w:id="2"><w:p><w:r><w:t>note de bas</w:t></w:r></w:p></w:footnote></w:footnotes>',
    'word/endnotes.xml': '<w:endnotes xmlns:w="urn:w"><w:endnote w:id="4"><w:p><w:r><w:t>note de fin</w:t></w:r></w:p></w:endnote></w:endnotes>'
  });
  const parsed = await handler()._parseDocx(file);
  assert.match(parsed.markdown, /corps/);
  assert.match(parsed.markdown, /en-tête/);
  assert.match(parsed.markdown, /pied/);
  assert.match(parsed.markdown, /note de bas/);
  assert.match(parsed.markdown, /note de fin/);
  assert.deepEqual(Array.from(parsed.sourceMap, source => source.locator.type).sort(), ['docx-endnote', 'docx-footer', 'docx-header', 'docx-paragraph', 'docx-footnote'].sort());
  assert.equal(parsed.sourceMap.find(source => source.locator.type === 'docx-footnote').locator.noteId, '2');
});

test('XLSX follows workbook relationships and formats date serials with the 1904 epoch', async () => {
  const file = await zipFixture('relations.xlsx', {
    'xl/workbook.xml': '<workbook xmlns:r="urn:r"><workbookPr date1904="1"/><sheets><sheet name="Tardive" sheetId="1" r:id="rId2"/><sheet name="Précoce" sheetId="2" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/></Relationships>',
    'xl/styles.xml': '<styleSheet><numFmts count="0"/><cellXfs count="2"><xf numFmtId="0"/><xf numFmtId="14"/></cellXfs></styleSheet>',
    'xl/worksheets/sheet1.xml': '<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Première feuille physique</t></is></c><c r="B1" s="1"><v>1</v></c></row></sheetData></worksheet>',
    'xl/worksheets/sheet2.xml': '<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Deuxième feuille physique</t></is></c></row></sheetData></worksheet>'
  });
  const parsed = await handler()._parseXlsx(file);
  assert.ok(parsed.markdown.indexOf('## Tardive') < parsed.markdown.indexOf('## Précoce'));
  assert.ok(parsed.markdown.indexOf('Deuxième feuille physique') < parsed.markdown.indexOf('Première feuille physique'));
  assert.match(parsed.markdown, /1904-01-02/);
  assert.equal(parsed.metadata.dateSystem, '1904');
});

test('PPTX follows presentation relationship order rather than slide filenames', async () => {
  const file = await zipFixture('relations.pptx', {
    'ppt/presentation.xml': '<p:presentation xmlns:p="urn:p" xmlns:r="urn:r"><p:sldIdLst><p:sldId id="256" r:id="rId2"/><p:sldId id="257" r:id="rId1"/></p:sldIdLst></p:presentation>',
    'ppt/_rels/presentation.xml.rels': '<Relationships><Relationship Id="rId1" Target="slides/slide1.xml"/><Relationship Id="rId2" Target="slides/slide2.xml"/></Relationships>',
    'ppt/slides/slide1.xml': '<p:sld xmlns:p="urn:p" xmlns:a="urn:a"><a:t>Diapositive physique 1</a:t></p:sld>',
    'ppt/slides/slide2.xml': '<p:sld xmlns:p="urn:p" xmlns:a="urn:a"><a:t>Diapositive physique 2</a:t></p:sld>'
  });
  const parsed = await handler()._parsePptx(file);
  assert.ok(parsed.markdown.indexOf('Diapositive physique 2') < parsed.markdown.indexOf('Diapositive physique 1'));
  assert.deepEqual(Array.from(parsed.sourceMap, source => source.locator.slide), [1, 2]);
});

test('archive preflight and actual XML accounting accept exact limits and reject overages', () => {
  const h = handler();
  const entry = (name, size) => ({ name, dir: false, _data: { uncompressedSize: size } });
  const exactXml = h._preflightArchiveEntries({ 'one.xml': entry('one.xml', 20 * 1024 * 1024) }, 'XLSX');
  assert.equal(exactXml.declaredExpandedBytes, 20 * 1024 * 1024);
  assert.throws(() => h._preflightArchiveEntries({ 'one.xml': entry('one.xml', 20 * 1024 * 1024 + 1) }, 'XLSX'), /20 Mio/);
  const totalEntries = Object.fromEntries(Array.from({ length: 5 }, (_, index) => [`data${index}.bin`, entry(`data${index}.bin`, 20 * 1024 * 1024)]));
  assert.equal(h._preflightArchiveEntries(totalEntries, 'DOCX').declaredExpandedBytes, 100 * 1024 * 1024);
  totalEntries.extra = entry('extra.bin', 1);
  assert.throws(() => h._preflightArchiveEntries(totalEntries, 'DOCX'), /100 Mio/);
  assert.equal(h._preflightArchiveEntries(Object.fromEntries(Array.from({ length: 2000 }, (_, index) => [`${index}.bin`, entry(`${index}.bin`, 0)])), 'PPTX').declaredExpandedBytes, 0);
  assert.throws(() => h._preflightArchiveEntries(Object.fromEntries(Array.from({ length: 2001 }, (_, index) => [`${index}.bin`, entry(`${index}.bin`, 0)])), 'PPTX'), /2000 entrées/);

  const archive = { format: 'ODF', budget: { actualExpandedBytes: 0 } };
  h._checkActualArchiveEntry(archive, 'content.xml', 20 * 1024 * 1024);
  assert.equal(archive.budget.actualExpandedBytes, 20 * 1024 * 1024);
  assert.throws(() => h._checkActualArchiveEntry({ format: 'ODF', budget: { actualExpandedBytes: 0 } }, 'content.xml', 20 * 1024 * 1024 + 1), /20 Mio/);
  archive.budget.actualExpandedBytes = 99 * 1024 * 1024;
  h._checkActualArchiveEntry(archive, 'next.xml', 1024 * 1024);
  assert.throws(() => h._checkActualArchiveEntry(archive, 'last.xml', 1), /100 Mio/);
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
