const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const apiSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'api.js'), 'utf8');

function loadApi(fetchImpl) {
    const context = {
        window: {},
        fetch: fetchImpl,
        AbortController,
        TextDecoder,
        setTimeout,
        clearTimeout,
        console: { log() {}, warn() {}, error() {} }
    };
    vm.createContext(context);
    vm.runInContext(apiSource, context, { filename: 'api.js' });
    return context.window.sealarcaApi;
}

function responseFromSse(events) {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
        start(controller) {
            controller.enqueue(encoder.encode(events.map(event => `data: ${JSON.stringify(event)}\n\n`).join('')));
            controller.close();
        }
    });
    return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

function responseFromRawSse(raw) {
    const body = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(raw)); controller.close(); } });
    return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

test('fetchModels normalise, déduplique et trie les modèles', async () => {
    const api = loadApi(async (url, options) => {
        assert.equal(url, 'https://sealarca.ch/v1/models');
        assert.equal(options.headers.Authorization, 'Bearer secret');
        return new Response(JSON.stringify({ data: [
            { id: 'z-model', owned_by: 'test' },
            'a-model',
            { id: 'z-model' },
            { name: '' }
        ] }), { status: 200, headers: { 'content-type': 'application/json' } });
    });

    const models = await api.fetchModels(' secret ');
    assert.deepEqual(models.map(model => model.id), ['a-model', 'z-model']);
});

test('fetchModels refuse une liste vide au lieu d’inventer un modèle', async () => {
    const api = loadApi(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }));
    await assert.rejects(() => api.fetchModels('secret'), /Aucun modèle/);
});

test('streamResponse utilise /responses et consomme les événements typés', async () => {
    let request;
    const api = loadApi(async (url, options) => {
        request = { url, options, body: JSON.parse(options.body) };
        return responseFromSse([
            { type: 'response.created' },
            { type: 'response.reasoning_summary_text.delta', delta: 'analyse' },
            { type: 'response.output_text.delta', delta: 'Bon' },
            { type: 'response.output_text.delta', delta: 'jour' },
            { type: 'response.completed', response: { id: 'resp_1' } }
        ]);
    });

    const chunks = [];
    const result = await new Promise((resolve, reject) => {
        api.streamResponse({
            apiKey: 'secret',
            model: 'model-a',
            messages: [{ role: 'user', content: 'Bonjour' }],
            instructions: 'Réponds brièvement.',
            onChunk: event => chunks.push(event),
            onError: reject,
            onDone: (text, reasoning, meta) => resolve({ text, reasoning, meta })
        });
    });

    assert.equal(request.url, 'https://sealarca.ch/v1/responses');
    assert.deepEqual(request.body, {
        model: 'model-a',
        input: [{ role: 'user', content: 'Bonjour' }],
        stream: true,
        store: false,
        instructions: 'Réponds brièvement.'
    });
    assert.equal(result.text, 'Bonjour');
    assert.equal(result.reasoning, 'analyse');
    assert.equal(result.meta.interrupted, false);
    assert.equal(chunks.length, 3);
});

test('un flux SSE fermé sans response.completed garde le partiel et le marque interrompu', async () => {
    const raw = [
        `data: ${JSON.stringify({ type: 'response.output_text.delta', delta: 'Partiel' })}`,
        `data: ${JSON.stringify({ type: 'response.reasoning_summary_text.delta', delta: 'raisonnement' })}`,
        'data: [DONE]'
    ].join('\n');
    const api = loadApi(async () => responseFromRawSse(raw));
    const result = await new Promise((resolve, reject) => api.streamResponse({
        apiKey: 'secret', model: 'model-a', messages: [{ role: 'user', content: 'Question' }],
        onError: reject,
        onDone: (text, reasoning, meta) => resolve({ text, reasoning, meta })
    }));
    assert.equal(result.text, 'Partiel');
    assert.equal(result.reasoning, 'raisonnement');
    assert.equal(result.meta.interrupted, true);
    assert.equal(result.meta.reason, 'eof_without_completion');
});

test('response.completed reste un succès quand il arrive sans saut de ligne final', async () => {
    const raw = `data: ${JSON.stringify({ type: 'response.output_text.delta', delta: 'Complet' })}\n\n` +
        `data: ${JSON.stringify({ type: 'response.completed', response: { id: 'finished' } })}`;
    const api = loadApi(async () => responseFromRawSse(raw));
    const result = await new Promise((resolve, reject) => api.streamResponse({
        apiKey: 'secret', model: 'model-a', messages: [{ role: 'user', content: 'Question' }],
        onError: reject,
        onDone: (text, reasoning, meta) => resolve({ text, reasoning, meta })
    }));
    assert.equal(result.text, 'Complet');
    assert.equal(result.meta.interrupted, false);
    assert.equal(result.meta.response.id, 'finished');
});

test('les erreurs HTTP ne divulguent pas la clé et sont remontées', async () => {
    const api = loadApi(async () => new Response(JSON.stringify({ error: { message: 'Non autorisé' } }), { status: 401 }));
    let received;
    await api.streamResponse({
        apiKey: 'very-secret',
        model: 'model-a',
        messages: [{ role: 'user', content: 'Bonjour' }],
        onError: error => { received = error; }
    });
    assert.match(received.message, /invalide|expirée/);
    assert.doesNotMatch(received.message, /very-secret/);
});


test('completeResponse utilise le modèle découvert et extrait le texte JSON', async () => {
    let request;
    const api = loadApi(async (url, options) => {
        request = { url, body: JSON.parse(options.body) };
        return new Response(JSON.stringify({ output: [{ content: [{ type: 'output_text', text: '{"summary":"ok"}' }] }] }), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    const result = await api.completeResponse({ apiKey: 'secret', model: 'modele-dynamique', messages: [{ role: 'user', content: 'Fiche' }] });
    assert.equal(request.url, 'https://sealarca.ch/v1/responses');
    assert.equal(request.body.model, 'modele-dynamique');
    assert.equal(request.body.stream, false);
    assert.equal(result.text, '{"summary":"ok"}');
});

test('completeResponse reprend après un HTTP 429 sans dupliquer le payload', async () => {
    let calls = 0;
    const bodies = [];
    const api = loadApi(async (url, options) => {
        calls += 1;
        bodies.push(options.body);
        if (calls === 1) return new Response(JSON.stringify({ error: { message: 'rate limit' } }), { status: 429, headers: { 'retry-after': '0' } });
        return new Response(JSON.stringify({ output_text: 'ok' }), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    const result = await api.completeResponse({ apiKey: 'secret', model: 'modele-dynamique', messages: [{ role: 'user', content: 'Fiche' }], maxRetries: 1 });
    assert.equal(calls, 2);
    assert.equal(bodies[0], bodies[1]);
    assert.equal(result.text, 'ok');
});
