const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const { marked } = require('marked');
const { IDBFactory, IDBKeyRange } = require('fake-indexeddb');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const operationsSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'operations.js'), 'utf8');
const timelineSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'timeline.js'), 'utf8');

function loadApp(windowExtras = {}) {
    let createApp;
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    const window = {
        document: dom.window.document,
        marked,
        DOMPurify: createDOMPurify(dom.window),
        confirm: () => true,
        ...windowExtras
    };
    const document = dom.window.document;
    document.addEventListener = (type, callback) => {
        if (type === 'alpine:init') callback();
    };
    const Alpine = {
        directive() {},
        data(name, factory) { if (name === 'sealarcaApp') createApp = factory; },
        mutateDom(callback) { callback(); }
    };
    const context = { window, document, Alpine, console, setTimeout, clearTimeout, AbortController, DOMException };
    vm.createContext(context);
    vm.runInContext(operationsSource, context, { filename: 'operations.js' });
    vm.runInContext(timelineSource, context, { filename: 'timeline.js' });
    vm.runInContext(appSource, context, { filename: 'app.js' });
    return { app: createApp(), window, dom };
}

function configureApi(app) {
    app.apiKey = 'test-key';
    app.verifiedApiKey = 'test-key';
    app.models = [{ id: 'test-model' }];
    app.selectedModel = 'test-model';
    app.activeFolderId = 'folder';
    app.activeConversationId = 'conversation';
    app.contextMode = 'manual';
    app.showToast = message => { app.lastToast = message; };
    app.t = key => key;
    app.scrollToBottom = () => {};
    app.decorateMessage = message => message;
}

test('découverte des modèles : changement ou oubli de clé écarte toute réponse tardive', async () => {
    let release;
    const { app } = loadApp({ sealarcaApi: { fetchModels: () => new Promise(resolve => { release = resolve; }), abortAllRequests() {} },
        sealarcaDb: { async deleteSetting() {} } });
    app.apiKey = 'key-A'; app.focusApiKeyInput = () => {};
    const first = app.loadModels();
    app.updateApiKey({ currentTarget: { value: 'key-B' } });
    release([{ id: 'model-A' }]); assert.equal(await first, false);
    assert.equal(app.verifiedApiKey, ''); assert.equal(app.models.length, 0);
    const second = app.loadModels(); await app.forgetApiKey(); release([{ id: 'model-B' }]);
    assert.equal(await second, false); assert.equal(app.apiKey, ''); assert.equal(app.models.length, 0);
});

test('résultats de recherche périmés et changements de dossier ne sont jamais appliqués', async () => {
    const pending = [];
    const { app } = loadApp(); app.activeFolderId = 'A';
    app.searchService = { search: () => new Promise(resolve => pending.push(resolve)) };
    app.documentSearchQuery = 'ancienne'; const first = app.runDocumentSearch();
    app.documentSearchQuery = 'récente'; const second = app.runDocumentSearch();
    pending[1]([{ id: 'B', matchedTerms: [] }]); await second;
    pending[0]([{ id: 'A', matchedTerms: [] }]); await first; assert.equal(app.documentSearchResults[0].id, 'B');
    const third = app.runDocumentSearch(); app.activeFolderId = 'B';
    pending[2]([{ id: 'wrong-folder', matchedTerms: [] }]); await third; assert.equal(app.documentSearchResults[0].id, 'B');
});

test('actualisations groupées de jobs : aucune lecture des documents ou des traces', async () => {
    const { app } = loadApp(); app.activeFolderId = 'folder';
    let jobs = 0; app.loadProcessingJobs = async () => jobs++;
    app.loadDocuments = app.loadFolderOperations = () => { throw new Error('full_reload'); };
    app.buildFolderOverview = () => {};
    await Promise.all([app.refreshFolderWorkspace({ folderId: 'folder', domains: ['jobs'] }), app.refreshFolderWorkspace({ folderId: 'folder', domains: ['jobs'] })]);
    assert.equal(jobs, 1);
    await app.refreshFolderWorkspace({ folderId: 'other', domains: ['jobs'] }); assert.equal(jobs, 1);
});

