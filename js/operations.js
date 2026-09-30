(function (global) {
    'use strict';

    const OPERATION_STATUSES = Object.freeze(['pending', 'running', 'completed', 'partial', 'failed', 'cancelled']);
    const STEP_STATUSES = Object.freeze(['pending', 'running', 'completed', 'warning', 'failed', 'cancelled']);
    const STEP_IDS = Object.freeze(['prepare', 'context', 'analyze', 'save']);

    const OPERATION_ACTIONS = Object.freeze({
        summary: { titleKey: 'summary', promptKey: 'promptSummary' },
        timeline: { titleKey: 'timeline', promptKey: 'promptTimeline' },
        entities: { titleKey: 'entities', promptKey: 'promptEntities' },
        obligations: { titleKey: 'obligations', promptKey: 'promptObligations' },
        compare: { titleKey: 'compare', promptKey: 'promptCompare' },
        divergences: { titleKey: 'divergences', promptKey: 'promptDivergences' },
        amounts: { titleKey: 'amounts', promptKey: 'promptAmounts' }
    });

    function makeId(prefix) {
        let random = '';
        try { random = global.crypto?.randomUUID?.() || ''; } catch (_) { /* fallback */ }
        return `${prefix}_${random || `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`}`;
    }

    function createNotice(code, severity = 'warning', options = {}) {
        const accepted = ['info', 'warning', 'partial', 'error'];
        return {
            code: String(code || 'unknown_notice'),
            severity: accepted.includes(severity) ? severity : 'warning',
            documentId: options.documentId || null,
            recoverable: options.recoverable !== false,
            metadata: options.metadata && typeof options.metadata === 'object' ? { ...options.metadata } : {},
            createdAt: Number(options.createdAt) || Date.now()
        };
    }

    function createOperation(type, folderId, documentIds = [], now = Date.now()) {
        if (!OPERATION_ACTIONS[type]) throw new Error('Type d’opération inconnu.');
        if (!folderId) throw new Error('Une opération doit être liée à un dossier.');
        const stamp = Number(now) || Date.now();
        return {
            id: makeId('op'),
            version: 1,
            type,
            folderId,
            status: 'pending',
            progress: { completed: 0, total: STEP_IDS.length },
            steps: STEP_IDS.map(id => ({ id, status: 'pending', startedAt: null, completedAt: null, detail: null })),
            documentIds: [...new Set((documentIds || []).filter(Boolean))],
            startedAt: null,
            updatedAt: stamp,
            completedAt: null,
            cancelledAt: null,
            resultRef: null,
            notices: [],
            context: null,
            leaseOwner: null,
            leaseToken: null,
            leaseExpiresAt: null
        };
    }

    function updateOperationStep(operation, stepId, status, detail = null, now = Date.now()) {
        if (!operation || !Array.isArray(operation.steps) || !STEP_STATUSES.includes(status)) return operation;
        const stamp = Number(now) || Date.now();
        const steps = operation.steps.map(step => {
            if (step.id !== stepId) return step;
            return {
                ...step,
                status,
                startedAt: status === 'running' ? (step.startedAt || stamp) : step.startedAt,
                completedAt: ['completed', 'warning', 'failed', 'cancelled'].includes(status) ? stamp : null,
                detail: detail === null ? step.detail : detail
            };
        });
        return {
            ...operation,
            steps,
            progress: { completed: steps.filter(step => step.status === 'completed').length, total: steps.length },
            updatedAt: stamp
        };
    }

    function createTrace({ folderId, conversationId = null, messageId = null, operation = null, manifest = {}, notices = [], model = null, now = Date.now() }) {
        const snapshot = value => value == null ? null : JSON.parse(JSON.stringify(value));
        const documents = (manifest.documents || []).map(item => ({
            id: String(item.id || ''),
            name: String(item.name || 'Document'),
            hash: item.hash || null,
            pageCount: Number(item.pageCount) || null,
            included: item.included !== false,
            characterCount: Number(item.characterCount) || 0,
            sourceIds: [...new Set((item.sourceIds || []).filter(Boolean))]
        })).filter(item => item.id);
        const sources = (manifest.sources || []).map(item => ({
            documentId: String(item.documentId || ''),
            documentName: String(item.documentName || 'Document'),
            sourceId: item.sourceId || null,
            reference: String(item.reference || item.documentName || 'Document'),
            locator: item.locator && typeof item.locator === 'object' ? snapshot(item.locator) : null,
            characterCount: Number(item.characterCount) || 0
        })).filter(item => item.documentId);
        return {
            id: makeId('trace'),
            version: 1,
            folderId,
            conversationId,
            messageId,
            operationId: operation?.id || null,
            operationType: operation?.type || 'chat-answer',
            operation: operation ? {
                id: operation.id,
                type: operation.type,
                status: operation.status,
                progress: snapshot(operation.progress),
                steps: (operation.steps || []).map(step => ({ id: step.id, status: step.status, startedAt: step.startedAt, completedAt: step.completedAt, detail: snapshot(step.detail) })),
                startedAt: operation.startedAt || null,
                updatedAt: operation.updatedAt || null,
                completedAt: operation.completedAt || null,
                cancelledAt: operation.cancelledAt || null
            } : null,
            createdAt: Number(now) || Date.now(),
            documents,
            sources,
            notices: Array.isArray(notices) ? snapshot(notices) : [],
            model: model || null,
            context: {
                mode: manifest.mode || 'manual',
                characters: Number(manifest.characters) || 0,
                documentCount: documents.filter(item => item.included).length,
                sourceCount: sources.length,
                omittedDocumentCount: documents.filter(item => !item.included).length
            }
        };
    }

    function statusKey(status) {
        return OPERATION_STATUSES.includes(status) ? 'dossier.status.' + status : 'dossier.status.warning';
    }

    global.SealarcaOperations = Object.freeze({
        OPERATION_STATUSES,
        STEP_STATUSES,
        STEP_IDS,
        OPERATION_ACTIONS,
        createNotice,
        createOperation,
        updateOperationStep,
        createTrace,
        statusKey,
        makeId
    });
})(window);
