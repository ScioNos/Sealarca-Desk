/**
 * Sealarca-Desk — Moteur de persistance locale IndexedDB
 * Base de données locale (sealarca_desk_db).
 * Les données persistées ici restent locales; les flux API sont gérés séparément.
 */

const DB_NAME = 'sealarca_desk_db';
const DB_VERSION = 6;
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
        } else if (existing.kind === 'system' && existing.systemVersion !== SYSTEM_ROLE_VERSION) {
            const systemRole = { ...existing, ...definition, kind: 'system', systemVersion: SYSTEM_ROLE_VERSION };
            byId.set(systemRole.id, systemRole);
        } else if (!existing.kind && hasLegacySystemRoleSignature(existing, LEGACY_SYSTEM_ROLE_SIGNATURES[definition.id])) {
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
        this.requiresReload = false;
    }

    async init() {
        if (this.requiresReload) throw new Error('La base locale a changé de version. Rechargez Sealarca-Desk pour continuer.');
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

                let operationStore;
                if (!db.objectStoreNames.contains('operations')) {
                    operationStore = db.createObjectStore('operations', { keyPath: 'id' });
                } else {
                    operationStore = tx.objectStore('operations');
                }
                if (!operationStore.indexNames.contains('folderId')) operationStore.createIndex('folderId', 'folderId', { unique: false });
                if (!operationStore.indexNames.contains('status')) operationStore.createIndex('status', 'status', { unique: false });
                if (!operationStore.indexNames.contains('updatedAt')) operationStore.createIndex('updatedAt', 'updatedAt', { unique: false });

                let traceStore;
                if (!db.objectStoreNames.contains('traces')) {
                    traceStore = db.createObjectStore('traces', { keyPath: 'id' });
                } else {
                    traceStore = tx.objectStore('traces');
                }
                if (!traceStore.indexNames.contains('folderId')) traceStore.createIndex('folderId', 'folderId', { unique: false });
                if (!traceStore.indexNames.contains('conversationId')) traceStore.createIndex('conversationId', 'conversationId', { unique: false });
                if (!traceStore.indexNames.contains('operationId')) traceStore.createIndex('operationId', 'operationId', { unique: false });
                if (!traceStore.indexNames.contains('createdAt')) traceStore.createIndex('createdAt', 'createdAt', { unique: false });

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
                            const updateRequest = cursor.update(conversation);
                            updateRequest.onerror = () => { try { request.transaction.abort(); } catch (_) {} };
                        }
                        cursor.continue();
                    };
                }

                if (oldVersion > 0 && oldVersion < 5 && db.objectStoreNames.contains('processingJobs')) {
                    const now = Date.now();
                    const jobCursor = tx.objectStore('processingJobs').openCursor();
                    jobCursor.onsuccess = cursorEvent => {
                        const cursor = cursorEvent.target.result;
                        if (!cursor) return;
                        const job = cursor.value;
                        if (job.status === 'running') {
                            job.status = 'failed';
                            job.errorKind = 'outcome_unknown';
                            job.lastError = 'Résultat réseau indéterminé : une relance peut répéter la requête.';
                            job.nextRunAt = null;
                            job.startedAt = null;
                            job.leaseOwner = null;
                            job.leaseToken = null;
                            job.leaseExpiresAt = null;
                            job.checkpoint = { stage: 'recovered_after_v4', outcome: 'outcome_unknown', previous: job.checkpoint || null, at: now };
                            const updateRequest = cursor.update(job);
                            updateRequest.onerror = () => { try { request.transaction.abort(); } catch (_) {} };
                        }
                        cursor.continue();
                    };
                }
            };

            request.onsuccess = async (event) => {
                this.db = event.target.result;
                this.db.onversionchange = () => {
                    const closedDatabase = this.db;
                    this.db = null;
                    this.initPromise = null;
                    this.requiresReload = true;
                    closedDatabase?.close();
                };
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
                request.onerror = () => reject(request.error || new Error('Opération IndexedDB impossible.'));
            }
            tx.oncomplete = () => resolve(request ? requestResult : true);
            tx.onerror = () => reject(tx.error || new Error('Transaction IndexedDB annulée.'));
            tx.onabort = () => reject(tx.error || new Error('Transaction IndexedDB annulée.'));
        });
    }

    _transaction(storeNames, mode, setup) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeNames, mode);
            let result;
            let failure = null;
            const fail = error => {
                failure = error || new Error('Transaction IndexedDB annulée.');
                try { tx.abort(); } catch (_) { reject(failure); }
            };
            tx.oncomplete = () => resolve(result);
            tx.onerror = () => reject(failure || tx.error);
            tx.onabort = () => reject(failure || tx.error || new Error('Transaction IndexedDB annulée.'));
            try { setup(tx, value => { result = value; }, fail); }
            catch (error) { fail(error); }
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
        const existingById = new Map(existingRoles.map(role => [role.id, role]));
        const mergedRoles = mergeSystemRoles(existingRoles);
        const changed = mergedRoles.filter(role => {
            const existing = existingById.get(role.id);
            if (!existing) return true;
            try { return JSON.stringify(existing) !== JSON.stringify(role); }
            catch (_) { return true; }
        });
        if (!changed.length) return;
        await this._transaction('roles', 'readwrite', (tx, setResult, fail) => {
            const store = tx.objectStore('roles');
            for (const role of changed) {
                const request = store.put(role);
                request.onerror = () => fail(request.error || new Error('Synchronisation des modes impossible.'));
            }
            setResult(true);
        });
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
            documentSettings: folder.documentSettings && typeof folder.documentSettings === 'object'
                ? {
                    contextMode: ['manual', 'automatic'].includes(folder.documentSettings.contextMode) ? folder.documentSettings.contextMode : null
                }
                : { contextMode: null },
            createdAt: folder.createdAt || now,
            updatedAt: now
        };
        await this._request('folders', 'readwrite', store => store.put(value));
        return value;
    }

    async deleteFolder(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['folders', 'conversations', 'messages', 'documents', 'documentChunks', 'documentProfiles', 'processingJobs', 'operations', 'traces'], 'readwrite');
            let failure = null;
            let missing = false;
            const abortWith = error => {
                failure = error;
                try { tx.abort(); } catch (_) { reject(error); }
            };
            tx.oncomplete = () => resolve(!missing);
            tx.onerror = () => reject(failure || tx.error || new Error('Suppression du dossier annulée.'));
            tx.onabort = () => reject(failure || tx.error || new Error('Suppression du dossier annulée.'));

            const folders = tx.objectStore('folders');
            const folderRequest = folders.get(id);
            folderRequest.onerror = () => abortWith(folderRequest.error || new Error('Lecture du dossier impossible.'));
            folderRequest.onsuccess = () => {
                if (!folderRequest.result) { missing = true; return; }
                const allFoldersRequest = folders.getAll();
                allFoldersRequest.onerror = () => abortWith(allFoldersRequest.error || new Error('Lecture des dossiers impossible.'));
                allFoldersRequest.onsuccess = () => {
                    if (id === DEFAULT_FOLDER_ID && allFoldersRequest.result.length <= 1) {
                        abortWith(new Error('Au moins un dossier doit être conservé.'));
                        return;
                    }

                    const conversations = tx.objectStore('conversations');
                    const documents = tx.objectStore('documents');
                    const jobs = tx.objectStore('processingJobs');
                    const profiles = tx.objectStore('documentProfiles');
                    const chunks = tx.objectStore('documentChunks');
                    const operations = tx.objectStore('operations');
                    const traces = tx.objectStore('traces');
                    const removeIndexedRecords = (index, key) => {
                        const request = index.openCursor(IDBKeyRange.only(key));
                        request.onerror = () => abortWith(request.error || new Error('Suppression en cascade impossible.'));
                        request.onsuccess = event => {
                            const cursor = event.target.result;
                            if (!cursor) return;
                            const deleteRequest = cursor.delete();
                            deleteRequest.onerror = () => abortWith(deleteRequest.error || new Error('Suppression en cascade impossible.'));
                            cursor.continue();
                        };
                    };

                    const conversationsRequest = conversations.index('folderId').getAll(id);
                    conversationsRequest.onerror = () => abortWith(conversationsRequest.error || new Error('Lecture des conversations impossible.'));
                    conversationsRequest.onsuccess = () => {
                        const messages = tx.objectStore('messages');
                        for (const conversation of conversationsRequest.result) {
                            conversations.delete(conversation.id);
                            removeIndexedRecords(messages.index('conversationId'), conversation.id);
                        }
                    };

                    const documentsRequest = documents.index('folderId').getAll(id);
                    documentsRequest.onerror = () => abortWith(documentsRequest.error || new Error('Lecture des documents impossible.'));
                    documentsRequest.onsuccess = () => {
                        for (const document of documentsRequest.result) {
                            documents.delete(document.id);
                            profiles.delete(document.id);
                            removeIndexedRecords(jobs.index('documentId'), document.id);
                            removeIndexedRecords(chunks.index('documentId'), document.id);
                        }
                    };

                    const jobsRequest = jobs.index('folderId').getAll(id);
                    jobsRequest.onerror = () => abortWith(jobsRequest.error || new Error('Lecture des jobs impossible.'));
                    jobsRequest.onsuccess = () => jobsRequest.result.forEach(job => jobs.delete(job.id));
                    const operationsRequest = operations.index('folderId').getAll(id);
                    operationsRequest.onerror = () => abortWith(operationsRequest.error || new Error('Lecture des opérations impossible.'));
                    operationsRequest.onsuccess = () => operationsRequest.result.forEach(operation => operations.delete(operation.id));
                    removeIndexedRecords(chunks.index('folderId'), id);
                    removeIndexedRecords(profiles.index('folderId'), id);
                    removeIndexedRecords(traces.index('folderId'), id);
                    folders.delete(id);
                };
            };
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

    async saveConversation(conversation, { allowCreate = false } = {}) {
        await this.init();
        const now = Date.now();
        const value = {
            ...conversation,
            folderId: conversation.folderId || DEFAULT_FOLDER_ID,
            createdAt: conversation.createdAt || now,
            updatedAt: now
        };
        await this._transaction(['folders', 'conversations'], 'readwrite', (tx, setResult, fail) => {
            const folderRequest = tx.objectStore('folders').get(value.folderId);
            const conversationRequest = tx.objectStore('conversations').get(value.id);
            let folderRecord;
            let conversationRecord;
            let remaining = 2;
            const ready = () => {
                remaining -= 1;
                if (remaining) return;
                if (!folderRecord) { fail(new Error('Le dossier de cette conversation n’existe plus.')); return; }
                if (!conversationRecord && !allowCreate) { fail(new Error('Cette conversation a été supprimée.')); return; }
                tx.objectStore('conversations')[conversationRecord ? 'put' : 'add'](value);
                setResult(value);
            };
            folderRequest.onerror = () => fail(folderRequest.error);
            conversationRequest.onerror = () => fail(conversationRequest.error);
            folderRequest.onsuccess = () => { folderRecord = folderRequest.result; ready(); };
            conversationRequest.onsuccess = () => { conversationRecord = conversationRequest.result; ready(); };
        });
        return value;
    }

    async deleteConversation(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['conversations', 'messages', 'traces'], 'readwrite');
            tx.objectStore('conversations').delete(id);
            const req = tx.objectStore('messages').index('conversationId').openCursor(IDBKeyRange.only(id));
            req.onsuccess = event => {
                const cursor = event.target.result;
                if (cursor) { cursor.delete(); cursor.continue(); }
            };
            const traces = tx.objectStore('traces').index('conversationId').openCursor(IDBKeyRange.only(id));
            traces.onsuccess = event => {
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
        return this._saveMessage(message, null);
    }

    async saveMessageWithTrace(message, trace) {
        if (!trace?.id) throw new Error('Une trace doit avoir un identifiant.');
        return this._saveMessage(message, trace);
    }

    async _saveMessage(message, trace = null) {
        await this.init();
        const value = { ...message, ...(trace ? { traceId: trace.id } : {}), createdAt: message.createdAt || Date.now() };
        const stores = trace ? ['conversations', 'messages', 'traces'] : ['conversations', 'messages'];
        await this._transaction(stores, 'readwrite', (tx, setResult, fail) => {
            if (!value.id || !value.conversationId) { fail(new Error('Identifiant de message ou de conversation manquant.')); return; }
            const conversationRequest = tx.objectStore('conversations').get(value.conversationId);
            conversationRequest.onerror = () => fail(conversationRequest.error || new Error('Lecture de la conversation impossible.'));
            conversationRequest.onsuccess = () => {
                const conversation = conversationRequest.result;
                if (!conversation) { fail(new Error('La conversation de ce message n’existe plus.')); return; }
                if (trace && (trace.folderId !== conversation.folderId || trace.messageId && trace.messageId !== value.id
                    || trace.conversationId && trace.conversationId !== value.conversationId)) {
                    fail(new Error('La trace ne correspond pas au dossier et au message.'));
                    return;
                }
                const addRequest = tx.objectStore('messages').add(value);
                addRequest.onerror = () => fail(addRequest.error || new Error('Enregistrement du message impossible (collision d’identifiant ?).'));
                addRequest.onsuccess = () => {
                    if (trace) {
                        const traceValue = { ...trace, messageId: value.id, conversationId: value.conversationId, createdAt: trace.createdAt || Date.now() };
                        const traceRequest = tx.objectStore('traces').add(traceValue);
                        traceRequest.onerror = () => fail(traceRequest.error || new Error('Enregistrement de la trace impossible.'));
                    }
                    const bumpRequest = tx.objectStore('conversations').put({ ...conversation, updatedAt: Date.now() });
                    bumpRequest.onerror = () => fail(bumpRequest.error || new Error('Actualisation de la conversation impossible.'));
                };
                setResult(value);
            };
        });
        return value;
    }

    async getTrace(id) {
        await this.init();
        return id ? (await this._request('traces', 'readonly', store => store.get(id))) || null : null;
    }

    async getTraces(folderId) {
        await this.init();
        const traces = folderId
            ? await this._request('traces', 'readonly', store => store.index('folderId').getAll(folderId))
            : await this._getAllDirect('traces');
        return traces.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    async getOperations(folderId) {
        await this.init();
        const operations = folderId
            ? await this._request('operations', 'readonly', store => store.index('folderId').getAll(folderId))
            : await this._getAllDirect('operations');
        return operations.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }

    async getOperation(id) {
        await this.init();
        return id ? (await this._request('operations', 'readonly', store => store.get(id))) || null : null;
    }

    async createOperation(operation) {
        await this.init();
        if (!operation?.id || !operation.folderId || !['pending', 'running'].includes(operation.status)) throw new Error('Opération invalide.');
        const value = { ...operation, createdAt: operation.createdAt || Date.now(), updatedAt: operation.updatedAt || Date.now() };
        return this._transaction(['folders', 'operations'], 'readwrite', (tx, setResult, fail) => {
            const folderRequest = tx.objectStore('folders').get(value.folderId);
            folderRequest.onerror = () => fail(folderRequest.error);
            folderRequest.onsuccess = () => {
                if (!folderRequest.result) { fail(new Error('Le dossier de cette opération n’existe plus.')); return; }
                const request = tx.objectStore('operations').add(value);
                request.onerror = () => fail(request.error || new Error('Enregistrement de l’opération impossible.'));
                setResult(value);
            };
        });
    }

    async failPendingOperation(id, notice) {
        await this.init();
        const now = Date.now();
        return this._transaction('operations', 'readwrite', (tx, setResult, fail) => {
            const store = tx.objectStore('operations');
            const request = store.get(id);
            request.onerror = () => fail(request.error);
            request.onsuccess = () => {
                const operation = request.result;
                if (!operation || operation.status !== 'pending') { setResult(false); return; }
                const value = {
                    ...operation,
                    status: 'failed',
                    notices: [...(operation.notices || []), { ...notice, createdAt: notice?.createdAt || now }],
                    updatedAt: now,
                    completedAt: now
                };
                const putRequest = store.put(value);
                putRequest.onerror = () => fail(putRequest.error);
                setResult(value);
            };
        });
    }

    async claimOperation(id, ownerId, leaseToken, leaseDurationMs = 180000) {
        await this.init();
        if (!id || !ownerId || !leaseToken) return false;
        const now = Date.now();
        return this._transaction('operations', 'readwrite', (tx, setResult, fail) => {
            const store = tx.objectStore('operations');
            const request = store.get(id);
            request.onerror = () => fail(request.error);
            request.onsuccess = () => {
                const operation = request.result;
                if (!operation || operation.status !== 'pending') { setResult(false); return; }
                const folderRequest = store.index('folderId').getAll(operation.folderId);
                folderRequest.onerror = () => fail(folderRequest.error);
                folderRequest.onsuccess = () => {
                    const anotherRunning = folderRequest.result.some(item => item.id !== id && item.status === 'running' && Number(item.leaseExpiresAt) > now);
                    if (anotherRunning) { setResult(false); return; }
                    const value = {
                        ...operation,
                        status: 'running',
                        startedAt: operation.startedAt || now,
                        leaseOwner: ownerId,
                        leaseToken,
                        leaseExpiresAt: now + Math.max(30000, Number(leaseDurationMs) || 180000),
                        updatedAt: now
                    };
                    const putRequest = store.put(value);
                    putRequest.onerror = () => fail(putRequest.error);
                    setResult(value);
                };
            };
        });
    }

    async updateOperationIfOwner(id, ownerId, leaseToken, changes) {
        await this.init();
        const now = Date.now();
        return this._transaction('operations', 'readwrite', (tx, setResult, fail) => {
            const store = tx.objectStore('operations');
            const request = store.get(id);
            request.onerror = () => fail(request.error);
            request.onsuccess = () => {
                const operation = request.result;
                if (!operation || operation.status !== 'running' || operation.leaseOwner !== ownerId
                    || operation.leaseToken !== leaseToken || Number(operation.leaseExpiresAt) <= now) {
                    setResult(false);
                    return;
                }
                const status = changes?.status ?? operation.status;
                if (status !== 'running' && !['completed', 'partial', 'failed', 'cancelled'].includes(status)) {
                    fail(new Error('État d’opération invalide.'));
                    return;
                }
                const terminal = status !== 'running';
                const value = {
                    ...operation,
                    ...changes,
                    ...(terminal ? { leaseOwner: null, leaseToken: null, leaseExpiresAt: null } : { leaseExpiresAt: now + 180000 }),
                    ...(status === 'cancelled' ? { cancelledAt: now } : {}),
                    ...(terminal ? { completedAt: now } : {}),
                    updatedAt: now
                };
                const putRequest = store.put(value);
                putRequest.onerror = () => fail(putRequest.error);
                setResult(value);
            };
        });
    }

    async renewOperationLease(id, ownerId, leaseToken, leaseDurationMs = 180000) {
        await this.init();
        const now = Date.now();
        return this._transaction('operations', 'readwrite', (tx, setResult, fail) => {
            const store = tx.objectStore('operations');
            const request = store.get(id);
            request.onerror = () => fail(request.error);
            request.onsuccess = () => {
                const operation = request.result;
                if (!operation || operation.status !== 'running' || operation.leaseOwner !== ownerId
                    || operation.leaseToken !== leaseToken || Number(operation.leaseExpiresAt) <= now) {
                    setResult(false);
                    return;
                }
                store.put({ ...operation, leaseExpiresAt: now + Math.max(30000, Number(leaseDurationMs) || 180000), updatedAt: now });
                setResult(true);
            };
        });
    }

    async recoverStaleOperations(now = Date.now()) {
        await this.init();
        return this._transaction('operations', 'readwrite', (tx, setResult, fail) => {
            const store = tx.objectStore('operations');
            const request = store.index('status').getAll('running');
            request.onerror = () => fail(request.error);
            request.onsuccess = () => {
                let recovered = 0;
                for (const operation of request.result) {
                    if (Number(operation.leaseExpiresAt) > now) continue;
                    const notices = Array.isArray(operation.notices) ? operation.notices : [];
                    store.put({
                        ...operation,
                        status: 'failed',
                        leaseOwner: null,
                        leaseToken: null,
                        leaseExpiresAt: null,
                        notices: [...notices, { code: 'operation_interrupted', severity: 'warning', recoverable: true, metadata: {}, createdAt: now }],
                        steps: (operation.steps || []).map(step => step.status === 'running' ? { ...step, status: 'failed', completedAt: now } : step),
                        updatedAt: now,
                        completedAt: now
                    });
                    recovered += 1;
                }
                setResult(recovered);
            };
        });
    }

    async completeLocalOperation({ operationId, ownerId, leaseToken, operationChanges, trace, resultRef }) {
        await this.init();
        const now = Date.now();
        if (!operationId || !trace?.id || !trace.folderId) throw new Error('Résultat local incomplet.');
        return this._transaction(['operations', 'traces', 'folders'], 'readwrite', (tx, setResult, fail) => {
            const store = tx.objectStore('operations');
            const operationRequest = store.get(operationId);
            const folderRequest = tx.objectStore('folders').get(trace.folderId);
            let operation;
            let folder;
            let remaining = 2;
            const ready = () => {
                remaining -= 1;
                if (remaining) return;
                if (!operation || operation.status !== 'running' || operation.leaseOwner !== ownerId
                    || operation.leaseToken !== leaseToken || Number(operation.leaseExpiresAt) <= now) {
                    setResult(false);
                    return;
                }
                if (!folder || folder.id !== operation.folderId || trace.folderId !== operation.folderId) {
                    fail(new Error('Le dossier de cette opération n’existe plus.'));
                    return;
                }
                const status = operationChanges?.status;
                if (!['completed', 'partial'].includes(status)) { fail(new Error('État final d’opération invalide.')); return; }
                const traceRequest = tx.objectStore('traces').add({ ...trace, operationId, createdAt: trace.createdAt || now });
                traceRequest.onerror = () => fail(traceRequest.error || new Error('Enregistrement de la trace impossible.'));
                const value = {
                    ...operation,
                    ...operationChanges,
                    resultRef: { traceId: trace.id, ...(resultRef && typeof resultRef === 'object' ? resultRef : {}) },
                    leaseOwner: null,
                    leaseToken: null,
                    leaseExpiresAt: null,
                    updatedAt: now,
                    completedAt: now
                };
                const putRequest = store.put(value);
                putRequest.onerror = () => fail(putRequest.error || new Error('Finalisation de l’opération impossible.'));
                setResult({ operation: value, trace: { ...trace, operationId, createdAt: trace.createdAt || now } });
            };
            operationRequest.onerror = () => fail(operationRequest.error);
            folderRequest.onerror = () => fail(folderRequest.error);
            operationRequest.onsuccess = () => { operation = operationRequest.result; ready(); };
            folderRequest.onsuccess = () => { folder = folderRequest.result; ready(); };
        });
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
        if (!uniqueIds.length) return [];
        return this._transaction('documents', 'readonly', (tx, setResult, fail) => {
            const store = tx.objectStore('documents');
            const results = new Array(uniqueIds.length);
            let remaining = uniqueIds.length;
            uniqueIds.forEach((id, index) => {
                const request = store.get(id);
                request.onerror = () => fail(request.error || new Error('Lecture document impossible.'));
                request.onsuccess = () => {
                    results[index] = request.result || null;
                    remaining -= 1;
                    if (!remaining) setResult(results.filter(Boolean));
                };
            });
        });
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
        await this._transaction(['folders', 'documents'], 'readwrite', (tx, setResult, fail) => {
            const folderRequest = tx.objectStore('folders').get(value.folderId);
            folderRequest.onerror = () => fail(folderRequest.error);
            folderRequest.onsuccess = () => {
                if (!folderRequest.result) { fail(new Error('Le dossier de ce document n’existe plus.')); return; }
                tx.objectStore('documents').put(value);
                setResult(value);
            };
        });
        return value;
    }

    async replaceDocumentExtraction(id, parsed, expectedRevision = 0) {
        await this.init();
        return this._transaction(['documents', 'documentProfiles', 'documentChunks', 'processingJobs', 'operations'], 'readwrite', (tx, setResult, fail) => {
            const request = tx.objectStore('documents').get(id);
            request.onerror = () => fail(request.error);
            request.onsuccess = () => {
                const current = request.result;
                if (!current || Number(current.metadata?.extraction?.revision || 0) !== expectedRevision) {
                    fail(new Error('Le document a été supprimé ou modifié pendant la réextraction.')); return;
                }
                const now = Date.now();
                const value = { ...current, markdown: parsed.markdown, sourceMap: parsed.sourceMap, sourceMapVersion: parsed.sourceMapVersion,
                    metadata: { ...current.metadata, ...parsed.metadata, extraction: { ...parsed.metadata.extraction, revision: expectedRevision + 1 } },
                    derivations: { chunks: { status: 'not_generated', source: 'markdown' } }, updatedAt: now };
                tx.objectStore('documents').put(value);
                const profileRequest = tx.objectStore('documentProfiles').get(id);
                profileRequest.onsuccess = () => {
                    if (profileRequest.result) tx.objectStore('documentProfiles').put({ ...profileRequest.result, status: 'stale', updatedAt: now });
                };
                const chunks = tx.objectStore('documentChunks').index('documentId').openCursor(IDBKeyRange.only(id));
                chunks.onsuccess = () => { const cursor = chunks.result; if (cursor) { cursor.delete(); cursor.continue(); } };
                const jobs = tx.objectStore('processingJobs').index('documentId').openCursor(IDBKeyRange.only(id));
                jobs.onsuccess = () => {
                    const cursor = jobs.result;
                    if (!cursor) return;
                    if (['pending', 'running'].includes(cursor.value.status)) cursor.update({ ...cursor.value, status: 'cancelled', leaseOwner: null, leaseToken: null, leaseExpiresAt: null,
                        checkpoint: { stage: 'extraction_replaced', at: now }, updatedAt: now });
                    cursor.continue();
                };
                const operations = tx.objectStore('operations').index('folderId').openCursor(IDBKeyRange.only(current.folderId));
                operations.onsuccess = () => {
                    const cursor = operations.result;
                    if (!cursor) return;
                    if (['pending', 'running'].includes(cursor.value.status) && cursor.value.documentIds?.includes(id)) cursor.update({ ...cursor.value, status: 'cancelled',
                        steps: (cursor.value.steps || []).map(step => step.status === 'running' ? { ...step, status: 'cancelled', completedAt: now } : step),
                        leaseOwner: null, leaseToken: null, leaseExpiresAt: null, cancelledAt: now, completedAt: now, updatedAt: now });
                    cursor.continue();
                };
                setResult(value);
            };
        });
    }

    async deleteDocument(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['documents', 'documentChunks', 'documentProfiles', 'processingJobs', 'operations'], 'readwrite');
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
            const operationReq = tx.objectStore('operations').openCursor();
            operationReq.onsuccess = event => {
                const cursor = event.target.result;
                if (!cursor) return;
                const operation = cursor.value;
                if ((operation.documentIds || []).includes(id) && ['pending', 'running'].includes(operation.status)) {
                    const now = Date.now();
                    cursor.update({
                        ...operation,
                        status: 'cancelled',
                        notices: [...(operation.notices || []), {
                            code: 'document_deleted',
                            severity: 'info',
                            documentId: id,
                            recoverable: false,
                            metadata: {},
                            createdAt: now
                        }],
                        updatedAt: now,
                        completedAt: now,
                        cancelledAt: now,
                        leaseOwner: null,
                        leaseToken: null,
                        leaseExpiresAt: null
                    });
                }
                cursor.continue();
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
        if (!document?.id) throw new Error('Identifiant de document manquant.');
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['documents', 'documentChunks'], 'readwrite');
            const chunkStore = tx.objectStore('documentChunks');
            const documentStore = tx.objectStore('documents');
            const checkRequest = documentStore.get(document.id);
            let failure = null;
            const abortWith = error => { failure = error; try { tx.abort(); } catch (_) { reject(error); } };
            checkRequest.onerror = () => abortWith(checkRequest.error || new Error('Lecture du document impossible.'));
            checkRequest.onsuccess = () => {
                if (!checkRequest.result) { abortWith(new Error('Le document n’existe plus.')); return; }
                const now = Date.now();
                const req = chunkStore.index('documentId').openCursor(IDBKeyRange.only(document.id));
                req.onerror = () => abortWith(req.error || new Error('Lecture des chunks impossible.'));
                req.onsuccess = event => {
                    const cursor = event.target.result;
                    if (cursor) {
                        const deleteRequest = cursor.delete();
                        deleteRequest.onerror = () => abortWith(deleteRequest.error || new Error('Suppression des chunks impossible.'));
                        cursor.continue();
                        return;
                    }
                    (chunks || []).forEach((chunk, index) => {
                        const putRequest = chunkStore.add({
                            ...chunk,
                            id: `chunk_${document.id}_${index}`,
                            documentId: document.id,
                            folderId: document.folderId,
                            index,
                            derivedFrom: 'markdown',
                            createdAt: chunk.createdAt || now
                        });
                        putRequest.onerror = () => abortWith(putRequest.error || new Error('Écriture des chunks impossible.'));
                    });
                    const docRequest = documentStore.put({
                        ...checkRequest.result,
                        ...document,
                        derivations: {
                            ...(checkRequest.result.derivations || {}),
                            ...(document.derivations || {}),
                            chunks: { status: 'ready', count: (chunks || []).length, source: 'markdown', updatedAt: now }
                        },
                        updatedAt: now
                    });
                    docRequest.onerror = () => abortWith(docRequest.error || new Error('Actualisation du document impossible.'));
                };
            };
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(failure || tx.error || new Error('Remplacement des chunks annulé.'));
            tx.onabort = () => reject(failure || tx.error || new Error('Remplacement des chunks annulé.'));
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
        await this._transaction(['documents', 'documentProfiles'], 'readwrite', (tx, setResult, fail) => {
            const documentRequest = tx.objectStore('documents').get(value.documentId);
            documentRequest.onerror = () => fail(documentRequest.error);
            documentRequest.onsuccess = () => {
                if (!documentRequest.result) { fail(new Error('Le document associé à cette fiche n’existe plus.')); return; }
                tx.objectStore('documentProfiles').put(value);
                setResult(value);
            };
        });
        return value;
    }

    async saveDocumentProfileIfJobOwner(profile, jobId, ownerId, leaseToken) {
        await this.init();
        if (!profile?.documentId || !jobId || !ownerId || !leaseToken) return false;
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
        return this._transaction(['documents', 'processingJobs', 'documentProfiles'], 'readwrite', (tx, setResult, fail) => {
            const documents = tx.objectStore('documents');
            const jobs = tx.objectStore('processingJobs');
            const documentRequest = documents.get(value.documentId);
            const jobRequest = jobs.get(jobId);
            let documentRecord;
            let jobRecord;
            let remaining = 2;
            const ready = () => {
                remaining -= 1;
                if (remaining) return;
                if (!documentRecord || !jobRecord || jobRecord.documentId !== value.documentId
                    || jobRecord.status !== 'running' || jobRecord.leaseOwner !== ownerId
                    || jobRecord.leaseToken !== leaseToken || Number(jobRecord.leaseExpiresAt) <= now) {
                    setResult(false);
                    return;
                }
                if (Number(value.schemaVersion) >= 3 && (value.inputFingerprint !== jobRecord.inputFingerprint
                    || Number(value.extractionRevision || 0) !== Number(documentRecord.metadata?.extraction?.revision || 0))) {
                    setResult(false); return;
                }
                tx.objectStore('documentProfiles').put(value);
                jobs.put({
                    ...jobRecord,
                    status: 'completed',
                    completedAt: now,
                    nextRunAt: null,
                    lastError: null,
                    leaseOwner: null,
                    leaseToken: null,
                    leaseExpiresAt: null,
                    checkpoint: { stage: 'profile_saved', at: now },
                    updatedAt: now
                });
                setResult(true);
            };
            documentRequest.onerror = () => fail(documentRequest.error);
            jobRequest.onerror = () => fail(jobRequest.error);
            documentRequest.onsuccess = () => { documentRecord = documentRequest.result; ready(); };
            jobRequest.onsuccess = () => { jobRecord = jobRequest.result; ready(); };
        });
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
        if (value.documentId) {
            await this._transaction(['documents', 'processingJobs'], 'readwrite', (tx, setResult, fail) => {
                const request = tx.objectStore('documents').get(value.documentId);
                request.onerror = () => fail(request.error);
                request.onsuccess = () => {
                    if (!request.result) { fail(new Error('Le document associé à ce job n’existe plus.')); return; }
                    tx.objectStore('processingJobs').put(value);
                    setResult(value);
                };
            });
        } else {
            await this._request('processingJobs', 'readwrite', store => store.put(value));
        }
        return value;
    }

    async enqueueProcessingJob(job) {
        await this.init();
        const now = Date.now();
        const value = {
            ...job,
            id: job.id || 'job_' + now + '_' + Math.random().toString(36).slice(2, 12),
            status: 'pending',
            attempts: 0,
            maxAttempts: Math.max(1, Number(job.maxAttempts) || 5),
            nextRunAt: now,
            leaseOwner: null,
            leaseToken: null,
            leaseExpiresAt: null,
            checkpoint: { stage: 'queued', at: now },
            createdAt: now,
            updatedAt: now
        };
        return this._transaction(['documents', 'processingJobs'], 'readwrite', (tx, setResult, fail) => {
            const store = tx.objectStore('processingJobs');
            const documentRequest = tx.objectStore('documents').get(job.documentId);
            documentRequest.onerror = () => fail(documentRequest.error);
            documentRequest.onsuccess = () => {
                if (!documentRequest.result) { fail(new Error('Le document associé à ce job n’existe plus.')); return; }
                const request = store.index('documentId').getAll(job.documentId);
                request.onerror = () => fail(request.error || new Error('Lecture des jobs impossible.'));
                request.onsuccess = () => {
                    if (typeof job.inputFingerprint === 'string' && job.inputFingerprint) {
                        const existing = request.result.find(item => item.type === job.type
                            && item.inputFingerprint === job.inputFingerprint
                            && ['pending', 'running'].includes(item.status));
                        if (existing) { setResult(existing); return; }
                    }
                    const addRequest = store.add(value);
                    addRequest.onerror = () => {
                        if (addRequest.error?.name === 'ConstraintError') {
                            value.id = 'job_' + Date.now() + '_' + Math.random().toString(36).slice(2, 12);
                            const retryRequest = store.add(value);
                            retryRequest.onerror = () => fail(retryRequest.error || new Error('Création du job impossible.'));
                            retryRequest.onsuccess = () => setResult(value);
                            return;
                        }
                        fail(addRequest.error || new Error('Création du job impossible.'));
                    };
                    addRequest.onsuccess = () => setResult(value);
                };
            };
        });
    }

    async claimRunnableProcessingJobs(now = Date.now(), limit = 2, ownerId, leaseMs = 180000) {
        await this.init();
        if (!ownerId) throw new Error('Propriétaire de job manquant.');
        const leaseUntil = now + Math.max(30000, Number(leaseMs) || 180000);
        return this._transaction('processingJobs', 'readwrite', (tx, setResult, fail) => {
            const store = tx.objectStore('processingJobs');
            const request = store.index('status').getAll('pending');
            request.onerror = () => fail(request.error || new Error('Lecture des jobs impossible.'));
            request.onsuccess = () => {
                const due = request.result
                    .filter(job => (!job.nextRunAt || job.nextRunAt <= now) && (Number(job.attempts) || 0) < Math.max(1, Number(job.maxAttempts) || 5))
                    .sort((a, b) => (a.nextRunAt || 0) - (b.nextRunAt || 0) || (a.createdAt || 0) - (b.createdAt || 0))
                    .slice(0, Math.max(1, Number(limit) || 1));
                const claimed = due.map(job => {
                    const attempt = Number(job.attempts || 0) + 1;
                    const value = {
                        ...job,
                        status: 'running',
                        attempts: attempt,
                        startedAt: now,
                        leaseOwner: ownerId,
                        leaseToken: `${ownerId}:${now}:${Math.random().toString(36).slice(2, 12)}`,
                        leaseExpiresAt: leaseUntil,
                        checkpoint: { stage: 'preparing', attempt, at: now },
                        updatedAt: now
                    };
                    store.put(value);
                    return value;
                });
                setResult(claimed);
            };
        });
    }

    async renewProcessingJobLease(jobId, ownerId, leaseToken, now = Date.now(), leaseMs = 180000) {
        await this.init();
        return this._transaction('processingJobs', 'readwrite', (tx, setResult, fail) => {
            const store = tx.objectStore('processingJobs');
            const request = store.get(jobId);
            request.onerror = () => fail(request.error);
            request.onsuccess = () => {
                const job = request.result;
                if (!job || job.status !== 'running' || job.leaseOwner !== ownerId || job.leaseToken !== leaseToken) {
                    setResult(false);
                    return;
                }
                job.leaseExpiresAt = now + Math.max(30000, Number(leaseMs) || 180000);
                job.updatedAt = now;
                store.put(job);
                setResult(true);
            };
        });
    }

    async updateProcessingJobIfOwner(jobId, ownerId, leaseToken, changes) {
        await this.init();
        const now = Date.now();
        return this._transaction('processingJobs', 'readwrite', (tx, setResult, fail) => {
            const store = tx.objectStore('processingJobs');
            const request = store.get(jobId);
            request.onerror = () => fail(request.error || new Error('Lecture du job impossible.'));
            request.onsuccess = () => {
                const job = request.result;
                if (!job || job.status !== 'running' || job.leaseOwner !== ownerId || job.leaseToken !== leaseToken) {
                    setResult(false);
                    return;
                }
                const nextStatus = changes?.status ?? job.status;
                const terminal = ['completed', 'failed', 'cancelled'].includes(nextStatus);
                const value = {
                    ...job,
                    ...changes,
                    ...(terminal
                        ? { leaseOwner: null, leaseToken: null, leaseExpiresAt: null }
                        : { leaseExpiresAt: now + 180000 }),
                    updatedAt: now
                };
                const putRequest = store.put(value);
                putRequest.onerror = () => fail(putRequest.error || new Error('Actualisation du job impossible.'));
                setResult(value);
            };
        });
    }

    async cancelProcessingJob(id) {
        await this.init();
        const now = Date.now();
        return this._transaction('processingJobs', 'readwrite', (tx, setResult, fail) => {
            const store = tx.objectStore('processingJobs');
            const request = store.get(id);
            request.onerror = () => fail(request.error);
            request.onsuccess = () => {
                const job = request.result;
                if (!job || !['pending', 'running'].includes(job.status)) { setResult(null); return; }
                const value = { ...job, status: 'cancelled', leaseOwner: null, leaseToken: null, leaseExpiresAt: null,
                    checkpoint: { stage: 'cancelled', at: now }, updatedAt: now };
                store.put(value);
                setResult(value);
            };
        });
    }

    async retryProcessingJob(id) {
        await this.init();
        const now = Date.now();
        return this._transaction('processingJobs', 'readwrite', (tx, setResult, fail) => {
            const store = tx.objectStore('processingJobs');
            const request = store.get(id);
            request.onerror = () => fail(request.error);
            request.onsuccess = () => {
                const job = request.result;
                if (!job || !['failed', 'cancelled'].includes(job.status)) { setResult(null); return; }
                const value = { ...job, status: 'pending', attempts: 0, nextRunAt: now, lastError: null, errorKind: null,
                    leaseOwner: null, leaseToken: null, leaseExpiresAt: null,
                    checkpoint: { stage: 'queued_again', at: now }, updatedAt: now };
                store.put(value);
                setResult(value);
            };
        });
    }

    async getRunnableProcessingJobs(now = Date.now(), limit = 2) {
        await this.init();
        const pending = await this._request('processingJobs', 'readonly', store => store.index('status').getAll('pending'));
        return pending
            .filter(job => (!job.nextRunAt || job.nextRunAt <= now) && (Number(job.attempts) || 0) < Math.max(1, Number(job.maxAttempts) || 5))
            .sort((a, b) => (a.nextRunAt || 0) - (b.nextRunAt || 0) || (a.createdAt || 0) - (b.createdAt || 0))
            .slice(0, Math.max(1, Number(limit) || 1));
    }

    async recoverInterruptedJobs() {
        await this.init();
        const now = Date.now();
        return this._transaction('processingJobs', 'readwrite', (tx, setResult, fail) => {
            const store = tx.objectStore('processingJobs');
            const request = store.index('status').getAll('running');
            request.onerror = () => fail(request.error || new Error('Lecture des jobs impossible.'));
            request.onsuccess = () => {
                let recovered = 0;
                for (const job of request.result) {
                    if (Number(job.leaseExpiresAt) > now) continue;
                    recovered += 1;
                    if (job.checkpoint?.stage !== 'preparing') {
                        store.put({ ...job, status: 'failed', nextRunAt: null, leaseOwner: null, leaseToken: null,
                            leaseExpiresAt: null, errorKind: 'outcome_unknown', lastError: 'Résultat réseau indéterminé : une relance peut répéter la requête.',
                            checkpoint: { stage: 'outcome_unknown', previous: job.checkpoint || null, at: now }, updatedAt: now });
                        continue;
                    }
                    const attempts = Number(job.attempts) || 0;
                    const maxAttempts = Math.max(1, Number(job.maxAttempts) || 5);
                    if (attempts >= maxAttempts) {
                        store.put({ ...job, status: 'failed', nextRunAt: null, leaseOwner: null, leaseToken: null,
                            leaseExpiresAt: null, lastError: job.lastError || 'Nombre maximal de tentatives atteint.',
                            checkpoint: { stage: 'exhausted', previous: job.checkpoint || null, at: now }, updatedAt: now });
                        continue;
                    }
                    const delay = Math.min(1000 * Math.pow(2, Math.max(0, attempts)), 5 * 60 * 1000);
                    store.put({ ...job, status: 'pending', nextRunAt: now + delay, leaseOwner: null, leaseToken: null,
                        leaseExpiresAt: null,
                        checkpoint: { stage: 'recovered_after_interruption', previous: job.checkpoint || null, at: now }, updatedAt: now });
                }
                setResult(recovered);
            };
        });
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
        return this._transaction(['folders', 'conversations', 'messages', 'documents', 'documentChunks', 'documentProfiles', 'processingJobs', 'operations', 'traces', 'roles', 'settings'], 'readonly', (tx, setResult, fail) => {
            const getAll = (storeName, indexName, key) => new Promise((resolve, reject) => {
                const target = indexName ? tx.objectStore(storeName).index(indexName) : tx.objectStore(storeName);
                const request = key !== undefined ? target.getAll(key) : target.getAll();
                request.onerror = () => reject(request.error || new Error('Export impossible.'));
                request.onsuccess = () => resolve(request.result || []);
            });
            (async () => {
                try {
                    const [folders, conversations, documents, chunks, profiles, jobs, operations, traces, roles, settings] = await Promise.all([
                        getAll('folders'), getAll('conversations'), getAll('documents'), getAll('documentChunks'),
                        getAll('documentProfiles'), getAll('processingJobs'), getAll('operations'), getAll('traces'), getAll('roles'), getAll('settings')
                    ]);
                    const messages = {};
                    for (const conversation of conversations) {
                        messages[conversation.id] = await getAll('messages', 'conversationId', conversation.id);
                    }
                    setResult({
                        version: '6.0',
                        exportedAt: new Date().toISOString(),
                        folders, documents, documentChunks: chunks, documentProfiles: profiles,
                        processingJobs: jobs, operations, traces, conversations, messages, roles,
                        settings: settings
                            .filter(entry => entry.key !== 'sealarca_api_key')
                            .map(entry => ({ key: entry.key, value: entry.value }))
                    });
                } catch (error) { fail(error); }
            })();
        });
    }

    async importData(data) {
        if (!data || !Array.isArray(data.conversations)) throw new Error('Format de sauvegarde Sealarca invalide.');
        await this.init();
        const folders = Array.isArray(data.folders) ? data.folders : [];
        const documents = Array.isArray(data.documents) ? data.documents : [];
        const profiles = Array.isArray(data.documentProfiles) ? data.documentProfiles : [];
        const jobs = Array.isArray(data.processingJobs) ? data.processingJobs : [];
        const operations = Array.isArray(data.operations) ? data.operations : [];
        const traces = Array.isArray(data.traces) ? data.traces : [];
        const roles = Array.isArray(data.roles) ? data.roles : [];
        const chunks = Array.isArray(data.documentChunks) ? data.documentChunks : [];
        for (const folder of folders) {
            if (!folder?.id) throw new Error('Dossier invalide dans la sauvegarde.');
        }
        for (const conversation of data.conversations) {
            if (!conversation?.id) throw new Error('Conversation invalide dans la sauvegarde.');
            const list = data.messages?.[conversation.id];
            if (list !== undefined && !Array.isArray(list)) throw new Error('Messages invalides dans la sauvegarde.');
        }
        for (const operation of operations) {
            if (!operation?.id || !operation.folderId || !['pending', 'running', 'completed', 'partial', 'failed', 'cancelled'].includes(operation.status)) {
                throw new Error('Opération invalide dans la sauvegarde.');
            }
        }
        for (const trace of traces) {
            if (!trace?.id || !trace.folderId || !Array.isArray(trace.documents) || !Array.isArray(trace.sources)) {
                throw new Error('Trace invalide dans la sauvegarde.');
            }
        }
        return this._transaction(['folders', 'conversations', 'messages', 'documents', 'documentChunks', 'documentProfiles', 'processingJobs', 'operations', 'traces', 'roles', 'settings'], 'readwrite', (tx, setResult, fail) => {
            const putAll = (storeName, values) => {
                for (const value of values) {
                    const request = tx.objectStore(storeName).put(value);
                    request.onerror = () => fail(request.error || new Error('Import impossible.'));
                }
            };
            try {
                putAll('folders', folders);
                putAll('documents', documents);
                putAll('documentChunks', chunks);
                putAll('documentProfiles', profiles);
                putAll('processingJobs', jobs);
                putAll('operations', operations);
                putAll('traces', traces);
                putAll('conversations', data.conversations);
                for (const conversation of data.conversations) {
                    const list = data.messages?.[conversation.id];
                    if (Array.isArray(list)) putAll('messages', list);
                }
                putAll('roles', roles);
                if (Array.isArray(data.settings)) {
                    putAll('settings', data.settings.filter(entry => entry?.key !== 'sealarca_api_key'));
                }
                tx.objectStore('settings').delete('sealarca_api_key');
                setResult(true);
            } catch (error) { fail(error); }
        });
    }
}

window.SEALARCA_DEFAULT_FOLDER_ID = DEFAULT_FOLDER_ID;
window.SEALARCA_DEFAULT_ROLE_ID = DEFAULT_ROLE_ID;
window.SEALARCA_SYSTEM_ROLE_VERSION = SYSTEM_ROLE_VERSION;
window.SEALARCA_SYSTEM_ROLE_DEFINITIONS = SYSTEM_ROLE_DEFINITIONS;
window.SEALARCA_MERGE_SYSTEM_ROLES = mergeSystemRoles;
window.sealarcaDb = new SealarcaDB();