test('fiche historique : couverture inconnue et analyse partielle dans la trace sans appel IA', async () => {
    const { app, db, window } = await loadStoredApp();
    window.sealarcaApi = { completeResponse() { throw new Error('unexpected_network'); } };
    await db.saveDocument({ id: 'unknown', folderId: 'folder_default', name: 'legacy.txt', hash: 'legacy', markdown: 'Texte' });
    await db.saveDocumentProfile({ documentId: 'unknown', folderId: 'folder_default', status: 'valid', inputFingerprint: 'fp:legacy', summary: 'Ancienne fiche' });
    await app.runFolderAnalysis('summary');
    const operation = (await db.getOperations('folder_default'))[0];
    assert.equal(operation.status, 'partial');
    const trace = await db.getTrace(operation.resultRef.traceId);
    assert.equal(trace.documents[0].coverage.status, 'unknown');
    assert.ok(trace.notices.some(notice => notice.code === 'profile_coverage_unknown'));
});

test('double envoi : un seul appel et verrou libéré après une erreur de persistance', async () => {
    let calls = 0;
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const { app, window } = loadApp({ sealarcaDb: {
        async getDocuments() { await gate; return []; }, async getDocumentsByIds() { return []; },
        async saveMessage() {},
    }, sealarcaApi: { async streamResponse() { calls++; } } });
    configureApi(app); app.inputPrompt = 'Question';
    const first = app.sendMessage();
    await app.sendMessage();
    assert.equal(app.isSending, true);
    release(); await first;
    assert.equal(calls, 1);
    assert.equal(app.isSending, false);
    app.isStreaming = false; app.inputPrompt = 'Retry';
    window.sealarcaDb.saveMessage = async () => { throw new Error('Quota'); };
    await app.sendMessage();
    assert.equal(app.isSending, false);
    assert.equal(app.inputPrompt, 'Retry');
    assert.equal(calls, 1);
});

test('navigation inversée ne remplace jamais les messages du dernier choix', async () => {
    const release = {};
    const { app } = loadApp({ sealarcaDb: { getMessages: id => new Promise(resolve => { release[id] = resolve; }) } });
    app.scrollToBottom = () => {};
    const left = app.selectConversation('A');
    const right = app.selectConversation('B');
    release.B([{ id: 'b', role: 'user', content: 'B' }]); await right;
    release.A([{ id: 'a', role: 'user', content: 'A' }]); await left;
    assert.equal(app.activeConversationId, 'B');
    assert.equal(app.messages[0].content, 'B');
    assert.equal(app.isNavigating, false);
});

test('navigation dossiers inversée : aucun document ou historique du précédent dossier', async () => {
    const release = {};
    const { app } = loadApp({ sealarcaDb: {
        async setSetting() {}, getDocuments: id => new Promise(resolve => { release[id] = resolve; }),
        async getDocumentProfiles() { return []; }, async getConversations() { return []; },
        async getProcessingJobs() { return []; }, async getOperations() { return []; }
    } });
    app.buildFolderOverview = () => {}; app.messages = [{ content: 'ancien' }];
    const first = app.selectFolder('A'); await new Promise(resolve => setTimeout(resolve, 0));
    const second = app.selectFolder('B'); await new Promise(resolve => setTimeout(resolve, 0));
    assert.equal(app.messages.length, 0);
    release.B([{ id: 'doc-B', folderId: 'B' }]); await second;
    release.A([{ id: 'doc-A', folderId: 'A' }]); await first;
    assert.equal(app.activeFolderId, 'B'); assert.equal(app.documents[0].id, 'doc-B'); assert.equal(app.isNavigating, false);
});

test('une ancienne entrée de conversation ne peut pas charger son historique dans un autre dossier', async () => {
    const { app } = loadApp({ sealarcaDb: { async getConversation() { return { id: 'old', folderId: 'A' }; },
        getMessages() { throw new Error('wrong_folder_read'); } } });
    app.activeFolderId = 'B'; await app.selectConversation('old');
    assert.equal(app.activeConversationId, null); assert.equal(app.messages.length, 0); assert.equal(app.isNavigating, false);
});

test('import conserve le dossier initial et arrête le lot si ce dossier disparaît', async () => {
    const { app, window, db } = await loadStoredApp();
    await db.saveFolder({ id: 'B', name: 'B' });
    let release;
    window.sealarcaDocHandler = { parseFile: () => new Promise(resolve => { release = resolve; }) };
    const first = app.processFiles([{ name: 'secret.txt' }]);
    app.activeFolderId = 'B';
    release({ id: 'secret', name: 'secret.txt', markdown: 'secret', hash: 'secret' }); await first;
    assert.equal((await db.getDocument('secret')).folderId, 'folder_default');
    assert.equal(app.selectedDocumentIds.length, 0);
    app.activeFolderId = 'folder_default';
    const second = app.processFiles([{ name: 'other.txt' }, { name: 'last.txt' }]);
    await db.deleteFolder('folder_default');
    release({ id: 'other', name: 'other.txt', markdown: 'other' }); await second;
    assert.equal(await db.getDocument('other'), null);
});

