/**
 * Sealarca-Desk — Moteur de persistance locale IndexedDB
 * Base de données locale sécurisée (sealarca_desk_db).
 * Aucune donnée ne quitte le poste client.
 */

const DB_NAME = 'sealarca_desk_db';
const DB_VERSION = 2;
const DEFAULT_FOLDER_ID = 'folder_default';

class SealarcaDB {
    constructor() {
        this.db = null;
        this.initPromise = null;
    }

    async init() {
        if (this.db) return this.db;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const tx = event.target.transaction;
                const oldVersion = event.oldVersion || 0;

                let convStore;
                if (!db.objectStoreNames.contains('conversations')) {
                    convStore = db.createObjectStore('conversations', { keyPath: 'id' });
                    convStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                    convStore.createIndex('createdAt', 'createdAt', { unique: false });
                } else {
                    convStore = tx.objectStore('conversations');
                }
                if (!convStore.indexNames.contains('folderId')) {
                    convStore.createIndex('folderId', 'folderId', { unique: false });
                }

                if (!db.objectStoreNames.contains('messages')) {
                    const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
                    msgStore.createIndex('conversationId', 'conversationId', { unique: false });
                    msgStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                if (!db.objectStoreNames.contains('roles')) {
                    db.createObjectStore('roles', { keyPath: 'id' });
                }

                let folderStore;
                if (!db.objectStoreNames.contains('folders')) {
                    folderStore = db.createObjectStore('folders', { keyPath: 'id' });
                    folderStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                    folderStore.createIndex('name', 'name', { unique: false });
                } else {
                    folderStore = tx.objectStore('folders');
                }

                if (!db.objectStoreNames.contains('documents')) {
                    const documentStore = db.createObjectStore('documents', { keyPath: 'id' });
                    documentStore.createIndex('folderId', 'folderId', { unique: false });
                    documentStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                    documentStore.createIndex('hash', 'hash', { unique: false });
                }

                if (!db.objectStoreNames.contains('documentChunks')) {
                    const chunkStore = db.createObjectStore('documentChunks', { keyPath: 'id' });
                    chunkStore.createIndex('documentId', 'documentId', { unique: false });
                    chunkStore.createIndex('folderId', 'folderId', { unique: false });
                }

                if (oldVersion < 2) {
                    const now = Date.now();
                    folderStore.put({
                        id: DEFAULT_FOLDER_ID,
                        name: 'Dossier principal',
                        description: 'Dossier créé automatiquement lors de la migration.',
                        tags: [],
                        metadata: { migratedFromVersion: oldVersion || 1 },
                        createdAt: now,
                        updatedAt: now
                    });

                    const cursorRequest = convStore.openCursor();
                    cursorRequest.onsuccess = (cursorEvent) => {
                        const cursor = cursorEvent.target.result;
                        if (!cursor) return;
                        const conversation = cursor.value;
                        if (!conversation.folderId) {
                            conversation.folderId = DEFAULT_FOLDER_ID;
                            cursor.update(conversation);
                        }
                        cursor.continue();
                    };
                }
            };

            request.onsuccess = async (event) => {
                this.db = event.target.result;
                this.db.onversionchange = () => this.db.close();
                try {
                    await this._ensureDefaultFolder();
                    await this._initDefaultRoles();
                    resolve(this.db);
                } catch (error) {
                    reject(error);
                }
            };

            request.onerror = (event) => {
                console.error('Erreur ouverture IndexedDB Sealarca:', event.target.error);
                reject(event.target.error);
            };
            request.onblocked = () => reject(new Error('La migration IndexedDB est bloquée par un autre onglet Sealarca-Desk.'));
        });

        return this.initPromise;
    }

    _request(storeName, mode, operation) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, mode);
            const store = tx.objectStore(storeName);
            let request;
            try {
                request = operation(store, tx);
            } catch (error) {
                reject(error);
                return;
            }
            if (request) {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } else {
                tx.oncomplete = () => resolve(true);
            }
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error || new Error('Transaction IndexedDB annulée.'));
        });
    }

    _getAllDirect(storeName) {
        return this._request(storeName, 'readonly', store => store.getAll());
    }

    async _ensureDefaultFolder() {
        const existing = await this._request('folders', 'readonly', store => store.get(DEFAULT_FOLDER_ID));
        if (existing) return existing;
        const now = Date.now();
        const folder = {
            id: DEFAULT_FOLDER_ID,
            name: 'Dossier principal',
            description: '',
            tags: [],
            metadata: {},
            createdAt: now,
            updatedAt: now
        };
        await this._request('folders', 'readwrite', store => store.put(folder));
        return folder;
    }

    async _initDefaultRoles() {
        const existingRoles = await this._getAllDirect('roles');
        if (existingRoles.length > 0) return;
        const defaultRoles = [
            {
                id: 'role-legal', name: 'Juriste & Droit des Contrats', icon: '⚖️',
                description: 'Analyse rigoureuse de clauses contractuelles, identification des risques et conformité (CO/LPD).',
                systemPrompt: `Tu es un juriste expert de haut niveau spécialisé en droit suisse (Code des Obligations, Loi sur la protection des données - LPD) et droit comparé.
Ton rôle est d'analyser minutieusement les contrats, actes et pièces juridiques.
- Identifie les clauses à risque, ambiguïtés et déséquilibres.
- Propose des reformulations claires et protectrices.
- Structure tes réponses avec méthode : Constat, Analyse juridique, Recommandations concrètes.`
            },
            {
                id: 'role-fiduciary', name: 'Expert Fiscal & Fiduciaire', icon: '📊',
                description: 'Analyse de bilans, comptes de résultat, ratios financiers et conformité fiscale.',
                systemPrompt: `Tu es un expert fiduciaire et fiscaliste chevronné.
Ton rôle est d'analyser des documents comptables, tableaux financiers (Excel/CSV) et déclarations fiscales.
- Analyse les indicateurs de performance, de liquidité et de solvabilité.
- Relève les anomalies ou incohérences dans les données chiffrées.
- Rédige des synthèses financières claires pour la direction.`
            },
            {
                id: 'role-compliance', name: 'Conformité & Secret Professionnel', icon: '🛡️',
                description: 'Vérification de conformité réglementaire, diligence raisonnable (KYC/LBA) et confidentialité.',
                systemPrompt: `Tu es un officier de conformité (Compliance Officer) et expert en réglementation suisse et internationale (LBA, CDB, RGPD/nLPD).
Ton rôle est d'évaluer les risques de conformité, de vérifier l'adéquation des processus et d'assister dans la rédaction de mémos de conformité rigoureux.`
            },
            {
                id: 'role-executive', name: 'Synthèse Exécutive & Rédaction', icon: '✍️',
                description: 'Restitution synthétique, mémos de direction, comptes-rendus et courriers officiels.',
                systemPrompt: `Tu es un conseiller en rédaction exécutive pour comités de direction et conseils d'administration.
Ton rôle est de synthétiser des dossiers volumineux en notes de synthèse concises, percutantes et élégantes, en conservant tous les éléments décisionnels cruciaux.`
            }
        ];
        await Promise.all(defaultRoles.map(role => this._request('roles', 'readwrite', store => store.put(role))));
    }

    async getSetting(key, defaultValue = null) {
        await this.init();
        const result = await this._request('settings', 'readonly', store => store.get(key));
        return result ? result.value : defaultValue;
    }

    async setSetting(key, value) {
        await this.init();
        await this._request('settings', 'readwrite', store => store.put({ key, value, updatedAt: Date.now() }));
        return true;
    }

    async deleteSetting(key) {
        await this.init();
        await this._request('settings', 'readwrite', store => store.delete(key));
        return true;
    }

    async getFolders() {
        await this.init();
        const folders = await this._getAllDirect('folders');
        return folders.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }

    async getFolder(id) {
        await this.init();
        return (await this._request('folders', 'readonly', store => store.get(id))) || null;
    }

    async saveFolder(folder) {
        await this.init();
        const now = Date.now();
        const value = {
            ...folder,
            name: String(folder.name || 'Dossier sans titre').trim(),
            description: String(folder.description || '').trim(),
            tags: Array.isArray(folder.tags) ? folder.tags : [],
            metadata: folder.metadata && typeof folder.metadata === 'object' ? folder.metadata : {},
            createdAt: folder.createdAt || now,
            updatedAt: now
        };
        await this._request('folders', 'readwrite', store => store.put(value));
        return value;
    }

    async deleteFolder(id) {
        await this.init();
        const conversations = await this.getConversations(id);
        const documents = await this.getDocuments(id);
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['folders', 'conversations', 'messages', 'documents', 'documentChunks'], 'readwrite');
            tx.objectStore('folders').delete(id);
            const convStore = tx.objectStore('conversations');
            const msgIndex = tx.objectStore('messages').index('conversationId');
            conversations.forEach(conversation => {
                convStore.delete(conversation.id);
                const req = msgIndex.openCursor(IDBKeyRange.only(conversation.id));
                req.onsuccess = event => {
                    const cursor = event.target.result;
                    if (cursor) { cursor.delete(); cursor.continue(); }
                };
            });
            const docStore = tx.objectStore('documents');
            const chunkIndex = tx.objectStore('documentChunks').index('documentId');
            documents.forEach(document => {
                docStore.delete(document.id);
                const req = chunkIndex.openCursor(IDBKeyRange.only(document.id));
                req.onsuccess = event => {
                    const cursor = event.target.result;
                    if (cursor) { cursor.delete(); cursor.continue(); }
                };
            });
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error || new Error('Suppression du dossier annulée.'));
        });
    }

    async getConversations(folderId = null) {
        await this.init();
        const conversations = folderId
            ? await this._request('conversations', 'readonly', store => store.index('folderId').getAll(folderId))
            : await this._getAllDirect('conversations');
        return conversations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }

    async getConversation(id) {
        await this.init();
        return (await this._request('conversations', 'readonly', store => store.get(id))) || null;
    }

    async saveConversation(conversation) {
        await this.init();
        const now = Date.now();
        const value = {
            ...conversation,
            folderId: conversation.folderId || DEFAULT_FOLDER_ID,
            createdAt: conversation.createdAt || now,
            updatedAt: now
        };
        await this._request('conversations', 'readwrite', store => store.put(value));
        return value;
    }

    async deleteConversation(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['conversations', 'messages'], 'readwrite');
            tx.objectStore('conversations').delete(id);
            const req = tx.objectStore('messages').index('conversationId').openCursor(IDBKeyRange.only(id));
            req.onsuccess = event => {
                const cursor = event.target.result;
                if (cursor) { cursor.delete(); cursor.continue(); }
            };
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    }

    async getMessages(conversationId) {
        await this.init();
        const messages = await this._request('messages', 'readonly', store => store.index('conversationId').getAll(conversationId));
        return messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    }

    async saveMessage(message) {
        await this.init();
        const value = { ...message, createdAt: message.createdAt || Date.now() };
        await this._request('messages', 'readwrite', store => store.put(value));
        return value;
    }

    async getDocuments(folderId) {
        await this.init();
        const documents = folderId
            ? await this._request('documents', 'readonly', store => store.index('folderId').getAll(folderId))
            : await this._getAllDirect('documents');
        return documents.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }

    async getDocument(id) {
        await this.init();
        return (await this._request('documents', 'readonly', store => store.get(id))) || null;
    }

    async getDocumentsByIds(ids) {
        await this.init();
        const uniqueIds = [...new Set((ids || []).filter(Boolean))];
        return Promise.all(uniqueIds.map(id => this.getDocument(id))).then(items => items.filter(Boolean));
    }

    async findDocumentByHash(folderId, hash) {
        await this.init();
        if (!hash) return null;
        const matches = await this._request('documents', 'readonly', store => store.index('hash').getAll(hash));
        return matches.find(document => document.folderId === folderId) || null;
    }

    async saveDocument(document) {
        await this.init();
        const now = Date.now();
        const value = {
            ...document,
            folderId: document.folderId || DEFAULT_FOLDER_ID,
            markdown: String(document.markdown || ''),
            sourceMap: Array.isArray(document.sourceMap) ? document.sourceMap : [],
            metadata: document.metadata && typeof document.metadata === 'object' ? document.metadata : {},
            derivations: document.derivations && typeof document.derivations === 'object'
                ? document.derivations
                : { chunks: { status: 'not_generated', source: 'markdown' } },
            createdAt: document.createdAt || now,
            updatedAt: now
        };
        await this._request('documents', 'readwrite', store => store.put(value));
        return value;
    }

    async deleteDocument(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['documents', 'documentChunks'], 'readwrite');
            tx.objectStore('documents').delete(id);
            const req = tx.objectStore('documentChunks').index('documentId').openCursor(IDBKeyRange.only(id));
            req.onsuccess = event => {
                const cursor = event.target.result;
                if (cursor) { cursor.delete(); cursor.continue(); }
            };
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    }

    async getDocumentChunks(documentId) {
        await this.init();
        const chunks = await this._request('documentChunks', 'readonly', store => store.index('documentId').getAll(documentId));
        return chunks.sort((a, b) => (a.index || 0) - (b.index || 0));
    }

    async replaceDocumentChunks(document, chunks) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['documents', 'documentChunks'], 'readwrite');
            const chunkStore = tx.objectStore('documentChunks');
            const req = chunkStore.index('documentId').openCursor(IDBKeyRange.only(document.id));
            req.onsuccess = event => {
                const cursor = event.target.result;
                if (cursor) { cursor.delete(); cursor.continue(); return; }
                (chunks || []).forEach((chunk, index) => chunkStore.put({
                    ...chunk,
                    id: chunk.id || `chunk_${document.id}_${index}`,
                    documentId: document.id,
                    folderId: document.folderId,
                    index,
                    derivedFrom: 'markdown',
                    createdAt: chunk.createdAt || Date.now()
                }));
                tx.objectStore('documents').put({
                    ...document,
                    derivations: {
                        ...(document.derivations || {}),
                        chunks: { status: 'ready', count: (chunks || []).length, source: 'markdown', updatedAt: Date.now() }
                    },
                    updatedAt: Date.now()
                });
            };
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    }

    async getRoles() {
        await this.init();
        return this._getAllDirect('roles');
    }

    async saveRole(role) {
        await this.init();
        await this._request('roles', 'readwrite', store => store.put(role));
        return role;
    }

    async deleteRole(id) {
        await this.init();
        await this._request('roles', 'readwrite', store => store.delete(id));
        return true;
    }

    async exportAllData() {
        await this.init();
        const conversations = await this.getConversations();
        const messages = {};
        for (const conversation of conversations) messages[conversation.id] = await this.getMessages(conversation.id);
        return {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            folders: await this.getFolders(),
            documents: await this.getDocuments(),
            conversations,
            messages,
            roles: await this.getRoles()
        };
    }

    async importData(data) {
        if (!data || !Array.isArray(data.conversations)) throw new Error('Format de sauvegarde Sealarca invalide.');
        await this.init();
        if (Array.isArray(data.folders)) for (const folder of data.folders) await this.saveFolder(folder);
        if (Array.isArray(data.documents)) for (const document of data.documents) await this.saveDocument(document);
        for (const conversation of data.conversations) {
            await this.saveConversation({ ...conversation, folderId: conversation.folderId || DEFAULT_FOLDER_ID });
            const messages = data.messages && data.messages[conversation.id];
            if (Array.isArray(messages)) for (const message of messages) await this.saveMessage(message);
        }
        if (Array.isArray(data.roles)) for (const role of data.roles) await this.saveRole(role);
        return true;
    }
}

window.SEALARCA_DEFAULT_FOLDER_ID = DEFAULT_FOLDER_ID;
window.sealarcaDb = new SealarcaDB();
