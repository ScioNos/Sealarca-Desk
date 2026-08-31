/**
 * Sealarca-Desk — Moteur de persistance locale IndexedDB
 * Base de données locale (sealarca_desk_db).
 * Les données persistées ici restent locales; les flux API sont gérés séparément.
 */

const DB_NAME = 'sealarca_desk_db';
const DB_VERSION = 4;
const DEFAULT_FOLDER_ID = 'folder_default';
const DEFAULT_ROLE_ID = 'role-document-analysis';
const SYSTEM_ROLE_VERSION = 2;

const COMMON_SYSTEM_PRINCIPLES = `Socle commun de fiabilité :
- Appuie-toi prioritairement sur le contenu fourni et ne présente comme fait que ce qui est étayé.
- N’invente aucun fait, montant, date, nom, source, citation ou référence.
- Sépare clairement les faits observés, l’analyse, l’interprétation et les recommandations.
- Signale les informations manquantes, ambiguïtés, contradictions, hypothèses et incertitudes utiles.
- Préserve fidèlement les noms, dates, chiffres et réserves importantes.
- Cite ou identifie les documents concernés lorsque les repères de provenance disponibles le permettent.
- Réponds dans la langue de l’utilisateur, sauf demande contraire.`;

const SYSTEM_ROLE_DEFINITIONS = [
    {
        id: 'role-document-analysis', name: 'Analyse documentaire', icon: '📄',
        description: 'Analysez vos documents, comparez les informations et identifiez les éléments importants.',
        systemPrompt: `Tu appliques une méthode générale d’analyse documentaire pour Sealarca Desk.
- Analyse un ou plusieurs documents et réponds aux questions à partir du dossier fourni.
- Retrouve les informations pertinentes, compare les documents ou versions et relève les contradictions.
- Identifie les personnes, organisations, dates, montants et événements importants lorsqu’ils sont présents.
- Signale les informations manquantes nécessaires, organise les analyses complexes et distingue les documents de ton interprétation.

${COMMON_SYSTEM_PRINCIPLES}`
    },
    {
        id: 'role-executive', name: 'Synthèse & Rédaction', icon: '✍️',
        description: 'Résumés, notes de synthèse, comptes-rendus, mémos et rédaction professionnelle.',
        systemPrompt: `Tu appliques une méthode de synthèse et de rédaction professionnelle pour Sealarca Desk.
- Résume, hiérarchise l’information, crée des notes de synthèse, mémos et comptes-rendus.
- Rédige ou reformule des courriers et autres textes selon la demande, en adaptant la longueur et le ton.
- Fais ressortir les décisions, risques, actions et questions ouvertes.
- Conserve les éléments décisionnels importants et distingue les informations constatées des formulations proposées.

${COMMON_SYSTEM_PRINCIPLES}`
    },
    {
        id: 'role-legal', name: 'Juridique & Contrats', icon: '⚖️',
        description: 'Analyse de contrats, clauses, obligations, risques et documents juridiques.',
        systemPrompt: `Tu appliques une méthode d’analyse juridique et contractuelle rigoureuse, sans te présenter comme juriste ou avocat.
- Identifie les parties, obligations, droits, délais, conditions, clauses, ambiguïtés et contradictions.
- Analyse les risques contractuels, les déséquilibres éventuels et compare les versions lorsque plusieurs textes sont fournis.
- Propose des reformulations uniquement lorsque l’utilisateur le demande et distingue toujours le texte du document de ton analyse.
- Si le contexte suisse est établi par le dossier ou la demande, tu peux l’examiner ; n’invente aucun article de loi, jurisprudence, doctrine ou référence réglementaire.
- Signale toute dépendance à une source juridique externe absente du dossier, sans ajouter de disclaimer automatique.

${COMMON_SYSTEM_PRINCIPLES}`
    },
    {
        id: 'role-fiduciary', name: 'Fiscal & Fiduciaire', icon: '📊',
        description: 'Analyse financière, comptable, fiduciaire et fiscale à partir de vos documents.',
        systemPrompt: `Tu appliques une méthode d’analyse financière, comptable, fiduciaire et fiscale, sans te présenter comme expert certifié.
- Analyse les bilans, comptes de résultat, tableaux financiers et périodes comparées.
- Calcule et explique les ratios lorsque les données le permettent, en montrant les calculs importants.
- Identifie les anomalies, incohérences et valeurs manquantes ; n’invente jamais un montant absent.
- Distingue les chiffres constatés de leur interprétation.
- Pour la fiscalité, ne présume pas la juridiction et signale-la lorsqu’elle est déterminante ; n’invente aucun taux, seuil, délai ou règle.

${COMMON_SYSTEM_PRINCIPLES}`
    },
    {
        id: 'role-compliance', name: 'Conformité & Confidentialité', icon: '🛡️',
        description: 'Analyse des exigences de conformité, confidentialité, diligence et protection des données.',
        systemPrompt: `Tu appliques une méthode d’analyse de conformité et de confidentialité, sans te présenter comme compliance officer ou professionnel certifié.
- Identifie les obligations présentes, les risques, les écarts et les procédures décrites dans les documents.
- Analyse les questions KYC/LBA et la protection des données uniquement lorsqu’elles sont pertinentes pour le dossier.
- Distingue une obligation réglementaire d’une bonne pratique et distingue clairement les juridictions concernées.
- Identifie les éléments manquants nécessaires à une conclusion et n’invente aucune obligation réglementaire.
- Ne mélange pas automatiquement LBA, CDB, LPD et RGPD lorsque le dossier ne les rend pas tous pertinents.

${COMMON_SYSTEM_PRINCIPLES}`
    }
];

