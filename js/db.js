/**
 * Sealarca-Desk — Moteur de persistance locale IndexedDB
 * Base de données locale sécurisée (sealarca_desk_db)
 * Aucune donnée ne quitte le poste client.
 */

const DB_NAME = 'sealarca_desk_db';
const DB_VERSION = 1;

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

                // 1. Store Conversations
                if (!db.objectStoreNames.contains('conversations')) {
                    const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
                    convStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                    convStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // 2. Store Messages
                if (!db.objectStoreNames.contains('messages')) {
                    const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
                    msgStore.createIndex('conversationId', 'conversationId', { unique: false });
                    msgStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // 3. Store Paramètres (clé API, thème, modèle actif...)
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                // 4. Store Rôles / Personas métiers
                if (!db.objectStoreNames.contains('roles')) {
                    db.createObjectStore('roles', { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this._initDefaultRoles().then(() => resolve(this.db));
            };

            request.onerror = (event) => {
                console.error('Erreur ouverture IndexedDB Sealarca:', event.target.error);
                reject(event.target.error);
            };
        });

        return this.initPromise;
    }

    // --- Rôles prédéfinis pour professions réglementées suisses ---
    async _initDefaultRoles() {
        const existingRoles = await this.getRoles();
        if (existingRoles.length > 0) return;

        const defaultRoles = [
            {
                id: 'role-legal',
                name: 'Juriste & Droit des Contrats',
                icon: '⚖️',
                description: 'Analyse rigoureuse de clauses contractuelles, identification des risques et conformité (CO/LPD).',
                systemPrompt: `Tu es un juriste expert de haut niveau spécialisé en droit suisse (Code des Obligations, Loi sur la protection des données - LPD) et droit comparé.
Ton rôle est d'analyser minutieusement les contrats, actes et pièces juridiques.
- Identifie les clauses à risque, ambiguïtés et déséquilibres.
- Propose des reformulations claires et protectrices.
- Structure tes réponses avec méthode : Constat, Analyse juridique, Recommandations concrètes.`
            },
            {
                id: 'role-fiduciary',
                name: 'Expert Fiscal & Fiduciaire',
                icon: '📊',
                description: 'Analyse de bilans, comptes de résultat, ratios financiers et conformité fiscale.',
                systemPrompt: `Tu es un expert fiduciaire et fiscaliste chevronné.
Ton rôle est d'analyser des documents comptables, tableaux financiers (Excel/CSV) et déclarations fiscales.
- Analyse les indicateurs de performance, de liquidité et de solvabilité.
- Relève les anomalies ou incohérences dans les données chiffrées.
- Rédige des synthèses financières claires pour la direction.`
            },
            {
                id: 'role-compliance',
                name: 'Conformité & Secret Professionnel',
                icon: '🛡️',
                description: 'Vérification de conformité réglementaire, diligence raisonnable (KYC/LBA) et confidentialité.',
                systemPrompt: `Tu es un officier de conformité (Compliance Officer) et expert en réglementation suisse et internationale (LBA, CDB, RGPD/nLPD).
Ton rôle est d'évaluer les risques de conformité, de vérifier l'adéquation des processus et d'assister dans la rédaction de mémos de conformité rigoureux.`
            },
            {
                id: 'role-executive',
                name: 'Synthèse Exécutive & Rédaction',
                icon: '✍️',
                description: 'Restitution synthétique, mémos de direction, comptes-rendus et courriers officiels.',
                systemPrompt: `Tu es un conseiller en rédaction exécutive pour comités de direction et conseils d'administration.
Ton rôle est de synthétiser des dossiers volumineux en notes de synthèse concises, percutantes et élégantes, en conservant tous les éléments décisionnels cruciaux.`
            }
        ];

        for (const role of defaultRoles) {
            await this.saveRole(role);
        }
    }

    // --- Paramètres (Settings) ---
    async getSetting(key, defaultValue = null) {
        await this.init();
        return new Promise((resolve) => {
            const tx = this.db.transaction('settings', 'readonly');
            const store = tx.objectStore('settings');
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result ? req.result.value : defaultValue);
            req.onerror = () => resolve(defaultValue);
        });
    }

    async setSetting(key, value) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('settings', 'readwrite');
            const store = tx.objectStore('settings');
            const req = store.put({ key, value, updatedAt: Date.now() });
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }

    async deleteSetting(key) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('settings', 'readwrite');
            const store = tx.objectStore('settings');
            const req = store.delete(key);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }

    // --- Conversations ---
    async getConversations() {
        await this.init();
        return new Promise((resolve) => {
            const tx = this.db.transaction('conversations', 'readonly');
            const store = tx.objectStore('conversations');
            const index = store.index('updatedAt');
            const req = index.openCursor(null, 'prev');
            const list = [];
            req.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    list.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(list);
                }
            };
            req.onerror = () => resolve([]);
        });
    }

    async getConversation(id) {
        await this.init();
        return new Promise((resolve) => {
            const tx = this.db.transaction('conversations', 'readonly');
            const store = tx.objectStore('conversations');
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    }

    async saveConversation(conv) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('conversations', 'readwrite');
            const store = tx.objectStore('conversations');
            conv.updatedAt = Date.now();
            if (!conv.createdAt) conv.createdAt = conv.updatedAt;
            const req = store.put(conv);
            req.onsuccess = () => resolve(conv);
            req.onerror = () => reject(req.error);
        });
    }

    async deleteConversation(id) {
        await this.init();
        // Supprime la conversation et tous ses messages associés
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['conversations', 'messages'], 'readwrite');
            const convStore = tx.objectStore('conversations');
            const msgStore = tx.objectStore('messages');

            convStore.delete(id);

            const msgIndex = msgStore.index('conversationId');
            const req = msgIndex.openCursor(IDBKeyRange.only(id));
            req.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };

            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    }

    // --- Messages ---
    async getMessages(conversationId) {
        await this.init();
        return new Promise((resolve) => {
            const tx = this.db.transaction('messages', 'readonly');
            const store = tx.objectStore('messages');
            const index = store.index('conversationId');
            const req = index.openCursor(IDBKeyRange.only(conversationId));
            const list = [];
            req.onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    list.push(cursor.value);
                    cursor.continue();
                } else {
                    list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                    resolve(list);
                }
            };
            req.onerror = () => resolve([]);
        });
    }

    async saveMessage(msg) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('messages', 'readwrite');
            const store = tx.objectStore('messages');
            if (!msg.createdAt) msg.createdAt = Date.now();
            const req = store.put(msg);
            req.onsuccess = () => resolve(msg);
            req.onerror = () => reject(req.error);
        });
    }

    // --- Rôles ---
    async getRoles() {
        await this.init();
        return new Promise((resolve) => {
            const tx = this.db.transaction('roles', 'readonly');
            const store = tx.objectStore('roles');
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
        });
    }

    async saveRole(role) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('roles', 'readwrite');
            const store = tx.objectStore('roles');
            const req = store.put(role);
            req.onsuccess = () => resolve(role);
            req.onerror = () => reject(req.error);
        });
    }

    async deleteRole(id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('roles', 'readwrite');
            const store = tx.objectStore('roles');
            const req = store.delete(id);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }

    // --- Export / Import complet ---
    async exportAllData() {
        await this.init();
        const convs = await this.getConversations();
        const allMessages = {};
        for (const c of convs) {
            allMessages[c.id] = await this.getMessages(c.id);
        }
        const roles = await this.getRoles();
        return {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            conversations: convs,
            messages: allMessages,
            roles: roles
        };
    }

    async importData(data) {
        if (!data || !Array.isArray(data.conversations)) {
            throw new Error('Format de sauvegarde Sealarca invalide.');
        }
        await this.init();
        for (const c of data.conversations) {
            await this.saveConversation(c);
            const msgs = data.messages && data.messages[c.id];
            if (Array.isArray(msgs)) {
                for (const m of msgs) {
                    await this.saveMessage(m);
                }
            }
        }
        if (Array.isArray(data.roles)) {
            for (const r of data.roles) {
                await this.saveRole(r);
            }
        }
        return true;
    }
}

// Instance singleton exportée globalement
window.sealarcaDb = new SealarcaDB();