async function loadStoredApp() {
    const context = { window: {}, indexedDB: new IDBFactory(), IDBKeyRange, console };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'db.js'), 'utf8'), context);
    const db = context.window.sealarcaDb;
    await db.init();
    const loaded = loadApp({ sealarcaDb: db });
    loaded.window.SealarcaP1 = {
        fingerprintDocument: document => 'fp:' + document.hash,
        sourceReference: (document, source) => `${document.name} — page ${source.locator.page}`,
        extractCitations: () => []
    };
    loaded.app.t = key => key;
    loaded.app.showToast = () => {};
    loaded.app.activeFolderId = 'folder_default';
    return { ...loaded, db };
}

test('une extraction partielle reste visible dans le résultat et sa trace historique après modification du dossier', async () => {
    const { app, db } = await loadStoredApp();
    const document = await db.saveDocument({
        id: 'partial', folderId: 'folder_default', name: 'table.pdf', hash: 'old-hash', markdown: 'Available text',
        metadata: { extraction: { warnings: [{ code: 'pdf_pages', pages: '2' }] } },
        sourceMap: [{ id: 'p1', markdownStart: 0, markdownEnd: 14, locator: { type: 'pdf-page', page: 1 } }]
    });
    await db.saveDocumentProfile({ documentId: document.id, folderId: document.folderId, status: 'valid', inputFingerprint: 'fp:old-hash', summary: 'Historical summary', events: [{ date: '2026-02-12', label: 'Signature', sourceIds: ['p1'], references: [{ sourceId: 'p1', label: 'table.pdf — page 1' }] }] });
    await db.saveDocument({ id: 'unprocessed', folderId: 'folder_default', name: 'missing.pdf', markdown: 'Not analyzed' });
    await app.runFolderAnalysis('timeline');
    const operation = (await db.getOperations('folder_default'))[0];
    const before = await db.getTrace(operation.resultRef.traceId);
    assert.equal(operation.status, 'partial');
    assert.ok(operation.notices.some(notice => notice.code === 'document_profile_missing' && notice.documentId === 'unprocessed'));
    assert.ok(operation.notices.some(notice => notice.code === 'document_extraction_partial' && notice.documentId === 'partial'));
    assert.equal(before.operation.status, 'partial');
    assert.equal(before.operation.steps.every(step => step.status === 'completed'), true);
    assert.equal(before.sources[0].locator.page, 1);
    assert.equal(operation.resultRef.snapshot.timeline[0].label, 'Signature');
    const context = app.buildDocumentContext([document]);
    assert.equal(context.notices[0].code, 'document_extraction_partial');
    assert.equal(context.notices[0].documentId, document.id);
    await db.saveDocument({ ...document, name: 'renamed.pdf', hash: 'new-hash', sourceMap: [{ id: 'p1', locator: { page: 99 } }] });
    await db.saveDocumentProfile({ documentId: document.id, folderId: document.folderId, status: 'valid', inputFingerprint: 'fp:new-hash', events: [{ date: '2026-01-01', label: 'Changed event' }] });
    assert.deepEqual(await db.getTrace(before.id), before);
    await app.loadFolderOperations();
    assert.equal(app.folderOperations[0].traceDocuments.find(item => item.id === 'partial').name, 'table.pdf');
    assert.match(app.folderOperations[0].resultLines[0].text, /Signature/);
});

test('l’annulation pendant une lecture IndexedDB termine les étapes actives et empêche un résultat tardif', async () => {
    const { app, db } = await loadStoredApp();
    await db.saveDocument({ id: 'cancel', folderId: 'folder_default', name: 'cancel.txt', markdown: 'Text' });
    let entered;
    let release;
    const reading = new Promise(resolve => { entered = resolve; });
    const pendingRead = new Promise(resolve => { release = resolve; });
    db.getDocumentProfiles = async () => { entered(); await pendingRead; return []; };
    const running = app.runFolderAnalysis('summary');
    await reading;
    const operationId = (await db.getOperations('folder_default'))[0].id;
    const cancelled = app.cancelFolderOperation(operationId);
    release();
    await Promise.all([running, cancelled]);
    const operation = await db.getOperation(operationId);
    assert.equal(operation.status, 'cancelled');
    assert.equal(operation.steps.some(step => step.status === 'running'), false);
    assert.equal(operation.steps.find(step => step.id === 'context').status, 'cancelled');
    assert.equal(operation.resultRef, null);
    assert.deepEqual(await db.getTraces('folder_default'), []);
    assert.equal(app.operationRuns.size, 0);
});

