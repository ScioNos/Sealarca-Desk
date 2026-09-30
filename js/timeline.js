(function (global) {
    'use strict';

    function normalize(value) {
        return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function canonicalDate(value) {
        const text = String(value || '').trim();
        const makeStamp = (year, month, day) => {
            const parsed = new Date(Date.UTC(year, month - 1, day));
            if (year < 1000 || parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
            return { key: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, stamp: parsed.getTime() };
        };
        let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (match) return makeStamp(Number(match[1]), Number(match[2]), Number(match[3]));
        match = text.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
        if (match) {
            return makeStamp(Number(match[3]), Number(match[2]), Number(match[1]));
        }
        match = text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (match) return makeStamp(Number(match[3]), Number(match[2]), Number(match[1]));
        return null;
    }

    function sourceFor(document, sourceId, fallbackLabel) {
        const source = (document.sourceMap || []).find(item => item.id === sourceId);
        const reference = source ? global.SealarcaP1.sourceReference(document, source) : fallbackLabel || document.name;
        return {
            documentId: document.id,
            documentName: document.name,
            sourceId: source?.id || sourceId || null,
            reference,
            locator: source?.locator ? { ...source.locator } : null
        };
    }

    function buildDossierModel(profiles, documents) {
        const documentsById = new Map((documents || []).map(document => [document.id, document]));
        const validProfiles = (profiles || []).filter(profile => profile && profile.status === 'valid' && documentsById.has(profile.documentId));
        const eventsByKey = new Map();
        const entities = { people: [], organizations: [], amounts: [], obligations: [], documents: [], sources: [] };
        const entityKeys = new Map();

        const addEntity = (kind, value, profile, document, sourceIds = [], references = []) => {
            const name = String(value || '').trim();
            if (!name) return;
            const key = kind + ':' + normalize(name);
            if (entityKeys.has(key)) {
                const entity = entityKeys.get(key);
                for (const sourceId of sourceIds) {
                    const source = sourceFor(document, sourceId, references.find(item => item.sourceId === sourceId)?.label);
                    if (!entity.sources.some(item => item.documentId === source.documentId && item.sourceId === source.sourceId)) entity.sources.push(source);
                }
                return;
            }
            const entity = {
                id: key,
                kind,
                name,
                documentId: document.id,
                documentName: document.name,
                sources: sourceIds.map(sourceId => sourceFor(document, sourceId, references.find(item => item.sourceId === sourceId)?.label))
            };
            entityKeys.set(key, entity);
            entities[kind === 'person' ? 'people' : kind === 'organization' ? 'organizations' : kind === 'amount' ? 'amounts' : 'obligations'].push(entity);
        };

        const addTimelineItem = (item, profile, document, kind) => {
            const label = String(item.label || item.details || item.date || '').trim();
            if (!label) return;
            const date = String(item.date || item.deadline || '').trim();
            const parsedDate = canonicalDate(date);
            const key = (parsedDate?.key || normalize(date)) + '|' + normalize(label);
            const sourceIds = Array.isArray(item.sourceIds) ? item.sourceIds : (item.references || []).map(reference => reference.sourceId).filter(Boolean);
            const entrySource = sourceIds[0] || null;
            const source = sourceFor(document, entrySource, item.references?.[0]?.label);
            if (eventsByKey.has(key)) {
                const event = eventsByKey.get(key);
                if (!event.sources.some(existing => existing.documentId === source.documentId && existing.sourceId === source.sourceId)) event.sources.push(source);
                if (!event.kinds.includes(kind)) event.kinds.push(kind);
                return;
            }
            eventsByKey.set(key, {
                id: 'event_' + profile.documentId + '_' + (entrySource || normalize(date + label).replace(/[^a-z0-9]+/g, '_')),
                date,
                dateOrder: parsedDate?.stamp ?? Number.MAX_SAFE_INTEGER,
                label,
                details: String(item.details || '').trim(),
                kinds: [kind],
                confidence: 'unverified-extraction',
                sources: [source]
            });
        };

        for (const profile of validProfiles) {
            const document = documentsById.get(profile.documentId);
            entities.documents.push({ id: document.id, name: document.name, hash: document.hash || null, pageCount: Number(document.metadata?.pageCount) || null });
            for (const source of document.sourceMap || []) {
                entities.sources.push({ ...sourceFor(document, source.id), sourceId: source.id || null });
            }
            const detailedEntities = Array.isArray(profile.entities) ? profile.entities : [];
            for (const entity of detailedEntities) {
                const kind = entity.kind === 'organization' ? 'organization' : entity.kind === 'amount' ? 'amount' : entity.kind === 'obligation' ? 'obligation' : 'person';
                addEntity(kind, entity.name, profile, document, entity.sourceIds || [], entity.references || []);
            }
            for (const person of profile.people || []) addEntity('person', person, profile, document);
            for (const organization of profile.organizations || []) addEntity('organization', organization, profile, document);
            for (const amount of profile.importantAmounts || []) addEntity('amount', amount.amount || amount.label, profile, document, amount.sourceIds || [], amount.references || []);
            for (const obligation of profile.obligations || []) {
                addEntity('obligation', obligation.label || obligation.details, profile, document, obligation.sourceIds || [], obligation.references || []);
                addTimelineItem(obligation, profile, document, 'obligation');
            }
            for (const date of profile.importantDates || []) addTimelineItem(date, profile, document, 'date');
            for (const event of profile.events || []) addTimelineItem(event, profile, document, 'event');
        }

        const timeline = [...eventsByKey.values()].sort((left, right) => left.dateOrder - right.dateOrder || left.label.localeCompare(right.label));
        for (const event of timeline) delete event.dateOrder;
        return { timeline, entities, analyzedDocumentCount: validProfiles.length, documentCount: (documents || []).length };
    }

    function buildComparison(profiles, documents) {
        const documentsById = new Map((documents || []).map(document => [document.id, document]));
        const groups = new Map();
        const validProfiles = (profiles || []).filter(profile => profile?.status === 'valid' && documentsById.has(profile.documentId));
        const add = (profile, field, item, value) => {
            const label = String(item.label || '').trim();
            const detail = String(value || '').trim();
            if (!label || !detail) return;
            const key = field + ':' + normalize(label);
            if (!groups.has(key)) groups.set(key, { id: key, field, label, values: [] });
            const group = groups.get(key);
            const document = documentsById.get(profile.documentId);
            let valueEntry = group.values.find(entry => normalize(entry.value) === normalize(detail));
            if (!valueEntry) {
                valueEntry = { value: detail, documents: [] };
                group.values.push(valueEntry);
            }
            const sourceIds = Array.isArray(item.sourceIds) ? item.sourceIds : (item.references || []).map(reference => reference.sourceId).filter(Boolean);
            const source = sourceFor(document, sourceIds[0] || null, item.references?.[0]?.label);
            if (!valueEntry.documents.some(entry => entry.documentId === document.id)) valueEntry.documents.push({ ...source, documentId: document.id, documentName: document.name });
        };
        for (const profile of validProfiles) {
            for (const item of profile.importantDates || []) add(profile, 'date', item, item.date || item.label);
            for (const item of profile.importantAmounts || []) add(profile, 'amount', item, item.amount || item.label);
            for (const item of profile.obligations || []) add(profile, 'obligation', item, item.deadline || item.details || item.label);
            for (const item of profile.importantItems || []) add(profile, 'item', item, item.details || item.label);
        }
        const comparisons = [...groups.values()].filter(group => group.values.length > 0).slice(0, 150);
        const divergences = comparisons.filter(group => group.values.length > 1).map(group => ({ ...group, type: 'apparent_difference', verified: false }));
        return { comparisons, divergences, analyzedDocumentCount: validProfiles.length, documentCount: (documents || []).length };
    }

    function buildDossierSummary(profiles, documents) {
        const documentsById = new Map((documents || []).map(document => [document.id, document]));
        const validProfiles = (profiles || []).filter(profile => profile?.status === 'valid' && documentsById.has(profile.documentId));
        const model = buildDossierModel(validProfiles, documents);
        const comparison = buildComparison(validProfiles, documents);
        const appearances = new Map();
        for (const profile of validProfiles) {
            const names = new Map();
            for (const person of profile.people || []) {
                const name = String(typeof person === 'string' ? person : person?.name || '').trim();
                if (name) names.set('person:' + normalize(name), { kind: 'person', name });
            }
            for (const organization of profile.organizations || []) {
                const name = String(typeof organization === 'string' ? organization : organization?.name || '').trim();
                if (name) names.set('organization:' + normalize(name), { kind: 'organization', name });
            }
            for (const entity of profile.entities || []) {
                if (!['person', 'organization'].includes(entity?.kind)) continue;
                const name = String(entity.name || '').trim();
                if (name) names.set(entity.kind + ':' + normalize(name), { kind: entity.kind, name });
            }
            for (const [key, entity] of names) {
                if (!appearances.has(key)) appearances.set(key, { ...entity, documentIds: [], documentNames: [] });
                const entry = appearances.get(key);
                if (!entry.documentIds.includes(profile.documentId)) {
                    entry.documentIds.push(profile.documentId);
                    entry.documentNames.push(documentsById.get(profile.documentId)?.name || profile.documentId);
                }
            }
        }
        const sharedParties = [...appearances.values()]
            .filter(entity => entity.documentIds.length > 1)
            .map(entity => {
                const sourceCollection = entity.kind === 'person' ? model.entities.people : model.entities.organizations;
                const sources = new Map();
                for (const documentId of entity.documentIds) {
                    const profile = validProfiles.find(item => item.documentId === documentId);
                    if (!profile) continue;
                    const document = documentsById.get(documentId);
                    const detailed = (profile.entities || []).find(item => item.kind === entity.kind && normalize(item.name) === normalize(entity.name));
                    const legacyValues = entity.kind === 'person' ? (profile.people || []) : (profile.organizations || []);
                    const legacyPresent = legacyValues.some(item => normalize(typeof item === 'string' ? item : item?.name || '') === normalize(entity.name));
                    const matchingSources = detailed?.sourceIds || [];
                    for (const sourceId of matchingSources) {
                        const source = sourceFor(document, sourceId, detailed?.references?.find(reference => reference.sourceId === sourceId)?.label);
                        sources.set(`${source.documentId}:${source.sourceId || ''}`, source);
                    }
                    if (!matchingSources.length && legacyPresent) {
                        const consolidated = sourceCollection.find(item => normalize(item.name) === normalize(entity.name));
                        for (const source of (consolidated?.sources || []).filter(item => item.documentId === documentId)) {
                            sources.set(`${source.documentId}:${source.sourceId || ''}`, source);
                        }
                    }
                }
                return { ...entity, sources: [...sources.values()].map(source => ({ ...source })) };
            })
            .sort((left, right) => left.name.localeCompare(right.name));
        return {
            analyzedDocumentCount: validProfiles.length,
            documentCount: (documents || []).length,
            eventCount: model.timeline.length,
            personCount: model.entities.people.length,
            organizationCount: model.entities.organizations.length,
            amountCount: model.entities.amounts.length,
            obligationCount: model.entities.obligations.length,
            apparentDifferenceCount: comparison.divergences.length,
            sharedParties
        };
    }

    global.SealarcaTimeline = Object.freeze({ buildDossierModel, buildComparison, buildDossierSummary });
})(window);
