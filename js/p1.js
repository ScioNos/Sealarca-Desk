/**
 * Sealarca-Desk P1 — fiches, recherche locale, provenance et queue persistante.
 * Les classements, recherches et sélections sont exécutés localement.
 */
(function (global) {
    'use strict';

    const PROFILE_SCHEMA_VERSION = 1;
    const PROFILE_PROMPT_VERSION = 'document-profile-v1';
    const DEFAULT_MAX_PROFILE_CHARS = 120000;
    const STOP_WORDS = new Set(['alors','avec','avoir','cette','comme','dans','des','elle','elles','entre','est','etait','etre','fait','font','ils','leur','leurs','mais','nous','pour','plus','sans','ses','sont','sur','tout','tous','une','vous','the','and','for','from','that','this','with','und','der','die','das','ein','eine','con','del','los','las','che','per','una']);

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
        if (document && document.hash) return 'sha256:' + document.hash + ':' + PROFILE_PROMPT_VERSION;
        const input = String((document && document.markdown) || '');
        let hash = 2166136261;
        for (let index = 0; index < input.length; index++) {
            hash ^= input.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return 'fnv1a:' + (hash >>> 0).toString(16) + ':' + input.length + ':' + PROFILE_PROMPT_VERSION;
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

    function excerptAround(markdown, position, radius) {
        const text = String(markdown || '');
        const width = Number(radius) || 180;
        const start = Math.max(0, position - width);
        const end = Math.min(text.length, position + width);
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
            const normalized = normalizeTextWithOffsets(markdown);
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
                    excerpt: excerptAround(markdown, candidate.position),
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

    function buildProfileRequest(document, maxChars) {
        const markdown = String((document && document.markdown) || '');
        const limit = Math.max(0, Number(maxChars) || DEFAULT_MAX_PROFILE_CHARS);
        const sentMarkdown = markdown.slice(0, limit);
        const sourceMap = ((document && document.sourceMap) || []).filter(source => source && source.id
            && Number(source.markdownStart || 0) < sentMarkdown.length
            && Number(source.markdownEnd || 0) > 0).slice(0, 100);
        const truncatedSources = ((document && document.sourceMap) || []).length > sourceMap.length;
        const sources = sourceMap.map(source => ({ id: source.id, reference: sourceReference(document, source) }));
        const prompt = [
            'Analyse le document Markdown ci-dessous et retourne uniquement un objet JSON valide.',
            'Schéma: {"documentType":"", "summary":"", "people":[], "organizations":[], "importantDates":[{"date":"", "label":"", "sourceIds":[]}], "importantItems":[{"label":"", "details":"", "sourceIds":[]}], "sourceIds":[]}.',
            'La fiche doit rester générique, factuelle et concise. N’invente aucune personne, organisation, date, information ou provenance.',
            'Pour sourceIds, utilise exclusivement les identifiants de la liste SOURCE_MAP. Omettre toute référence non démontrable.',
            'Nom: ' + ((document && document.name) || ''),
            'Type technique: ' + ((document && (document.mimeType || document.extension)) || ''),
            'SOURCE_MAP: ' + JSON.stringify(sources) + (truncatedSources ? '\n(Sources tronquées à 100 pour le contexte.)' : ''),
            'MARKDOWN:',
            sentMarkdown
        ].join('\n\n');
        return { prompt, sourceMap, sentMarkdown, truncatedSources };
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

    function normalizeProfile(rawProfile, document, inputFingerprint, allowedSourceMap = null) {
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
            if (kind === 'date') normalized.date = String(object.date || (typeof item === 'string' ? item : '')).trim();
            if (kind === 'item') normalized.details = String(object.details || object.description || '').trim();
            return normalized;
        }).filter(item => item.label || item.date || item.details);
        const sourceIds = normalizeSourceIds(raw.sourceIds || raw.sources || []);
        return {
            documentId: document.id,
            folderId: document.folderId,
            inputFingerprint,
            schemaVersion: PROFILE_SCHEMA_VERSION,
            status: 'valid',
            documentType: String(raw.documentType || raw.type || document.extension || 'document').trim(),
            summary: String(raw.summary || raw.resume || '').trim(),
            people: uniqueStrings(raw.people || raw.persons || raw.personnes),
            organizations: uniqueStrings(raw.organizations || raw.organisations),
            importantDates: normalizeItems(raw.importantDates || raw.dates, 'date'),
            importantItems: normalizeItems(raw.importantItems || raw.items || raw.elements, 'item'),
            sourceIds,
            references: sourceIds.map(id => ({ sourceId: id, label: sourceReference(document, allowed.get(id)) })),
            generatedAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    function extractProfile(text, document, fingerprint, allowedSourceMap = null) {
        return normalizeProfile(parseJsonObject(text), document, fingerprint, allowedSourceMap);
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
        if (!error || error.name === 'AbortError') return false;
        if (error.retryable === true) return true;
        if ([408, 425, 429, 500, 502, 503, 504].includes(Number(error.status))) return true;
        return /network|fetch|timeout|tempor|réseau|connexion/i.test(String(error.message || ''));
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
        }
        async start() {
            if (this.started) return;
            this.started = true;
            await this.db.recoverInterruptedJobs();
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
            if (profile && profile.status === 'valid' && profile.inputFingerprint === inputFingerprint) return { skipped: true, profile };
            const job = await this.db.enqueueProcessingJob({ type: 'document-profile', documentId: document.id, folderId: document.folderId, inputFingerprint, maxAttempts: 5 });
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
            await this.notify();
        }
        async retry(jobId) {
            const job = await this.db.retryProcessingJob(jobId);
            if (job) this.schedule(0);
        }
        schedule(delay) {
            if (!this.started) return;
            clearTimeout(this.timer);
            this.timer = setTimeout(() => this.pump().catch(error => console.error('Queue P1:', error)), Math.max(0, Number(delay) || 0));
        }
        async notify() {
            try { await this.onChange(); } catch (error) { console.error('Actualisation queue impossible:', error); }
        }
        async pump() {
            if (!this.started) return;
            const available = this.concurrency - this.running.size;
            if (available <= 0) { this.schedule(500); return; }
            const jobs = await this.db.claimRunnableProcessingJobs(Date.now(), available, this.ownerId, this.leaseDurationMs);
            for (const job of jobs) this.run(job);
            await this.notify();
            this.schedule(jobs.length ? 250 : 1500);
        }
        async run(job) {
            const controller = new AbortController();
            const leaseToken = job.leaseToken;
            const attempt = Number(job.attempts || 1);
            this.running.set(job.id, { controller, leaseToken });
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
                await this.notify();
                const document = await this.db.getDocument(job.documentId);
                if (!document) throw Object.assign(new Error('Document introuvable.'), { retryable: false });
                const currentFingerprint = fingerprintDocument(document);
                const existing = await this.db.getDocumentProfile(document.id);
                if (existing && existing.status === 'valid' && existing.inputFingerprint === currentFingerprint) {
                    await this.db.updateProcessingJobIfOwner(job.id, this.ownerId, leaseToken, {
                        status: 'completed', attempts: attempt, completedAt: Date.now(),
                        checkpoint: { stage: 'deduplicated', at: Date.now() }
                    });
                    return;
                }
                if (currentFingerprint !== job.inputFingerprint) {
                    const stale = await this.db.updateProcessingJobIfOwner(job.id, this.ownerId, leaseToken, {
                        status: 'cancelled', attempts: attempt, lastError: 'Le document a changé.',
                        checkpoint: { stage: 'stale_input', at: Date.now() }
                    });
                    if (stale) await this.enqueueDocument(document);
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
                const profile = extractProfile(response.text, document, currentFingerprint, request.sourceMap);
                await this.db.saveDocumentProfileIfJobOwner(profile, job.id, this.ownerId, leaseToken);
            } catch (error) {
                if (!controller.signal.aborted) {
                    const retryable = isRetryableError(error);
                    const exhausted = attempt >= Number(job.maxAttempts || 5);
                    const status = retryable && !exhausted ? 'pending' : 'failed';
                    const delay = status === 'pending' ? backoffDelay(attempt, error.retryAfterMs) : 0;
                    await this.db.updateProcessingJobIfOwner(job.id, this.ownerId, leaseToken, {
                        status, attempts: attempt, nextRunAt: status === 'pending' ? Date.now() + delay : null,
                        lastError: String(error.message || error),
                        checkpoint: { stage: status === 'pending' ? 'retry_scheduled' : 'failed', attempt, retryInMs: delay, at: Date.now() }
                    });
                }
            } finally {
                clearInterval(heartbeat);
                this.running.delete(job.id);
                await this.notify();
                this.schedule(0);
            }
        }
    }

    global.SealarcaP1 = { PROFILE_SCHEMA_VERSION, PROFILE_PROMPT_VERSION, normalizeText, tokenize, fingerprintDocument, locatorText, sourceReference, sourceForOffset, localSearch, selectRelevantDocuments, citableExcerpts, buildProfileRequest, buildProfilePrompt, extractProfile, normalizeProfile, extractCitations, isRetryableError, backoffDelay, PersistentJobQueue };
})(typeof window !== 'undefined' ? window : globalThis);
