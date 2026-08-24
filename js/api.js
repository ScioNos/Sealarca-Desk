/**
 * Sealarca-Desk — client OpenAI-compatible Responses API.
 */

const DEFAULT_SEALARCA_BASE_URL = 'https://sealarca.ch/v1';
const REQUEST_TIMEOUT_MS = 120000;

class SealarcaAPI {
    constructor() {
        this.currentAbortController = null;
        this.timeoutId = null;
    }

    async fetchModels(apiKey) {
        const key = this._requireApiKey(apiKey);
        const response = await fetch(`${DEFAULT_SEALARCA_BASE_URL}/models`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${key}`,
                Accept: 'application/json'
            }
        });

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
                    description: typeof model === 'object' ? model.description : '',
                    created: typeof model === 'object' ? model.created : undefined,
                    owned_by: typeof model === 'object' ? (model.owned_by || 'sealarca') : 'sealarca'
                };
            })
            .filter(Boolean)
            .sort((left, right) => left.name.localeCompare(right.name));

        if (models.length === 0) {
            throw new Error('Aucun modèle n’est disponible pour cette clé API.');
        }

        return models;
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

        const finish = (metadata = {}) => {
            if (doneCalled) return;
            doneCalled = true;
            onDone(fullText, fullReasoning, metadata);
        };

        try {
            const key = this._requireApiKey(apiKey);
            if (!model) throw new Error('Aucun modèle sélectionné.');

            this.abortCurrentRequest();
            this.currentAbortController = new AbortController();
            this.timeoutId = setTimeout(() => this.currentAbortController?.abort('timeout'), REQUEST_TIMEOUT_MS);

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

            const response = await fetch(`${DEFAULT_SEALARCA_BASE_URL}/responses`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${key}`,
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream'
                },
                body: JSON.stringify(payload),
                signal: this.currentAbortController.signal
            });

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

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith(':') || !trimmed.startsWith('data:')) continue;
                    const raw = trimmed.slice(5).trim();
                    if (!raw || raw === '[DONE]') continue;

                    let event;
                    try {
                        event = JSON.parse(raw);
                    } catch (error) {
                        throw new Error(`Événement streaming invalide : ${error.message}`);
                    }

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
                        finish({ interrupted: false, response: event.response || null });
                        return;
                    } else if (type === 'error' || type === 'response.failed') {
                        const message = event.error?.message || event.response?.error?.message || event.message;
                        throw new Error(message || 'La génération a échoué.');
                    }
                }
            }

            if (buffer.trim().startsWith('data:')) {
                const raw = buffer.trim().slice(5).trim();
                if (raw && raw !== '[DONE]') {
                    const event = JSON.parse(raw);
                    if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
                        fullText += event.delta;
                        onChunk({ type: 'content', chunk: event.delta, fullText, fullReasoning });
                    }
                }
            }

            finish({ interrupted: false });
        } catch (error) {
            if (error.name === 'AbortError') {
                finish({ interrupted: true });
            } else {
                console.error('Erreur Responses API Sealarca:', error);
                onError(error);
            }
        } finally {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
            this.currentAbortController = null;
        }
    }

    // Alias temporaire pour les anciennes intégrations locales.
    streamChat(options) {
        return this.streamResponse({
            ...options,
            instructions: options.instructions || options.systemPrompt || null
        });
    }

    abortCurrentRequest() {
        if (!this.currentAbortController) return false;
        this.currentAbortController.abort();
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
        return true;
    }

    _requireApiKey(apiKey) {
        const key = typeof apiKey === 'string' ? apiKey.trim() : '';
        if (!key) throw new Error('Veuillez renseigner votre clé API Sealarca.');
        return key;
    }

    async _createHttpError(response, context) {
        if (response.status === 401) return new Error('Clé API Sealarca invalide ou expirée.');
        if (response.status === 403) return new Error('Accès refusé pour cette clé API.');
        if (response.status === 429) return new Error('Trop de requêtes. Veuillez réessayer dans quelques instants.');
        const text = await response.text().catch(() => '');
        let detail = text;
        try {
            const data = JSON.parse(text);
            detail = data?.error?.message || data?.message || text;
        } catch { /* réponse non JSON */ }
        return new Error(`Erreur API lors de la ${context} (${response.status})${detail ? ` : ${detail.slice(0, 500)}` : ''}`);
    }

    _formatModelLabel(modelId) {
        const rawName = String(modelId || 'Modèle Sealarca').split('/').pop();
        return rawName.replace(/[-_]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
    }
}

window.sealarcaApi = new SealarcaAPI();
window.DEFAULT_SEALARCA_BASE_URL = DEFAULT_SEALARCA_BASE_URL;
