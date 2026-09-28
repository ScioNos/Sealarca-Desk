const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { IDBFactory, IDBKeyRange } = require('fake-indexeddb');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('IndexedDB v5 conserve les stores, synchronise les modes et migre les jobs v4', () => {
    const db = read('js/db.js');
    assert.match(db, /const DB_VERSION = 5/);
    assert.match(db, /createObjectStore\('folders'/);
    assert.match(db, /createObjectStore\('documents'/);
    assert.match(db, /createObjectStore\('documentChunks'/);
    assert.match(db, /createObjectStore\('documentProfiles'/);
    assert.match(db, /createObjectStore\('processingJobs'/);
    assert.match(db, /recoverInterruptedJobs\(\)/);
    assert.match(db, /recovered_after_v4/);
    assert.match(db, /leaseExpiresAt/);
    assert.match(db, /SYSTEM_ROLE_VERSION = 2/);
    assert.match(db, /role-document-analysis/);
    assert.match(db, /mergeSystemRoles/);
    assert.match(db, /createIndex\('folderId', 'folderId'/);
    assert.match(db, /if \(!conversation\.folderId\)/);
    assert.match(db, /conversation\.folderId = DEFAULT_FOLDER_ID/);
    assert.doesNotMatch(db, /deleteObjectStore/);
});

function loadDb(factory) {
    const context = { window: {}, indexedDB: factory, IDBKeyRange, console };
    vm.createContext(context);
    vm.runInContext(read('js/db.js'), context, { filename: 'db.js' });
    return context.window.sealarcaDb;
}

function createLegacyV4(factory, seed = {}) {
    return new Promise((resolve, reject) => {
        const request = factory.open('sealarca_desk_db', 4);
        request.onupgradeneeded = () => {
            const db = request.result;
            const folders = db.createObjectStore('folders', { keyPath: 'id' });
            folders.createIndex('updatedAt', 'updatedAt');
            folders.createIndex('name', 'name');
            const conversations = db.createObjectStore('conversations', { keyPath: 'id' });
            conversations.createIndex('updatedAt', 'updatedAt');
            conversations.createIndex('createdAt', 'createdAt');
            conversations.createIndex('folderId', 'folderId');
            const messages = db.createObjectStore('messages', { keyPath: 'id' });
            messages.createIndex('conversationId', 'conversationId');
            messages.createIndex('createdAt', 'createdAt');
            db.createObjectStore('settings', { keyPath: 'key' });
            db.createObjectStore('roles', { keyPath: 'id' });
            const documents = db.createObjectStore('documents', { keyPath: 'id' });
            documents.createIndex('folderId', 'folderId');
            documents.createIndex('updatedAt', 'updatedAt');
            documents.createIndex('hash', 'hash');
            const chunks = db.createObjectStore('documentChunks', { keyPath: 'id' });
            chunks.createIndex('documentId', 'documentId');
            chunks.createIndex('folderId', 'folderId');
            const profiles = db.createObjectStore('documentProfiles', { keyPath: 'documentId' });
            profiles.createIndex('folderId', 'folderId');
            profiles.createIndex('inputFingerprint', 'inputFingerprint');
            profiles.createIndex('status', 'status');
            profiles.createIndex('updatedAt', 'updatedAt');
            const jobs = db.createObjectStore('processingJobs', { keyPath: 'id' });
            jobs.createIndex('folderId', 'folderId');
            jobs.createIndex('documentId', 'documentId');
            jobs.createIndex('status', 'status');
            jobs.createIndex('nextRunAt', 'nextRunAt');
            jobs.createIndex('inputFingerprint', 'inputFingerprint');
            for (const [storeName, rows] of Object.entries(seed)) {
                for (const row of rows) request.transaction.objectStore(storeName).put(row);
            }
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => { request.result.close(); resolve(); };
    });
}

async function readyDb(factory = new IDBFactory()) {
    const db = loadDb(factory);
    await db.init();
    return db;
}

test('snapshot IndexedDB round-trip keeps workspace data but excludes API key material', async () => {
    const source = await readyDb(new IDBFactory());
    const conversation = {
        id: 'conv_snapshot', folderId: 'folder_default', title: 'Snapshot', createdAt: 1, updatedAt: 1
    };
    await source.saveConversation(conversation, { allowCreate: true });
    await source.saveMessage({ id: 'msg_snapshot', conversationId: conversation.id, role: 'user', content: 'persisted', createdAt: 2 });
    await source.setSetting('language', 'fr');
    await source.setSetting('sealarca_api_key', 'legacy-secret');

    const snapshot = await source.exportAllData();
    assert.equal(snapshot.messages[conversation.id][0].content, 'persisted');
    assert.equal(snapshot.settings.some(entry => entry.key === 'sealarca_api_key'), false);
    snapshot.settings.push({ key: 'sealarca_api_key', value: 'untrusted-secret' });

    const target = await readyDb(new IDBFactory());
    await target.setSetting('sealarca_api_key', 'stale-secret');
    await target.importData(snapshot);
    assert.equal((await target.getMessages(conversation.id))[0].content, 'persisted');
    assert.equal(await target.getSetting('language'), 'fr');
    assert.equal(await target.getSetting('sealarca_api_key'), null);
});

test('migration v4→v5 conserve toutes les données existantes et rend les jobs legacy reprenables', async () => {
    const factory = new IDBFactory();
    const stamp = Date.now();
    await createLegacyV4(factory, {
        folders: [{ id: 'folder_archive', name: 'Archive', createdAt: stamp, updatedAt: stamp }],
        conversations: [{ id: 'conversation_legacy', folderId: 'folder_archive', title: 'Historique', createdAt: stamp, updatedAt: stamp }],
        messages: [{ id: 'message_legacy', conversationId: 'conversation_legacy', role: 'user', content: 'Préservé', createdAt: stamp }],
        settings: [{ key: 'legacy_theme', value: 'dark' }],
        roles: [{ id: 'custom_role', kind: 'custom', name: 'Mon rôle' }],
        documents: [{ id: 'document_legacy', folderId: 'folder_archive', name: 'legacy.txt', markdown: 'Préservé' }],
        documentProfiles: [{ documentId: 'document_legacy', folderId: 'folder_archive', status: 'valid', summary: 'Fiche existante' }],
        processingJobs: [
            { id: 'job_pending', documentId: 'document_legacy', folderId: 'folder_archive', status: 'pending', checkpoint: { stage: 'queued' } },
            { id: 'job_running', documentId: 'document_legacy', folderId: 'folder_archive', status: 'running', attempts: 2, checkpoint: { stage: 'request_started' } }
        ]
    });
    const db = loadDb(factory);
    await db.init();
    assert.equal((await db.getConversation('conversation_legacy')).title, 'Historique');
    assert.equal((await db.getMessages('conversation_legacy'))[0].content, 'Préservé');
    assert.equal(await db.getSetting('legacy_theme'), 'dark');
    assert.equal((await db.getRoles()).some(role => role.id === 'custom_role'), true);
    assert.equal((await db.getDocument('document_legacy')).markdown, 'Préservé');
    assert.equal((await db.getDocumentProfile('document_legacy')).summary, 'Fiche existante');
    assert.equal((await db.getProcessingJob('job_pending')).checkpoint.stage, 'queued');
    const recovered = await db.getProcessingJob('job_running');
    assert.equal(recovered.status, 'pending');
    assert.equal(recovered.checkpoint.stage, 'recovered_after_v4');
    assert.equal(recovered.leaseOwner, null);
    assert.equal(recovered.nextRunAt <= Date.now(), true);
});

test('deux onglets ne dédupliquent pas en double et ne réclament pas le même job', async () => {
    const factory = new IDBFactory();
    const first = await readyDb(factory);
    const second = loadDb(factory);
    await second.init();
    await first.saveFolder({ id: 'folder_queue', name: 'Queue' });
    const document = { id: 'doc_queue', folderId: 'folder_queue', name: 'queue.txt', markdown: 'Texte' };
    await first.saveDocument(document);
    const request = { type: 'document-profile', documentId: document.id, folderId: document.folderId, inputFingerprint: 'same' };
    const [left, right] = await Promise.all([first.enqueueProcessingJob(request), second.enqueueProcessingJob(request)]);
    assert.equal(left.id, right.id);
    assert.equal((await first.getProcessingJobs()).length, 1);
    const now = Date.now();
    const claims = await Promise.all([
        first.claimRunnableProcessingJobs(now, 2, 'tab-a', 180000),
        second.claimRunnableProcessingJobs(now, 2, 'tab-b', 180000)
    ]);
    assert.equal(claims[0].length + claims[1].length, 1);
    const [claimed] = claims[0].concat(claims[1]);
    assert.equal(claimed.status, 'running');
    assert.equal(claimed.leaseExpiresAt, now + 180000);
    assert.equal(await first.renewProcessingJobLease(claimed.id, 'other-tab', claimed.leaseToken), false);
    assert.equal(await first.renewProcessingJobLease(claimed.id, claimed.leaseOwner, claimed.leaseToken), true);
});

test('la reprise ne récupère que les baux expirés', async () => {
    const db = await readyDb();
    await db.saveFolder({ id: 'folder_jobs', name: 'Jobs' });
    await db.saveDocument({ id: 'doc_jobs', folderId: 'folder_jobs', name: 'jobs.txt', markdown: 'Texte' });
    const now = Date.now();
    await db.saveProcessingJob({ id: 'live', documentId: 'doc_jobs', status: 'running', leaseOwner: 'tab', leaseToken: 'live-token', leaseExpiresAt: now + 180000 });
    await db.saveProcessingJob({ id: 'expired', documentId: 'doc_jobs', status: 'running', leaseOwner: 'tab-old', leaseToken: 'expired-token', leaseExpiresAt: now - 1 });
    assert.equal(await db.recoverInterruptedJobs(), 1);
    assert.equal((await db.getProcessingJob('live')).status, 'running');
    assert.equal((await db.getProcessingJob('expired')).status, 'pending');
});

test('suppression de document pendant un job empêche fiche tardive et job orphelin', async () => {
    const db = await readyDb();
    await db.saveFolder({ id: 'folder_job_delete', name: 'Jobs' });
    const document = { id: 'doc_job_delete', folderId: 'folder_job_delete', name: 'delete.txt', markdown: 'Texte' };
    await db.saveDocument(document);
    const job = await db.enqueueProcessingJob({ type: 'document-profile', documentId: document.id, folderId: document.folderId, inputFingerprint: 'fingerprint' });
    const [claimed] = await db.claimRunnableProcessingJobs(Date.now(), 1, 'worker-a');
    assert.equal(claimed.id, job.id);
    await db.deleteDocument(document.id);
    assert.equal(await db.saveDocumentProfileIfJobOwner({ documentId: document.id, folderId: document.folderId, summary: 'tardive' }, job.id, 'worker-a', claimed.leaseToken), false);
    assert.equal(await db.getDocumentProfile(document.id), null);
    assert.equal(await db.getProcessingJob(job.id), null);
    await assert.rejects(db.enqueueProcessingJob({ type: 'document-profile', documentId: document.id, inputFingerprint: 'new' }), /document associé.*n’existe plus/i);
});

test('suppression de dossier supprime ses enfants dans la même base sans résidus', async () => {
    const db = await readyDb();
    await db.saveFolder({ id: 'folder_cascade', name: 'À supprimer' });
    await db.saveConversation({ id: 'conversation_cascade', folderId: 'folder_cascade', title: 'Enfant' }, { allowCreate: true });
    await db.saveMessage({ id: 'message_cascade', conversationId: 'conversation_cascade', role: 'user', content: 'x' });
    await db.saveDocument({ id: 'document_cascade', folderId: 'folder_cascade', name: 'cascade.txt', markdown: 'Texte' });
    await db.saveDocumentProfile({ documentId: 'document_cascade', folderId: 'folder_cascade', summary: 'Fiche' });
    await db._request('documentChunks', 'readwrite', store => store.put({ id: 'chunk_cascade', documentId: 'document_cascade', folderId: 'folder_cascade', text: 'Texte' }));
    await db.saveProcessingJob({ id: 'job_cascade', documentId: 'document_cascade', folderId: 'folder_cascade', type: 'document-profile' });

    assert.equal(await db.deleteFolder('folder_cascade'), true);
    assert.equal(await db.getFolder('folder_cascade'), null);
    assert.equal(await db.getConversation('conversation_cascade'), null);
    assert.equal(await db.getMessages('conversation_cascade').then(messages => messages.length), 0);
    assert.equal(await db.getDocument('document_cascade'), null);
    assert.equal(await db.getDocumentProfile('document_cascade'), null);
    assert.equal((await db.getDocumentChunks('document_cascade')).length, 0);
    assert.equal(await db.getProcessingJob('job_cascade'), null);
});

test('versionchange ferme et invalide la connexion IndexedDB détenue par l’instance', async () => {
    const factory = new IDBFactory();
    const db = await readyDb(factory);
    const oldConnection = db.db;
    await new Promise((resolve, reject) => {
        const request = factory.open('sealarca_desk_db', 6);
        request.onsuccess = () => { request.result.close(); resolve(); };
        request.onerror = () => reject(request.error);
    });
    assert.equal(db.db, null);
    assert.equal(db.initPromise, null);
    await assert.rejects(db.init(), /Rechargez Sealarca-Desk/);
    assert.throws(() => oldConnection.transaction('folders', 'readonly'), /InvalidStateError|not allowed/i);
});

test('les écritures refusent les références orphelines et les collisions de messages', async () => {
    const db = await readyDb();
    await assert.rejects(db.saveConversation({ id: 'orphan-conversation', folderId: 'missing-folder' }), /dossier de cette conversation/i);
    await assert.rejects(db.saveDocument({ id: 'orphan-document', folderId: 'missing-folder' }), /dossier de ce document/i);
    await assert.rejects(db.saveMessage({ id: 'orphan-message', conversationId: 'missing-conversation', role: 'user', content: 'x' }), /conversation.*n’existe plus/i);
    await assert.rejects(db.saveDocumentProfile({ documentId: 'missing-document', summary: 'x' }), /document associé/i);
    await assert.rejects(db.saveProcessingJob({ id: 'orphan-job', documentId: 'missing-document', type: 'document-profile' }), /document associé/i);

    await db.saveConversation({ id: 'collision-conversation', folderId: 'folder_default', title: 'Collision' }, { allowCreate: true });
    await db.saveMessage({ id: 'message_unique', conversationId: 'collision-conversation', role: 'user', content: 'original' });
    await assert.rejects(db.saveMessage({ id: 'message_unique', conversationId: 'collision-conversation', role: 'assistant', content: 'remplacement' }));
    assert.equal((await db.getMessages('collision-conversation'))[0].content, 'original');
});


test('la normalisation Markdown recalcule des offsets sourceMap exacts', () => {
    const vm = require('node:vm');
    const context = { window: {}, console };
    vm.createContext(context);
    vm.runInContext(read('js/doc-handler.js'), context, { filename: 'doc-handler.js' });
    const handler = context.window.sealarcaDocHandler;
    const parsed = { markdown: '# Titre\n\n\n\nSection A   \n\n', sourceMap: [] };
    handler._appendSection(parsed, 'Section B   \n\nTexte', { type: 'text-line-range', startLine: 4, endLine: 6 }, 'Lignes 4–6');
    const normalized = handler._normalizeParsedDocument(parsed);
    const source = normalized.sourceMap[0];
    assert.equal(normalized.markdown.slice(source.markdownStart, source.markdownEnd), 'Section B\n\nTexte');
    assert.equal(Object.hasOwn(source, '_sourceMarkdown'), false);
});

test('une extraction textuelle vide est refusée avant la persistance', async () => {
    const vm = require('node:vm');
    const context = { window: {}, console };
    vm.createContext(context);
    vm.runInContext(read('js/doc-handler.js'), context, { filename: 'doc-handler.js' });
    const handler = context.window.sealarcaDocHandler;
    const parsed = await handler._parseText({ text: async () => ' \n\n ' }, 'txt');
    assert.equal(parsed.markdown, '');
    assert.equal(parsed.sourceMap.length, 0);
});

test('les documents persistants gardent Markdown, original, hash et sourceMap', () => {
    const handler = read('js/doc-handler.js');
    const db = read('js/db.js');
    assert.match(handler, /canonicalFormat: 'markdown'/);
    assert.match(handler, /sourceMapVersion: 1/);
    assert.match(handler, /markdown,/);
    assert.match(handler, /sourceFile:/);
    assert.match(handler, /hashAlgorithm: hash \? 'SHA-256'/);
    assert.match(handler, /sourceMap/);
    assert.match(handler, /type: 'pdf-page'/);
    assert.match(handler, /type: 'presentation-slide'/);
    assert.match(handler, /type: 'spreadsheet-range'/);
    assert.match(handler, /sheet: sheetName, range/);
    assert.match(handler, /type: 'text-line-range'/);
    assert.match(db, /canonicalFormat: 'markdown'/);
    assert.match(db, /sourceMapVersion/);
    assert.match(db, /chunks: \{ status: 'not_generated', source: 'markdown' \}/);
    assert.match(db, /derivedFrom: 'markdown'/);
    assert.match(db, /tx\.onabort = \(\) => reject\(tx\.error \|\| new Error\('Suppression du document annulée\.'\)\)/);
    assert.match(db, /this\.initPromise = initPromise\.catch/);
});

test('le contexte IA sépare historique et documents sélectionnés', () => {
    const app = read('js/app.js');
    assert.match(app, /buildConversationHistory\(\)/);
    assert.match(app, /getDocumentsByIds\(requestedIds\)/);
    assert.match(app, /selectRelevantDocuments\(folderDocuments, text/);
    assert.match(app, /getDocuments\(folderId\)/);
    assert.match(app, /contextSelection: \{/);
    assert.match(app, /mode: this\.contextMode === 'automatic' \? 'automatic' : 'manual'/);
    assert.match(app, /buildDocumentContext\(selectedDocuments, text, this\.contextMode\)/);
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


test('P1 persiste fiches, jobs, reprise et export sans remplacer le Markdown canonique', () => {
    const db = read('js/db.js');
    const app = read('js/app.js');
    const html = read('index.html');
    assert.match(db, /getDocumentProfile\(documentId\)/);
    assert.match(db, /saveDocumentProfile\(profile\)/);
    assert.match(db, /enqueueProcessingJob\(job\)/);
    assert.match(db, /status: 'pending'/);
    assert.match(db, /\['pending', 'running', 'completed', 'failed', 'cancelled'\]/);
    assert.match(app, /exportFolderOverviewMarkdown\(\)/);
    assert.match(app, /link\.download = 'index\.md'/);
    assert.match(html, /x-text="documentsOverviewDescription"/);
    assert.doesNotMatch(app, /saveDocument\([^)]*index\.md/);
});

test('l’interface P1 expose vue dossier, recherche, queue et modes de contexte', () => {
    const html = read('index.html');
    assert.match(html, /x-text="documentsOverviewTab"/);
    assert.match(html, /x-text="documentsSearchTab"/);
    assert.match(html, /x-text="documentsQueueTitle"/);
    assert.match(html, /x-text="documentsAutomaticMode"/);
    assert.match(html, /x-text="documentsGenerateMissing"/);
    assert.match(html, /js\/p1\.js\?v=1\.1\.0/);
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


test('la release cumulative utilise la version 1.1.0 et conserve les versions précédentes', () => {
    const pkg = JSON.parse(read('package.json'));
    const changelog = read('CHANGELOG.md');
    const notes = read('RELEASE_NOTES.md');
    const html = read('index.html');
    const buildScript = read('scripts/build-release.ps1');
    const forbiddenDevelopmentVersion = ['1', '1', '0-dev'].join('.');

    assert.equal(pkg.version, '1.1.0');
    assert.ok(changelog.includes('## [1.0.0] - 2026-08-29')); 
    assert.ok(changelog.includes('## [1.0.1] - 2026-08-31'));
    assert.ok(changelog.includes('## [1.0.3] - 2026-09-05'));
    assert.ok(changelog.includes('## [1.0.2] - 2026-08-31'));
    assert.ok(changelog.includes('## [1.0.4] - 2026-09-19'));
    assert.ok(changelog.includes('## [1.1.0] - 2026-09-28'));
    assert.match(changelog, /First Official Release/i);
    assert.doesNotMatch(changelog, /changed from MIT/i);
    assert.ok(notes.startsWith('# Sealarca Desk v1.1.0'));
    assert.match(notes, /IndexedDB from v4 to v5/i);
    assert.ok(notes.includes('Sealarca-Desk-v1.1.0.zip'));
    assert.ok(buildScript.includes("[string]$Version = '1.1.0'"));
    assert.ok(html.includes('js/app.js?v=1.1.0'));

    for (const contents of [changelog, notes, html, buildScript, JSON.stringify(pkg)]) {
        assert.equal(contents.includes(forbiddenDevelopmentVersion), false);
        assert.equal(contents.includes(`v${forbiddenDevelopmentVersion}`), false);
    }
});
