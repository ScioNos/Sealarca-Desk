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

test('couverture v3 : limites exactes, source coupée, sources omises et fiche historique', () => {
    const p1 = loadP1();
    const document = { id: 'coverage', folderId: 'folder', hash: 'original', markdown: 'x'.repeat(120000), sourceMap: [{ id: 'all', markdownStart: 0, markdownEnd: 120000 }] };
    assert.equal(p1.buildProfileRequest(document).coverage.status, 'complete');
    document.markdown += 'x'; document.sourceMap[0].markdownEnd++;
    const request = p1.buildProfileRequest(document);
    assert.equal(request.coverage.status, 'partial');
    assert.equal(request.coverage.sentCharacters, 120000);
    assert.equal(request.coverage.totalCharacters, 120001);
    assert.deepEqual(Array.from(request.coverage.cutSourceIds), ['all']);
    assert.equal(request.sourceMap[0].markdownEnd, 120000);
    const profile = p1.extractProfile('{"summary":"test"}', document, 'fp', request.sourceMap, request.coverage);
    assert.equal(profile.status, 'valid'); assert.equal(profile.coverage.status, 'partial');
    assert.equal(p1.extractProfile('{}', document, 'fp').coverage.status, 'unknown');
    document.markdown = 'x'.repeat(101);
    document.sourceMap = Array.from({ length: 101 }, (_, i) => ({ id: String(i), markdownStart: i, markdownEnd: i + 1 }));
    assert.equal(p1.buildProfileRequest(document).coverage.representedSources, 100);
    assert.equal(p1.buildProfileRequest(document).coverage.totalSources, 101);
    const fingerprint = p1.fingerprintDocument(document);
    document.metadata = { extraction: { revision: 1 } };
    assert.notEqual(p1.fingerprintDocument(document), fingerprint);
});

test('extraits bornés : aucun texte de la source voisine sous une mauvaise référence', () => {
    const p1 = loadP1();
    const document = { id: 'bounds', name: 'pages.pdf', markdown: 'mot cible\nSECRET PAGE DEUX', sourceMap: [
        { id: 'p1', markdownStart: 0, markdownEnd: 9, locator: { type: 'pdf-page', page: 1 } },
        { id: 'p2', markdownStart: 9, markdownEnd: 25, locator: { type: 'pdf-page', page: 2 } }
    ] };
    const [result] = p1.citableExcerpts(document, 'cible');
    assert.equal(result.sourceId, 'p1'); assert.doesNotMatch(result.excerpt, /SECRET/);
    assert.match(result.reference, /p\. 1/);
});

test('recherche coopérative sur 20 × 500 000 caractères : timer réactif et cache réutilisé', async () => {
    const p1 = loadP1(), service = new p1.SearchService();
    const documents = Array.from({ length: 20 }, (_, i) => ({ id: 'large-' + i, name: 'large-' + i, markdown: 'e'.repeat(499980) + ' résiliation contrat' }));
    let ticks = 0; const timer = setInterval(() => ticks++, 5);
    try {
        const first = await service.search(documents, 'résiliation', { maxResults: 30 });
        assert.equal(first.length, 20); assert.ok(ticks > 10);
        const start = performance.now();
        const second = await service.search(documents, 'contrat', { maxResults: 30 });
        assert.equal(second.length, 20); assert.ok(performance.now() - start < 250);
        documents[0].markdown = 'Texte remplacé'; service.invalidate(documents[0].id);
        assert.equal((await service.search(documents, 'résiliation', { maxResults: 30 })).length, 19);
    } finally { clearInterval(timer); service.destroy(); }
});

test('pompe sérialisée et inactive : aucun événement documentaire, récupération périodique', async () => {
    const p1 = loadP1(); let claims = 0, recoveries = 0, changes = 0, release;
    const gate = new Promise(resolve => { release = resolve; });
    const queue = new p1.PersistentJobQueue({ db: {
        async recoverInterruptedJobs() { recoveries++; return 0; },
        async claimRunnableProcessingJobs() { claims++; await gate; return []; }
    }, api: {}, getCredentials: () => ({}), onChange: () => changes++ });
    queue.started = true;
    const first = queue.pump(), second = queue.pump(); release(); await Promise.all([first, second]);
    assert.equal(claims, 1); assert.equal(changes, 0); assert.equal(recoveries, 1);
    queue.lastRecoveryAt = Date.now() - 30001; await queue.pump(); assert.equal(recoveries, 2);
    queue.stop(); assert.equal(queue.timer, null);
});

