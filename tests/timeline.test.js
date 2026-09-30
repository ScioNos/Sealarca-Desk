const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'timeline.js'), 'utf8');

function loadTimeline() {
    const context = {
        window: {
            SealarcaP1: {
                sourceReference(document, item) { return `${document.name} — page ${item.locator?.page || '?'}`; }
            }
        },
        console
    };
    vm.createContext(context);
    vm.runInContext(source, context, { filename: 'timeline.js' });
    return context.window.SealarcaTimeline;
}

test('dossier timeline groups equivalent events and keeps source locations', () => {
    const timeline = loadTimeline();
    const documents = [
        { id: 'doc-a', name: 'one.pdf', sourceMap: [{ id: 'p1', locator: { type: 'pdf-page', page: 1 } }] },
        { id: 'doc-b', name: 'two.pdf', sourceMap: [{ id: 'p2', locator: { type: 'pdf-page', page: 3 } }] }
    ];
    const profiles = documents.map((document, index) => ({
        status: 'valid', documentId: document.id,
        importantDates: [{ date: '2025-01-14', label: 'Notice deadline', sourceIds: [index ? 'p2' : 'p1'] }],
        importantAmounts: [{ amount: 'CHF 12,000', sourceIds: [index ? 'p2' : 'p1'] }],
        obligations: [{ label: 'Notice deadline', deadline: '2025-01-14', sourceIds: [index ? 'p2' : 'p1'] }]
    }));
    const model = timeline.buildDossierModel(profiles, documents);
    assert.equal(model.analyzedDocumentCount, 2);
    assert.equal(model.timeline.length, 1);
    assert.equal(model.timeline[0].sources.length, 2);
    assert.equal(model.timeline[0].sources[1].reference, 'two.pdf — page 3');
    assert.equal(model.entities.amounts[0].name, 'CHF 12,000');
    assert.equal(model.entities.amounts[0].sources.length, 2);
    assert.equal(model.entities.obligations[0].name, 'Notice deadline');
});

test('comparisons mark differing extracted values as apparent and unverified', () => {
    const timeline = loadTimeline();
    const documents = [
        { id: 'a', name: 'a.pdf', sourceMap: [{ id: 'pa', locator: { page: 1 } }] },
        { id: 'b', name: 'b.pdf', sourceMap: [{ id: 'pb', locator: { page: 2 } }] }
    ];
    const profiles = [
        { status: 'valid', documentId: 'a', importantDates: [{ label: 'Payment date', date: '2025-02-01', sourceIds: ['pa'] }] },
        { status: 'valid', documentId: 'b', importantDates: [{ label: 'Payment date', date: '2025-03-01', sourceIds: ['pb'] }] }
    ];
    const result = timeline.buildComparison(profiles, documents);
    assert.equal(result.comparisons.length, 1);
    assert.equal(result.divergences[0].verified, false);
    assert.equal(result.divergences[0].type, 'apparent_difference');
    assert.equal(result.divergences[0].values.length, 2);
    assert.equal(result.divergences[0].values[0].documents[0].sourceId, 'pa');
});

test('chronology orders Swiss day-month dates and retains each event source', () => {
    const timeline = loadTimeline();
    const document = {
        id: 'contract', name: 'contract.pdf',
        sourceMap: [
            { id: 'page-1', locator: { type: 'pdf-page', page: 1 } },
            { id: 'page-4', locator: { type: 'pdf-page', page: 4 } }
        ]
    };
    const result = timeline.buildDossierModel([{
        status: 'valid', documentId: 'contract',
        importantDates: [
            { date: '12.02.2026', label: 'Contract signed', sourceIds: ['page-4'] },
            { date: '01.01.2025', label: 'Notice received', sourceIds: ['page-1'] }
        ]
    }], [document]);
    assert.deepEqual(Array.from(result.timeline, item => item.label), ['Notice received', 'Contract signed']);
    assert.equal(result.timeline[1].sources[0].locator.page, 4);
});

test('comparisons group amount values by a shared extracted label', () => {
    const timeline = loadTimeline();
    const documents = [
        { id: 'a', name: 'a.pdf', sourceMap: [{ id: 'pa', locator: { page: 1 } }] },
        { id: 'b', name: 'b.pdf', sourceMap: [{ id: 'pb', locator: { page: 2 } }] }
    ];
    const result = timeline.buildComparison([
        { status: 'valid', documentId: 'a', importantAmounts: [{ label: 'Invoice total', amount: 'CHF 100', sourceIds: ['pa'] }] },
        { status: 'valid', documentId: 'b', importantAmounts: [{ label: 'Invoice total', amount: 'CHF 110', sourceIds: ['pb'] }] }
    ], documents);
    assert.equal(result.divergences.length, 1);
    assert.equal(result.divergences[0].field, 'amount');
    assert.equal(result.divergences[0].values.length, 2);
});

test('dossier summaries consolidate profile coverage, extracted facts, and parties shared across documents', () => {
    const timeline = loadTimeline();
    const documents = [
        { id: 'a', name: 'a.pdf', sourceMap: [{ id: 'pa', locator: { page: 1 } }] },
        { id: 'b', name: 'b.pdf', sourceMap: [{ id: 'pb', locator: { page: 2 } }] },
        { id: 'c', name: 'c.pdf', sourceMap: [] }
    ];
    const profiles = [
        { status: 'valid', documentId: 'a', people: ['Ada Lovelace'], organizations: ['Example SA'], entities: [{ kind: 'person', name: 'Ada Lovelace', sourceIds: ['pa'] }, { kind: 'organization', name: 'Example SA', sourceIds: ['pa'] }], importantDates: [{ label: 'Payment', date: '2025-02-01', sourceIds: ['pa'] }], importantAmounts: [{ amount: 'CHF 100', sourceIds: ['pa'] }], events: [{ date: '2025-01-01', label: 'Agreement signed', sourceIds: ['pa'] }] },
        { status: 'valid', documentId: 'b', people: ['ada lovelace'], organizations: ['Example SA'], entities: [{ kind: 'person', name: 'ada lovelace', sourceIds: ['pb'] }, { kind: 'organization', name: 'Example SA', sourceIds: ['pb'] }], importantDates: [{ label: 'Payment', date: '2025-03-01', sourceIds: ['pb'] }], obligations: [{ label: 'Send notice', deadline: '2025-04-01', sourceIds: ['pb'] }], events: [{ date: '2025-01-01', label: 'Agreement signed', sourceIds: ['pb'] }] },
        { status: 'stale', documentId: 'c', people: ['Ignored'], summary: 'stale' }
    ];
    const summary = timeline.buildDossierSummary(profiles, documents);
    assert.equal(summary.documentCount, 3);
    assert.equal(summary.analyzedDocumentCount, 2);
    assert.equal(summary.eventCount, 4);
    assert.equal(summary.personCount, 1);
    assert.equal(summary.organizationCount, 1);
    assert.equal(summary.amountCount, 1);
    assert.equal(summary.obligationCount, 1);
    assert.equal(summary.apparentDifferenceCount, 1);
    assert.deepEqual(Array.from(summary.sharedParties, item => item.name), ['Ada Lovelace', 'Example SA']);
    assert.deepEqual(Array.from(summary.sharedParties[0].documentNames), ['a.pdf', 'b.pdf']);
    assert.deepEqual(Array.from(summary.sharedParties[0].sources, item => item.locator.page), [1, 2]);
});
