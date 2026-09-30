// Optional integration check using Playwright, without changing runtime dependencies.
const { chromium, firefox } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');

async function main() {
    const root = path.resolve(process.env.BROWSER_APP_ROOT || path.join(__dirname, '..'));
    const server = http.createServer(async (request, response) => {
        const file = path.resolve(root, '.' + new URL(request.url, 'http://localhost').pathname);
        if (!file.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
        try {
            const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml' };
            response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); response.end(await fs.readFile(file));
        } catch (_) { response.writeHead(404); response.end(); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
        for (const [name, browserType, options] of [
            ['Chromium', chromium, process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}],
            ['Firefox', firefox, process.env.FIREFOX_EXECUTABLE ? { executablePath: process.env.FIREFOX_EXECUTABLE } : {}]
        ]) {
            const browser = await browserType.launch({ headless: true, ...options });
            try {
                for (const url of [`http://127.0.0.1:${server.address().port}/index.html`, pathToFileURL(path.join(root, 'index.html')).href]) {
                    const context = await browser.newContext(); const page = await context.newPage(); const errors = [], external = [];
                    page.on('pageerror', error => errors.push(String(error)));
                    await context.route('https://**', route => { external.push(route.request().url()); return route.abort(); });
                    await page.goto(url); await page.waitForFunction(() => window.Alpine && Alpine.$data(document.querySelector('[x-data]')).p1Queue?.started);
                    const result = await page.evaluate(async () => {
                        const app = Alpine.$data(document.querySelector('[x-data]'));
                        app.currentLang = 'fr';
                        app.isSettingsOpen = false; app.p1Queue.stop();
                        const zip = new JSZip();
                        zip.file('content.xml', '<office:document-content xmlns:office="urn:office" xmlns:text="urn:text" xmlns:table="urn:table"><office:body><office:text><text:p>Introduction</text:p><text:h>Titre</text:h><text:list><text:list-item><text:p>Obligation</text:p></text:list-item></text:list><table:table><table:table-row><table:table-cell><text:p>CHF 500</text:p></table:table-cell></table:table-row></table:table></office:text></office:body></office:document-content>');
                        const original = await zip.generateAsync({ type: 'blob' });
                        await sealarcaDb.saveDocument({ id: 'repair-browser', folderId: app.activeFolderId, name: 'legacy.odt', originalName: 'legacy.odt', extension: 'odt', sourceFile: original, hash: 'original', markdown: 'Ancienne extraction', metadata: { extraction: { parserVersion: 2 } }, createdAt: 100 });
                        await sealarcaDb.saveDocumentProfile({ documentId: 'repair-browser', folderId: app.activeFolderId, status: 'valid', summary: 'Historique', inputFingerprint: SealarcaP1.fingerprintDocument(await sealarcaDb.getDocument('repair-browser')) });
                        await app.loadDocuments(); app.openDocuments();
                        await app.reextractDocument('repair-browser');
                        const repaired = await sealarcaDb.getDocument('repair-browser'); const profile = await sealarcaDb.getDocumentProfile(repaired.id);
                        await app.openDocumentPreview(repaired.id);
                        const documents = Alpine.reactive(Array.from({ length: 20 }, (_, i) => ({ id: 'large-' + i, name: 'large-' + i,
                            markdown: 'e'.repeat(499980) + ' résiliation contrat', sourceMap: [{ id: 'all', markdownStart: 0, markdownEnd: 500000, locator: { type: 'text-line-range', startLine: 1 } }] })));
                        const service = app.getSearchService(); let ticks = 0; const timer = setInterval(() => ticks++, 10);
                        const start = performance.now();
                        const matches = await service.search(documents, 'résiliation', { maxResults: 30 });
                        const initialMs = performance.now() - start, cachedStart = performance.now();
                        const cached = await service.search(documents, 'contrat', { maxResults: 30 });
                        const cachedMs = performance.now() - cachedStart; clearInterval(timer);
                        app.documentSearchQuery = 'Introduction'; await app.runDocumentSearch();
                        app.closeDocumentPreview(); app.closeDocuments();
                        app.apiKey = app.verifiedApiKey = 'fixture-verified-key'; app.selectedModel = 'fixture-model'; app.models = [{ id: 'fixture-model' }];
                        let requests = 0;
                        sealarcaApi.streamResponse = async ({ onDone }) => { requests++; await new Promise(resolve => setTimeout(resolve, 20)); await onDone('Fixture answer', '', { interrupted: false }); };
                        app.inputPrompt = 'Question locale de test';
                        await Promise.all([app.sendMessage(), app.sendMessage()]);
                        return { markdown: repaired.markdown, revision: repaired.metadata.extraction.revision, createdAt: repaired.createdAt, profileStatus: profile.status,
                            originalSize: repaired.sourceFile.size, matches: matches.length, cached: cached.length, initialMs, cachedMs, ticks, worker: Boolean(service.worker),
                            searchCount: app.documentSearchResults.length, coverage: app.coverageLabel(profile), requests,
                            conversationCount: (await sealarcaDb.getConversations(app.activeFolderId)).length };
                    });
                    assert.match(result.markdown, /Introduction[\s\S]*Titre[\s\S]*Obligation[\s\S]*CHF 500/);
                    assert.equal(result.revision, 1); assert.equal(result.createdAt, 100); assert.equal(result.profileStatus, 'stale'); assert.ok(result.originalSize > 0);
                    assert.equal(result.matches, 20); assert.equal(result.cached, 20); assert.ok(result.ticks > 5); assert.ok(result.cachedMs < 1000);
                    assert.equal(result.searchCount, 1); assert.match(result.coverage, /inconnue/);
                    assert.equal(result.requests, 1); assert.equal(result.conversationCount, 1);
                    assert.deepEqual(errors, []); assert.deepEqual(external, []);
                    console.log(JSON.stringify({ browser: name, scheme: new URL(url).protocol, ...result, markdown: undefined }));
                    await context.close();
                }
            } finally { await browser.close(); }
        }
    } finally { await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