test('les documents omis par la limite restent identifiables dans la trace de l’opération partielle', async () => {
    const { app, db } = await loadStoredApp();
    await Promise.all(Array.from({ length: 101 }, (_, index) => db.saveDocument({ id: 'doc-' + index, folderId: 'folder_default', name: 'document-' + index + '.txt', markdown: 'Text' })));
    await app.runFolderAnalysis('summary');
    const operation = (await db.getOperations('folder_default'))[0];
    const trace = await db.getTrace(operation.resultRef.traceId);
    assert.equal(operation.status, 'partial');
    assert.equal(operation.documentIds.length, 101);
    assert.equal(trace.documents.length, 101);
    assert.equal(trace.context.omittedDocumentCount, 101);
    assert.equal(operation.steps.find(step => step.id === 'prepare').detail.count, 100);
    assert.ok(trace.notices.some(notice => notice.code === 'document_limit_reached' && notice.metadata.limit === 100));
});

test('les tiroirs de raisonnement et de trace réagissent avec Alpine CSP et conservent leur état par message', async () => {
    const { app: rawApp } = loadApp();
    const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', url: 'https://desk.test/' });
    dom.window.eval(fs.readFileSync(path.join(__dirname, '..', 'vendor', 'alpine-csp.min.js'), 'utf8'));
    const Alpine = dom.window.Alpine;
    const app = Alpine.reactive(rawApp);
    app.t = key => key;
    const trace = { documents: [{ id: 'doc', included: true }], sources: [], context: {} };
    const message = Alpine.reactive(app.decorateMessage({ id: 'message', role: 'assistant', reasoning: 'API reasoning', trace }));
    const other = app.decorateMessage({ id: 'other', reasoning: 'Other API reasoning', trace });
    let visible;
    let label;
    const effect = Alpine.effect(() => { visible = [message.reasoningVisible, message.traceVisible]; label = message.reasoningLabel; });
    try {
        assert.deepEqual(visible, [true, true]);
        message.toggleReasoning();
        message.toggleTrace();
        await Promise.resolve();
        assert.deepEqual(visible, [false, false]);
        assert.equal(label, 'reasoning.show');
        assert.equal(other.reasoningVisible, true);
        assert.equal(other.traceVisible, true);
        const reloaded = app.decorateMessage({ id: 'message', reasoning: 'API reasoning', trace });
        assert.equal(reloaded.reasoningVisible, false);
        assert.equal(reloaded.traceVisible, false);
        reloaded.toggleReasoning();
        await Promise.resolve();
        assert.equal(message.reasoningVisible, true);
    } finally {
        Alpine.release(effect);
        dom.window.close();
    }
});

test('le chat persiste le modèle et le contexte réellement envoyés malgré un changement pendant le streaming', async () => {
    const { app, window, db } = await loadStoredApp();
    configureApi(app);
    app.activeFolderId = 'folder_default';
    app.activeConversationId = 'conversation';
    await db.saveConversation({ id: 'conversation', folderId: 'folder_default', title: 'Historical chat' }, { allowCreate: true });
    const document = await db.saveDocument({ id: 'sent', folderId: 'folder_default', name: 'sent.pdf', markdown: 'Sent text', sourceMap: [{ id: 'p1', markdownStart: 0, markdownEnd: 9, locator: { type: 'pdf-page', page: 1 } }] });
    app.selectedDocumentIds = [document.id];
    app.inputPrompt = 'Question';
    app.loadConversations = async () => {};
    let request;
    window.sealarcaApi = { async streamResponse(options) {
        request = options;
        app.selectedModel = 'changed-model';
        await db.saveDocument({ ...document, name: 'changed.pdf', markdown: 'Changed text' });
        await options.onDone('Partial answer', 'API summary', { interrupted: true, reason: 'cancelled' });
    } };
    await app.sendMessage();
    const answer = (await db.getMessages('conversation')).find(message => message.role === 'assistant');
    const trace = await db.getTrace(answer.traceId);
    assert.equal(answer.model, request.model);
    assert.equal(trace.model, 'test-model');
    assert.equal(answer.content, 'Partial answer');
    assert.equal(trace.documents[0].name, 'sent.pdf');
    assert.equal(trace.context.characters, request.messages.at(-1).content.length - 'Question'.length);
    assert.equal(trace.notices.at(-1).code, 'response_interrupted');
    assert.doesNotMatch(JSON.stringify(trace), /Sent text|Changed text/);
});

