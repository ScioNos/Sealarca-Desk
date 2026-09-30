/**
 * Sealarca-Desk P1 — fiches, recherche locale, provenance et queue persistante.
 * Les classements, recherches et sélections sont exécutés localement.
 */
(function (global) {
    'use strict';

    const PROFILE_SCHEMA_VERSION = 3;
    const PROFILE_PROMPT_VERSION = 'document-profile-v2';
    const DEFAULT_MAX_PROFILE_CHARS = 120000;
    const STOP_WORDS = new Set(['alors','avec','avoir','cette','comme','dans','des','elle','elles','entre','est','etait','etre','fait','font','ils','leur','leurs','mais','nous','pour','plus','sans','ses','sont','sur','tout','tous','une','vous','the','and','for','from','that','this','with','und','der','die','das','ein','eine','con','del','los','las','che','per','una']);
    const SEARCH_CACHE = new Map();

    function cachedNormalization(document) {
        const key = document.id;
        const text = String(document.markdown || '');
        const revision = Number(document.metadata?.extraction?.revision || 0);
        const cached = SEARCH_CACHE.get(key);
        if (cached?.text === text && cached.revision === revision) return cached.value;
        const value = normalizeTextWithOffsets(text);
        rememberNormalization(document, value);
        return value;
    }

    function rememberNormalization(document, value) {
        SEARCH_CACHE.delete(document.id);
        SEARCH_CACHE.set(document.id, { text: String(document.markdown || ''), revision: Number(document.metadata?.extraction?.revision || 0), value });
        while (SEARCH_CACHE.size > 24) SEARCH_CACHE.delete(SEARCH_CACHE.keys().next().value);
    }

    function normalizeText(value) {
        return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function normalizeTextWithOffsets(value) {
        const original = String(value || '');
        let normalized = '';
        const offsets = [];
        for (let index = 0; index < original.length;) {
            const character = String.fromCodePoint(original.codePointAt(index));
            const part = normalizeText(character);
            for (let offset = 0; offset < part.length; offset += 1) offsets.push(index);
            normalized += part;
            index += character.length;
        }
        offsets.push(original.length);
        return { normalized, offsets };
    }

    function tokenize(value) {
        const matches = normalizeText(value).match(/[a-z0-9]{2,}/g) || [];
        return matches.filter(term => !STOP_WORDS.has(term));
    }

    function uniqueStrings(value, limit) {
        const maximum = Number(limit) || 50;
        const seen = new Set();
        const output = [];
        for (const item of Array.isArray(value) ? value : []) {
            const text = typeof item === 'string' ? item.trim() : String((item && (item.name || item.label)) || '').trim();
            const key = normalizeText(text);
            if (!text || seen.has(key)) continue;
            seen.add(key);
            output.push(text);
            if (output.length >= maximum) break;
        }
        return output;
    }

    function fingerprintDocument(document) {
        const revision = Number(document?.metadata?.extraction?.revision || 0);
        const suffix = revision ? ':extraction:' + revision : '';
        if (document && document.hash) return 'sha256:' + document.hash + ':' + PROFILE_PROMPT_VERSION + suffix;
        const input = String((document && document.markdown) || '');
        let hash = 2166136261;
        for (let index = 0; index < input.length; index++) {
            hash ^= input.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return 'fnv1a:' + (hash >>> 0).toString(16) + ':' + input.length + ':' + PROFILE_PROMPT_VERSION + suffix;
    }

    function locatorText(locator) {
        if (!locator || typeof locator !== 'object') return '';
        if (locator.type === 'pdf-page' && Number.isFinite(Number(locator.page))) return 'p. ' + Number(locator.page);
        if (locator.type === 'presentation-slide' && Number.isFinite(Number(locator.slide))) return 'slide ' + Number(locator.slide);
        if (locator.type === 'spreadsheet-range' && locator.sheet) return locator.range ? 'feuille ' + locator.sheet + ', ' + locator.range : 'feuille ' + locator.sheet;
        if (locator.type === 'csv-row-range' && locator.startRow) return locator.endRow && locator.endRow !== locator.startRow ? 'lignes ' + locator.startRow + '–' + locator.endRow : 'ligne ' + locator.startRow;
        if (locator.type === 'text-line-range' && locator.startLine) return locator.endLine && locator.endLine !== locator.startLine ? 'lignes ' + locator.startLine + '–' + locator.endLine : 'ligne ' + locator.startLine;
        if (locator.type === 'rtf-line-range' && locator.startLine) return locator.endLine && locator.endLine !== locator.startLine ? 'lignes ' + locator.startLine + '–' + locator.endLine : 'ligne ' + locator.startLine;
        if (typeof locator.type === 'string' && locator.type.startsWith('docx-')) {
            if (locator.paragraph) return locator.type.replace('docx-', '') + ' ' + locator.paragraph;
            if (locator.table) return 'tableau ' + locator.table;
            if (locator.noteId) return 'note ' + locator.noteId;
            return locator.type.replace('docx-', '');
        }
        if (locator.type === 'odf-paragraph' && locator.paragraph) return 'bloc ' + locator.paragraph;
        if (locator.type === 'odf-table' && locator.table) return 'tableau ' + locator.table;
        if (locator.sheet) return 'feuille ' + locator.sheet;
        return '';
    }

    function sourceReference(document, source) {
        const name = String((document && document.name) || 'Document');
        const location = locatorText(source && source.locator);
        return location ? name + ' — ' + location : name;
    }

    function sourceForOffset(document, offset) {
        const position = Math.max(0, Number(offset) || 0);
        return (((document && document.sourceMap) || []).find(source => position >= Number(source.markdownStart || 0) && position < Number(source.markdownEnd || 0))) || null;
    }

    function excerptAround(markdown, position, radius, source = null) {
        const text = String(markdown || '');
        const width = Number(radius) || 180;
        const start = Math.max(Number(source?.markdownStart || 0), position - width);
        const end = Math.min(source ? Number(source.markdownEnd) : text.length, position + width);
        let excerpt = text.slice(start, end).replace(/\s+/g, ' ').trim();
        if (start > 0) excerpt = '…' + excerpt;
        if (end < text.length) excerpt += '…';
        return excerpt;
    }

    function localSearch(documents, query, options) {
        const settings = options || {};
        const terms = Array.from(new Set(tokenize(query)));
        if (!terms.length) return [];
        const maxResults = Math.max(1, Number(settings.maxResults) || 30);
        const perDocument = Math.max(1, Number(settings.perDocument) || 3);
        const results = [];
        for (const document of documents || []) {
            const markdown = String((document && document.markdown) || '');
            const normalized = cachedNormalization(document);
            const haystack = normalized.normalized;
            const title = normalizeText((document && document.name) || '');
            const candidates = [];
            for (const term of terms) {
                let from = 0;
                let count = 0;
                while (from < haystack.length && count < 12) {
                    const position = haystack.indexOf(term, from);
                    if (position < 0) break;
                    const markdownPosition = normalized.offsets[position] ?? markdown.length;
                    const source = sourceForOffset(document, markdownPosition);
                    const sourceId = (source && source.id) || 'offset:' + Math.floor(markdownPosition / 400);
                    let candidate = candidates.find(item => item.sourceId === sourceId);
                    if (!candidate) {
                        candidate = { sourceId, position: markdownPosition, source, matchedTerms: new Set(), occurrences: 0 };
                        candidates.push(candidate);
                    }
                    candidate.matchedTerms.add(term);
                    candidate.occurrences += 1;
                    from = position + term.length;
                    count += 1;
                }
            }
            for (const candidate of candidates) {
                const titleMatches = terms.filter(term => title.includes(term)).length;
                const coverage = candidate.matchedTerms.size / terms.length;
                results.push({
                    id: 'search_' + document.id + '_' + candidate.sourceId,
                    documentId: document.id,
                    documentName: document.name,
                    score: coverage * 12 + Math.min(candidate.occurrences, 8) + titleMatches * 4,
                    matchedTerms: Array.from(candidate.matchedTerms),
                    excerpt: excerptAround(markdown, candidate.position, 180, candidate.source),
                    sourceId: (candidate.source && candidate.source.id) || null,
                    source: candidate.source || null,
                    reference: candidate.source ? sourceReference(document, candidate.source) : document.name
                });
            }
        }
        return results.sort((left, right) => right.score - left.score || String(left.documentName).localeCompare(String(right.documentName)))
            .filter((result, index, all) => all.slice(0, index).filter(item => item.documentId === result.documentId).length < perDocument)
            .slice(0, maxResults);
    }

    function selectRelevantDocuments(documents, query, options) {
        const limit = Math.max(1, Number(options && options.limit) || 5);
        const searchResults = localSearch(documents, query, { maxResults: Math.max(limit * 5, 20), perDocument: 4 });
        const scores = new Map();
        for (const result of searchResults) scores.set(result.documentId, (scores.get(result.documentId) || 0) + result.score);
        return (documents || []).map(document => ({ document, score: scores.get(document.id) || 0 }))
            .filter(item => item.score > 0)
            .sort((left, right) => right.score - left.score)
            .slice(0, limit);
    }

    function citableExcerpts(document, query, options) {
        const limit = Math.max(1, Number(options && options.limit) || 5);
        const results = localSearch([document], query, { maxResults: limit, perDocument: limit });
        if (results.length) return results;
        return ((document && document.sourceMap) || []).slice(0, limit).map((source, index) => ({
            id: 'fallback_' + document.id + '_' + (source.id || index),
            documentId: document.id,
            documentName: document.name,
            score: 0,
            matchedTerms: [],
            sourceId: source.id || null,
            source,
            reference: sourceReference(document, source),
            excerpt: String(document.markdown || '').slice(Number(source.markdownStart || 0), Number(source.markdownEnd || 0)).replace(/\s+/g, ' ').trim().slice(0, 500)
        })).filter(item => item.excerpt);
    }

    // Only local document text enters this worker; it never receives credentials or originals.
    class SearchService {
        constructor() {
            this.worker = null;
            this.pending = new Map();
            this.sequence = 0;
            this.destroyed = false;
            try {
                const functions = [normalizeText, normalizeTextWithOffsets, cachedNormalization, rememberNormalization,
                    tokenize, locatorText, sourceReference, sourceForOffset, excerptAround, localSearch, citableExcerpts];
                const source = `'use strict';const STOP_WORDS=new Set(${JSON.stringify([...STOP_WORDS])});const SEARCH_CACHE=new Map();`
                    + functions.map(fn => fn.toString()).join('\n')
                    + `onmessage=({data})=>{try{if(data.invalidate){SEARCH_CACHE.delete(data.invalidate);return;}
                        const results=data.excerpts?data.documents.map(document=>[document.id,citableExcerpts(document,data.query,data.options)]):localSearch(data.documents,data.query,data.options);
                        postMessage({id:data.id,results});}catch(error){postMessage({id:data.id,error:String(error.message||error)});}};`;
                const url = global.URL.createObjectURL(new global.Blob([source], { type: 'text/javascript' }));
                try { this.worker = new global.Worker(url); } finally { global.URL.revokeObjectURL(url); }
                this.worker.onmessage = ({ data }) => {
                    const pending = this.pending.get(data.id); if (!pending) return;
                    this.pending.delete(data.id);
                    if (data.error) pending.reject(new Error(data.error)); else pending.resolve(data.results);
                };
                this.worker.onerror = () => {
                    this.worker?.terminate(); this.worker = null;
                    for (const pending of this.pending.values()) pending.reject(new Error('worker_unavailable'));
                    this.pending.clear();
                };
            } catch (_) { this.worker = null; }
        }
        async execute(documents, query, options, excerpts = false) {
            if (this.destroyed) return [];
            const plain = documents.map(document => ({ id: document.id, name: document.name, markdown: document.markdown,
                sourceMap: JSON.parse(JSON.stringify(document.sourceMap || [])), metadata: { extraction: { revision: document.metadata?.extraction?.revision || 0 } } }));
            if (this.worker) {
                try {
                    return await new Promise((resolve, reject) => {
                        const id = ++this.sequence;
                        this.pending.set(id, { resolve, reject });
                        try { this.worker.postMessage({ id, documents: plain, query, options, excerpts }); }
                        catch (error) { this.pending.delete(id); reject(error); }
                    });
                } catch (_) { /* CSP/browser failure: use cooperative local batches. */ }
            }
            for (const document of plain) {
                if (this.destroyed) return [];
                const cached = SEARCH_CACHE.get(document.id);
                if (cached?.text === document.markdown && cached.revision === Number(document.metadata.extraction.revision)) continue;
                const text = String(document.markdown || '');
                const parts = [], offsets = [];
                for (let start = 0; start < text.length;) {
                    let end = Math.min(text.length, start + 16000);
                    if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end -= 1;
                    const batch = normalizeTextWithOffsets(text.slice(start, end));
                    parts.push(batch.normalized);
                    for (let index = 0; index < batch.offsets.length - 1; index++) offsets.push(start + batch.offsets[index]);
                    start = end;
                    await new Promise(resolve => setTimeout(resolve, 0));
                    if (this.destroyed) return [];
                }
                offsets.push(text.length);
                rememberNormalization(document, { normalized: parts.join(''), offsets });
            }
            return excerpts ? plain.map(document => [document.id, citableExcerpts(document, query, options)]) : localSearch(plain, query, options);
        }
        search(documents, query, options) { return this.execute(documents, query, options); }
        async select(documents, query, options = {}) {
            const limit = Math.max(1, Number(options.limit) || 5);
            const results = await this.search(documents, query, { maxResults: Math.max(limit * 5, 20), perDocument: 4 });
            const scores = new Map();
            for (const result of results) scores.set(result.documentId, (scores.get(result.documentId) || 0) + result.score);
            return documents.map(document => ({ document, score: scores.get(document.id) || 0 }))
                .filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
        }
        async excerpts(documents, query, options) { return new Map(await this.execute(documents, query, options, true)); }
        invalidate(id) { SEARCH_CACHE.delete(id); this.worker?.postMessage({ invalidate: id }); }
        destroy() {
            this.destroyed = true;
            this.worker?.terminate(); this.worker = null;
            for (const pending of this.pending.values()) pending.resolve([]);
            this.pending.clear(); SEARCH_CACHE.clear();
        }
    }

    function buildProfileRequest(document, maxChars) {
        const markdown = String((document && document.markdown) || '');
        const limit = Math.max(0, Number(maxChars) || DEFAULT_MAX_PROFILE_CHARS);
        const sentMarkdown = markdown.slice(0, limit);
        const allSources = (document && document.sourceMap) || [];
        const sourceMap = allSources.filter(source => source && source.id
            && Number(source.markdownStart || 0) < sentMarkdown.length
            && Number(source.markdownEnd || 0) > 0).slice(0, 100).map(source => ({ ...source, markdownEnd: Math.min(Number(source.markdownEnd), sentMarkdown.length) }));
        const cutSourceIds = allSources.filter(source => sourceMap.some(sent => sent.id === source.id) && Number(source.markdownEnd) > sentMarkdown.length).map(source => source.id);
        const truncatedSources = allSources.length > sourceMap.length || cutSourceIds.length > 0;
        const reasons = [];
        if (sentMarkdown.length < markdown.length) reasons.push('character_limit');
        if (allSources.length > sourceMap.length) reasons.push('source_limit');
        if (cutSourceIds.length) reasons.push('source_cut');
        const coverage = { status: reasons.length ? 'partial' : 'complete', totalCharacters: markdown.length, sentCharacters: sentMarkdown.length,
            totalSources: allSources.length, representedSources: sourceMap.length, cutSourceIds, reasons };
        const sources = sourceMap.map(source => ({ id: source.id, reference: sourceReference(document, source) }));
        const prompt = [
            'Analyse le document Markdown ci-dessous et retourne uniquement un objet JSON valide.',
            'Schéma: {"documentType":"", "summary":"", "people":[{"name":"", "sourceIds":[]}], "organizations":[{"name":"", "sourceIds":[]}], "importantDates":[{"date":"", "label":"", "sourceIds":[]}], "importantAmounts":[{"amount":"", "label":"", "sourceIds":[]}], "events":[{"date":"", "label":"", "details":"", "category":"", "sourceIds":[]}], "obligations":[{"label":"", "details":"", "deadline":"", "sourceIds":[]}], "importantItems":[{"label":"", "details":"", "sourceIds":[]}], "sourceIds":[]}.',
            'La fiche doit rester générique, factuelle et concise. N’invente aucune personne, organisation, date, information ou provenance.',
            'Pour sourceIds, utilise exclusivement les identifiants de la liste SOURCE_MAP. Omettre toute référence non démontrable.',
            'Nom: ' + ((document && document.name) || ''),
            'Type technique: ' + ((document && (document.mimeType || document.extension)) || ''),
            'SOURCE_MAP: ' + JSON.stringify(sources) + (truncatedSources ? '\n(Sources tronquées à 100 pour le contexte.)' : ''),
            'MARKDOWN:',
            sentMarkdown
        ].join('\n\n');
        return { prompt, sourceMap, sentMarkdown, truncatedSources, coverage };
    }

    function buildProfilePrompt(document, maxChars) {
        return buildProfileRequest(document, maxChars).prompt;
    }

    function parseJsonObject(text) {
        const raw = String(text || '').trim();
        try { return JSON.parse(raw); } catch { /* extraction ci-dessous */ }
        const start = raw.indexOf('{');
        const end = raw.lastIndexOf('}');
        if (start < 0 || end <= start) throw new Error('La réponse de fiche ne contient pas de JSON valide.');
        return JSON.parse(raw.slice(start, end + 1));
    }

    function normalizeProfile(rawProfile, document, inputFingerprint, allowedSourceMap = null, coverage = null) {
        const raw = rawProfile && typeof rawProfile === 'object' ? rawProfile : {};
        const sourceMap = Array.isArray(allowedSourceMap) ? allowedSourceMap
            : (Array.isArray(document && document.sourceMap) ? document.sourceMap : []);
        const allowed = new Map(sourceMap.filter(source => source && source.id).map(source => [source.id, source]));
        const normalizeSourceIds = value => uniqueStrings(value, 30).filter(id => allowed.has(id));
        const normalizeItems = (value, kind) => (Array.isArray(value) ? value : []).slice(0, 50).map(item => {
            const object = typeof item === 'string' ? { label: item } : (item || {});
            const sourceIds = normalizeSourceIds(object.sourceIds || object.sources || []);
            const normalized = {
                label: String(object.label || object.title || '').trim(),
                sourceIds,
                references: sourceIds.map(id => ({ sourceId: id, label: sourceReference(document, allowed.get(id)) }))
            };
            if (kind === 'date' || kind === 'event') normalized.date = String(object.date || (typeof item === 'string' ? item : '')).trim();
            if (['item', 'event', 'obligation'].includes(kind)) normalized.details = String(object.details || object.description || '').trim();
            if (kind === 'event') normalized.category = String(object.category || object.type || '').trim();
            if (kind === 'obligation') normalized.deadline = String(object.deadline || object.date || '').trim();
            if (kind === 'amount') normalized.amount = String(object.amount || object.value || object.label || '').trim();
            return normalized;
        }).filter(item => item.label || item.date || item.details || item.amount || item.deadline);
        const normalizeNamedEntities = (value, kind) => (Array.isArray(value) ? value : []).slice(0, 50).map(item => {
            const object = typeof item === 'string' ? { name: item } : (item || {});
            const name = String(object.name || object.label || '').trim();
            const sourceIds = normalizeSourceIds(object.sourceIds || object.sources || []);
            return {
                kind,
                name,
                sourceIds,
                references: sourceIds.map(id => ({ sourceId: id, label: sourceReference(document, allowed.get(id)) }))
            };
        }).filter(item => item.name);
        const sourceIds = normalizeSourceIds(raw.sourceIds || raw.sources || []);
        const people = uniqueStrings(raw.people || raw.persons || raw.personnes);
        const organizations = uniqueStrings(raw.organizations || raw.organisations);
        return {
            documentId: document.id,
            folderId: document.folderId,
            inputFingerprint,
            schemaVersion: PROFILE_SCHEMA_VERSION,
            status: 'valid',
            extractionRevision: Number(document.metadata?.extraction?.revision || 0),
            coverage: coverage ? JSON.parse(JSON.stringify(coverage)) : { status: 'unknown', reasons: ['legacy_coverage_unknown'] },
            documentType: String(raw.documentType || raw.type || document.extension || 'document').trim(),
            summary: String(raw.summary || raw.resume || '').trim(),
            people,
            organizations,
            entities: [...normalizeNamedEntities(raw.people || raw.persons || raw.personnes, 'person'), ...normalizeNamedEntities(raw.organizations || raw.organisations, 'organization')],
            importantDates: normalizeItems(raw.importantDates || raw.dates, 'date'),
            importantAmounts: normalizeItems(raw.importantAmounts || raw.amounts || raw.montants, 'amount'),
            events: normalizeItems(raw.events || raw.eventsTimeline || raw.evenements, 'event'),
            obligations: normalizeItems(raw.obligations || raw.commitments, 'obligation'),
            importantItems: normalizeItems(raw.importantItems || raw.items || raw.elements, 'item'),
            sourceIds,
            references: sourceIds.map(id => ({ sourceId: id, label: sourceReference(document, allowed.get(id)) })),
            generatedAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    function extractProfile(text, document, fingerprint, allowedSourceMap = null, coverage = null) {
        return normalizeProfile(parseJsonObject(text), document, fingerprint, allowedSourceMap, coverage);
    }

    function extractCitations(text, documents) {
        const haystack = normalizeText(text);
        const citations = [];
        for (const document of documents || []) {
            for (const source of document.sourceMap || []) {
                const label = sourceReference(document, source);
                if (locatorText(source.locator) && haystack.includes(normalizeText(label))) citations.push({ documentId: document.id, sourceId: source.id || null, label });
            }
        }
        return citations.filter((item, index, all) => all.findIndex(other => other.documentId === item.documentId && other.sourceId === item.sourceId) === index);
    }

    function isRetryableError(error) {
        return Boolean(error && error.name !== 'AbortError' && error.kind !== 'outcome_unknown'
            && Number(error.status) && (error.retryable === true || [408, 425, 429, 500, 502, 503, 504].includes(Number(error.status))));
    }

    function backoffDelay(attempt, retryAfterMs) {
        if (Number(retryAfterMs) > 0) return Math.min(Number(retryAfterMs), 15 * 60 * 1000);
        return Math.min(1000 * Math.pow(2, Math.max(0, Number(attempt) - 1)), 5 * 60 * 1000);
    }

    class PersistentJobQueue {
        constructor(config) {
            this.db = config.db;
            this.api = config.api;
            this.getCredentials = config.getCredentials;
            this.concurrency = Math.max(1, Number(config.concurrency) || 2);
            this.onChange = config.onChange || (() => {});
            this.running = new Map();
            this.ownerId = `queue_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
            this.leaseDurationMs = 180000;
            this.heartbeatIntervalMs = 30000;
            this.timer = null;
            this.started = false;
            this.pumping = null;
            this.lastRecoveryAt = 0;
        }
        async start() {
            if (this.started) return;
            this.started = true;
            await this.pump();
        }
        stop() {
            this.started = false;
            clearTimeout(this.timer);
            this.timer = null;
            for (const running of this.running.values()) running.controller.abort('queue_stopped');
        }
        async enqueueDocument(document) {
            const inputFingerprint = fingerprintDocument(document);
            const profile = await this.db.getDocumentProfile(document.id);
            if (profile && profile.status === 'valid' && profile.inputFingerprint === inputFingerprint && profile.coverage?.status !== 'unknown' && profile.coverage) return { skipped: true, profile };
            const job = await this.db.enqueueProcessingJob({ type: 'document-profile', documentId: document.id, folderId: document.folderId, inputFingerprint,
                extractionRevision: Number(document.metadata?.extraction?.revision || 0), regenerate: Boolean(profile && (!profile.coverage || profile.coverage.status === 'unknown')), maxAttempts: 5 });
            this.schedule(0);
            return { skipped: false, job };
        }
        async enqueueDocuments(documents) {
            const results = [];
            for (const document of documents || []) results.push(await this.enqueueDocument(document));
            return results;
        }
        async cancel(jobId) {
            const job = await this.db.cancelProcessingJob(jobId);
            const running = this.running.get(jobId);
            if (job && running) running.controller.abort('cancelled');
            if (job) await this.notify(job);
        }
        abortJobsForDocument(documentId, reason = 'document_deleted') {
            if (!documentId) return [];
            const aborted = [];
            for (const [jobId, entry] of this.running.entries()) {
                if (entry && entry.documentId === documentId) {
                    try { entry.controller.abort(reason); } catch (_) { /* déjà terminé */ }
                    aborted.push(jobId);
                }
            }
            return aborted;
        }
        abortJobsForFolder(folderId, reason = 'folder_deleted') {
            if (!folderId) return [];
            const aborted = [];
            for (const [jobId, entry] of this.running.entries()) {
                if (entry && entry.folderId === folderId) {
                    try { entry.controller.abort(reason); } catch (_) { /* déjà terminé */ }
                    aborted.push(jobId);
                }
            }
            return aborted;
        }
        abortJobsForDocuments(documentIds, reason = 'document_deleted') {
            const ids = new Set((documentIds || []).filter(Boolean));
            if (!ids.size) return [];
            const aborted = [];
            for (const [jobId, entry] of this.running.entries()) {
                if (entry && ids.has(entry.documentId)) {
                    try { entry.controller.abort(reason); } catch (_) { /* déjà terminé */ }
                    aborted.push(jobId);
                }
            }
            return aborted;
        }
        async retry(jobId) {
            const job = await this.db.retryProcessingJob(jobId);
            if (job) { await this.notify(job); this.schedule(0); }
        }
        schedule(delay) {
            if (!this.started) return;
            clearTimeout(this.timer);
            this.timer = setTimeout(() => this.pump().catch(error => console.error('Queue P1:', error)), Math.max(0, Number(delay) || 0));
        }
        async notify(job, domains = ['jobs']) {
            try { await this.onChange({ folderId: job?.folderId || null, domains }); } catch (error) { console.error('Actualisation queue impossible:', error); }
        }
        async pump() {
            if (!this.started) return;
            if (this.pumping) return this.pumping;
            this.pumping = this.pumpOnce();
            try { await this.pumping; } finally { this.pumping = null; }
        }
        async pumpOnce() {
            if (Date.now() - this.lastRecoveryAt >= 30000) {
                this.lastRecoveryAt = Date.now();
                if (await this.db.recoverInterruptedJobs()) await this.notify(null);
            }
            if (!this.started) return;
            const available = this.concurrency - this.running.size;
            if (available <= 0) { this.schedule(500); return; }
            const jobs = await this.db.claimRunnableProcessingJobs(Date.now(), available, this.ownerId, this.leaseDurationMs);
            if (!this.started) return;
            for (const job of jobs) this.run(job).catch(error => console.error('Job P1:', error));
            for (const job of jobs) await this.notify(job);
            this.schedule(jobs.length ? 250 : 1500);
        }
        async run(job) {
            const controller = new AbortController();
            const leaseToken = job.leaseToken;
            const attempt = Number(job.attempts || 1);
            this.running.set(job.id, { controller, leaseToken, documentId: job.documentId, folderId: job.folderId });
            let heartbeatBusy = false;
            const heartbeat = setInterval(async () => {
                if (heartbeatBusy || controller.signal.aborted) return;
                heartbeatBusy = true;
                try {
                    const renewed = await this.db.renewProcessingJobLease(job.id, this.ownerId, leaseToken, Date.now(), this.leaseDurationMs);
                    if (!renewed) controller.abort('lease_lost');
                } catch (_) {
                    controller.abort('lease_lost');
                } finally { heartbeatBusy = false; }
            }, this.heartbeatIntervalMs);
            try {
                const document = await this.db.getDocument(job.documentId);
                if (!document) throw Object.assign(new Error('Document introuvable.'), { retryable: false });
                const currentFingerprint = fingerprintDocument(document);
                const existing = await this.db.getDocumentProfile(document.id);
                if (!job.regenerate && existing && existing.status === 'valid' && existing.inputFingerprint === currentFingerprint) {
                    await this.db.updateProcessingJobIfOwner(job.id, this.ownerId, leaseToken, {
                        status: 'completed', attempts: attempt, completedAt: Date.now(),
                        checkpoint: { stage: 'deduplicated', at: Date.now() }
                    });
                    return;
                }
                if (currentFingerprint !== job.inputFingerprint) {
                    await this.db.updateProcessingJobIfOwner(job.id, this.ownerId, leaseToken, {
                        status: 'cancelled', attempts: attempt, lastError: 'Le document a changé.',
                        checkpoint: { stage: 'stale_input', at: Date.now() }
                    });
                    return;
                }
                const credentials = this.getCredentials() || {};
                if (!credentials.apiKey || !credentials.model) {
                    await this.db.updateProcessingJobIfOwner(job.id, this.ownerId, leaseToken, {
                        status: 'pending', attempts: Math.max(0, attempt - 1), nextRunAt: Date.now() + 60000,
                        checkpoint: { stage: 'awaiting_api_configuration', at: Date.now() }
                    });
                    return;
                }
                const request = buildProfileRequest(document);
                if (controller.signal.aborted) return;
                const dispatched = await this.db.updateProcessingJobIfOwner(job.id, this.ownerId, leaseToken, {
                    checkpoint: { stage: 'request_dispatched', at: Date.now() }
                });
                if (!dispatched || controller.signal.aborted) return;
                const timeoutMs = 120000;
                const timeoutController = new AbortController();
                const timeoutId = setTimeout(() => timeoutController.abort('timeout'), timeoutMs);
                const forwardAbort = () => {
                    try { timeoutController.abort(controller.signal.reason || 'cancelled'); } catch (_) {}
                };
                if (controller.signal.aborted) timeoutController.abort(controller.signal.reason || 'cancelled');
                else controller.signal.addEventListener('abort', forwardAbort, { once: true });
                let response;
                try {
                    response = await this.api.completeResponse({ apiKey: credentials.apiKey, model: credentials.model, messages: [{ role: 'user', content: request.prompt }], instructions: 'Tu extrais une fiche documentaire JSON strictement fondée sur la source fournie.', signal: timeoutController.signal, maxRetries: 0 });
                } finally {
                    clearTimeout(timeoutId);
                    controller.signal.removeEventListener?.('abort', forwardAbort);
                }
                const profile = extractProfile(response.text, document, currentFingerprint, request.sourceMap, request.coverage);
                await this.db.saveDocumentProfileIfJobOwner(profile, job.id, this.ownerId, leaseToken);
            } catch (error) {
                if (!controller.signal.aborted) {
                    const errorKind = error.kind || (error.name === 'AbortError' ? 'cancelled' : Number(error.status) ? 'http' : error instanceof TypeError ? 'outcome_unknown' : 'definitive');
                    const retryable = isRetryableError(error);
                    const exhausted = attempt >= Number(job.maxAttempts || 5);
                    const status = retryable && !exhausted ? 'pending' : 'failed';
                    const delay = status === 'pending' ? backoffDelay(attempt, error.retryAfterMs) : 0;
                    await this.db.updateProcessingJobIfOwner(job.id, this.ownerId, leaseToken, {
                        status, attempts: attempt, nextRunAt: status === 'pending' ? Date.now() + delay : null,
                        lastError: String(error.message || error),
                        errorKind,
                        checkpoint: { stage: errorKind === 'outcome_unknown' ? 'outcome_unknown' : status === 'pending' ? 'retry_scheduled' : 'failed', attempt, retryInMs: delay, at: Date.now() }
                    });
                }
            } finally {
                clearInterval(heartbeat);
                this.running.delete(job.id);
                await this.notify(job, ['jobs', 'profiles']);
                this.schedule(0);
            }
        }
    }

    global.SealarcaP1 = { PROFILE_SCHEMA_VERSION, PROFILE_PROMPT_VERSION, normalizeText, tokenize, fingerprintDocument, locatorText, sourceReference, sourceForOffset, localSearch, selectRelevantDocuments, citableExcerpts, SearchService, buildProfileRequest, buildProfilePrompt, extractProfile, normalizeProfile, extractCitations, isRetryableError, backoffDelay, PersistentJobQueue };
})(typeof window !== 'undefined' ? window : globalThis);
