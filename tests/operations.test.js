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

test('coverage traces whitelist counters and discard document text', () => {
    const operations = loadOperations();
    const coverage = { status: 'partial', totalCharacters: 200000, sentCharacters: 120000, totalSources: 200, representedSources: 100,
        cutSourceIds: ['p1'], reasons: ['character_limit'], markdown: 'SECRET', summary: 'SECRET' };
    const trace = operations.createTrace({ folderId: 'folder', manifest: { documents: [{ id: 'document', coverage }] } });
    assert.equal(trace.documents[0].coverage.sentCharacters, 120000);
    assert.doesNotMatch(JSON.stringify(trace), /SECRET|markdown|summary/);
    coverage.sentCharacters = 1; assert.equal(trace.documents[0].coverage.sentCharacters, 120000);
});

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

test('historical traces snapshot nested notices, locators and operation events without lease credentials', () => {
    const operations = loadOperations();
    const operation = operations.createOperation('timeline', 'folder');
    operation.status = 'completed';
    operation.leaseToken = 'SECRET LEASE';
    operation.steps[0].detail = { counters: { documents: 2 } };
    const notice = operations.createNotice('document_extraction_partial', 'partial', { metadata: { warnings: [{ code: 'rows', used: 100 }] } });
    const locator = { type: 'table', range: { firstRow: 1, lastRow: 100 } };
    const trace = operations.createTrace({ folderId: 'folder', operation, notices: [notice], manifest: { sources: [{ documentId: 'doc', locator }] } });
    operation.steps[0].detail.counters.documents = 9;
    operation.status = 'failed';
    notice.metadata.warnings[0].used = 0;
    locator.range.lastRow = 999;
    assert.equal(trace.operation.status, 'completed');
    assert.equal(trace.operation.steps[0].detail.counters.documents, 2);
    assert.equal(trace.notices[0].metadata.warnings[0].used, 100);
    assert.equal(trace.sources[0].locator.range.lastRow, 100);
    assert.doesNotMatch(JSON.stringify(trace), /SECRET LEASE|leaseToken|leaseOwner/);
});