test('le chat bloque sans persistance ni appel API au-delà de 250 000 caractères', async () => {
    let apiCalls = 0;
    let savedMessages = 0;
    const { app, window } = loadApp({
        SEALARCA_DEFAULT_FOLDER_ID: 'folder_default',
        sealarcaDb: {
            async getDocuments() { return []; },
            async getDocumentsByIds() { return []; },
            async saveMessage() { savedMessages++; }
        },
        sealarcaApi: { async streamResponse() { apiCalls++; } }
    });
    configureApi(app);
    app.inputPrompt = 'x'.repeat(249999);
    app.selectedRole = { id: 'role-test', systemPrompt: 'ab' };
    await app.sendMessage();
    assert.equal(app.lastToast, 'app.contextTooLarge');
    assert.equal(apiCalls, 0);
    assert.equal(savedMessages, 0);
    assert.equal(app.inputPrompt.length, 249999);
});

test('le chat accepte exactement 250 000 caractères effectifs, instructions comprises', async () => {
    let apiCalls = 0;
    let savedMessages = 0;
    const { app, window } = loadApp({
        SEALARCA_DEFAULT_FOLDER_ID: 'folder_default',
        sealarcaDb: {
            async getDocuments() { return []; },
            async getDocumentsByIds() { return []; },
            async saveMessage() { savedMessages++; }
        },
        sealarcaApi: { async streamResponse() { apiCalls++; } }
    });
    configureApi(app);
    app.inputPrompt = 'x'.repeat(249999);
    app.selectedRole = { id: 'role-test', systemPrompt: 'x' };
    await app.sendMessage();
    assert.equal(apiCalls, 1);
    assert.equal(savedMessages, 1);
});

test('les citations du chat ne gardent que les sources réellement envoyées', () => {
    const { app, window } = loadApp();
    window.SealarcaP1 = {
        sourceReference: (document, source) => `${document.name} — ${source.id}`,
        citableExcerpts: () => [{ sourceId: 'sent', reference: 'doc.txt — sent', excerpt: 'extrait transmis' }]
    };
    const document = {
        id: 'doc', name: 'doc.txt', markdown: 'visible\nsecret',
        sourceMap: [
            { id: 'sent', markdownStart: 0, markdownEnd: 8 },
            { id: 'not_sent', markdownStart: 8, markdownEnd: 14 }
        ]
    };
    const context = app.buildDocumentContext([document], 'question', 'automatic');
    assert.match(context.text, /extrait transmis/);
    assert.doesNotMatch(context.text, /secret/);
    assert.equal(context.manifest.characters, context.text.length);
    assert.equal(context.manifest.documents[0].included, true);
    assert.deepEqual(Array.from(context.manifest.documents[0].sourceIds), ['sent']);
    assert.equal(context.manifest.sources.length, 1);
    assert.equal(context.manifest.sources[0].sourceId, 'sent');
    assert.deepEqual(Array.from(context.citationDocuments[0].sourceMap, source => source.id), ['sent']);
});

test('le registre du dossier ignore les fiches périmées et lie les montants à leurs sources', () => {
    const { app, window } = loadApp();
    window.SealarcaP1 = {
        fingerprintDocument: document => 'current:' + document.id,
        sourceReference: (document, source) => `${document.name} — page ${source.locator.page}`
    };
    app.openProfileReference = (documentId, sourceId) => { app.openedReference = { documentId, sourceId }; };
    app.documents = [{
        id: 'doc-a', name: 'contract.pdf', hash: 'hash-a', metadata: { pageCount: 2 },
        sourceMap: [{ id: 'page-1', label: 'Page 1', locator: { type: 'pdf-page', page: 1 } }]
    }, {
        id: 'doc-old', name: 'old.pdf', sourceMap: []
    }];
    app.documentProfiles = [{
        documentId: 'doc-a', status: 'valid', coverage: { status: 'complete' }, inputFingerprint: 'current:doc-a', people: ['Alex Doe'], organizations: ['Example GmbH'],
        importantAmounts: [{ amount: 'CHF 12 000', sourceIds: ['page-1'], references: [{ sourceId: 'page-1', label: 'contract.pdf — page 1' }] }],
        obligations: [{ label: 'Send notice', deadline: '2025-01-14', sourceIds: ['page-1'], references: [{ sourceId: 'page-1', label: 'contract.pdf — page 1' }] }],
        importantDates: [{ date: '2025-01-14', label: 'Notice', sourceIds: ['page-1'], references: [{ sourceId: 'page-1', label: 'contract.pdf — page 1' }] }]
    }, { documentId: 'doc-old', status: 'valid', inputFingerprint: 'old-fingerprint', summary: 'stale' }];
    app.buildFolderOverview();
    assert.equal(app.folderOverview.profileCount, 1);
    assert.equal(app.folderOverview.timeline.length, 2);
    assert.equal(app.folderOverview.entities.amounts[0].sourceLinks[0].reference, 'contract.pdf — page 1');
    app.folderOverview.entities.amounts[0].sourceLinks[0].open();
    assert.deepEqual(app.openedReference, { documentId: 'doc-a', sourceId: 'page-1' });
    assert.equal(app.documentAnalysisStatus(app.documents[0], app.documentProfiles[0]), 'ready');
    assert.equal(app.documentAnalysisStatus(app.documents[1], app.documentProfiles[1]), 'not_analyzed');
});

