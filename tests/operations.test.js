const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'operations.js'), 'utf8');

function loadOperations() {
    const context = { window: {}, console, Date, Math };
    vm.createContext(context);
    vm.runInContext(source, context, { filename: 'operations.js' });
    return context.window.SealarcaOperations;
}

test('generic operations expose bounded lifecycle steps and recoverable notices', () => {
    const operations = loadOperations();
    const operation = operations.createOperation('timeline', 'folder', ['doc-a', 'doc-a', 'doc-b'], 100);
    assert.equal(operation.status, 'pending');
    assert.deepEqual(Array.from(operation.documentIds), ['doc-a', 'doc-b']);
    assert.deepEqual(Array.from(operation.steps, step => step.id), ['prepare', 'context', 'analyze', 'save']);
    const advanced = operations.updateOperationStep(operation, 'prepare', 'completed', null, 120);
    assert.equal(advanced.progress.completed, 1);
    assert.equal(advanced.steps[0].completedAt, 120);
    assert.equal(operations.statusKey('partial'), 'dossier.status.partial');
    assert.throws(() => operations.createOperation('unknown', 'folder'), /inconnu/i);
    const notice = operations.createNotice('profiles_missing', 'partial', { metadata: { count: 2 }, recoverable: true, createdAt: 140 });
    assert.equal(notice.severity, 'partial');
    assert.equal(notice.metadata.count, 2);
    assert.equal(notice.createdAt, 140);
});

test('traces retain source metadata but never copy document or excerpt text', () => {
    const operations = loadOperations();
    const trace = operations.createTrace({
        folderId: 'folder',
        manifest: {
            mode: 'automatic', characters: 18,
            documents: [{ id: 'doc-a', name: 'contract.pdf', included: true, characterCount: 18, markdown: 'PRIVATE SOURCE TEXT' }],
            sources: [{ documentId: 'doc-a', documentName: 'contract.pdf', sourceId: 'page-1', reference: 'contract.pdf — p. 1', locator: { type: 'pdf-page', page: 1 }, excerpt: 'PRIVATE EXCERPT' }]
        },
        notices: [operations.createNotice('context_limit_reached', 'partial', { metadata: { limit: 250000 } })],
        model: 'test-model', now: 200
    });
    const serialized = JSON.stringify(trace);
    assert.equal(trace.context.documentCount, 1);
    assert.equal(trace.sources[0].locator.page, 1);
    assert.equal(trace.createdAt, 200);
    assert.doesNotMatch(serialized, /PRIVATE SOURCE TEXT|PRIVATE EXCERPT/);
});
