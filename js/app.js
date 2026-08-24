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
        conversations: [],
        activeConversationId: null,
        messages: [],
        inputPrompt: '',
        attachedFiles: [],
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
        closeOverlays() { this.closeRoles(); this.closeSettings(); },
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

            // 5. Charger la liste des conversations
            await this.loadConversations();

            // 6. Si une clé API est présente, découvrir les modèles
            if (this.apiKey) {
                const connected = await this.loadModels(true);
                if (!connected) this.isSettingsOpen = true;
            } else {
                this.isSettingsOpen = true;
                this.focusApiKeyInput();
            }

            // 7. Charger la dernière conversation si existante
            if (this.conversations.length > 0) {
                await this.selectConversation(this.conversations[0].id);
            }
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

        // --- Gestion des Conversations ---
        async loadConversations() {
            const app = this;
            const conversations = await window.sealarcaDb.getConversations();
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
                get hasAttachments() { return Boolean(message.attachments && message.attachments.length); },
                get hasReasoning() { return Boolean(message.reasoning); },
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
                    model: this.selectedModel,
                    roleId: this.selectedRole ? this.selectedRole.id : null,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                await window.sealarcaDb.saveConversation(newConv);
                this.activeConversationId = newConv.id;
                await this.loadConversations();
            }

            // 2. Préparer le contenu du message avec les pièces jointes
            let fullContent = text;
            const attachmentsMeta = [];

            if (this.attachedFiles.length > 0) {
                for (const doc of this.attachedFiles) {
                    fullContent += doc.formattedPromptText;
                    attachmentsMeta.push({ name: doc.name, size: doc.size, ext: doc.extension });
                }
            }

            const userMsg = {
                id: 'msg_' + Date.now() + '_user',
                conversationId: this.activeConversationId,
                role: 'user',
                content: text || (this.attachedFiles[0] ? `[${this.attachedFiles[0].name}]` : '...'),
                fullPayload: fullContent,
                attachments: attachmentsMeta,
                createdAt: Date.now()
            };

            // 3. Sauvegarder et afficher le message utilisateur
            await window.sealarcaDb.saveMessage(userMsg);
            this.messages.push(this.decorateMessage(userMsg));

            // Réinitialiser les entrées
            this.inputPrompt = '';
            this.attachedFiles = [];
            this.currentStreamingMessage = '';
            this.currentStreamingReasoning = '';
            this.isStreaming = true;
            this.scrollToBottom();

            // 4. Préparer le contexte pour l'API
            const apiMessages = this.messages.map(m => ({
                role: m.role,
                content: m.fullPayload || m.content
            }));

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
            const maxFiles = 5;
            const remaining = Math.max(0, maxFiles - this.attachedFiles.length);
            if (remaining === 0) {
                this.showToast(`Maximum ${maxFiles} fichiers par message.`, 5000);
                return;
            }
            const files = Array.from(fileList).slice(0, remaining);
            if (fileList.length > remaining) {
                this.showToast(`Maximum ${maxFiles} fichiers par message.`, 5000);
            }
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                try {
                    this.showToast(`${file.name}...`);
                    const parsed = await window.sealarcaDocHandler.parseFile(file);
                    const app = this;
                    const attachment = {
                        ...parsed,
                        id: `attachment_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                        remove() {
                            const index = app.attachedFiles.indexOf(attachment);
                            if (index >= 0) app.attachedFiles.splice(index, 1);
                        }
                    };
                    this.attachedFiles.push(attachment);
                    this.showToast(`✅ ${file.name}`);
                } catch (err) {
                    console.error('Erreur extraction document:', err);
                    this.showToast(`❌ ${file.name} : ${err.message}`);
                }
            }
        },

        removeAttachment(index) {
            this.attachedFiles.splice(index, 1);
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
