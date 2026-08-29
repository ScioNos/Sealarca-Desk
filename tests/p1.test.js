const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'p1.js'), 'utf8');
function loadP1() {
    const context = { window: {}, console, AbortController, setTimeout, clearTimeout };
    vm.createContext(context);
    vm.runInContext(source, context, { filename: 'p1.js' });
    return context.window.SealarcaP1;
}

function sampleDocuments() {
    return [
        {
            id: 'contract', folderId: 'folder', name: 'contrat.pdf', hash: 'aaa', extension: 'pdf',
            markdown: '# Contrat\n\nLe contrat prévoit une résiliation au 14 janvier 2025. Société A mandate Alice Dupont.',
            sourceMap: [{ id: 'page_21', markdownStart: 0, markdownEnd: 120, label: 'Page 21', locator: { type: 'pdf-page', page: 21 } }]
        },
        {
            id: 'budget', folderId: 'folder', name: 'budget.xlsx', hash: 'bbb', extension: 'xlsx',
            markdown: '# Budget\n\nPrévision de chiffre d’affaires 2026 et trésorerie.',
            sourceMap: [{ id: 'sheet_2026', markdownStart: 0, markdownEnd: 80, label: '2026', locator: { type: 'spreadsheet-range', sheet: '2026', range: 'A1:F20' } }]
        }
    ];
}

test('la recherche locale retourne extrait, document et provenance exacte', () => {
    const p1 = loadP1();
    const results = p1.localSearch(sampleDocuments(), 'résiliation contrat', { maxResults: 5 });
    assert.equal(results[0].documentId, 'contract');
    assert.match(results[0].excerpt, /résiliation/i);
    assert.equal(results[0].reference, 'contrat.pdf — p. 21');
    assert.equal(results[0].sourceId, 'page_21');
});

test('la sélection automatique reste locale, limitée et compréhensible', () => {
    const p1 = loadP1();
    const selected = p1.selectRelevantDocuments(sampleDocuments(), 'trésorerie prévision 2026', { limit: 1 });
    assert.equal(selected.length, 1);
    assert.equal(selected[0].document.id, 'budget');
    assert.ok(selected[0].score > 0);
});

test('les références utilisent uniquement les locators réellement disponibles', () => {
    const p1 = loadP1();
    const docs = sampleDocuments();
    assert.equal(p1.sourceReference(docs[0], docs[0].sourceMap[0]), 'contrat.pdf — p. 21');
    assert.equal(p1.sourceReference(docs[1], docs[1].sourceMap[0]), 'budget.xlsx — feuille 2026, A1:F20');
    assert.equal(p1.sourceReference({ name: 'note.docx' }, { locator: {} }), 'note.docx');
});

test('la fiche filtre toute provenance inventée et conserve son fingerprint', () => {
    const p1 = loadP1();
    const document = sampleDocuments()[0];
    const fingerprint = p1.fingerprintDocument(document);
    const profile = p1.normalizeProfile({
        documentType: 'contrat', summary: 'Résumé', people: ['Alice Dupont'], organizations: ['Société A'],
        importantDates: [{ date: '2025-01-14', label: 'Résiliation', sourceIds: ['page_21', 'page_999'] }],
        importantItems: [{ label: 'Résiliation', sourceIds: ['page_999'] }]
    }, document, fingerprint);
    assert.equal(profile.inputFingerprint, fingerprint);
    assert.deepEqual(Array.from(profile.importantDates[0].sourceIds), ['page_21']);
    assert.deepEqual(Array.from(profile.importantItems[0].sourceIds), []);
    assert.equal(profile.importantDates[0].references[0].label, 'contrat.pdf — p. 21');
});

test('le backoff couvre 429 et erreurs réseau sans accélération incontrôlée', () => {
    const p1 = loadP1();
    assert.equal(p1.isRetryableError({ status: 429 }), true);
    assert.equal(p1.isRetryableError(new Error('Network fetch failed')), true);
    assert.equal(p1.isRetryableError({ name: 'AbortError' }), false);
    assert.equal(p1.backoffDelay(1), 1000);
    assert.equal(p1.backoffDelay(4), 8000);
    assert.equal(p1.backoffDelay(10), 300000);
});

test('la queue termine une fiche et évite de recalculer une fiche valide', async () => {
    const p1 = loadP1();
    const document = sampleDocuments()[0];
    const profiles = new Map();
    const jobs = new Map();
    const db = {
        async getDocument(id) { return id === document.id ? document : null; },
        async getDocumentProfile(id) { return profiles.get(id) || null; },
        async saveDocumentProfile(profile) { profiles.set(profile.documentId, profile); return profile; },
        async saveProcessingJob(job) { jobs.set(job.id, { ...job }); return job; },
        async getProcessingJob(id) { return jobs.get(id) || null; }
    };
    let apiCalls = 0;
    const api = { async completeResponse() { apiCalls += 1; return { text: JSON.stringify({ documentType: 'contrat', summary: 'Résumé', people: [], organizations: [], importantDates: [], importantItems: [] }) }; } };
    const queue = new p1.PersistentJobQueue({ db, api, getCredentials: () => ({ apiKey: 'key', model: 'dynamic-model' }) });
    const job = { id: 'job_1', type: 'document-profile', documentId: document.id, folderId: document.folderId, inputFingerprint: p1.fingerprintDocument(document), status: 'pending', attempts: 0, maxAttempts: 5 };
    jobs.set(job.id, job);
    await queue.run(job);
    assert.equal(jobs.get(job.id).status, 'completed');
    assert.equal(profiles.get(document.id).status, 'valid');
    await queue.run({ ...job, id: 'job_2' });
    assert.equal(apiCalls, 1);
    assert.equal(jobs.get('job_2').checkpoint.stage, 'deduplicated');
});

test('la queue checkpoint une limitation 429 et la reprogramme', async () => {
    const p1 = loadP1();
    const document = sampleDocuments()[0];
    const jobs = new Map();
    const db = {
        async getDocument() { return document; }, async getDocumentProfile() { return null; },
        async saveDocumentProfile() {}, async saveProcessingJob(job) { jobs.set(job.id, { ...job }); return job; },
        async getProcessingJob(id) { return jobs.get(id) || null; }
    };
    const error = Object.assign(new Error('Trop de requêtes'), { status: 429, retryable: true, retryAfterMs: 2500 });
    const queue = new p1.PersistentJobQueue({ db, api: { async completeResponse() { throw error; } }, getCredentials: () => ({ apiKey: 'key', model: 'dynamic-model' }) });
    const job = { id: 'job_429', type: 'document-profile', documentId: document.id, folderId: document.folderId, inputFingerprint: p1.fingerprintDocument(document), status: 'pending', attempts: 0, maxAttempts: 5 };
    jobs.set(job.id, job);
    const before = Date.now();
    await queue.run(job);
    const saved = jobs.get(job.id);
    assert.equal(saved.status, 'pending');
    assert.equal(saved.checkpoint.stage, 'retry_scheduled');
    assert.equal(saved.checkpoint.retryInMs, 2500);
    assert.ok(saved.nextRunAt >= before + 2500);
});