const LEGACY_SYSTEM_ROLE_SIGNATURES = {
    'role-legal': {
        name: 'Juriste & Droit des Contrats',
        description: 'Analyse rigoureuse de clauses contractuelles, identification des risques et conformité (CO/LPD).',
        systemPrompt: `Tu es un juriste expert de haut niveau spécialisé en droit suisse (Code des Obligations, Loi sur la protection des données - LPD) et droit comparé.
Ton rôle est d'analyser minutieusement les contrats, actes et pièces juridiques.
- Identifie les clauses à risque, ambiguïtés et déséquilibres.
- Propose des reformulations claires et protectrices.
- Structure tes réponses avec méthode : Constat, Analyse juridique, Recommandations concrètes.`
    },
    'role-fiduciary': {
        name: 'Expert Fiscal & Fiduciaire',
        description: 'Analyse de bilans, comptes de résultat, ratios financiers et conformité fiscale.',
        systemPrompt: `Tu es un expert fiduciaire et fiscaliste chevronné.
Ton rôle est d'analyser des documents comptables, tableaux financiers (Excel/CSV) et déclarations fiscales.
- Analyse les indicateurs de performance, de liquidité et de solvabilité.
- Relève les anomalies ou incohérences dans les données chiffrées.
- Rédige des synthèses financières claires pour la direction.`
    },
    'role-compliance': {
        name: 'Conformité & Secret Professionnel',
        description: 'Vérification de conformité réglementaire, diligence raisonnable (KYC/LBA) et confidentialité.',
        systemPrompt: `Tu es un officier de conformité (Compliance Officer) et expert en réglementation suisse et internationale (LBA, CDB, RGPD/nLPD).
Ton rôle est d'évaluer les risques de conformité, de vérifier l'adéquation des processus et d'assister dans la rédaction de mémos de conformité rigoureux.`
    },
    'role-executive': {
        name: 'Synthèse Exécutive & Rédaction',
        description: 'Restitution synthétique, mémos de direction, comptes-rendus et courriers officiels.',
        systemPrompt: `Tu es un conseiller en rédaction exécutive pour comités de direction et conseils d'administration.
Ton rôle est de synthétiser des dossiers volumineux en notes de synthèse concises, percutantes et élégantes, en conservant tous les éléments décisionnels cruciaux.`
    }
};

function hasLegacySystemRoleSignature(role, legacy) {
    return role && legacy && role.name === legacy.name && role.description === legacy.description && role.systemPrompt === legacy.systemPrompt;
}

function mergeSystemRoles(existingRoles) {
    const roles = (Array.isArray(existingRoles) ? existingRoles : []).map(role => ({ ...role }));
    const byId = new Map(roles.map(role => [role.id, role]));
    for (const definition of SYSTEM_ROLE_DEFINITIONS) {
        const existing = byId.get(definition.id);
        if (!existing) {
            const systemRole = { ...definition, kind: 'system', systemVersion: SYSTEM_ROLE_VERSION };
            roles.push(systemRole);
            byId.set(systemRole.id, systemRole);
        } else if (existing.kind === 'system' || (!existing.kind && hasLegacySystemRoleSignature(existing, LEGACY_SYSTEM_ROLE_SIGNATURES[definition.id]))) {
            const systemRole = { ...existing, ...definition, kind: 'system', systemVersion: SYSTEM_ROLE_VERSION };
            byId.set(systemRole.id, systemRole);
        } else if (!existing.kind) {
            byId.set(existing.id, { ...existing, kind: 'custom' });
        }
    }
    return roles.map(role => byId.get(role.id) || role);
}

class SealarcaDB {
    constructor() {
        this.db = null;
        this.initPromise = null;
    }

