const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'p1.js'), 'utf8');
function loadP1() {
    const context = { window: {}, console, AbortController, setTimeout, clearTimeout, setInterval, clearInterval };
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

test('la fiche ne transmet et n’accepte que les sources comprises dans ses 120 000 caractères', () => {
    const p1 = loadP1();
    const markdown = 'A'.repeat(120000) + 'B'.repeat(20);
    const document = {
        id: 'truncated', name: 'long.docx', extension: 'docx', markdown,
        sourceMap: [
            { id: 'sent', markdownStart: 0, markdownEnd: 120000, locator: { type: 'docx-paragraph', paragraph: 1 } },
            { id: 'never_sent', markdownStart: 120000, markdownEnd: markdown.length, locator: { type: 'docx-paragraph', paragraph: 2 } }
        ]
    };
    const request = p1.buildProfileRequest(document);
    assert.equal(request.sentMarkdown.length, 120000);
    assert.deepEqual(Array.from(request.sourceMap, source => source.id), ['sent']);
    assert.match(request.prompt, /"id":"sent"/);
    assert.doesNotMatch(request.prompt, /never_sent/);
    const result = p1.extractProfile(JSON.stringify({ summary: 'Résumé', sourceIds: ['sent', 'never_sent'] }), document, 'fingerprint', request.sourceMap);
    assert.deepEqual(Array.from(result.sourceIds), ['sent']);
});

test('la recherche sur accents combinés retrouve le bon offset et la bonne source', () => {
    const p1 = loadP1();
    const prefix = 'e\u0301'.repeat(100);
    const markdown = `${prefix}résiliation`;
    const result = p1.localSearch([{
        id: 'unicode', name: 'unicode.txt', markdown,
        sourceMap: [
            { id: 'before', markdownStart: 0, markdownEnd: prefix.length, locator: { type: 'text-line-range', startLine: 1, endLine: 1 } },
            { id: 'after', markdownStart: prefix.length, markdownEnd: markdown.length, locator: { type: 'text-line-range', startLine: 2, endLine: 2 } }
        ]
    }], 'résiliation');
    assert.equal(result[0].sourceId, 'after');
    assert.match(result[0].excerpt, /résiliation/);
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
        async renewProcessingJobLease() { return true; },
        async saveDocumentProfileIfJobOwner(profile, id, owner, token) {
            const job = jobs.get(id);
            if (!job || job.status !== 'running' || job.leaseOwner !== owner || job.leaseToken !== token) return false;
            profiles.set(profile.documentId, profile);
            jobs.set(id, { ...job, status: 'completed', checkpoint: { stage: 'profile_saved' } });
            return true;
        },
        async updateProcessingJobIfOwner(id, owner, token, changes) {
            const job = jobs.get(id);
            if (!job || job.status !== 'running' || job.leaseOwner !== owner || job.leaseToken !== token) return false;
            jobs.set(id, { ...job, ...changes, leaseOwner: null, leaseToken: null });
            return true;
        }
    };
    let apiCalls = 0;
    const api = { async completeResponse() { apiCalls += 1; return { text: JSON.stringify({ documentType: 'contrat', summary: 'Résumé', people: [], organizations: [], importantDates: [], importantItems: [] }) }; } };
    const queue = new p1.PersistentJobQueue({ db, api, getCredentials: () => ({ apiKey: 'key', model: 'dynamic-model' }) });
    const claimed = id => ({ id, type: 'document-profile', documentId: document.id, folderId: document.folderId, inputFingerprint: p1.fingerprintDocument(document), status: 'running', attempts: 1, maxAttempts: 5, leaseOwner: queue.ownerId, leaseToken: `${id}:token` });
    const job = claimed('job_1');
    jobs.set(job.id, job);
    await queue.run(job);
    assert.equal(jobs.get(job.id).status, 'completed');
    assert.equal(profiles.get(document.id).status, 'valid');
    const deduplicated = claimed('job_2');
    jobs.set(deduplicated.id, deduplicated);
    await queue.run(deduplicated);
    assert.equal(apiCalls, 1);
    assert.equal(jobs.get('job_2').checkpoint.stage, 'deduplicated');
});

test('la queue checkpoint une limitation 429 et la reprogramme', async () => {
    const p1 = loadP1();
    const document = sampleDocuments()[0];
    const jobs = new Map();
    const db = {
        async getDocument() { return document; }, async getDocumentProfile() { return null; },
        async renewProcessingJobLease() { return true; },
        async saveDocumentProfileIfJobOwner() { return false; },
        async updateProcessingJobIfOwner(id, owner, token, changes) {
            const job = jobs.get(id);
            if (!job || job.status !== 'running' || job.leaseOwner !== owner || job.leaseToken !== token) return false;
            jobs.set(id, { ...job, ...changes, leaseOwner: null, leaseToken: null });
            return true;
        }
    };
    const error = Object.assign(new Error('Trop de requêtes'), { status: 429, retryable: true, retryAfterMs: 2500 });
    const queue = new p1.PersistentJobQueue({ db, api: { async completeResponse() { throw error; } }, getCredentials: () => ({ apiKey: 'key', model: 'dynamic-model' }) });
    const job = { id: 'job_429', type: 'document-profile', documentId: document.id, folderId: document.folderId, inputFingerprint: p1.fingerprintDocument(document), status: 'running', attempts: 1, maxAttempts: 5, leaseOwner: queue.ownerId, leaseToken: 'token-429' };
    jobs.set(job.id, job);
    const before = Date.now();
    await queue.run(job);
    const saved = jobs.get(job.id);
    assert.equal(saved.status, 'pending');
    assert.equal(saved.checkpoint.stage, 'retry_scheduled');
    assert.equal(saved.checkpoint.retryInMs, 2500);
    assert.ok(saved.nextRunAt >= before + 2500);
});