test('les actions de dossier synthétisent les fiches localement et conservent leurs sources sans appeler l’API', async () => {
    const document = {
        id: 'doc-local', folderId: 'folder-local', name: 'contract.pdf', hash: 'hash-local',
        markdown: 'SOURCE TEXT MUST NOT BE COPIED INTO THE TRACE',
        sourceMap: [{ id: 'page-4', label: 'Page 4', locator: { type: 'pdf-page', page: 4 } }]
    };
    const unprofiledDocument = {
        id: 'doc-unprofiled', folderId: 'folder-local', name: 'scan.pdf', hash: 'hash-unprofiled',
        markdown: 'UNPROFILED SOURCE TEXT', sourceMap: []
    };
    const documents = [document, unprofiledDocument];
    const profile = {
        documentId: document.id, folderId: document.folderId, status: 'valid', coverage: { status: 'complete' }, inputFingerprint: 'fp-doc-local', summary: 'Local summary',
        importantDates: [{ date: '2025-04-01', label: 'Notice', sourceIds: ['page-4'], references: [{ sourceId: 'page-4', label: 'contract.pdf — page 4' }] }]
    };
    const profiles = [profile];
    const operations = new Map();
    const traces = new Map();
    const db = {
        async getDocuments() { return documents; },
        async getDocumentProfiles() { return profiles; },
        async createOperation(operation) { operations.set(operation.id, operation); return operation; },
        async claimOperation(id, ownerId, leaseToken) {
            const operation = { ...operations.get(id), status: 'running', leaseOwner: ownerId, leaseToken, leaseExpiresAt: Date.now() + 180000 };
            operations.set(id, operation);
            return operation;
        },
        async updateOperationIfOwner(id, ownerId, leaseToken, changes) {
            const operation = operations.get(id);
            if (!operation || operation.leaseOwner !== ownerId || operation.leaseToken !== leaseToken) return false;
            const updated = { ...operation, ...changes, leaseExpiresAt: Date.now() + 180000 };
            operations.set(id, updated);
            return updated;
        },
        async getOperations() { return [...operations.values()]; },
        async getTrace(id) { return traces.get(id) || null; },
        async completeLocalOperation({ operationId, operationChanges, trace, resultRef }) {
            const operation = { ...operations.get(operationId), ...operationChanges, resultRef: { traceId: trace.id, ...resultRef }, leaseOwner: null, leaseToken: null };
            operations.set(operationId, operation);
            traces.set(trace.id, trace);
            return { operation, trace };
        }
    };
    let apiCalls = 0;
    const { app, window } = loadApp({ sealarcaDb: db, sealarcaApi: { async completeResponse() { apiCalls += 1; } } });
    window.SealarcaP1 = {
        fingerprintDocument: item => 'fp-' + item.id,
        sourceReference: (item, source) => `${item.name} — page ${source.locator.page}`
    };
    app.t = key => key;
    app.showToast = () => {};
    app.activeFolderId = document.folderId;
    app.selectedDocumentIds = [];
    app.documents = documents;
    app.documentProfiles = profiles;
    app.openProfileReference = () => {};
    await app.runFolderAnalysis('timeline', [document.id]);
    await app.runFolderAnalysis('summary', [document.id]);
    await app.runFolderAnalysis('compare', documents.map(item => item.id));
    const timelineOperation = [...operations.values()].find(item => item.type === 'timeline');
    const summaryOperation = [...operations.values()].find(item => item.type === 'summary');
    const partialOperation = [...operations.values()].find(item => item.type === 'compare');
    const trace = [...traces.values()].find(item => item.operationId === timelineOperation.id);
    const partialTrace = [...traces.values()].find(item => item.operationId === partialOperation.id);
    assert.equal(apiCalls, 0);
    assert.equal(timelineOperation.status, 'completed');
    assert.equal(timelineOperation.resultRef.snapshot.timeline[0].label, 'Notice');
    assert.equal(timelineOperation.steps[0].detail.kind, 'documents');
    assert.equal(timelineOperation.steps[0].detail.count, 1);
    assert.equal(timelineOperation.steps.find(step => step.id === 'context').detail.kind, 'profiles');
    assert.equal(timelineOperation.steps.find(step => step.id === 'context').detail.count, 1);
    assert.equal(timelineOperation.steps.find(step => step.id === 'context').detail.total, 1);
    assert.equal(timelineOperation.steps.find(step => step.id === 'save').detail.kind, 'results');
    assert.equal(summaryOperation.status, 'completed');
    assert.equal(summaryOperation.context.mode, 'local_profiles');
    assert.equal(summaryOperation.resultRef.snapshot.stats.analyzedDocumentCount, 1);
    assert.equal(summaryOperation.resultRef.snapshot.summaries[0].documentName, 'dossier.summaryLocalTitle');
    assert.match(summaryOperation.resultRef.snapshot.summaries.find(item => item.documentId === document.id).summary, /Local summary/);
    const summarizedEvent = summaryOperation.resultRef.snapshot.summaries.find(item => item.documentName === 'dossier.timelineTitle');
    assert.ok(summarizedEvent);
    assert.equal(summarizedEvent.sources[0].sourceId, 'page-4');
    assert.equal(partialOperation.status, 'partial');
    assert.equal(partialOperation.notices[0].code, 'profiles_missing');
    assert.equal(partialOperation.resultRef.snapshot.comparisons.length, 1);
    assert.equal(partialTrace.documents.find(item => item.id === unprofiledDocument.id).included, false);
    assert.equal(trace.sources[0].sourceId, 'page-4');
    assert.doesNotMatch(JSON.stringify(trace), /SOURCE TEXT MUST NOT BE COPIED/);
});

