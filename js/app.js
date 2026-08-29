/**
 * Sealarca-Desk — Logique Applicative & Composant Réactif Alpine.js
 * Intégration multilingue i18n (FR, DE, IT, EN, ES) & Réactivité complète.
 */

document.addEventListener('alpine:init', () => {
    // x-html est volontairement interdit par Alpine CSP. Cette directive interne
    // n'accepte que du HTML déjà produit et assaini par renderMarkdown().
    Alpine.directive('safe-html', (element, { expression }, { effect, evaluateLater }) => {
        const evaluateHtml = evaluateLater(expression);
        effect(() => {
            evaluateHtml(value => {
                Alpine.mutateDom(() => {
                    element.innerHTML = typeof value === 'string' ? value : '';
                });
            });
        });
    });

    Alpine.data('sealarcaApp', () => ({
        // --- Internationalisation (i18n) ---
        currentLang: 'fr',
        supportedLangs: [
            { code: 'fr', flagSrc: 'images/flags/fr.svg', name: 'Français' },
            { code: 'de', flagSrc: 'images/flags/de.svg', name: 'Deutsch' },
            { code: 'it', flagSrc: 'images/flags/it.svg', name: 'Italiano' },
            { code: 'en', flagSrc: 'images/flags/gb.svg', name: 'English' },
            { code: 'es', flagSrc: 'images/flags/es.svg', name: 'Español' }
        ],

        // --- État de configuration & API ---
        apiKey: '',
        models: [],
        selectedModel: '',
        isLoadingModels: false,
        apiError: '',
        isApiKeyVisible: false,

        // --- État des conversations & Messages ---
        folders: [],
        activeFolderId: null,
        conversations: [],
        activeConversationId: null,
        messages: [],
        documents: [],
        selectedDocumentIds: [],
        attachedFiles: [], // documents du dossier sélectionnés pour la requête courante
        previewDocument: null,
        documentProfiles: [],
        processingJobs: [],
        documentPanelTab: 'overview',
        documentSearchQuery: '',
        documentSearchResults: [],
        contextMode: 'manual',
        folderOverview: { documentCount: 0, pageCount: 0, profileCount: 0, people: [], organizations: [], dates: [], items: [] },
        p1Queue: null,
        inputPrompt: '',
        isStreaming: false,
        currentStreamingMessage: '',
        currentStreamingReasoning: '',
        isReasoningOpen: true,

        // --- Rôles métiers ---
        roles: [],
        selectedRole: null,

        // --- État UI ---
        sidebarCollapsed: false,
        searchQuery: '',
        isSettingsOpen: false,
        isRolesOpen: false,
        isDocumentsOpen: false,
        isDocumentPreviewOpen: false,
        isDarkMode: false,
        isDraggingFile: false,
        toastMessage: '',
        toastTimeout: null,

        // --- Traducteur helper $t ---
        t(path) {
            const dict = window.SEALARCA_I18N?.[this.currentLang] || window.SEALARCA_I18N?.['fr'] || {};
            const val = path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), dict);
            return val !== undefined ? val : path;
        },

        // --- Adaptateurs pour le build Alpine CSP (expressions HTML simples) ---
        get appDesk() { return this.t('app.desk'); },
        get appNewChat() { return this.t('app.newChat'); },
        get appSearchPlaceholder() { return this.t('app.searchPlaceholder'); },
        get appNoConversations() { return this.t('app.noConversations'); },
        get appApiKey() { return this.t('app.apiKey'); },
        get appRoles() { return this.t('app.roles'); },
        get appVaultStatus() { return this.t('app.vaultStatus'); },
        get appConnecting() { return this.t('app.connecting'); },
        get appCopy() { return this.t('app.copy'); },
        get appDelete() { return this.t('app.delete'); },
        get appFolders() { return this.t('folders.title'); },
        get appNewFolder() { return this.t('folders.new'); },
        get appDocuments() { return this.t('documents.title'); },
        get appAddDocuments() { return this.t('documents.add'); },
        get documentsCloseLabel() { return this.t('documents.close'); },
        get documentsSelectionHint() { return this.t('documents.selectionHint'); },
        get documentsEmptyLabel() { return this.t('documents.empty'); },
        get documentsPreviewLabel() { return this.t('documents.preview'); },
        get documentsDownloadLabel() { return this.t('documents.download'); },
        get documentsProvenanceLabel() { return this.t('documents.provenance'); },
        get documentsDownloadOriginalLabel() { return this.t('documents.downloadOriginal'); },
        get documentPreviewTitle() { return this.previewDocument ? this.previewDocument.name : this.t('documents.preview'); },
        get documentPreviewSize() { return this.previewDocument ? this.formatBytes(this.previewDocument.size) : ''; },
        get previewHasProfile() { return Boolean(this.previewDocument?.profile?.status === 'valid'); },
        get previewProfile() { return this.previewDocument?.profile || { people: [], organizations: [], importantDates: [], importantItems: [] }; },
        get emptyTitle() { return this.t('empty.title'); },
        get emptyDesc() { return this.t('empty.desc'); },
        get emptyCard1Title() { return this.t('empty.card1Title'); },
        get emptyCard1Desc() { return this.t('empty.card1Desc'); },
        get emptyCard2Title() { return this.t('empty.card2Title'); },
        get emptyCard2Desc() { return this.t('empty.card2Desc'); },
        get emptyCard3Title() { return this.t('empty.card3Title'); },
        get emptyCard3Desc() { return this.t('empty.card3Desc'); },
        get inputPlaceholder() { return this.t('input.placeholder'); },
        get inputAttachDoc() { return this.t('input.attachDoc'); },
        get inputRoleLabel() { return this.t('input.roleLabel'); },
        get inputActionTitle() { return this.t(this.isStreaming ? 'input.stop' : 'input.send'); },
        get settingsTitle() { return this.t('settings.title'); },
        get settingsDesc() { return this.t('settings.desc'); },
        get settingsApiKeyLabel() { return this.t('settings.apiKeyLabel'); },
        get settingsApiKeyHint() { return this.t('settings.apiKeyHint'); },
        get settingsModelsTitle() { return this.t('settings.modelsTitle'); },
        get settingsTestLabel() { return this.t(this.isLoadingModels ? 'settings.syncing' : 'settings.testBtn'); },
        get settingsSaveLabel() { return this.t('settings.saveBtn'); },
        get settingsForgetLabel() { return this.t('settings.forgetBtn'); },
        get settingsToggleKeyLabel() { return this.t(this.isApiKeyVisible ? 'settings.hideKey' : 'settings.showKey'); },
        get rolesTitle() { return this.t('roles.title'); },
        get rolesDesc() { return this.t('roles.desc'); },
        get rolesCloseLabel() { return this.t('roles.closeBtn'); },
        get rolesActiveBadge() { return this.t('roles.activeBadge'); },
        get reasoningThinking() { return this.t('reasoning.thinking'); },
        get reasoningDrawerTitle() { return this.t('reasoning.drawerTitle'); },
        get reasoningLiveToggleLabel() { return this.t(this.isReasoningOpen ? 'reasoning.hide' : 'reasoning.show'); },
        get sidebarClass() { return this.sidebarCollapsed ? 'collapsed' : ''; },
        get hasNoConversations() { return this.filteredConversations.length === 0; },
        get selectedRoleIcon() { return this.selectedRole ? this.selectedRole.icon : '⚖️'; },
        get selectedRoleName() { return this.selectedRole ? this.selectedRole.name : this.appRoles; },
        get selectedInputRoleName() { return this.selectedRole ? this.selectedRole.name : this.inputRoleLabel; },
        get showMoonIcon() { return !this.isDarkMode; },
        get showSunIcon() { return this.isDarkMode; },
        get themeButtonLabel() { return this.isDarkMode ? 'Activer le thème clair' : 'Activer le thème sombre'; },
        get modelsDisabled() { return this.isStreaming || this.models.length === 0; },
        get hasNoModels() { return this.models.length === 0; },
        get showEmptyState() { return this.messages.length === 0 && !this.isStreaming; },
        get hasAttachedFiles() { return this.attachedFiles.length > 0; },
        get hasFolders() { return this.folders.length > 0; },
        get hasDocuments() { return this.documents.length > 0; },
        get hasNoDocuments() { return this.documents.length === 0; },
        get activeFolder() { return this.folders.find(folder => folder.id === this.activeFolderId) || null; },
        get activeFolderName() { return this.activeFolder ? this.activeFolder.name : this.t('folders.none'); },
        get previewMarkdown() { return this.previewDocument ? this.renderMarkdown(this.previewDocument.markdown) : ''; },
        get inputBoxClass() { return this.isDraggingFile ? 'dragover' : ''; },
        get sendButtonClass() { return this.isStreaming ? 'btn-stop' : ''; },
        get showSendIcon() { return !this.isStreaming; },
        get showStopIcon() { return this.isStreaming; },
        get hasApiKey() { return Boolean(this.apiKey && this.apiKey.trim()); },
        get hasConfiguredApi() { return this.hasApiKey && this.models.length > 0; },
        get settingsActionsDisabled() { return this.isLoadingModels || !this.hasApiKey; },
        get apiKeyInputType() { return this.isApiKeyVisible ? 'text' : 'password'; },
        get hasModels() { return this.models.length > 0; },
        get hasToast() { return Boolean(this.toastMessage); },
        get streamingMarkdown() { return this.renderMarkdown(this.currentStreamingMessage || '...'); },
        get isOverviewTab() { return this.documentPanelTab === 'overview'; },
        get isLibraryTab() { return this.documentPanelTab === 'library'; },
        get isSearchTab() { return this.documentPanelTab === 'search'; },
        get isJobsTab() { return this.documentPanelTab === 'jobs'; },
        get overviewTabClass() { return this.isOverviewTab ? 'active' : ''; },
        get libraryTabClass() { return this.isLibraryTab ? 'active' : ''; },
        get searchTabClass() { return this.isSearchTab ? 'active' : ''; },
        get jobsTabClass() { return this.isJobsTab ? 'active' : ''; },
        get manualContextClass() { return this.isManualContext ? 'active' : ''; },
        get automaticContextClass() { return this.isAutomaticContext ? 'active' : ''; },
        get hasDocumentSearchResults() { return this.documentSearchResults.length > 0; },
        get hasNoDocumentSearchResults() { return Boolean(this.documentSearchQuery.trim()) && this.documentSearchResults.length === 0; },
        get hasProcessingJobs() { return this.processingJobs.length > 0; },
        get hasNoProcessingJobs() { return this.processingJobs.length === 0; },
        get hasNoOverviewEntities() { return this.folderOverview.people.length === 0 && this.folderOverview.organizations.length === 0; },
        get isManualContext() { return this.contextMode === 'manual'; },
        get isAutomaticContext() { return this.contextMode === 'automatic'; },
        get folderOverviewPagesLabel() { return this.folderOverview.pageCount > 0 ? this.folderOverview.pageCount + ' pages' : 'Pages non disponibles'; },
        get folderOverviewProfilesLabel() { return this.folderOverview.profileCount + ' / ' + this.folderOverview.documentCount; },

        conversationRowClass() {
            return this.activeConversationId === this.conv.id ? 'active' : '';
        },
        selectCurrentConversation() { return this.selectConversation(this.conv.id); },
        deleteCurrentConversation() { return this.deleteConversation(this.conv.id); },
        useSuggestion1() { this.useSuggestion('empty.card1Prompt'); },
        useSuggestion2() { this.useSuggestion('empty.card2Prompt'); },
        useSuggestion3() { this.useSuggestion('empty.card3Prompt'); },
        useSuggestion(path) {
            this.inputPrompt = this.t(path);
            this.$nextTick(() => document.getElementById('chat-textarea')?.focus());
        },
        openSettings() { this.isSettingsOpen = true; this.apiError = ''; this.focusApiKeyInput(); },
        closeSettings() { if (this.hasConfiguredApi) this.isSettingsOpen = false; },
        openRoles() { this.isRolesOpen = true; },
        closeRoles() { this.isRolesOpen = false; },
        openDocuments() { this.isDocumentsOpen = true; this.openOverviewTab(); this.refreshFolderWorkspace(); },
        openOverviewTab() { this.documentPanelTab = 'overview'; this.refreshFolderWorkspace(); },
        openLibraryTab() { this.documentPanelTab = 'library'; },
        openSearchTab() { this.documentPanelTab = 'search'; },
        openJobsTab() { this.documentPanelTab = 'jobs'; this.loadProcessingJobs(); },
        useManualContext() { this.contextMode = 'manual'; },
        useAutomaticContext() { this.contextMode = 'automatic'; },
        closeDocuments() { this.isDocumentsOpen = false; },
        closeDocumentPreview() { this.isDocumentPreviewOpen = false; this.previewDocument = null; },
        closeOverlays() { this.closeRoles(); this.closeSettings(); this.closeDocuments(); this.closeDocumentPreview(); },
        toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; },
        modelChanged() { return window.sealarcaDb.setSetting('sealarca_model', this.selectedModel); },
        updateSearchQuery(event) { this.searchQuery = event.currentTarget.value; },
        updateSelectedModel(event) {
            this.selectedModel = event.currentTarget.value;
            return this.modelChanged();
        },
        updatePrompt(event) { this.inputPrompt = event.currentTarget.value; },
        updateApiKey(event) { this.apiKey = event.currentTarget.value; },
        sendOrStop() { return this.isStreaming ? this.stopGeneration() : this.sendMessage(); },
        toggleLiveReasoning() { this.isReasoningOpen = !this.isReasoningOpen; },
        toggleApiKeyVisibility() { this.isApiKeyVisible = !this.isApiKeyVisible; },
        focusApiKeyInput() { this.$nextTick(() => document.getElementById('api-key-input')?.focus()); },
        handlePromptKeydown(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.sendMessage();
            }
        },
        resizePrompt(event) {
            event.currentTarget.style.height = 'auto';
            event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 200)}px`;
        },
        openFilePicker() { document.getElementById('file-input-hidden')?.click(); },
        dragOver() { this.isDraggingFile = true; },
        dragLeave() { this.isDraggingFile = false; },

        // --- Initialisation ---
        async init() {
            // 1. Initialiser la base de données locale
            await window.sealarcaDb.init();

            // 2. Détecter / Charger la langue
            const savedLang = await window.sealarcaDb.getSetting('sealarca_lang', null);
            if (savedLang && ['fr', 'de', 'it', 'en', 'es'].includes(savedLang)) {
                this.currentLang = savedLang;
            } else {
                // Détection navigateur
                const navLang = (navigator.language || 'fr').toLowerCase();
                if (navLang.startsWith('de')) this.currentLang = 'de';
                else if (navLang.startsWith('it')) this.currentLang = 'it';
                else if (navLang.startsWith('en')) this.currentLang = 'en';
                else if (navLang.startsWith('es')) this.currentLang = 'es';
                else this.currentLang = 'fr';
            }
            document.documentElement.lang = this.currentLang;
            this.refreshLanguageOptions();

            // 3. Charger les paramètres sauvegardés
            let savedKey = '';
            try { savedKey = sessionStorage.getItem('sealarca_api_key_session') || ''; } catch { /* indisponible */ }
            const legacyKey = await window.sealarcaDb.getSetting('sealarca_api_key', '');
            const savedModel = await window.sealarcaDb.getSetting('sealarca_model', '');
            const savedRole = await window.sealarcaDb.getSetting('sealarca_active_role', null);

            this.apiKey = savedKey || legacyKey;
            if (legacyKey) {
                try { sessionStorage.setItem('sealarca_api_key_session', legacyKey); } catch { /* indisponible */ }
                await window.sealarcaDb.deleteSetting('sealarca_api_key');
            }
            this.selectedModel = savedModel;
            this.isDarkMode = document.documentElement.classList.contains('dark');
            this.selectedRole = savedRole;
            this.applyTheme();

            // 4. Charger les rôles métiers
            await this.refreshRoles();

            // 5. Charger les dossiers, documents et conversations
            await this.loadFolders();
            if (this.folders.length > 0) {
                const savedFolderId = await window.sealarcaDb.getSetting('sealarca_active_folder', this.folders[0].id);
                await this.selectFolder(this.folders.some(folder => folder.id === savedFolderId) ? savedFolderId : this.folders[0].id, false);
            }

            // 6. Si une clé API est présente, découvrir les modèles
            if (this.apiKey) {
                const connected = await this.loadModels(true);
                if (!connected) this.isSettingsOpen = true;
            } else {
                this.isSettingsOpen = true;
                this.focusApiKeyInput();
            }

            // 7. Charger la dernière conversation du dossier actif si existante
            if (this.conversations.length > 0) await this.selectConversation(this.conversations[0].id);
            await this.initializeP1Queue();
        },

        // --- Changement de langue ---
        async setLanguage(langCode) {
            if (!['fr', 'de', 'it', 'en', 'es'].includes(langCode)) return;
            this.currentLang = langCode;
            document.documentElement.lang = langCode;
            this.refreshLanguageOptions();
            await window.sealarcaDb.setSetting('sealarca_lang', langCode);
            await this.refreshRoles();
        },

        refreshLanguageOptions() {
            const app = this;
            this.supportedLangs = [
                { code: 'fr', flagSrc: 'images/flags/fr.svg', name: 'Français' },
                { code: 'de', flagSrc: 'images/flags/de.svg', name: 'Deutsch' },
                { code: 'it', flagSrc: 'images/flags/it.svg', name: 'Italiano' },
                { code: 'en', flagSrc: 'images/flags/gb.svg', name: 'English' },
                { code: 'es', flagSrc: 'images/flags/es.svg', name: 'Español' }
            ].map(language => ({
                ...language,
                get buttonClass() { return app.currentLang === language.code ? 'active' : ''; },
                get isActive() { return app.currentLang === language.code; },
                select() { app.setLanguage(language.code); }
            }));
        },

        async refreshRoles() {
            const app = this;
            const rawRoles = await window.sealarcaDb.getRoles();
            // Adapter les libellés des rôles selon la langue active
            this.roles = rawRoles.map(r => {
                const roleKey = r.id.replace('role-', '');
                const localized = window.SEALARCA_I18N?.[this.currentLang]?.roles?.[roleKey];
                if (localized) {
                    const decoratedRole = {
                        ...r,
                        name: localized.name,
                        icon: localized.icon || r.icon,
                        description: localized.desc || r.description,
                        get cardStyle() {
                            return app.selectedRole && app.selectedRole.id === r.id
                                ? 'border-color: var(--sealarca-evergreen); background-color: var(--sealarca-evergreen-light);'
                                : '';
                        },
                        get isSelected() { return Boolean(app.selectedRole && app.selectedRole.id === r.id); },
                        select() { app.selectRole(decoratedRole); }
                    };
                    return decoratedRole;
                }
                const decoratedRole = {
                    ...r,
                    get cardStyle() {
                        return app.selectedRole && app.selectedRole.id === r.id
                            ? 'border-color: var(--sealarca-evergreen); background-color: var(--sealarca-evergreen-light);'
                            : '';
                    },
                    get isSelected() { return Boolean(app.selectedRole && app.selectedRole.id === r.id); },
                    select() { app.selectRole(decoratedRole); }
                };
                return decoratedRole;
            });

            if (this.selectedRole) {
                const updated = this.roles.find(r => r.id === this.selectedRole.id);
                if (updated) this.selectedRole = updated;
            } else if (this.roles.length > 0) {
                this.selectedRole = this.roles[0];
            }
        },

        // --- Gestion du Thème (Clair / Sombre) ---
        applyTheme() {
            document.documentElement.classList.toggle('dark', this.isDarkMode);
            document.documentElement.style.colorScheme = this.isDarkMode ? 'dark' : 'light';
        },

        toggleTheme() {
            this.isDarkMode = !this.isDarkMode;
            this.applyTheme();
            try { localStorage.setItem('sealarca_theme', this.isDarkMode ? 'dark' : 'light'); } catch { /* indisponible */ }
        },

        // --- Notification Toast ---
        showToast(msg, duration = 3000) {
            this.toastMessage = msg;
            if (this.toastTimeout) clearTimeout(this.toastTimeout);
            this.toastTimeout = setTimeout(() => {
                this.toastMessage = '';
            }, duration);
        },

        // --- Découverte des modèles Sealarca ---
        async loadModels(silent = false) {
            if (!this.apiKey || !this.apiKey.trim()) {
                this.apiError = this.t('settings.keyMissing');
                this.isSettingsOpen = true;
                this.focusApiKeyInput();
                return false;
            }
            this.isLoadingModels = true;
            this.apiError = '';

            try {
                const fetched = await window.sealarcaApi.fetchModels(this.apiKey);
                this.models = fetched;
                if (this.models.length > 0) {
                    const exists = this.models.some(m => m.id === this.selectedModel);
                    if (!exists) {
                        this.selectedModel = this.models[0].id;
                        await window.sealarcaDb.setSetting('sealarca_model', this.selectedModel);
                    }
                }
                try { sessionStorage.setItem('sealarca_api_key_session', this.apiKey.trim()); } catch { /* indisponible */ }
                await window.sealarcaDb.deleteSetting('sealarca_api_key');
                if (!silent) this.showToast(this.t('settings.syncSuccess'));
                return true;
            } catch (err) {
                console.error('Erreur découverte modèles:', err);
                this.models = [];
                this.apiError = err.message || 'Impossible de joindre le Vault Sealarca.';
                this.isSettingsOpen = true;
                this.focusApiKeyInput();
                return false;
            } finally {
                this.isLoadingModels = false;
            }
        },

        discoverModels() { return this.loadModels(false); },

        // --- Sauvegarde des paramètres ---
        async saveSettings() {
            const cleanKey = this.apiKey ? this.apiKey.trim() : '';
            this.apiKey = cleanKey;
            const connected = await this.loadModels(false);
            if (connected) this.isSettingsOpen = false;
        },

        async forgetApiKey() {
            window.sealarcaApi.abortCurrentRequest();
            try { sessionStorage.removeItem('sealarca_api_key_session'); } catch { /* indisponible */ }
            await window.sealarcaDb.deleteSetting('sealarca_api_key');
            await window.sealarcaDb.deleteSetting('sealarca_model');
            this.apiKey = '';
            this.selectedModel = '';
            this.models = [];
            this.apiError = '';
            this.isSettingsOpen = true;
            this.focusApiKeyInput();
        },

        // --- Dossiers / Projets ---
        async loadFolders() {
            const app = this;
            const folders = await window.sealarcaDb.getFolders();
            this.folders = folders.map(folder => {
                const decorated = {
                    ...folder,
                    get rowClass() { return app.activeFolderId === folder.id ? 'active' : ''; },
                    select() { app.selectFolder(folder.id); },
                    edit() { app.editFolder(folder.id); },
                    remove() { app.deleteFolder(folder.id); }
                };
                return decorated;
            });
        },

        async selectFolder(id, loadLatestConversation = true) {
            if (this.isStreaming || !id) return;
            this.activeFolderId = id;
            await window.sealarcaDb.setSetting('sealarca_active_folder', id);
            this.activeConversationId = null;
            this.messages = [];
            this.inputPrompt = '';
            this.selectedDocumentIds = [];
            this.attachedFiles = [];
            await Promise.all([this.loadDocuments(), this.loadConversations(), this.loadDocumentProfiles(), this.loadProcessingJobs()]);
            this.buildFolderOverview();
            if (loadLatestConversation && this.conversations.length > 0) await this.selectConversation(this.conversations[0].id);
        },

        async createFolder() {
            if (this.isStreaming) return;
            const name = window.prompt(this.t('folders.namePrompt'), this.t('folders.defaultName'));
            if (!name || !name.trim()) return;
            const now = Date.now();
            const folder = await window.sealarcaDb.saveFolder({
                id: `folder_${now}_${Math.random().toString(36).slice(2, 8)}`,
                name: name.trim(), description: '', tags: [], metadata: {}, createdAt: now
            });
            await this.loadFolders();
            await this.selectFolder(folder.id, false);
        },

        async editFolder(id) {
            const folder = await window.sealarcaDb.getFolder(id);
            if (!folder) return;
            const name = window.prompt(this.t('folders.namePrompt'), folder.name || '');
            if (!name || !name.trim()) return;
            const description = window.prompt(this.t('folders.descriptionPrompt'), folder.description || '');
            if (description === null) return;
            const tags = window.prompt(this.t('folders.tagsPrompt'), (folder.tags || []).join(', '));
            if (tags === null) return;
            await window.sealarcaDb.saveFolder({
                ...folder,
                name: name.trim(),
                description: description.trim(),
                tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
                metadata: { ...(folder.metadata || {}), editedAt: new Date().toISOString() }
            });
            await this.loadFolders();
        },

        async deleteFolder(id) {
            if (this.folders.length <= 1) {
                this.showToast(this.t('folders.keepOne'), 5000);
                return;
            }
            if (!window.confirm(this.t('folders.deleteConfirm'))) return;
            await window.sealarcaDb.deleteFolder(id);
            await this.loadFolders();
            const next = this.folders[0];
            if (next) await this.selectFolder(next.id);
        },

        // --- Bibliothèque documentaire du dossier ---
        async loadDocuments() {
            if (!this.activeFolderId) { this.documents = []; return; }
            const app = this;
            const documents = await window.sealarcaDb.getDocuments(this.activeFolderId);
            const profiles = await window.sealarcaDb.getDocumentProfiles(this.activeFolderId);
            const profileByDocument = new Map(profiles.map(profile => [profile.documentId, profile]));
            this.documentProfiles = profiles;
            this.documents = documents.map(document => {
                const decorated = {
                    ...document,
                    profile: profileByDocument.get(document.id) || null,
                    get isSelected() { return app.selectedDocumentIds.includes(document.id); },
                    get selectionClass() { return decorated.isSelected ? 'selected' : ''; },
                    get selectionMark() { return decorated.isSelected ? '✓' : '+'; },
                    get sizeLabel() { return app.formatBytes(document.size); },
                    get pageLabel() { const pages = Number(document.metadata?.pageCount || 0); return pages ? pages + ' pages' : ''; },
                    get profileStatusLabel() { return decorated.profile?.status === 'valid' ? 'Fiche disponible' : 'Fiche à générer'; },
                    toggle() { app.toggleDocumentSelection(document.id); },
                    preview() { app.openDocumentPreview(document.id); },
                    download() { app.downloadDocument(document.id); },
                    generateProfile() { app.queueDocumentProfile(document.id); },
                    remove() { app.deleteDocument(document.id); }
                };
                return decorated;
            });
            this.selectedDocumentIds = this.selectedDocumentIds.filter(id => documents.some(document => document.id === id));
            this.attachedFiles = this.documents.filter(document => this.selectedDocumentIds.includes(document.id));
        },

        toggleDocumentSelection(id) {
            const index = this.selectedDocumentIds.indexOf(id);
            if (index >= 0) this.selectedDocumentIds.splice(index, 1);
            else this.selectedDocumentIds.push(id);
            this.attachedFiles = this.documents.filter(document => this.selectedDocumentIds.includes(document.id));
        },

        async openDocumentPreview(id) {
            this.previewDocument = await window.sealarcaDb.getDocument(id);
            if (this.previewDocument) {
                this.previewDocument.profile = await window.sealarcaDb.getDocumentProfile(id);
                this.isDocumentPreviewOpen = true;
            }
        },

        async deleteDocument(id) {
            if (!window.confirm(this.t('documents.deleteConfirm'))) return;
            await window.sealarcaDb.deleteDocument(id);
            this.selectedDocumentIds = this.selectedDocumentIds.filter(documentId => documentId !== id);
            await this.loadDocuments();
        },

        downloadPreviewDocument() {
            if (this.previewDocument) return this.downloadDocument(this.previewDocument.id);
        },

        async downloadDocument(id) {
            const document = await window.sealarcaDb.getDocument(id);
            if (!document?.sourceFile) return;
            const url = URL.createObjectURL(document.sourceFile);
            const link = window.document.createElement('a');
            link.href = url;
            link.download = document.originalName || document.name;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        },

        formatBytes(size) {
            const bytes = Number(size) || 0;
            if (bytes < 1024) return `${bytes} o`;
            if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
            return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
        },

        buildConversationHistory() {
            return this.messages.map(message => ({ role: message.role, content: message.content || '' }));
        },

        buildDocumentContext(documents, query = '', mode = this.contextMode) {
            if (!documents.length) return '';
            const sections = documents.map(document => {
                const sourceMap = Array.isArray(document.sourceMap) ? document.sourceMap : [];
                const excerpts = mode === 'automatic'
                    ? window.SealarcaP1.citableExcerpts(document, query, { limit: 8 })
                    : sourceMap.map(source => ({
                        reference: window.SealarcaP1.sourceReference(document, source),
                        excerpt: String(document.markdown || '').slice(Number(source.markdownStart || 0), Number(source.markdownEnd || 0)).trim()
                    })).filter(item => item.excerpt);
                if (!excerpts.length) {
                    return ['## Document sélectionné : ' + document.name, 'Type: ' + (document.mimeType || document.extension || 'inconnu'), '', String(document.markdown || '')].join('\n');
                }
                return ['## Document sélectionné : ' + document.name, 'Type: ' + (document.mimeType || document.extension || 'inconnu'), '', ...excerpts.map(item => '### SOURCE: ' + item.reference + '\n' + item.excerpt)].join('\n\n');
            });
            return '\n\n# CONTEXTE DOCUMENTAIRE SÉLECTIONNÉ\n\n' + sections.join('\n\n---\n\n') + '\n\nRègle de citation: cite exactement les libellés SOURCE fournis. N’invente jamais une page, slide, feuille ou ligne absente.\n\n# FIN DU CONTEXTE DOCUMENTAIRE\n';
        },

        async initializeP1Queue() {
            if (this.p1Queue) return;
            this.p1Queue = new window.SealarcaP1.PersistentJobQueue({
                db: window.sealarcaDb,
                api: window.sealarcaApi,
                concurrency: 2,
                getCredentials: () => ({ apiKey: this.apiKey, model: this.selectedModel }),
                onChange: () => this.refreshFolderWorkspace()
            });
            await this.p1Queue.start();
        },

        async loadDocumentProfiles() {
            this.documentProfiles = this.activeFolderId ? await window.sealarcaDb.getDocumentProfiles(this.activeFolderId) : [];
        },

        async loadProcessingJobs() {
            const app = this;
            const jobs = this.activeFolderId ? await window.sealarcaDb.getProcessingJobs(this.activeFolderId) : [];
            this.processingJobs = jobs.map(job => {
                const document = app.documents.find(item => item.id === job.documentId);
                const decorated = {
                    ...job,
                    documentName: document?.name || job.documentId,
                    get statusLabel() { return ({ pending: 'En attente', running: 'En cours', completed: 'Terminée', failed: 'Échec', cancelled: 'Annulée' })[job.status] || job.status; },
                    get checkpointStage() { return job.checkpoint?.stage || ''; },
                    get canCancel() { return ['pending', 'running'].includes(job.status); },
                    get canRetry() { return ['failed', 'cancelled'].includes(job.status); },
                    cancel() { app.cancelProcessingJob(job.id); },
                    retry() { app.retryProcessingJob(job.id); }
                };
                return decorated;
            });
        },

        async refreshFolderWorkspace() {
            if (!this.activeFolderId) return;
            await Promise.all([this.loadDocuments(), this.loadDocumentProfiles(), this.loadProcessingJobs()]);
            this.buildFolderOverview();
            if (this.documentSearchQuery.trim()) this.runDocumentSearch();
        },

        buildFolderOverview() {
            const profileByDocument = new Map(this.documentProfiles.map(profile => [profile.documentId, profile]));
            const validProfiles = this.documents.map(document => profileByDocument.get(document.id)).filter(profile => profile?.status === 'valid');
            const unique = values => [...new Set(values.filter(Boolean).map(value => String(value).trim()))].slice(0, 100);
            const dates = [];
            const items = [];
            for (const profile of validProfiles) {
                const document = this.documents.find(item => item.id === profile.documentId);
                for (const item of profile.importantDates || []) dates.push({ ...item, id: profile.documentId + '_' + (item.date || item.label), documentId: profile.documentId, documentName: document?.name || '', referenceLabel: item.references?.[0]?.label || document?.name || '', open: () => this.openProfileReference(profile.documentId, item.references?.[0]?.sourceId || null) });
                for (const item of profile.importantItems || []) items.push({ ...item, id: profile.documentId + '_' + (item.label || item.details), documentId: profile.documentId, documentName: document?.name || '', referenceLabel: item.references?.[0]?.label || document?.name || '', open: () => this.openProfileReference(profile.documentId, item.references?.[0]?.sourceId || null) });
            }
            this.folderOverview = {
                documentCount: this.documents.length,
                pageCount: this.documents.reduce((sum, document) => sum + (Number(document.metadata?.pageCount) || 0), 0),
                profileCount: validProfiles.length,
                people: unique(validProfiles.flatMap(profile => profile.people || [])),
                organizations: unique(validProfiles.flatMap(profile => profile.organizations || [])),
                dates: dates.slice(0, 50),
                items: items.slice(0, 50)
            };
        },

        async queueDocumentProfile(documentId) {
            await this.initializeP1Queue();
            const document = await window.sealarcaDb.getDocument(documentId);
            if (!document) return;
            const result = await this.p1Queue.enqueueDocument(document);
            this.showToast(result.skipped ? 'Fiche déjà à jour.' : 'Fiche ajoutée à la queue.');
            await this.refreshFolderWorkspace();
        },

        async queueAllDocumentProfiles() {
            await this.initializeP1Queue();
            const results = await this.p1Queue.enqueueDocuments(this.documents);
            const queued = results.filter(result => !result.skipped).length;
            this.showToast(queued ? queued + ' fiche(s) ajoutée(s) à la queue.' : 'Toutes les fiches sont déjà à jour.');
            await this.refreshFolderWorkspace();
        },

        async cancelProcessingJob(jobId) { await this.p1Queue?.cancel(jobId); },
        async retryProcessingJob(jobId) { await this.p1Queue?.retry(jobId); },

        updateDocumentSearch(event) {
            this.documentSearchQuery = event.currentTarget.value;
            this.runDocumentSearch();
        },

        runDocumentSearch() {
            const app = this;
            const rawResults = window.SealarcaP1.localSearch(this.documents, this.documentSearchQuery, { maxResults: 30, perDocument: 3 });
            this.documentSearchResults = rawResults.map(result => ({ ...result, matchedTermsLabel: result.matchedTerms.join(', '), open() { app.openProfileReference(result.documentId, result.sourceId); } }));
        },

        async openProfileReference(documentId, sourceId = null) {
            await this.openDocumentPreview(documentId);
            if (!this.previewDocument || !sourceId) return;
            this.$nextTick(() => {
                const source = this.previewDocument.sourceMap?.find(item => item.id === sourceId);
                const preview = document.getElementById('document-preview-markdown');
                if (source && preview) preview.scrollTop = Math.max(0, Number(source.markdownStart || 0) / Math.max(1, this.previewDocument.markdown.length) * preview.scrollHeight - 80);
            });
        },

        exportFolderOverviewMarkdown() {
            const folder = this.activeFolder;
            const lines = ['# ' + (folder?.name || 'Dossier'), '', this.folderOverview.documentCount + ' documents', this.folderOverviewPagesLabel, '', '## Documents', ''];
            this.documents.forEach((document, index) => lines.push('- DOC-' + String(index + 1).padStart(3, '0') + ' — ' + document.name + (document.metadata?.pageCount ? ' — ' + document.metadata.pageCount + ' pages' : '')));
            lines.push('', '## Fiches disponibles', '', this.folderOverviewProfilesLabel, '', '## Dates principales', '');
            this.folderOverview.dates.forEach(item => lines.push('- ' + [item.date, item.label].filter(Boolean).join(' — ')));
            lines.push('', '## Personnes / organisations', '');
            [...this.folderOverview.people, ...this.folderOverview.organizations].forEach(item => lines.push('- ' + item));
            lines.push('', '## Éléments importants', '');
            this.folderOverview.items.forEach(item => lines.push('- ' + (item.label || item.details) + (item.references?.[0]?.label ? ' — ' + item.references[0].label : '')));
            const blob = new Blob([lines.join('\n') + '\n'], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'index.md';
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        },


        // --- Gestion des Conversations ---
        async loadConversations() {
            const app = this;
            const conversations = this.activeFolderId ? await window.sealarcaDb.getConversations(this.activeFolderId) : [];
            this.conversations = conversations.map(conversation => {
                const decorated = {
                    ...conversation,
                    get rowClass() { return app.activeConversationId === conversation.id ? 'active' : ''; },
                    select() { app.selectConversation(conversation.id); },
                    remove() { app.deleteConversation(conversation.id); }
                };
                return decorated;
            });
        },

        decorateMessage(message) {
            const app = this;
            const decorated = {
                ...message,
                _showReasoning: message._showReasoning !== false,
                get senderInitial() { return message.role === 'assistant' ? 'S' : 'V'; },
                get senderName() { return message.role === 'assistant' ? 'Sealarca Vault' : app.t('app.you'); },
                get hasAttachments() { return Boolean((message.documentRefs && message.documentRefs.length) || (message.attachments && message.attachments.length)); },
                get visibleAttachments() { return (message.documentRefs || message.attachments || []).map((attachment, index) => ({ ...attachment, attachmentKey: attachment.id || attachment.name || ('attachment_' + index) })); },
                get hasReasoning() { return Boolean(message.reasoning); },
                get hasCitations() { return Array.isArray(message.citations) && message.citations.length > 0; },
                get visibleCitations() { return (message.citations || []).map(citation => ({ ...citation, open() { app.openProfileReference(citation.documentId, citation.sourceId); } })); },
                get reasoningLabel() { return app.t(decorated._showReasoning ? 'reasoning.hide' : 'reasoning.show'); },
                get reasoningVisible() { return decorated._showReasoning !== false; },
                get renderedContent() { return app.renderMarkdown(message.content); },
                toggleReasoning() { decorated._showReasoning = !decorated._showReasoning; },
                copy() { app.copyText(message.content); }
            };
            return decorated;
        },

        get filteredConversations() {
            if (!this.searchQuery || !this.searchQuery.trim()) {
                return this.conversations;
            }
            const q = this.searchQuery.toLowerCase();
            return this.conversations.filter(c => (c.title || '').toLowerCase().includes(q));
        },

        async newConversation() {
            if (this.isStreaming) return;
            this.activeConversationId = null;
            this.messages = [];
            this.inputPrompt = '';
            this.selectedDocumentIds = [];
            this.attachedFiles = [];
            this.currentStreamingMessage = '';
            this.currentStreamingReasoning = '';
            this.$nextTick(() => {
                const textarea = document.getElementById('chat-textarea');
                if (textarea) textarea.focus();
            });
        },

        async selectConversation(id) {
            if (this.isStreaming || this.activeConversationId === id) return;
            this.activeConversationId = id;
            const loadedMessages = await window.sealarcaDb.getMessages(id);
            this.messages = loadedMessages.map(message => this.decorateMessage(message));
            this.selectedDocumentIds = [];
            this.attachedFiles = [];
            this.currentStreamingMessage = '';
            this.currentStreamingReasoning = '';
            this.scrollToBottom();
        },

        async deleteConversation(id) {
            await window.sealarcaDb.deleteConversation(id);
            await this.loadConversations();
            if (this.activeConversationId === id) {
                if (this.conversations.length > 0) {
                    await this.selectConversation(this.conversations[0].id);
                } else {
                    await this.newConversation();
                }
            }
            this.showToast(this.t('app.delete'));
        },

        // --- Sélection d'un Rôle Métier ---
        selectRole(role) {
            this.selectedRole = role;
            window.sealarcaDb.setSetting('sealarca_active_role', {
                id: role.id,
                name: role.name,
                icon: role.icon,
                description: role.description,
                systemPrompt: role.systemPrompt
            }).catch(error => console.error('Sauvegarde du rôle impossible:', error));
            this.isRolesOpen = false;
            this.showToast(`${this.t('input.roleLabel')} : ${role.name}`);
        },

        // --- Envoi d'un Message ---
        async sendMessage() {
            const text = this.inputPrompt.trim();
            if ((!text && this.attachedFiles.length === 0) || this.isStreaming) return;

            if (!this.hasConfiguredApi || !this.selectedModel) {
                this.isSettingsOpen = true;
                this.apiError = this.hasApiKey
                    ? 'Aucun modèle disponible pour cette clé API.'
                    : this.t('settings.keyMissing');
                this.focusApiKeyInput();
                return;
            }

            // 1. Créer la conversation si première interaction
            if (!this.activeConversationId) {
                const titleText = text || (this.attachedFiles[0] ? `Doc: ${this.attachedFiles[0].name}` : this.t('app.newChat'));
                const newConv = {
                    id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                    title: titleText.length > 40 ? titleText.substring(0, 40) + '...' : titleText,
                    folderId: this.activeFolderId || window.SEALARCA_DEFAULT_FOLDER_ID,
                    model: this.selectedModel,
                    roleId: this.selectedRole ? this.selectedRole.id : null,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                await window.sealarcaDb.saveConversation(newConv);
                this.activeConversationId = newConv.id;
                await this.loadConversations();
            }

            // 2. Conserver uniquement les références documentaires dans le message.
            const folderDocuments = await window.sealarcaDb.getDocuments(this.activeFolderId);
            const automaticSelection = this.contextMode === 'automatic'
                ? window.SealarcaP1.selectRelevantDocuments(folderDocuments, text, { limit: 5 })
                : [];
            const requestedIds = this.contextMode === 'automatic'
                ? automaticSelection.map(item => item.document.id)
                : this.selectedDocumentIds;
            const selectedDocuments = (await window.sealarcaDb.getDocumentsByIds(requestedIds))
                .filter(document => document.folderId === this.activeFolderId);
            const documentRefs = selectedDocuments.map(document => ({
                id: document.id,
                name: document.name,
                size: document.size,
                extension: document.extension,
                hash: document.hash || null
            }));

            const userMsg = {
                id: 'msg_' + Date.now() + '_user',
                conversationId: this.activeConversationId,
                role: 'user',
                content: text || (selectedDocuments[0] ? `[${selectedDocuments[0].name}]` : '...'),
                documentRefs,
                contextSelection: {
                    mode: this.contextMode === 'automatic' ? 'automatic' : 'manual',
                    scope: 'folder',
                    folderId: this.activeFolderId,
                    documentIds: documentRefs.map(document => document.id)
                },
                createdAt: Date.now()
            };

            // 3. Sauvegarder et afficher le message utilisateur
            await window.sealarcaDb.saveMessage(userMsg);
            this.messages.push(this.decorateMessage(userMsg));

            // Réinitialiser les entrées
            this.inputPrompt = '';
            this.selectedDocumentIds = [];
            this.attachedFiles = [];
            this.currentStreamingMessage = '';
            this.currentStreamingReasoning = '';
            this.isStreaming = true;
            this.scrollToBottom();

            // 4. Séparer l'historique du contexte documentaire explicitement sélectionné.
            const apiMessages = this.buildConversationHistory();
            const currentUserMessage = apiMessages[apiMessages.length - 1];
            if (currentUserMessage && currentUserMessage.role === 'user' && selectedDocuments.length > 0) {
                currentUserMessage.content += this.buildDocumentContext(selectedDocuments, text, this.contextMode);
            }

            const systemPrompt = this.selectedRole ? this.selectedRole.systemPrompt : null;

            // 5. Lancer le streaming
            await window.sealarcaApi.streamResponse({
                apiKey: this.apiKey,
                model: this.selectedModel,
                messages: apiMessages,
                instructions: systemPrompt,
                onChunk: ({ type, chunk, fullText, fullReasoning }) => {
                    this.currentStreamingMessage = fullText;
                    this.currentStreamingReasoning = fullReasoning;
                    this.scrollToBottom();
                },
                onError: (err) => {
                    console.error('Erreur pendant le streaming:', err);
                    this.showToast(`Erreur : ${err.message || 'Échec de communication'}`);
                    this.isStreaming = false;
                },
                onDone: async (finalText, finalReasoning, metadata = {}) => {
                    if (finalText || finalReasoning) {
                        const assistantMsg = {
                            id: 'msg_' + Date.now() + '_assistant',
                            conversationId: this.activeConversationId,
                            role: 'assistant',
                            content: finalText || (metadata.interrupted ? '(Réponse interrompue)' : '(Réponse vide)'),
                            reasoning: finalReasoning || null,
                            model: this.selectedModel,
                            interrupted: Boolean(metadata.interrupted),
                            citations: window.SealarcaP1.extractCitations(finalText, selectedDocuments),
                            createdAt: Date.now()
                        };
                        await window.sealarcaDb.saveMessage(assistantMsg);
                        this.messages.push(this.decorateMessage(assistantMsg));
                    }
                    this.currentStreamingMessage = '';
                    this.currentStreamingReasoning = '';
                    this.isStreaming = false;

                    // Mettre à jour l'horodatage de la conversation
                    const conv = await window.sealarcaDb.getConversation(this.activeConversationId);
                    if (conv) {
                        await window.sealarcaDb.saveConversation(conv);
                        await this.loadConversations();
                    }
                    this.scrollToBottom();
                }
            });
        },

        // --- Interrompre la réponse ---
        stopGeneration() {
            window.sealarcaApi.abortCurrentRequest();
        },

        // --- Gestion des Fichiers (Drag & Drop & Input) ---
        async handleFileInput(event) {
            const files = event.target.files;
            if (!files || files.length === 0) return;
            await this.processFiles(files);
            event.target.value = '';
        },

        async handleDrop(event) {
            this.isDraggingFile = false;
            const files = event.dataTransfer?.files;
            if (files && files.length > 0) {
                await this.processFiles(files);
            }
        },

        async processFiles(fileList) {
            if (!this.activeFolderId) return;
            const maxFiles = 5;
            const files = Array.from(fileList).slice(0, maxFiles);
            if (fileList.length > maxFiles) this.showToast(`Maximum ${maxFiles} fichiers par ajout.`, 5000);
            for (const file of files) {
                try {
                    this.showToast(`${file.name}...`);
                    const parsed = await window.sealarcaDocHandler.parseFile(file);
                    const duplicate = await window.sealarcaDb.findDocumentByHash(this.activeFolderId, parsed.hash);
                    const saved = duplicate || await window.sealarcaDb.saveDocument({ ...parsed, folderId: this.activeFolderId });
                    if (!this.selectedDocumentIds.includes(saved.id)) this.selectedDocumentIds.push(saved.id);
                    await this.loadDocuments();
                    this.showToast(duplicate ? `↩️ ${file.name} déjà présent et sélectionné` : `✅ ${file.name}`);
                } catch (err) {
                    console.error('Erreur extraction document:', err);
                    this.showToast(`❌ ${file.name} : ${err.message}`);
                }
            }
        },

        removeAttachment(index) {
            const document = this.attachedFiles[index];
            if (document) this.toggleDocumentSelection(document.id);
        },

        // --- Utilitaire Rendu Markdown & Blocs de Code ---
        renderMarkdown(rawText) {
            if (!rawText) return '';
            if (!window.marked || !window.DOMPurify) return this.escapeHtml(rawText);

            try {
                const html = window.marked.parse(rawText, {
                    breaks: true,
                    gfm: true
                });

                const cleanHtml = window.DOMPurify.sanitize(html, {
                    ADD_ATTR: ['target', 'rel', 'class'],
                    FORBID_TAGS: ['iframe', 'object', 'embed', 'form', 'input', 'button'],
                    FORBID_ATTR: ['style']
                });

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = cleanHtml;

                tempDiv.querySelectorAll('a').forEach(link => {
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                });

                const preBlocks = tempDiv.querySelectorAll('pre');
                preBlocks.forEach((pre) => {
                    const code = pre.querySelector('code');
                    const codeText = code ? code.innerText : pre.innerText;
                    const langClass = code ? Array.from(code.classList).find(c => c.startsWith('language-')) : '';
                    const lang = langClass ? langClass.replace('language-', '') : 'code';

                    const wrapper = document.createElement('div');
                    wrapper.className = 'code-block-wrapper';

                    const header = document.createElement('div');
                    header.className = 'code-block-header';
                    const copyLabel = this.t('app.copy');
                    const languageLabel = document.createElement('span');
                    languageLabel.textContent = lang;
                    const copyButton = document.createElement('button');
                    copyButton.type = 'button';
                    copyButton.className = 'code-copy-btn';
                    copyButton.textContent = copyLabel;
                    copyButton.dataset.code = encodeURIComponent(codeText);
                    copyButton.dataset.copiedLabel = this.t('app.copied');
                    header.append(languageLabel, copyButton);

                    const newPre = pre.cloneNode(true);

                    wrapper.appendChild(header);
                    wrapper.appendChild(newPre);
                    pre.parentNode.replaceChild(wrapper, pre);
                });

                return tempDiv.innerHTML;
            } catch (e) {
                console.error('Erreur rendu Markdown:', e);
                return this.escapeHtml(rawText);
            }
        },

        escapeHtml(value) {
            const node = document.createElement('div');
            node.textContent = value == null ? '' : String(value);
            return node.innerHTML;
        },

        // --- Copier un message ---
        copyText(text) {
            if (!navigator.clipboard) return;
            navigator.clipboard.writeText(text).then(() => {
                this.showToast(this.t('app.copied'));
            });
        },

        // --- Défilement automatique ---
        scrollToBottom() {
            this.$nextTick(() => {
                const container = document.getElementById('chat-messages');
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            });
        }
    }));
});

// Helper global pour le bouton "Copier" des blocs de code
window.sealarcaCopyCode = function(button, copiedLabel = 'Copié !') {
    const rawCode = decodeURIComponent(button.dataset.code || '');
    if (navigator.clipboard && rawCode) {
        navigator.clipboard.writeText(rawCode).then(() => {
            const originalText = button.innerText;
            button.innerText = copiedLabel;
            button.style.color = '#137A52';
            setTimeout(() => {
                button.innerText = originalText;
                button.style.color = '';
            }, 2000);
        });
    }
};

document.addEventListener('click', (event) => {
    const button = event.target.closest('.code-copy-btn');
    if (button) window.sealarcaCopyCode(button, button.dataset.copiedLabel || 'Copié !');
});
