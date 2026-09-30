/**
 * Sealarca-Desk — client OpenAI-compatible Responses API.
 */

const DEFAULT_SEALARCA_BASE_URL = 'https://api.sealarca.ch/v1';
const REQUEST_TIMEOUT_MS = 120000;
const DEFAULT_RETRY_LIMIT = 3;

class SealarcaAPI {
    constructor() {
        this.currentAbortController = null;
        this.timeoutId = null;
        this.profileControllers = new Set();
    }

    async fetchModels(apiKey) {
        const key = this._requireApiKey(apiKey);
        const response = await this._requestWithRetry(DEFAULT_SEALARCA_BASE_URL + '/models', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${key}`,
                Accept: 'application/json'
            }
        }, { context: 'modèles', maxRetries: DEFAULT_RETRY_LIMIT });

        if (!response.ok) throw await this._createHttpError(response, 'modèles');

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error('La réponse de découverte des modèles est invalide.');
        }

        const rawModels = Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.models)
                ? data.models
                : Array.isArray(data)
                    ? data
                    : null;

        if (!rawModels) {
            throw new Error('Format de liste de modèles non reconnu.');
        }

        const seen = new Set();
        const models = rawModels
            .map(model => {
                const id = typeof model === 'string' ? model : (model?.id || model?.name);
                if (typeof id !== 'string' || !id.trim()) return null;
                const cleanId = id.trim();
                if (seen.has(cleanId)) return null;
                seen.add(cleanId);
                return {
                    id: cleanId,
                    name: this._formatModelLabel(cleanId),
                    description: typeof model === 'object' && typeof model.description === 'string' ? model.description : '',
                    created: typeof model === 'object' ? model.created : undefined,
                    owned_by: typeof model === 'object' && typeof model.owned_by === 'string' ? model.owned_by : 'sealarca',
                    capabilities: this._normalizeModelCapabilities(model?.capabilities)
                };
            })
            .filter(Boolean)
            .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }));

        if (models.length === 0) {
            throw new Error('Aucun modèle n’est disponible pour cette clé API.');
        }

        return models;
    }

    // Unknown stays unknown: only explicit gateway metadata can describe a capability.
    _normalizeModelCapabilities(metadata) {
        const capabilities = {};
        if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return capabilities;
        for (const name of ['vision', 'reasoning', 'structured_output']) {
            if (typeof metadata[name] === 'boolean') capabilities[name] = metadata[name];
        }
        return capabilities;
    }

    getModelCapability(model, capability) {
        const value = model?.capabilities?.[capability];
        return typeof value === 'boolean' ? value : null;
    }

    async streamResponse({
        apiKey,
        model,
        messages,
        instructions = null,
        onChunk = () => {},
        onError = () => {},
        onDone = () => {}
    }) {
        let fullText = '';
        let fullReasoning = '';
        let doneCalled = false;
        let completed = false;
        let controller = null;
        let requestTimeoutId = null;

        const finish = async (metadata = {}) => {
            if (doneCalled) return;
            doneCalled = true;
            await onDone(fullText, fullReasoning, metadata);
        };

        try {
            const key = this._requireApiKey(apiKey);
            if (!model) throw new Error('Aucun modèle sélectionné.');

            this.abortCurrentRequest();
            controller = new AbortController();
            this.currentAbortController = controller;
            const armTimeout = () => {
                clearTimeout(requestTimeoutId);
                requestTimeoutId = setTimeout(() => controller.abort('timeout'), REQUEST_TIMEOUT_MS);
                this.timeoutId = requestTimeoutId;
            };
            armTimeout();

            const input = [];
            for (const message of messages || []) {
                if (!message || !['user', 'assistant', 'developer', 'system'].includes(message.role)) continue;
                if (typeof message.content !== 'string' || !message.content) continue;
                input.push({ role: message.role, content: message.content });
            }

            const payload = {
                model,
                input,
                stream: true,
                store: false
            };
            if (instructions?.trim()) payload.instructions = instructions.trim();

            const response = await this._requestWithRetry(DEFAULT_SEALARCA_BASE_URL + '/responses', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${key}`,
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            }, { context: 'réponse', maxRetries: DEFAULT_RETRY_LIMIT, retryNetworkErrors: false });