    async init() {
        if (this.db) return this.db;
        if (this.initPromise) return this.initPromise;

        const initPromise = new Promise((resolve, reject) => {
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

                if (!db.objectStoreNames.contains('documentProfiles')) {
                    const profileStore = db.createObjectStore('documentProfiles', { keyPath: 'documentId' });
                    profileStore.createIndex('folderId', 'folderId', { unique: false });
                    profileStore.createIndex('inputFingerprint', 'inputFingerprint', { unique: false });
                    profileStore.createIndex('status', 'status', { unique: false });
                    profileStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                }

                if (!db.objectStoreNames.contains('processingJobs')) {
                    const jobStore = db.createObjectStore('processingJobs', { keyPath: 'id' });
                    jobStore.createIndex('folderId', 'folderId', { unique: false });
                    jobStore.createIndex('documentId', 'documentId', { unique: false });
                    jobStore.createIndex('status', 'status', { unique: false });
                    jobStore.createIndex('nextRunAt', 'nextRunAt', { unique: false });
                    jobStore.createIndex('inputFingerprint', 'inputFingerprint', { unique: false });
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
                    this.db.close();
                    this.db = null;
                    reject(error);
                }
            };

            request.onerror = (event) => {
                console.error('Erreur ouverture IndexedDB Sealarca:', event.target.error);
                reject(event.target.error);
            };
            request.onblocked = () => reject(new Error('La migration IndexedDB est bloquée par un autre onglet Sealarca-Desk.'));
        });