test('une erreur de lecture au démarrage libère le verrou d’opération du dossier', async () => {
    const { app } = loadApp({ sealarcaDb: { async getDocuments() { throw new Error('IndexedDB indisponible'); } } });
    app.activeFolderId = 'folder-failure';
    app.t = key => key;
    app.showToast = () => {};
    const originalError = console.error;
    console.error = () => {};
    try {
        await app.runFolderAnalysis('summary');
    } finally {
        console.error = originalError;
    }
    assert.equal(app.isStartingFolderOperation, false);
});

test('le réglage de contexte par dossier ne modifie pas la préférence générale', async () => {
    let savedFolder = { id: 'folder-context', name: 'Context', documentSettings: { contextMode: null } };
    const { app } = loadApp({
        sealarcaDb: {
            async getFolder() { return savedFolder; },
            async saveFolder(folder) { savedFolder = folder; return folder; }
        }
    });
    app.activeFolderId = savedFolder.id;
    app.folders = [savedFolder];
    app.contextMode = 'manual';
    app.loadFolders = async () => { app.folders = [savedFolder]; };
    await app.setFolderContextModeOverride({ currentTarget: { value: 'automatic' } });
    assert.equal(savedFolder.documentSettings.contextMode, 'automatic');
    assert.equal(app.contextMode, 'manual');
    assert.equal(app.effectiveContextMode, 'automatic');
    await app.setContextMode('manual');
    assert.equal(savedFolder.documentSettings.contextMode, 'manual');
    assert.equal(app.contextMode, 'manual');
    app.contextMode = 'automatic';
    assert.equal(app.effectiveContextMode, 'manual');
    await app.setFolderContextModeOverride({ currentTarget: { value: '' } });
    assert.equal(savedFolder.documentSettings.contextMode, null);
    assert.equal(app.effectiveContextMode, 'automatic');
});

test('le Markdown utilisateur ne peut pas reprendre une classe ou un identifiant de l’interface', () => {
    const { app, dom } = loadApp();
    const output = app.renderMarkdown('<div class="modal-overlay" id="settingsModal"><strong>contenu</strong><a href="javascript:alert(1)">lien</a></div>\n\n```js\nconst safe = true;\n```');
    const root = dom.window.document.createElement('div');
    root.innerHTML = output;
    assert.equal(root.querySelector('.modal-overlay, #settingsModal, #sidebar'), null);
    assert.match(root.textContent, /contenu/);
    assert.equal(root.querySelector('a')?.getAttribute('href'), null);
    assert.ok(root.querySelector('code.language-js'));
});

