const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('IndexedDB v2 migre les conversations vers un dossier sans supprimer les messages', () => {
    const db = read('js/db.js');
    assert.match(db, /const DB_VERSION = 2/);
    assert.match(db, /createObjectStore\('folders'/);
    assert.match(db, /createObjectStore\('documents'/);
    assert.match(db, /createObjectStore\('documentChunks'/);
    assert.match(db, /createIndex\('folderId', 'folderId'/);
    assert.match(db, /if \(!conversation\.folderId\)/);
    assert.match(db, /conversation\.folderId = DEFAULT_FOLDER_ID/);
    assert.doesNotMatch(db, /deleteObjectStore/);
});

test('les documents persistants gardent Markdown, original, hash et sourceMap', () => {
    const handler = read('js/doc-handler.js');
    const db = read('js/db.js');
    assert.match(handler, /markdown,/);
    assert.match(handler, /sourceFile:/);
    assert.match(handler, /hashAlgorithm: hash \? 'SHA-256'/);
    assert.match(handler, /sourceMap/);
    assert.match(handler, /type: 'pdf-page'/);
    assert.match(handler, /type: 'presentation-slide'/);
    assert.match(handler, /type: 'spreadsheet-range'/);
    assert.match(handler, /sheet: sheetName, range/);
    assert.match(handler, /type: 'text-line-range'/);
    assert.match(db, /chunks: \{ status: 'not_generated', source: 'markdown' \}/);
    assert.match(db, /derivedFrom: 'markdown'/);
});

test('le contexte IA sépare historique et documents sélectionnés', () => {
    const app = read('js/app.js');
    assert.match(app, /buildConversationHistory\(\)/);
    assert.match(app, /getDocumentsByIds\(this\.selectedDocumentIds\)/);
    assert.match(app, /buildDocumentContext\(selectedDocuments\)/);
    assert.match(app, /documentRefs/);
    assert.doesNotMatch(app, /m\.fullPayload \|\| m\.content/);
    assert.doesNotMatch(app, /formattedPromptText/);
});

test('l’interface expose dossiers, bibliothèque, consultation et sélection', () => {
    const html = read('index.html');
    assert.match(html, /x-for="folder in folders"/);
    assert.match(html, /@click="openDocuments"/);
    assert.match(html, /x-for="doc in documents"/);
    assert.match(html, /x-safe-html="previewMarkdown"/);
    assert.match(html, /x-text="doc\.selectionMark"/);
});

test('le projet est source available sous PolyForm Perimeter 1.0.1', () => {
    const license = read('LICENSE');
    const pkg = JSON.parse(read('package.json'));
    assert.match(license, /^# PolyForm Perimeter License 1\.0\.1/);
    assert.match(license, /## Noncompete/);
    assert.equal(pkg.license, 'SEE LICENSE IN LICENSE');
    for (const file of ['README.md', 'README.fr.md', 'README.de.md', 'README.it.md', 'README.es.md']) {
        const contents = read(file);
        assert.match(contents, /PolyForm Perimeter License 1\.0\.1/);
        assert.match(contents, /source[- ]available/i);
        assert.doesNotMatch(contents, /License-MIT|licensed under the \*\*MIT|licence \*\*MIT|MIT-Lizenz|licenza \*\*MIT|licencia \*\*MIT/i);
    }
});


test('la première publication officielle utilise la version 1.0.0', () => {
    const pkg = JSON.parse(read('package.json'));
    const changelog = read('CHANGELOG.md');
    const notes = read('RELEASE_NOTES.md');
    const html = read('index.html');
    const buildScript = read('scripts/build-release.ps1');
    const forbiddenDevelopmentVersion = ['1', '1', '0'].join('.');

    assert.equal(pkg.version, '1.0.0');
    assert.ok(changelog.includes('## [1.0.0] - 2026-08-29')); 
    assert.match(changelog, /First Official Release/i);
    assert.doesNotMatch(changelog, /changed from MIT/i);
    assert.ok(notes.startsWith('# Sealarca Desk v1.0.0')); 
    assert.match(notes, /first official public release/i);
    assert.ok(notes.includes('Sealarca-Desk-v1.0.0.zip')); 
    assert.ok(buildScript.includes("[string]$Version = '1.0.0'")); 
    assert.ok(html.includes('js/app.js?v=1.0.0')); 

    for (const contents of [changelog, notes, html, buildScript, JSON.stringify(pkg)]) {
        assert.equal(contents.includes(forbiddenDevelopmentVersion), false);
        assert.equal(contents.includes(`v${forbiddenDevelopmentVersion}`), false);
    }
});