        this.initPromise = initPromise.catch(error => {
            this.initPromise = null;
            throw error;
        });
        return this.initPromise;
    }

    _request(storeName, mode, operation) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, mode);
            const store = tx.objectStore(storeName);
            let request;
            let requestResult;
            try {
                request = operation(store, tx);
            } catch (error) {
                reject(error);
                return;
            }
            if (request) {
                request.onsuccess = () => { requestResult = request.result; };
                request.onerror = () => reject(request.error);
            }
            tx.oncomplete = () => resolve(request ? requestResult : true);
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
        const mergedRoles = mergeSystemRoles(existingRoles);
        await Promise.all(mergedRoles.map(role => this._request('roles', 'readwrite', store => store.put(role))));
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
        const folders = await this.getFolders();
        if (id === DEFAULT_FOLDER_ID && folders.length <= 1) throw new Error('Au moins un dossier doit être conservé.');
        const conversations = await this.getConversations(id);
        const documents = await this.getDocuments(id);
        const processingJobs = await this.getProcessingJobs(id);
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['folders', 'conversations', 'messages', 'documents', 'documentChunks', 'documentProfiles', 'processingJobs'], 'readwrite');
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
            const profileStore = tx.objectStore('documentProfiles');
            const jobStore = tx.objectStore('processingJobs');
            const jobIndex = tx.objectStore('processingJobs').index('documentId');
            processingJobs.forEach(job => jobStore.delete(job.id));
            documents.forEach(document => {
                docStore.delete(document.id);
                profileStore.delete(document.id);
                const jobReq = jobIndex.openCursor(IDBKeyRange.only(document.id));
                jobReq.onsuccess = event => {
                    const cursor = event.target.result;
                    if (cursor) { cursor.delete(); cursor.continue(); }
                };
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
            tx.onabort = () => reject(tx.error || new Error('Suppression de la consultation annulée.'));
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
            canonicalFormat: 'markdown',
            markdown: String(document.markdown || ''),
            sourceMapVersion: Number.isInteger(document.sourceMapVersion) ? document.sourceMapVersion : 1,
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
            const tx = this.db.transaction(['documents', 'documentChunks', 'documentProfiles', 'processingJobs'], 'readwrite');
            tx.objectStore('documents').delete(id);
            tx.objectStore('documentProfiles').delete(id);
            const jobReq = tx.objectStore('processingJobs').index('documentId').openCursor(IDBKeyRange.only(id));
            jobReq.onsuccess = event => {
                const cursor = event.target.result;
                if (cursor) { cursor.delete(); cursor.continue(); }
            };
            const req = tx.objectStore('documentChunks').index('documentId').openCursor(IDBKeyRange.only(id));
            req.onsuccess = event => {
                const cursor = event.target.result;
                if (cursor) { cursor.delete(); cursor.continue(); }
            };
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error || new Error('Suppression du document annulée.'));
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


    async getDocumentProfile(documentId) {
        await this.init();
        return (await this._request('documentProfiles', 'readonly', store => store.get(documentId))) || null;
    }

    async getDocumentProfiles(folderId = null) {
        await this.init();
        const profiles = folderId
            ? await this._request('documentProfiles', 'readonly', store => store.index('folderId').getAll(folderId))
            : await this._getAllDirect('documentProfiles');
        return profiles.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }

    async saveDocumentProfile(profile) {
        await this.init();
        if (!profile?.documentId) throw new Error('Une fiche doit être liée à un document.');
        const now = Date.now();
        const value = {
            ...profile,
            status: profile.status || 'valid',
            schemaVersion: Number(profile.schemaVersion) || 1,
            people: Array.isArray(profile.people) ? profile.people : [],
            organizations: Array.isArray(profile.organizations) ? profile.organizations : [],
            importantDates: Array.isArray(profile.importantDates) ? profile.importantDates : [],
            importantItems: Array.isArray(profile.importantItems) ? profile.importantItems : [],
            createdAt: profile.createdAt || now,
            updatedAt: now
        };
        await this._request('documentProfiles', 'readwrite', store => store.put(value));
        return value;
    }

    async deleteDocumentProfile(documentId) {
        await this.init();
        await this._request('documentProfiles', 'readwrite', store => store.delete(documentId));
        return true;
    }

    async getProcessingJob(id) {
        await this.init();
        return (await this._request('processingJobs', 'readonly', store => store.get(id))) || null;
    }

    async getProcessingJobs(folderId = null) {
        await this.init();
        const jobs = folderId
            ? await this._request('processingJobs', 'readonly', store => store.index('folderId').getAll(folderId))
            : await this._getAllDirect('processingJobs');
        return jobs.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    }

    async saveProcessingJob(job) {
        await this.init();
        if (!job?.id) throw new Error('Identifiant de job manquant.');
        const now = Date.now();
        const value = {
            ...job,
            status: ['pending', 'running', 'completed', 'failed', 'cancelled'].includes(job.status) ? job.status : 'pending',
            attempts: Number(job.attempts) || 0,
            maxAttempts: Math.max(1, Number(job.maxAttempts) || 5),
            createdAt: job.createdAt || now,
            updatedAt: now
        };
        await this._request('processingJobs', 'readwrite', store => store.put(value));
        return value;
    }

    async enqueueProcessingJob(job) {
        await this.init();
        const existing = (await this._request('processingJobs', 'readonly', store => store.index('documentId').getAll(job.documentId)))
            .find(item => item.type === job.type && item.inputFingerprint === job.inputFingerprint && ['pending', 'running'].includes(item.status));
        if (existing) return existing;
        const now = Date.now();
        return this.saveProcessingJob({
            ...job,
            id: job.id || 'job_' + now + '_' + Math.random().toString(36).slice(2, 9),
            status: 'pending',
            attempts: 0,
            nextRunAt: now,
            checkpoint: { stage: 'queued', at: now },
            createdAt: now
        });
    }

    async getRunnableProcessingJobs(now = Date.now(), limit = 2) {
        await this.init();
        const pending = await this._request('processingJobs', 'readonly', store => store.index('status').getAll('pending'));
        return pending
            .filter(job => !job.nextRunAt || job.nextRunAt <= now)
            .sort((a, b) => (a.nextRunAt || 0) - (b.nextRunAt || 0) || (a.createdAt || 0) - (b.createdAt || 0))
            .slice(0, Math.max(1, Number(limit) || 1));
    }

    async recoverInterruptedJobs() {
        await this.init();
        const running = await this._request('processingJobs', 'readonly', store => store.index('status').getAll('running'));
        for (const job of running) {
            await this.saveProcessingJob({
                ...job,
                status: 'pending',
                nextRunAt: Date.now(),
                checkpoint: { stage: 'recovered_after_interruption', previous: job.checkpoint || null, at: Date.now() }
            });
        }
        return running.length;
    }

    async deleteProcessingJob(id) {
        await this.init();
        await this._request('processingJobs', 'readwrite', store => store.delete(id));
        return true;
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
            version: '3.0',
            exportedAt: new Date().toISOString(),
            folders: await this.getFolders(),
            documents: await this.getDocuments(),
            documentProfiles: await this.getDocumentProfiles(),
            processingJobs: await this.getProcessingJobs(),
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
        if (Array.isArray(data.documentProfiles)) for (const profile of data.documentProfiles) await this.saveDocumentProfile(profile);
        if (Array.isArray(data.processingJobs)) for (const job of data.processingJobs) await this.saveProcessingJob(job);
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
window.SEALARCA_DEFAULT_ROLE_ID = DEFAULT_ROLE_ID;
window.SEALARCA_SYSTEM_ROLE_VERSION = SYSTEM_ROLE_VERSION;
window.SEALARCA_SYSTEM_ROLE_DEFINITIONS = SYSTEM_ROLE_DEFINITIONS;
window.SEALARCA_MERGE_SYSTEM_ROLES = mergeSystemRoles;
window.sealarcaDb = new SealarcaDB();