            if (!response.ok) throw await this._createHttpError(response, 'réponse');
            if (!response.body) throw new Error('Le serveur n’a renvoyé aucun flux.');

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('text/event-stream')) {
                const unexpected = await response.text().catch(() => '');
                throw new Error(`Réponse streaming inattendue${unexpected ? ` : ${unexpected.slice(0, 300)}` : '.'}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            const processData = async line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith(':') || !trimmed.startsWith('data:')) return false;
                const raw = trimmed.slice(5).trim();
                if (!raw || raw === '[DONE]') return false;
                let event;
                try { event = JSON.parse(raw); }
                catch (error) { throw new Error(`Événement streaming invalide : ${error.message}`); }
                const type = event.type;
                if (type === 'response.output_text.delta' && typeof event.delta === 'string') {
                    fullText += event.delta;
                    onChunk({ type: 'content', chunk: event.delta, fullText, fullReasoning });
                } else if (
                    (type === 'response.reasoning_summary_text.delta' || type === 'response.reasoning_text.delta')
                    && typeof event.delta === 'string'
                ) {
                    fullReasoning += event.delta;
                    onChunk({ type: 'reasoning', chunk: event.delta, fullText, fullReasoning });
                } else if (type === 'response.completed') {
                    completed = true;
                    try { await reader.cancel(); } catch (_) { /* flux déjà terminé */ }
                    try { reader.releaseLock?.(); } catch (_) { /* verrou déjà libéré */ }
                    await finish({ interrupted: false, response: event.response || null });
                    return true;
                } else if (type === 'error' || type === 'response.failed') {
                    const message = event.error?.message || event.response?.error?.message || event.message;
                    throw new Error(message || 'La génération a échoué.');
                }
                return false;
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                armTimeout();
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop() || '';
                for (const line of lines) {
                    const shouldReturn = await processData(line);
                    if (shouldReturn) { try { await reader.cancel(); } catch (_) {} try { reader.releaseLock?.(); } catch (_) {} return; }
                }
            }

            buffer += decoder.decode();
            if (buffer) {
                const shouldReturn = await processData(buffer);
                if (shouldReturn) { try { await reader.cancel(); } catch (_) {} try { reader.releaseLock?.(); } catch (_) {} return; }
            }

            if (!completed) await finish({ interrupted: true, reason: 'eof_without_completion' });
        } catch (error) {
            if (error.name === 'AbortError' || controller?.signal.aborted) {
                const reason = controller?.signal.reason === 'timeout' ? 'timeout' : 'cancelled';
                await finish({ interrupted: true, reason });
            } else {
                console.error('Erreur Responses API Sealarca:', error);
                if (fullText || fullReasoning) await finish({ interrupted: true, reason: 'stream_error' });
                await onError(error);
            }
        } finally {
            clearTimeout(requestTimeoutId);
            if (this.currentAbortController === controller) {
                this.currentAbortController = null;
                this.timeoutId = null;
            }
        }
    }

    async completeResponse({ apiKey, model, messages, instructions = null, signal = null, maxRetries = DEFAULT_RETRY_LIMIT }) {
        const key = this._requireApiKey(apiKey);
        if (!model) throw new Error('Aucun modèle sélectionné.');
        const controller = new AbortController();
        this.profileControllers.add(controller);
        let timedOut = false;
        const abortFromCaller = () => controller.abort(signal.reason);
        if (signal) {
            if (signal.aborted) controller.abort(signal.reason);
            else signal.addEventListener('abort', abortFromCaller, { once: true });
        }
        const timeoutId = setTimeout(() => { timedOut = true; controller.abort(); }, REQUEST_TIMEOUT_MS);
        try {
            const input = [];
            for (const message of messages || []) {
                if (!message || !['user', 'assistant', 'developer', 'system'].includes(message.role)) continue;
                if (typeof message.content !== 'string' || !message.content) continue;
                input.push({ role: message.role, content: message.content });
            }
            const payload = { model, input, stream: false, store: false };
            if (instructions?.trim()) payload.instructions = instructions.trim();
            const response = await this._requestWithRetry(DEFAULT_SEALARCA_BASE_URL + '/responses', {
                method: 'POST',
                headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            }, { context: 'réponse', maxRetries, retryNetworkErrors: false });
            const data = await response.json().catch(error => { throw Object.assign(error, { kind: 'outcome_unknown', retryable: false }); });
            const text = this._extractResponseText(data);
            if (!text) throw new Error('La réponse API ne contient aucun texte exploitable.');
            return { text, response: data };
        } catch (error) {
            if ((timedOut || signal?.reason === 'timeout') && error.name === 'AbortError') {
                const timeoutError = new Error('La requête API a dépassé le délai autorisé.');
                timeoutError.retryable = false;
                timeoutError.kind = 'outcome_unknown';
                throw timeoutError;
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
            this.profileControllers.delete(controller);
            if (signal) signal.removeEventListener('abort', abortFromCaller);
        }
    }

    _extractResponseText(data) {
        if (typeof data?.output_text === 'string') return data.output_text;
        const parts = [];
        for (const item of data?.output || []) {
            for (const content of item?.content || []) if (typeof content?.text === 'string') parts.push(content.text);
        }
        return parts.join('');
    }

    async _requestWithRetry(url, options, { context = 'requête', maxRetries = DEFAULT_RETRY_LIMIT, retryNetworkErrors = null } = {}) {
        const method = String(options?.method || 'GET').toUpperCase();
        // POST /responses n'est pas idempotent : l'API actuelle n'expose aucune clé
        // d'idempotence (payload avec store:false uniquement, sans Idempotency-Key ni request-id).
        // Une panne réseau après envoi est ambiguë : le serveur peut avoir traité la requête
        // sans que Desk reçoive la réponse. Un retry automatique déclencherait alors une
        // deuxième inférence. On ne rejoue donc les erreurs réseau sans réponse que pour
        // les requêtes sûres (GET /models). Les erreurs HTTP avec réponse explicite
        // (429, 408, 425, 5xx retryables) restent rejouées avec backoff ci-dessus.
        const allowNetworkRetry = retryNetworkErrors === null || retryNetworkErrors === undefined
            ? method === 'GET'
            : Boolean(retryNetworkErrors);
        let attempt = 0;
        while (true) {
            try {
                const response = await fetch(url, options);
                if (response.ok) return response;
                const error = await this._createHttpError(response, context);
                if (!error.retryable || attempt >= maxRetries) throw error;
                await this._delay(error.retryAfterMs || this._backoffDelay(attempt + 1), options.signal);
                attempt += 1;
            } catch (error) {
                if (error.name === 'AbortError') throw error;
                if (!error.status && method === 'POST') {
                    error.kind = 'outcome_unknown';
                    error.retryable = false;
                }
                const retryable = error.retryable === true || (allowNetworkRetry && error.name === 'TypeError');
                if (!retryable || attempt >= maxRetries) throw error;
                await this._delay(error.retryAfterMs || this._backoffDelay(attempt + 1), options.signal);
                attempt += 1;
            }
        }
    }

    _backoffDelay(attempt) {
        return Math.min(1000 * Math.pow(2, Math.max(0, attempt - 1)), 30000);
    }

    _delay(milliseconds, signal) {
        return new Promise((resolve, reject) => {
            const abortError = () => new DOMException('Aborted', 'AbortError');
            if (signal?.aborted) { reject(abortError()); return; }
            let settled = false;
            const cleanup = () => signal?.removeEventListener('abort', onAbort);
            const onAbort = () => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                cleanup();
                reject(abortError());
            };
            const timeout = setTimeout(() => {
                if (settled) return;
                settled = true;
                cleanup();
                resolve();
            }, Math.max(0, Number(milliseconds) || 0));
            signal?.addEventListener('abort', onAbort, { once: true });
        });
    }

    abortCurrentRequest() {
        if (!this.currentAbortController) return false;
        this.currentAbortController.abort();
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
        return true;
    }

    abortProfileRequests(reason = 'cancelled') {
        let aborted = false;
        for (const controller of Array.from(this.profileControllers)) {
            try { controller.abort(reason); aborted = true; } catch (_) { /* déjà terminé */ }
        }
        return aborted;
    }

    abortAllRequests(reason = 'cancelled') {
        const chat = this.abortCurrentRequest();
        const profiles = this.abortProfileRequests(reason);
        return chat || profiles;
    }

    _requireApiKey(apiKey) {
        const key = typeof apiKey === 'string' ? apiKey.trim() : '';
        if (!key) throw new Error('Veuillez renseigner votre clé API Sealarca.');
        return key;
    }

    async _createHttpError(response, context) {
        let message;
        if (response.status === 401) message = 'Clé API Sealarca invalide ou expirée.';
        else if (response.status === 403) message = 'Accès refusé pour cette clé API.';
        else if (response.status === 429) message = 'Trop de requêtes. Une nouvelle tentative sera effectuée automatiquement.';
        else {
            const text = await response.text().catch(() => '');
            let detail = text;
            try {
                const data = JSON.parse(text);
                detail = data?.error?.message || data?.message || text;
            } catch { /* réponse non JSON */ }
            message = 'Erreur API lors de la ' + context + ' (' + response.status + ')' + (detail ? ' : ' + detail.slice(0, 500) : '');
        }
        const error = new Error(message);
        error.status = response.status;
        error.retryable = [408, 425, 429, 500, 502, 503, 504].includes(response.status);
        const retryAfter = response.headers.get('retry-after');
        if (retryAfter) {
            const seconds = Number(retryAfter);
            if (Number.isFinite(seconds)) error.retryAfterMs = seconds * 1000;
            else {
                const delay = Date.parse(retryAfter) - Date.now();
                error.retryAfterMs = Number.isFinite(delay) ? Math.max(0, delay) : 0;
            }
        }
        return error;
    }

    _formatModelLabel(modelId) {
        const rawName = String(modelId || 'Modèle Sealarca').split('/').pop();
        return rawName.replace(/-vault$/i, '').replace(/^glm\./i, 'GLM ').replace(/[-_]/g, ' ').replace(/\b[a-z]/g, letter => letter.toUpperCase());
    }
}

window.sealarcaApi = new SealarcaAPI();
window.DEFAULT_SEALARCA_BASE_URL = DEFAULT_SEALARCA_BASE_URL;