test('résultat réseau indéterminé : job failed sans reprise automatique', async () => {
    const p1 = loadP1(), document = sampleDocuments()[0]; let saved;
    const queue = new p1.PersistentJobQueue({ db: {
        async getDocument() { return document; }, async getDocumentProfile() { return null; },
        async updateProcessingJobIfOwner(id, owner, token, changes) { saved = changes; return true; }
    }, api: { async completeResponse() { throw Object.assign(new Error('Failed to fetch'), { kind: 'outcome_unknown' }); } },
    getCredentials: () => ({ apiKey: 'verified', model: 'model' }) });
    await queue.run({ id: 'ambiguous', documentId: document.id, inputFingerprint: p1.fingerprintDocument(document), attempts: 1 });
    assert.equal(saved.status, 'failed'); assert.equal(saved.nextRunAt, null); assert.equal(saved.errorKind, 'outcome_unknown');
});

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

test('le schéma de fiche v2 garde entités, montants, événements et obligations avec leurs sources valides', () => {
    const p1 = loadP1();
    const document = sampleDocuments()[0];
    const profile = p1.normalizeProfile({
        people: [{ name: 'Alice Dupont', sourceIds: ['page_21', 'made_up'] }],
        organizations: [{ name: 'Société A', sourceIds: ['page_21'] }],
        importantAmounts: [{ amount: 'CHF 12 000', label: 'Honoraires', sourceIds: ['page_21'] }],
        events: [{ date: '2025-01-14', label: 'Résiliation', details: 'Fin du contrat', sourceIds: ['page_21'] }],
        obligations: [{ label: 'Notifier', details: 'Par écrit', deadline: '2025-01-14', sourceIds: ['page_21'] }]
    }, document, p1.fingerprintDocument(document));
    assert.equal(p1.PROFILE_SCHEMA_VERSION, 3);
    assert.equal(p1.PROFILE_PROMPT_VERSION, 'document-profile-v2');
    assert.deepEqual(Array.from(profile.people), ['Alice Dupont']);
    assert.deepEqual(Array.from(profile.entities[0].sourceIds), ['page_21']);
    assert.deepEqual(Array.from(profile.importantAmounts[0].sourceIds), ['page_21']);
    assert.equal(profile.events[0].date, '2025-01-14');
    assert.equal(profile.obligations[0].deadline, '2025-01-14');
    assert.equal(profile.importantAmounts[0].references[0].label, 'contrat.pdf — p. 21');
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
    assert.equal(p1.isRetryableError(new Error('Network fetch failed')), false);
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
            jobs.set(id, { ...job, ...changes, ...(changes.status && changes.status !== 'running' ? { leaseOwner: null, leaseToken: null } : {}) });
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
            jobs.set(id, { ...job, ...changes, ...(changes.status && changes.status !== 'running' ? { leaseOwner: null, leaseToken: null } : {}) });
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

test('abortJobsForDocument annule uniquement le document supprimé, pending ou running', async () => {
    const p1 = loadP1();
    const queue = new p1.PersistentJobQueue({ db: {}, api: {}, getCredentials: () => ({}) });
    queue.running.set('job-a1', { controller: new AbortController(), leaseToken: 't1', documentId: 'doc-a', folderId: 'folder-1' });
    queue.running.set('job-a2', { controller: new AbortController(), leaseToken: 't2', documentId: 'doc-a', folderId: 'folder-1' });
    queue.running.set('job-b', { controller: new AbortController(), leaseToken: 't3', documentId: 'doc-b', folderId: 'folder-1' });
    const aborted = Array.from(queue.abortJobsForDocument('doc-a', 'document_deleted')).sort();
    assert.deepEqual(aborted, ['job-a1', 'job-a2']);
    assert.equal(queue.running.get('job-a1').controller.signal.aborted, true);
    assert.equal(queue.running.get('job-a1').controller.signal.reason, 'document_deleted');
    assert.equal(queue.running.get('job-a2').controller.signal.aborted, true);
    assert.equal(queue.running.get('job-b').controller.signal.aborted, false);
    assert.deepEqual(Array.from(queue.abortJobsForDocument('doc-pending-sans-running')), []);
    assert.deepEqual(Array.from(queue.abortJobsForDocument('')), []);
    assert.deepEqual(Array.from(queue.abortJobsForDocument(null)), []);
});

test('abortJobsForFolder annule tous les traitements du dossier sans toucher les autres', () => {
    const p1 = loadP1();
    const queue = new p1.PersistentJobQueue({ db: {}, api: {}, getCredentials: () => ({}) });
    queue.running.set('job-f1-a', { controller: new AbortController(), leaseToken: 't1', documentId: 'doc-1', folderId: 'folder-x' });
    queue.running.set('job-f1-b', { controller: new AbortController(), leaseToken: 't2', documentId: 'doc-2', folderId: 'folder-x' });
    queue.running.set('job-other', { controller: new AbortController(), leaseToken: 't3', documentId: 'doc-3', folderId: 'folder-y' });
    const aborted = Array.from(queue.abortJobsForFolder('folder-x', 'folder_deleted')).sort();
    assert.deepEqual(aborted, ['job-f1-a', 'job-f1-b']);
    assert.equal(queue.running.get('job-f1-a').controller.signal.aborted, true);
    assert.equal(queue.running.get('job-f1-b').controller.signal.aborted, true);
    assert.equal(queue.running.get('job-other').controller.signal.aborted, false);
    assert.deepEqual(Array.from(queue.abortJobsForFolder('folder-vide')), []);
});

test('la suppression pendant la génération aborte immédiatement sans attendre le heartbeat et garde le garde-fou final', async () => {
    const p1 = loadP1();
    const docA = { id: 'doc-del', folderId: 'folder-1', name: 'supprime.txt', hash: 'h-a', extension: 'txt', markdown: 'Contenu A supprimer', sourceMap: [] };
    const docB = { id: 'doc-keep', folderId: 'folder-1', name: 'garde.txt', hash: 'h-b', extension: 'txt', markdown: 'Contenu B garde', sourceMap: [] };
    const profiles = new Map();
    const jobs = new Map();
    let deletedA = false;
    let releaseB;
    const gateB = new Promise(resolve => { releaseB = resolve; });
    const db = {
        async getDocument(id) {
            if (id === 'doc-del' && deletedA) return null;
            return id === 'doc-del' ? docA : docB;
        },
        async getDocumentProfile(id) { return profiles.get(id) || null; },
        async renewProcessingJobLease() { return true; },
        async saveDocumentProfileIfJobOwner(profile, id, owner, token) {
            const job = jobs.get(id);
            if (!job || job.status !== 'running' || job.leaseOwner !== owner || job.leaseToken !== token) return false;
            if (deletedA && profile.documentId === 'doc-del') return false;
            profiles.set(profile.documentId, profile);
            jobs.set(id, { ...job, status: 'completed' });
            return true;
        },
        async updateProcessingJobIfOwner(id, owner, token, changes) {
            const job = jobs.get(id);
            if (!job || job.status !== 'running' || job.leaseOwner !== owner || job.leaseToken !== token) return false;
            jobs.set(id, { ...job, ...changes });
            return true;
        }
    };
    const api = {
        async completeResponse({ messages, signal }) {
            const prompt = String(messages?.[0]?.content || '');
            if (prompt.includes('supprime.txt')) {
                await new Promise((resolve, reject) => {
                    if (signal?.aborted) {
                        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
                        return;
                    }
                    signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true });
                });
            } else {
                await Promise.race([
                    gateB,
                    new Promise((resolve, reject) => {
                        if (signal?.aborted) {
                            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
                            return;
                        }
                        signal?.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true });
                    })
                ]);
            }
            if (signal?.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' });
            return { text: JSON.stringify({ documentType: 'note', summary: 'Résumé', people: [], organizations: [], importantDates: [], importantItems: [] }) };
        }
    };
    const queue = new p1.PersistentJobQueue({ db, api, getCredentials: () => ({ apiKey: 'key', model: 'm' }) });
    queue.heartbeatIntervalMs = 60000;
    const jobA = { id: 'job-del', type: 'document-profile', documentId: 'doc-del', folderId: 'folder-1', inputFingerprint: p1.fingerprintDocument(docA), status: 'running', attempts: 1, maxAttempts: 5, leaseOwner: queue.ownerId, leaseToken: 'token-del' };
    const jobB = { id: 'job-keep', type: 'document-profile', documentId: 'doc-keep', folderId: 'folder-1', inputFingerprint: p1.fingerprintDocument(docB), status: 'running', attempts: 1, maxAttempts: 5, leaseOwner: queue.ownerId, leaseToken: 'token-keep' };
    jobs.set(jobA.id, jobA);
    jobs.set(jobB.id, jobB);
    const runA = queue.run(jobA);
    const runB = queue.run(jobB);
    try {
        await new Promise(resolve => setTimeout(resolve, 50));
        assert.equal(queue.running.size, 2);
        const aborted = Array.from(queue.abortJobsForDocument('doc-del', 'document_deleted'));
        assert.deepEqual(aborted, ['job-del']);
        assert.equal(queue.running.get('job-del').controller.signal.aborted, true);
        assert.equal(queue.running.get('job-keep').controller.signal.aborted, false);
        deletedA = true;
        jobs.delete('job-del');
        releaseB();
        await Promise.all([runA, runB]);
        assert.equal(queue.running.size, 0);
        assert.equal(profiles.get('doc-del'), undefined);
        assert.equal(profiles.get('doc-keep')?.status, 'valid');
        assert.equal(jobs.get('job-keep')?.status, 'completed');
        assert.equal(jobs.get('job-del'), undefined);
    } finally {
        try { releaseB(); } catch (_) {}
        try { queue.abortJobsForDocument('doc-del', 'cleanup'); } catch (_) {}
        try { queue.abortJobsForDocument('doc-keep', 'cleanup'); } catch (_) {}
        await Promise.allSettled([runA, runB]);
    }
});