test('la suppression d’une conversation ou du dossier actif attend la fin du streaming', async () => {
    const calls = [];
    const { app, window } = loadApp({
        sealarcaDb: {
            async deleteConversation() { calls.push('delete-conversation'); },
            async getDocuments() { return []; },
            async deleteFolder() { calls.push('delete-folder'); return true; }
        },
        sealarcaApi: { abortCurrentRequest() { calls.push('abort'); } }
    });
    configureApi(app);
    app.loadConversations = async () => { app.conversations = []; };
    app.newConversation = async () => { app.activeConversationId = null; };
    app.loadFolders = async () => { app.folders = [{ id: 'next' }, { id: 'other' }]; };
    app.selectFolder = async id => { calls.push(`select:${id}`); app.activeFolderId = id; };
    app.folders = [{ id: 'active' }, { id: 'other' }];

    let finishStream;
    const startPendingStream = () => {
        app.isStreaming = true;
        const promise = new Promise(resolve => { finishStream = () => { app.isStreaming = false; resolve(); }; });
        app.activeStreamPromise = promise;
    };

    startPendingStream();
    const deletingConversation = app.deleteConversation('conversation');
    await Promise.resolve();
    assert.deepEqual(calls, ['abort']);
    finishStream();
    await deletingConversation;
    assert.ok(calls.indexOf('delete-conversation') > calls.indexOf('abort'));

    calls.length = 0;
    app.activeFolderId = 'active';
    app.folders = [{ id: 'active' }, { id: 'other' }];
    app.activeConversationId = null;
    startPendingStream();
    const deletingFolder = app.deleteFolder('active');
    await Promise.resolve();
    assert.deepEqual(calls, ['abort']);
    finishStream();
    await deletingFolder;
    assert.ok(calls.indexOf('delete-folder') > calls.indexOf('abort'));
    assert.ok(calls.includes('select:next'));
});

test('la suppression document/dossier annule immédiatement les traitements actifs ciblés', async () => {
    const queueCalls = [];
    const dbCalls = [];
    const order = [];
    const { app } = loadApp({
        sealarcaDb: {
            async deleteDocument(id) { dbCalls.push(`delete-document:${id}`); order.push(`delete-document:${id}`); },
            async getDocuments(folderId) {
                dbCalls.push(`get-documents:${folderId}`);
                return [{ id: 'doc-in-folder', folderId }];
            },
            async deleteFolder(id) { dbCalls.push(`delete-folder:${id}`); order.push(`delete-folder:${id}`); return true; }
        }
    });
    app.t = key => key;
    app.loadDocuments = async () => {};
    app.loadFolders = async () => { app.folders = [{ id: 'next' }]; };
    app.selectFolder = async id => { app.activeFolderId = id; };
    app.selectedDocumentIds = ['doc-x'];
    app.folders = [{ id: 'folder-x' }, { id: 'next' }];
    app.p1Queue = {
        abortJobsForDocument(id, reason) { queueCalls.push(`abort-document:${id}:${reason}`); order.push(`abort-document:${id}`); return [id]; },
        abortJobsForFolder(id, reason) { queueCalls.push(`abort-folder:${id}:${reason}`); order.push(`abort-folder:${id}`); return [id]; },
        abortJobsForDocuments(ids, reason) { queueCalls.push(`abort-documents:${ids.join(',')}:${reason}`); return ids; }
    };
    await app.deleteDocument('doc-x');
    assert.ok(queueCalls.includes('abort-document:doc-x:document_deleted'));
    assert.ok(dbCalls.includes('delete-document:doc-x'));
    assert.ok(order.indexOf('abort-document:doc-x') < order.indexOf('delete-document:doc-x'));

    queueCalls.length = 0;
    dbCalls.length = 0;
    order.length = 0;
    await app.deleteFolder('folder-x');
    assert.ok(queueCalls.includes('abort-folder:folder-x:folder_deleted'));
    assert.ok(queueCalls.some(call => call.startsWith('abort-documents:doc-in-folder')));
    assert.ok(dbCalls.includes('delete-folder:folder-x'));
    assert.ok(order.indexOf('abort-folder:folder-x') < order.indexOf('delete-folder:folder-x'));
});
