const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const { marked } = require('marked');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

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
    const context = { window, document, Alpine, console, setTimeout, clearTimeout };
    vm.createContext(context);
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
    assert.deepEqual(Array.from(context.citationDocuments[0].sourceMap, source => source.id), ['sent']);
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
