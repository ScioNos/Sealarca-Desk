/**
 * Sealarca-Desk — Logique Applicative & Composant Réactif Alpine.js
 * Intégration multilingue i18n (FR, DE, IT, EN, ES) & Réactivité complète.
 */

const MAX_CHAT_CONTEXT_CHARACTERS = 250000;

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
        verifiedApiKey: '',
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
        folderOverview: { documentCount: 0, pageCount: 0, profileCount: 0, people: [], organizations: [], dates: [], items: [], timeline: [], entities: { people: [], organizations: [], amounts: [], obligations: [], documents: [], sources: [] } },
        folderOperations: [],
        isFolderOptionsOpen: false,
        isStartingFolderOperation: false,
        operationOwnerId: `tab_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`,
        operationRuns: new Map(),
        reasoningOpenState: {},
        traceOpenState: {},
        p1Queue: null,
        inputPrompt: '',
        isStreaming: false,
        currentStreamingMessage: '',
        currentStreamingReasoning: '',
        activeStreamPromise: null,
        isReasoningOpen: true,

        // --- Rôles métiers ---
        roles: [],
        selectedRole: null,

        // --- État UI ---
        sidebarCollapsed: typeof window !== 'undefined' && window.innerWidth <= 900,
        searchQuery: '',
        isSettingsOpen: false,
        isRolesOpen: false,
        isDocumentsOpen: false,
        isDocumentPreviewOpen: false,
        modalFocusStack: [],
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
        get appEdit() { return this.t('app.edit'); },
        get appClose() { return this.t('app.close'); },
        get modelPickerHint() { return this.t('app.modelHint'); },
        get roleButtonHint() { return this.t('app.roleHint'); },
        get roleButtonTitle() { return `${this.appRoles} — ${this.t('app.roleHint')}`; },
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
        get documentPreviewWarnings() { return this.extractionWarnings(this.previewDocument); },
        get documentPreviewTitle() { return this.previewDocument ? this.previewDocument.name : this.t('documents.preview'); },
        get documentPreviewSize() { return this.previewDocument ? this.formatBytes(this.previewDocument.size) : ''; },
        get previewHasProfile() {
            const profile = this.previewDocument?.profile;
            return Boolean(profile?.status === 'valid' && profile.inputFingerprint === window.SealarcaP1.fingerprintDocument(this.previewDocument));
        },
        get previewHasProfileFacts() { return this.previewProfileFacts.length > 0; },
        get previewProfileFacts() {
            const app = this;
            const profile = this.previewDocument?.profile || {};
            const documentId = this.previewDocument?.id;
            const entries = [
                ...(profile.importantAmounts || []).map(item => ({ ...item, kind: 'amount', value: item.amount || item.label })),
                ...(profile.obligations || []).map(item => ({ ...item, kind: 'obligation', value: item.label || item.details, detail: item.deadline || item.details }))
            ];
            return entries.map((item, index) => ({
                ...item,
                id: item.kind + '_' + index,
                reference: item.references?.[0]?.label || '',
                open() { app.openProfileReference(documentId, item.references?.[0]?.sourceId || null); }
            }));
        },
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
        get settingsModelsHint() { return this.t('settings.modelsHint'); },
        get settingsTestLabel() { return this.t(this.isLoadingModels ? 'settings.syncing' : 'settings.testBtn'); },
        get settingsSaveLabel() { return this.t('settings.saveBtn'); },
        get settingsForgetLabel() { return this.t('settings.forgetBtn'); },
        get settingsToggleKeyLabel() { return this.t(this.isApiKeyVisible ? 'settings.hideKey' : 'settings.showKey'); },
        get settingsGetKeyLabel() { return this.t('settings.getKey'); },
        get settingsOpenKeysLabel() { return this.t('settings.openKeys'); },
        get settingsPrerequisitesTitle() { return this.t('settings.prerequisitesTitle'); },
        get settingsPrerequisites() { return this.t('settings.prerequisites'); },
        get settingsStepOne() { return this.t('settings.stepOne'); },
        get settingsStepTwo() { return this.t('settings.stepTwo'); },
        get settingsStartUrl() {
            // Le site ne propose pas de page /es/ ; l'espagnol retombe volontairement sur /en/.
            const locale = ['fr', 'de', 'it', 'en'].includes(this.currentLang) ? this.currentLang : 'en';
            return `https://sealarca.ch/${locale}/commencer#desk`;
        },
        get settingsKeysUrl() { return 'https://sealarca.ch/keys'; },
        get settingsCloseLabel() { return this.t('settings.closeBtn'); },
        get modelPickerLabel() { return this.t('app.model'); },
        get modelChoosePrompt() { return this.t('settings.chooseModel'); },
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
        get themeButtonLabel() { return this.t(this.isDarkMode ? 'app.themeLight' : 'app.themeDark'); },
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
        get hasVerifiedApiKey() { return Boolean(this.verifiedApiKey && this.verifiedApiKey === this.apiKey.trim()); },
        get hasConfiguredApi() { return this.hasVerifiedApiKey && this.models.length > 0 && Boolean(this.selectedModel); },
        get settingsActionsDisabled() { return this.isLoadingModels || !this.hasApiKey; },
        get settingsSaveDisabled() { return this.isLoadingModels || !this.selectedModel; },
        get apiKeyInputType() { return this.isApiKeyVisible ? 'text' : 'password'; },
        get hasModels() { return this.models.length > 0; },
        get hasToast() { return Boolean(this.toastMessage); },
        get streamingMarkdown() { return this.renderMarkdown(this.currentStreamingMessage || '...'); },
        get isOverviewTab() { return this.documentPanelTab === 'overview'; },
        get isTimelineTab() { return this.documentPanelTab === 'timeline'; },
        get isLibraryTab() { return this.documentPanelTab === 'library'; },
        get isSearchTab() { return this.documentPanelTab === 'search'; },
        get isJobsTab() { return this.documentPanelTab === 'jobs'; },
        get overviewTabClass() { return this.isOverviewTab ? 'active' : ''; },
        get libraryTabClass() { return this.isLibraryTab ? 'active' : ''; },
        get searchTabClass() { return this.isSearchTab ? 'active' : ''; },
        get jobsTabClass() { return this.isJobsTab ? 'active' : ''; },
        get timelineTabClass() { return this.isTimelineTab ? 'active' : ''; },
        get manualContextClass() { return this.isManualContext ? 'active' : ''; },
        get automaticContextClass() { return this.isAutomaticContext ? 'active' : ''; },
        get hasAnyModal() { return this.isSettingsOpen || this.isRolesOpen || this.isDocumentsOpen || this.isDocumentPreviewOpen; },
        get hasDocumentSearchResults() { return this.documentSearchResults.length > 0; },
        get hasNoDocumentSearchResults() { return Boolean(this.documentSearchQuery.trim()) && this.documentSearchResults.length === 0; },
        get hasProcessingJobs() { return this.processingJobs.length > 0; },
        get hasNoProcessingJobs() { return this.processingJobs.length === 0; },
        get hasFolderOperations() { return this.folderOperations.length > 0; },
        get hasNoFolderOperations() { return this.folderOperations.length === 0; },
        get hasTimelineEvents() { return this.folderOverview.timeline.length > 0; },
        get hasDossierAmounts() { return this.folderOverview.entities.amounts.length > 0; },
        get hasDossierObligations() { return this.folderOverview.entities.obligations.length > 0; },
        get dossierParties() { return this.folderOverview.entities.people.concat(this.folderOverview.entities.organizations); },
        get runningFolderOperation() { return this.folderOperations.find(operation => operation.status === 'running') || null; },
        get canCancelFolderOperation() { return Boolean(this.runningFolderOperation && this.operationRuns.has(this.runningFolderOperation.id)); },
        get folderActionsDisabled() { return !this.documents.length || this.isStartingFolderOperation || Boolean(this.runningFolderOperation); },
        get visibleFolderOperations() { return this.folderOperations.slice(0, 6); },
        get folderContextModeOverride() { return this.activeFolder?.documentSettings?.contextMode || ''; },
        get hasNoOverviewEntities() { return this.folderOverview.people.length === 0 && this.folderOverview.organizations.length === 0; },
        get effectiveContextMode() {
            const override = this.activeFolder?.documentSettings?.contextMode;
            return ['manual', 'automatic'].includes(override) ? override : this.contextMode;
        },
        get isManualContext() { return this.effectiveContextMode === 'manual'; },
        get isAutomaticContext() { return this.effectiveContextMode === 'automatic'; },
        get folderOverviewPagesLabel() { return this.folderOverview.pageCount > 0 ? this.folderOverview.pageCount + ' ' + this.t('documents.pagesUnit') : this.t('documents.pagesUnavailable'); },
        get folderOverviewProfilesLabel() { return this.folderOverview.profileCount + ' / ' + this.folderOverview.documentCount; },

        get documentsWorkspaceKicker() { return this.t('documents.workspaceKicker'); },
        get documentsWorkspaceSubtitle() { return this.t('documents.workspaceSubtitle'); },
        get dossierActionsTitle() { return this.t('dossier.actionsTitle'); },
        get dossierTimelineTitle() { return this.t('dossier.timelineTitle'); },
        get dossierTimelineEmpty() { return this.t('dossier.timelineEmpty'); },
        get dossierOperationTitle() { return this.t('dossier.operationsTitle'); },
        get dossierOperationsEmpty() { return this.t('dossier.operationsEmpty'); },
        get dossierAdvancedOptions() { return this.t('dossier.advancedOptions'); },
        get dossierFolderContextSetting() { return this.t('dossier.folderContextSetting'); },
        get dossierInheritContextSetting() { return this.t('dossier.inheritContextSetting'); },
        get dossierManualContextSetting() { return this.t('dossier.manualContextSetting'); },
        get dossierAutomaticContextSetting() { return this.t('dossier.automaticContextSetting'); },
        get dossierProfileCoverageLabel() {
            return this.t('dossier.profileCoverage').replaceAll('{ready}', String(this.folderOverview.profileCount)).replaceAll('{total}', String(this.folderOverview.documentCount));
        },
        get dossierLocalActionHelp() { return this.t('dossier.localActionHelp'); },
        get dossierCancelOperation() { return this.t('dossier.cancelOperation'); },
        get dossierRetryOperation() { return this.t('dossier.retryOperation'); },
        get dossierOpenResult() { return this.t('dossier.openResult'); },
        get dossierSummaryAction() { return this.t('dossier.actions.summary'); },
        get dossierTimelineAction() { return this.t('dossier.actions.timeline'); },
        get dossierEntitiesAction() { return this.t('dossier.actions.entities'); },
        get dossierObligationsAction() { return this.t('dossier.actions.obligations'); },
        get dossierCompareAction() { return this.t('dossier.actions.compare'); },
        get dossierDivergencesAction() { return this.t('dossier.actions.divergences'); },
        get dossierAmountsAction() { return this.t('dossier.actions.amounts'); },
        get dossierTimelineTabLabel() { return this.t('dossier.timelineTab'); },
        get dossierEntitiesTitle() { return this.t('dossier.entitiesTitle'); },
        get dossierAmountsTitle() { return this.t('dossier.amountsTitle'); },
        get dossierObligationsTitle() { return this.t('dossier.obligationsTitle'); },
        get dossierAmountsEmpty() { return this.t('dossier.amountsEmpty'); },
        get dossierObligationsEmpty() { return this.t('dossier.obligationsEmpty'); },
        get dossierExtractionUnverified() { return this.t('dossier.extractionUnverified'); },
        get documentsOverviewTab() { return this.t('documents.overviewTab'); },
        get documentsLibraryTab() { return this.t('documents.libraryTab'); },
        get documentsSearchTab() { return this.t('documents.searchTab'); },
        get documentsJobsTab() { return this.t('documents.jobsTab'); },
        get documentsOverviewTitle() { return this.t('documents.overviewTitle'); },
        get documentsOverviewDescription() { return this.t('documents.overviewDescription'); },
        get documentsExportOverview() { return this.t('documents.exportOverview'); },
        get documentsGenerateMissing() { return this.t('documents.generateMissing'); },
        get documentsDocumentStat() { return this.t('documents.documentStat'); },
        get documentsVolumeStat() { return this.t('documents.volumeStat'); },
        get documentsProfilesStat() { return this.t('documents.profilesStat'); },
        get documentsSectionLabel() { return this.t('documents.documentsSection'); },
        get documentsPeopleOrganizations() { return this.t('documents.peopleOrganizationsSection'); },
        get documentsDatesSection() { return this.t('documents.datesSection'); },
        get documentsItemsSection() { return this.t('documents.itemsSection'); },
        get documentsOverviewEmpty() { return this.t('documents.overviewEmpty'); },
        get documentsOverviewEntitiesEmpty() { return this.t('documents.overviewEntitiesEmpty'); },
        get documentsGenerateProfile() { return this.t('documents.generateProfile'); },
        get documentsProfileTitle() { return this.t('documents.profileTitle'); },
        get documentsPeopleLabel() { return this.t('documents.people'); },
        get documentsOrganizationsLabel() { return this.t('documents.organizations'); },
        get documentsContextTitle() { return this.t('documents.contextTitle'); },
        get documentsManualMode() { return this.t('documents.manualMode'); },
        get documentsAutomaticMode() { return this.t('documents.automaticMode'); },
        get documentsAutomaticHint() { return this.t('documents.automaticHint'); },
        get documentsSearchLabel() { return this.t('documents.searchLabel'); },
        get documentsSearchPlaceholder() { return this.t('documents.searchPlaceholder'); },
        get documentsSearchScope() { return this.t('documents.searchScope'); },
        get documentsNoSearchResults() { return this.t('documents.noSearchResults'); },
        get documentsQueueTitle() { return this.t('documents.queueTitle'); },
        get documentsQueueDescription() { return this.t('documents.queueDescription'); },
        get documentsQueueAction() { return this.t('documents.queueAction'); },
        get documentsNoJobs() { return this.t('documents.noJobs'); },
        get documentsJobCancel() { return this.t('documents.jobCancel'); },
        get documentsJobRetry() { return this.t('documents.jobRetry'); },

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
        openModal(stateKey, modalName, focusSelector = null) {
            if (!this[stateKey]) {
                const active = document.activeElement;
                this.modalFocusStack.push(active && active !== document.body ? active : null);
                this[stateKey] = true;
            }
            this.$nextTick(() => this.focusModal(modalName, focusSelector));
        },
        focusModal(modalName, focusSelector = null) {
            const card = document.querySelector(`[data-modal="${modalName}"]`);
            if (!card) return;
            const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
            const focusables = Array.from(card.querySelectorAll(focusableSelector)).filter(element => element.getClientRects().length && !element.closest('[inert]'));
            const target = focusSelector ? card.querySelector(focusSelector) : null;
            (target && target.getClientRects().length ? target : focusables[0] || card).focus();
        },
        closeModal(stateKey, modalName, canClose = true) {
            if (!canClose || !this[stateKey]) return false;
            this[stateKey] = false;
            const returnFocus = this.modalFocusStack.pop() || null;
            this.$nextTick(() => {
                if (returnFocus && returnFocus.isConnected && !returnFocus.closest('[inert]')) {
                    returnFocus.focus();
                } else {
                    document.getElementById('chat-textarea')?.focus();
                }
            });
            return true;
        },
        openSettings() { this.apiError = ''; this.openModal('isSettingsOpen', 'settings', '#api-key-input'); },
        closeSettings() { return this.closeModal('isSettingsOpen', 'settings', this.hasConfiguredApi); },
        openRoles() { this.openModal('isRolesOpen', 'roles', '.modal-close'); },
        closeRoles() { return this.closeModal('isRolesOpen', 'roles'); },
        openDocuments() { this.openModal('isDocumentsOpen', 'documents', '#overview-tab'); this.openOverviewTab(); this.refreshFolderWorkspace(); },
        openOverviewTab() { this.documentPanelTab = 'overview'; this.refreshFolderWorkspace(); },
        openTimelineTab() { this.documentPanelTab = 'timeline'; this.refreshFolderWorkspace(); },
        openLibraryTab() { this.documentPanelTab = 'library'; },
        openSearchTab() { this.documentPanelTab = 'search'; },
        openJobsTab() { this.documentPanelTab = 'jobs'; this.loadProcessingJobs(); },
        handleWorkspaceTabsKeydown(event) {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') return;
            const order = ['overview', 'timeline', 'library', 'search', 'jobs'];
            let index = order.indexOf(this.documentPanelTab);
            if (event.key === 'ArrowRight') index = (index + 1) % order.length;
            else if (event.key === 'ArrowLeft') index = (index - 1 + order.length) % order.length;
            else if (event.key === 'Home') index = 0;
            else if (event.key === 'End') index = order.length - 1;
            event.preventDefault();
            const tab = order[index];
            if (tab === 'overview') this.openOverviewTab();
            else if (tab === 'timeline') this.openTimelineTab();
            else if (tab === 'library') this.openLibraryTab();
            else if (tab === 'search') this.openSearchTab();
            else if (tab === 'jobs') this.openJobsTab();
            this.$nextTick(() => document.getElementById(`${tab}-tab`)?.focus());
        },
        useManualContext() { return this.setContextMode('manual'); },
        useAutomaticContext() { return this.setContextMode('automatic'); },
        async setContextMode(mode) {
            if (!['manual', 'automatic'].includes(mode)) return;
            const folder = this.activeFolderId ? await window.sealarcaDb.getFolder(this.activeFolderId) : null;
            if (['manual', 'automatic'].includes(folder?.documentSettings?.contextMode)) {
                await this.saveActiveFolderSettings({ contextMode: mode });
                return;
            }
            this.contextMode = mode;
            await window.sealarcaDb.setSetting('sealarca_context_mode', mode);
        },
        async setFolderContextModeOverride(event) {
            const value = event.currentTarget.value;
            await this.saveActiveFolderSettings({ contextMode: ['manual', 'automatic'].includes(value) ? value : null });
        },
        async saveActiveFolderSettings(changes) {
            const folder = this.activeFolderId ? await window.sealarcaDb.getFolder(this.activeFolderId) : null;
            if (!folder) return;
            await window.sealarcaDb.saveFolder({
                ...folder,
                documentSettings: { ...(folder.documentSettings || {}), ...changes }
            });
            await this.loadFolders();
        },
        closeDocuments() { return this.closeModal('isDocumentsOpen', 'documents'); },
        closeDocumentPreview() { const closed = this.closeModal('isDocumentPreviewOpen', 'preview'); if (closed) this.previewDocument = null; return closed; },
        closeOverlays() {
            if (this.isDocumentPreviewOpen) return this.closeDocumentPreview();
            if (this.isDocumentsOpen) return this.closeDocuments();
            if (this.isRolesOpen) return this.closeRoles();
            if (this.isSettingsOpen) return this.closeSettings();
            return false;
        },
        handleWindowKeydown(event) {
            if (!this.hasAnyModal) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                this.closeOverlays();
            } else if (event.key === 'Tab') {
                this.trapModalFocus(event);
            }
        },
        trapModalFocus(event) {
            const modalName = this.isDocumentPreviewOpen ? 'preview' : this.isDocumentsOpen ? 'documents' : this.isRolesOpen ? 'roles' : 'settings';
            const card = document.querySelector(`[data-modal="${modalName}"]`);
            if (!card) return;
            const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
            const focusables = Array.from(card.querySelectorAll(focusableSelector)).filter(element => element.getClientRects().length && !element.closest('[inert]'));
            if (!focusables.length) {
                event.preventDefault();
                card.setAttribute('tabindex', '-1');
                card.focus();
                return;
            }
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (event.shiftKey && (document.activeElement === first || !card.contains(document.activeElement))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || !card.contains(document.activeElement))) {
                event.preventDefault();
                first.focus();
            }
        },
        toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; },
        modelChanged() { return this.selectedModel ? window.sealarcaDb.setSetting('sealarca_model', this.selectedModel) : window.sealarcaDb.deleteSetting('sealarca_model'); },
        updateSearchQuery(event) { this.searchQuery = event.currentTarget.value; },
        updateSelectedModel(event) {
            this.selectedModel = event.currentTarget.value;
            return this.modelChanged();
        },
        updatePrompt(event) { this.inputPrompt = event.currentTarget.value; },
        updateApiKey(event) {
            const nextKey = event.currentTarget.value;
            if (nextKey.trim() !== this.verifiedApiKey) {
                this.models = [];
                this.selectedModel = '';
            }
            this.apiKey = nextKey;
        },
        sendOrStop() { return this.isStreaming ? this.stopGeneration() : this.sendMessage(); },
        toggleLiveReasoning() { this.isReasoningOpen = !this.isReasoningOpen; },
        toggleApiKeyVisibility() { this.isApiKeyVisible = !this.isApiKeyVisible; },
        focusApiKeyInput() { this.$nextTick(() => this.focusModal('settings', '#api-key-input')); },
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
            try { savedKey = (sessionStorage.getItem('sealarca_api_key_session') || '').trim(); } catch { /* indisponible */ }
            const legacyKey = String((await window.sealarcaDb.getSetting('sealarca_api_key', '')) || '').trim();
            const savedModel = await window.sealarcaDb.getSetting('sealarca_model', '');
            const savedRole = await window.sealarcaDb.getSetting('sealarca_active_role', null);
            const savedContextMode = await window.sealarcaDb.getSetting('sealarca_context_mode', 'manual');

            this.apiKey = savedKey || legacyKey;
            if (!savedKey && legacyKey) {
                try { sessionStorage.setItem('sealarca_api_key_session', legacyKey); } catch { /* indisponible */ }
            }
            if (legacyKey) {
                await window.sealarcaDb.deleteSetting('sealarca_api_key');
            }
            this.selectedModel = savedModel;
            this.contextMode = ['manual', 'automatic'].includes(savedContextMode) ? savedContextMode : 'manual';
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
                if (!connected) {
                    this.isSettingsOpen = true;
                    this.focusApiKeyInput();
                }
            } else {
                this.isSettingsOpen = true;
                this.focusApiKeyInput();
            }

            // 7. Charger la dernière conversation du dossier actif si existante
            if (this.conversations.length > 0) await this.selectConversation(this.conversations[0].id);
            await this.initializeP1Queue();
            await window.sealarcaDb.recoverStaleOperations();
            await this.loadFolderOperations();
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
                const localized = r.kind === 'custom' ? null : window.SEALARCA_I18N?.[this.currentLang]?.roles?.[roleKey];
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
                if (updated) {
                    this.selectedRole = updated;
                    await this.persistSelectedRole(updated);
                }
            } else {
                this.selectedRole = this.roles.find(role => role.id === window.SEALARCA_DEFAULT_ROLE_ID) || null;
            }
        },

        async persistSelectedRole(role) {
            if (!role) return;
            try {
                await window.sealarcaDb.setSetting('sealarca_active_role', {
                    id: role.id,
                    name: role.name,
                    icon: role.icon,
                    description: role.description,
                    systemPrompt: role.systemPrompt
                });
            } catch (error) {
                console.error('Sauvegarde du mode impossible:', error);
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
                        this.selectedModel = '';
                        await window.sealarcaDb.deleteSetting('sealarca_model');
                    }
                }
                try { sessionStorage.setItem('sealarca_api_key_session', this.apiKey.trim()); } catch { /* indisponible */ }
                this.verifiedApiKey = this.apiKey.trim();
                await window.sealarcaDb.deleteSetting('sealarca_api_key');
                if (!silent) this.showToast(this.t('settings.syncSuccess'));
                return true;
            } catch (err) {
                console.error('Erreur découverte modèles:', err);
                this.models = [];
                this.selectedModel = '';
                this.verifiedApiKey = '';
                const rawMessage = String(err?.message || '');
                this.apiError = !err?.status && /failed to fetch|network|networkerror|load failed|connexion/i.test(rawMessage)
                    ? this.t('settings.networkError')
                    : rawMessage || this.t('settings.networkError');
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
            if (!this.hasVerifiedApiKey || this.models.length === 0) {
                const connected = await this.loadModels(false);
                if (!connected) return;
            }
            if (this.selectedModel) this.closeModal('isSettingsOpen', 'settings', true);
            else this.apiError = this.t('settings.modelRequired');
        },

        async forgetApiKey() {
            if (window.sealarcaApi && typeof window.sealarcaApi.abortAllRequests === 'function') window.sealarcaApi.abortAllRequests('cancelled');
            else window.sealarcaApi.abortCurrentRequest();
            try { sessionStorage.removeItem('sealarca_api_key_session'); } catch { /* indisponible */ }
            await window.sealarcaDb.deleteSetting('sealarca_api_key');
            await window.sealarcaDb.deleteSetting('sealarca_model');
            this.apiKey = '';
            this.verifiedApiKey = '';
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
                    get isActive() { return app.activeFolderId === folder.id; },
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
            if (id === this.activeFolderId) await this.cancelAndWaitForStream();
            try {
                this.p1Queue?.abortJobsForFolder?.(id, 'folder_deleted');
                const folderDocuments = await window.sealarcaDb.getDocuments(id).catch(() => []);
                if (Array.isArray(folderDocuments) && folderDocuments.length) {
                    this.p1Queue?.abortJobsForDocuments?.(folderDocuments.map(document => document?.id), 'folder_deleted');
                }
            } catch (_) { /* annulation best-effort */ }
            const deleted = await window.sealarcaDb.deleteFolder(id);
            if (!deleted) return;
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
                    get warningText() { return app.extractionWarnings(document).join(' · '); },
                    get sizeLabel() { return app.formatBytes(document.size); },
                    get pageLabel() { const pages = Number(document.metadata?.pageCount || 0); return pages ? pages + ' ' + app.t('documents.pagesUnit') : ''; },
                    get profileAnalysisDateLabel() {
                        const timestamp = Number(decorated.profile?.generatedAt || decorated.profile?.updatedAt || 0);
                        if (!Number.isFinite(timestamp) || timestamp <= 0) return '';
                        const date = new Intl.DateTimeFormat(app.currentLang, { dateStyle: 'medium' }).format(new Date(timestamp));
                        return app.t('documents.lastProfileDate').replaceAll('{date}', date);
                    },
                    get profileStatusLabel() { return app.t(decorated.profile?.status === 'valid' && decorated.profile.inputFingerprint === window.SealarcaP1.fingerprintDocument(document) ? 'documents.profileAvailable' : 'documents.profileToGenerate'); },
                    get analysisStatus() { return app.documentAnalysisStatus(document, decorated.profile); },
                    get analysisStatusLabel() { return app.t('dossier.status.' + decorated.analysisStatus); },
                    get analysisStatusClass() { return 'status-' + decorated.analysisStatus; },
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
            const documentRecord = await window.sealarcaDb.getDocument(id);
            if (documentRecord) {
                documentRecord.profile = await window.sealarcaDb.getDocumentProfile(id);
                this.previewDocument = documentRecord;
                this.openModal('isDocumentPreviewOpen', 'preview', '.modal-close');
            }
        },

        async deleteDocument(id) {
            if (!window.confirm(this.t('documents.deleteConfirm'))) return;
            if (this.runningFolderOperation?.documentIds?.includes(id)) await this.cancelFolderOperation(this.runningFolderOperation.id);
            try { this.p1Queue?.abortJobsForDocument?.(id, 'document_deleted'); } catch (_) { /* annulation best-effort */ }
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
            window.document.body.appendChild(link);
            link.click();
            link.remove();
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

        createMessageId(role) {
            let randomId = '';
            try { randomId = window.crypto?.randomUUID?.() || ''; } catch (_) { /* fallback below */ }
            return `msg_${randomId || `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`}_${role}`;
        },

        async cancelAndWaitForStream() {
            const stream = this.activeStreamPromise;
            if (!this.isStreaming && !stream) return;
            if (this.isStreaming && window.sealarcaApi) {
                if (typeof window.sealarcaApi.abortAllRequests === 'function') window.sealarcaApi.abortAllRequests('cancelled');
                else window.sealarcaApi.abortCurrentRequest();
            }
            if (this.p1Queue?.running?.size) {
                for (const running of this.p1Queue.running.values()) {
                    try { running.controller.abort('cancelled'); } catch (_) {}
                }
            }
            if (stream) await stream;
        },

        buildDocumentContext(documents, query = '', mode = this.effectiveContextMode, options = {}) {
            const selectedDocuments = Array.isArray(documents) ? documents : [];
            if (!selectedDocuments.length) return { text: '', citationDocuments: [], notices: [], manifest: { mode, characters: 0, documents: [], sources: [] } };
            const citationDocuments = [];
            const sections = [];
            const manifestDocuments = [];
            const manifestSources = [];
            const notices = [];
            const maxCharacters = Number.isFinite(Number(options.maxCharacters)) ? Math.max(1000, Number(options.maxCharacters)) : Infinity;
            const sectionBudget = Number.isFinite(maxCharacters) ? Math.max(0, maxCharacters - 500) : Infinity;
            const maxSourcesPerDocument = Math.max(1, Number(options.maxSourcesPerDocument) || 8);
            let usedCharacters = 0;

            for (const document of selectedDocuments) {
                const sourceMap = Array.isArray(document.sourceMap) ? document.sourceMap : [];
                const excerpts = mode === 'automatic'
                    ? window.SealarcaP1.citableExcerpts(document, query, { limit: maxSourcesPerDocument })
                    : sourceMap.map(source => ({
                        sourceId: source.id,
                        reference: window.SealarcaP1.sourceReference(document, source),
                        excerpt: String(document.markdown || '').slice(Number(source.markdownStart || 0), Number(source.markdownEnd || 0)).trim(),
                        source
                    })).filter(item => item.excerpt);
                const header = ['## Document sélectionné : ' + document.name, 'Type: ' + (document.mimeType || document.extension || 'inconnu')].join('\n');
                const sourceEntries = [];
                const sentSourceMap = [];
                let body = '';
                if (!excerpts.length) {
                    body = String(document.markdown || '');
                    if (body && usedCharacters + header.length + body.length <= sectionBudget) {
                        usedCharacters += header.length + body.length + 4;
                    } else {
                        body = '';
                        notices.push(window.SealarcaOperations.createNotice('document_not_in_context', 'partial', { documentId: document.id, metadata: { reason: 'context_limit_or_empty' } }));
                    }
                } else {
                    for (const excerpt of excerpts) {
                        const excerptText = String(excerpt.excerpt || '').trim();
                        if (!excerptText) continue;
                        const source = excerpt.source || sourceMap.find(item => item.id && item.id === excerpt.sourceId)
                            || sourceMap.find(item => window.SealarcaP1.sourceReference(document, item) === excerpt.reference);
                        const reference = String(excerpt.reference || (source && window.SealarcaP1.sourceReference(document, source)) || document.name);
                        const block = '### SOURCE: ' + reference + '\n' + excerptText;
                        const nextSection = [header, ...sourceEntries.map(item => item.block), block].join('\n\n');
                        if (usedCharacters + nextSection.length + 4 > sectionBudget) {
                            notices.push(window.SealarcaOperations.createNotice('context_limit_reached', 'partial', { documentId: document.id, metadata: { limit: maxCharacters } }));
                            continue;
                        }
                        sourceEntries.push({ block, source, reference, characterCount: excerptText.length });
                        if (source?.id && !sentSourceMap.some(item => item.id === source.id)) sentSourceMap.push(source);
                    }
                    if (sourceEntries.length) usedCharacters += [header, ...sourceEntries.map(item => item.block)].join('\n\n').length + 4;
                }
                const section = body ? [header, body].join('\n\n') : sourceEntries.length ? [header, ...sourceEntries.map(item => item.block)].join('\n\n') : '';
                const included = Boolean(section);
                if (included) sections.push(section);
                const warnings = document.metadata?.extraction?.warnings || [];
                if (included && warnings.length) notices.push(window.SealarcaOperations.createNotice('document_extraction_partial', 'partial', { documentId: document.id, metadata: { name: document.name, warnings } }));
                citationDocuments.push({ ...document, sourceMap: sentSourceMap });
                const sourceIds = sourceEntries.map(item => item.source?.id).filter(Boolean);
                const characterCount = body.length || sourceEntries.reduce((sum, item) => sum + item.characterCount, 0);
                manifestDocuments.push({
                    id: document.id,
                    name: document.name,
                    hash: document.hash || null,
                    pageCount: Number(document.metadata?.pageCount) || null,
                    included,
                    characterCount,
                    sourceIds
                });
                for (const item of sourceEntries) manifestSources.push({
                    documentId: document.id,
                    documentName: document.name,
                    sourceId: item.source?.id || null,
                    reference: item.reference,
                    locator: item.source?.locator || null,
                    characterCount: item.characterCount
                });
            }

            const text = sections.length
                ? '\n\n# CONTEXTE DOCUMENTAIRE SÉLECTIONNÉ\n\n' + sections.join('\n\n---\n\n') + '\n\nRègle de citation: cite exactement les libellés SOURCE fournis. N’invente jamais une page, slide, feuille ou ligne absente.\n\n# FIN DU CONTEXTE DOCUMENTAIRE\n'
                : '';
            return {
                text,
                citationDocuments,
                notices,
                manifest: { mode, characters: text.length, documents: manifestDocuments, sources: manifestSources }
            };
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
                    get statusLabel() { return app.t(({ pending: 'documents.statusPending', running: 'documents.statusRunning', completed: 'documents.statusCompleted', failed: 'documents.statusFailed', cancelled: 'documents.statusCancelled' })[job.status] || 'documents.statusFailed'); },
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
            await Promise.all([this.loadDocuments(), this.loadDocumentProfiles(), this.loadProcessingJobs(), this.loadFolderOperations()]);
            this.buildFolderOverview();
            if (this.documentSearchQuery.trim()) this.runDocumentSearch();
        },

        buildFolderOverview() {
            const profileByDocument = new Map(this.documentProfiles.map(profile => [profile.documentId, profile]));
            const validProfiles = this.documents.map(document => {
                const profile = profileByDocument.get(document.id);
                return profile?.status === 'valid' && profile.inputFingerprint === window.SealarcaP1.fingerprintDocument(document) ? profile : null;
            }).filter(Boolean);
            const unique = values => [...new Set(values.filter(Boolean).map(value => String(value).trim()))].slice(0, 100);
            const dates = [];
            const items = [];
            for (const profile of validProfiles) {
                const document = this.documents.find(item => item.id === profile.documentId);
                for (const item of profile.importantDates || []) dates.push({ ...item, id: profile.documentId + '_' + (item.date || item.label), documentId: profile.documentId, documentName: document?.name || '', referenceLabel: item.references?.[0]?.label || document?.name || '', open: () => this.openProfileReference(profile.documentId, item.references?.[0]?.sourceId || null) });
                for (const item of profile.importantItems || []) items.push({ ...item, id: profile.documentId + '_' + (item.label || item.details), documentId: profile.documentId, documentName: document?.name || '', referenceLabel: item.references?.[0]?.label || document?.name || '', open: () => this.openProfileReference(profile.documentId, item.references?.[0]?.sourceId || null) });
            }
            const model = window.SealarcaTimeline.buildDossierModel(validProfiles, this.documents);
            const app = this;
            const entities = Object.fromEntries(Object.entries(model.entities).map(([kind, rows]) => [kind, rows.map(entity => ({
                ...entity,
                sourceLinks: (entity.sources || []).map(source => ({
                    ...source,
                    open() { app.openProfileReference(source.documentId, source.sourceId); }
                }))
            }))]));
            this.folderOverview = {
                documentCount: this.documents.length,
                pageCount: this.documents.reduce((sum, document) => sum + (Number(document.metadata?.pageCount) || 0), 0),
                profileCount: validProfiles.length,
                people: unique(validProfiles.flatMap(profile => profile.people || [])),
                organizations: unique(validProfiles.flatMap(profile => profile.organizations || [])),
                dates: dates.slice(0, 50),
                items: items.slice(0, 50),
                timeline: model.timeline.map(event => ({
                    ...event,
                    get displayDate() { return event.date || app.t('dossier.dateUnknown'); },
                    get extractionNote() { return app.t('dossier.extractionUnverified'); },
                    sources: event.sources.map(source => ({
                        ...source,
                        open: () => this.openProfileReference(source.documentId, source.sourceId)
                    }))
                })),
                entities,
                analyzedDocumentCount: model.analyzedDocumentCount
            };
        },

        async loadFolderOperations() {
            const operations = this.activeFolderId ? await window.sealarcaDb.getOperations(this.activeFolderId) : [];
            const traceRows = await Promise.all(operations.map(async operation => ({ operation, trace: operation.resultRef?.traceId ? await window.sealarcaDb.getTrace(operation.resultRef.traceId) : null })));
            this.folderOperations = traceRows.map(({ operation, trace }) => {
                const app = this;
                const traceDocuments = (trace?.documents || []).map(item => ({
                    ...item,
                    traceStatusLabel: app.t(item.included ? 'dossier.traceIncluded' : 'dossier.traceOmitted')
                        .replaceAll('{count}', String((trace.sources || []).filter(source => source.documentId === item.id).length)),
                    visibleSources: (trace.sources || []).filter(source => source.documentId === item.id).map(source => ({
                        ...source,
                        open() { app.openProfileReference(source.documentId, source.sourceId); }
                    }))
                }));
                const snapshot = operation.resultRef?.snapshot || {};
                const resultItems = operation.type === 'timeline' ? (snapshot.timeline || [])
                    : operation.type === 'obligations' ? (snapshot.obligations || [])
                        : operation.type === 'amounts' ? (snapshot.amounts || [])
                            : operation.type === 'compare' ? (snapshot.comparisons || [])
                                : operation.type === 'divergences' ? (snapshot.divergences || [])
                                    : operation.type === 'summary' ? (snapshot.summaries || [])
                                        : Object.values(snapshot.entities || {}).flat();
                const resultLines = resultItems.slice(0, 40).map((item, index) => {
                    const comparisonValues = (item.values || []).map(value => value.value).filter(Boolean).join(' / ');
                    const text = item.summary
                        ? item.documentName + ': ' + item.summary
                        : [item.date || item.deadline, item.label || item.name || item.value, item.details || item.amount || comparisonValues].filter(Boolean).join(' — ');
                    const source = item.sources?.[0] || item.documents?.[0] || item.values?.[0]?.documents?.[0] || null;
                    return {
                        id: item.id || operation.id + '_result_' + index,
                        text: text || String(item.name || item.value || ''),
                        reference: source?.reference || source?.label || source?.documentName || '',
                        open() { if (source?.documentId) app.openProfileReference(source.documentId, source.sourceId); }
                    };
                });
                return {
                    ...operation,
                    get title() { return app.t('dossier.actions.' + operation.type); },
                    get statusLabel() { return app.t(window.SealarcaOperations.statusKey(operation.status)); },
                    get statusClass() { return 'status-' + (['pending', 'running', 'completed', 'partial', 'failed', 'cancelled'].includes(operation.status) ? operation.status : 'warning'); },
                    get progressLabel() {
                        const progress = operation.progress || { completed: 0, total: (operation.steps || []).length };
                        return app.t('dossier.progress').replaceAll('{done}', String(progress.completed || 0)).replaceAll('{total}', String(progress.total || 0));
                    },
                    get stepRows() {
                        return (operation.steps || []).map(step => ({
                            ...step,
                            mark: step.status === 'completed' ? '✓' : step.status === 'running' ? '●' : step.status === 'failed' ? '!' : step.status === 'warning' ? '⚠' : '○',
                            rowClass: 'step-' + step.status,
                            label: app.t('dossier.steps.' + step.id),
                            get detailLabel() {
                                const detail = step.detail;
                                if (!detail || typeof detail !== 'object' || !['documents', 'profiles', 'results'].includes(detail.kind)) return '';
                                let value = app.t('dossier.stepDetails.' + detail.kind);
                                for (const [key, item] of Object.entries(detail)) {
                                    if (key !== 'kind') value = value.replaceAll('{' + key + '}', String(Number(item) || 0));
                                }
                                return value;
                            }
                        }));
                    },
                    get noticeRows() {
                        return (operation.notices || []).map((notice, index) => ({
                            id: operation.id + '_notice_' + index,
                            className: 'notice-box ' + (['info', 'warning', 'partial', 'error'].includes(notice.severity) ? notice.severity : 'warning'),
                            text: app.noticeText(notice)
                        }));
                    },
                    get traceSummaryLabel() {
                        return trace ? app.t('dossier.traceSummary')
                            .replaceAll('{documents}', String(trace.context?.documentCount || 0))
                            .replaceAll('{sources}', String(trace.context?.sourceCount || 0))
                            .replaceAll('{characters}', new Intl.NumberFormat(app.currentLang).format(trace.context?.characters || 0)) : '';
                    },
                    get traceDocuments() { return traceDocuments; },
                    get resultLines() { return resultLines; },
                    get localOnlyLabel() { return trace?.context?.mode === 'local_profiles' ? app.t('dossier.localOnly') : ''; },
                    get canCancel() { return operation.status === 'running' && app.operationRuns.has(operation.id); },
                    get canRetry() { return ['partial', 'failed', 'cancelled'].includes(operation.status); },
                    get canOpenResult() { return Boolean(operation.resultRef?.section || operation.resultRef?.conversationId); },
                    cancel() { app.cancelFolderOperation(operation.id); },
                    retry() { app.retryFolderOperation(operation.id); },
                    openResult() { app.openOperationResult(operation); }
                };
            });
        },

        noticeText(notice) {
            let text = this.t('dossier.notices.' + String(notice?.code || 'unknown_notice'));
            if (text === 'dossier.notices.' + String(notice?.code || 'unknown_notice')) text = this.t('dossier.notices.unknown_notice');
            for (const [key, value] of Object.entries(notice?.metadata || {})) text = text.replaceAll('{' + key + '}', String(value));
            if (notice?.code === 'document_extraction_partial' && Array.isArray(notice.metadata?.warnings)) {
                const details = this.extractionWarnings({ metadata: { extraction: { warnings: notice.metadata.warnings } } });
                if (details.length) text += ' ' + details.join(' · ');
            }
            return text;
        },

        documentAnalysisStatus(document, profile = document?.profile) {
            const job = this.processingJobs.find(item => item.documentId === document?.id);
            if (job?.status === 'running') return 'processing';
            if (job?.status === 'pending') return 'pending';
            if (job?.status === 'failed') return 'error';
            if (profile?.status === 'valid' && profile.inputFingerprint === window.SealarcaP1.fingerprintDocument(document)) {
                if ((document?.metadata?.extraction?.warnings || []).length) return 'partial';
                return 'ready';
            }
            if (profile && profile.status !== 'valid') return 'warning';
            return 'not_analyzed';
        },

        async runFolderAnalysis(type, requestedDocumentIds = null) {
            if (!window.SealarcaOperations.OPERATION_ACTIONS[type] || !this.activeFolderId) return;
            if (this.isStartingFolderOperation || this.operationRuns.size > 0) {
                this.showToast(this.t('dossier.operationAlreadyRunning'));
                return;
            }
            this.isStartingFolderOperation = true;
            const folderId = this.activeFolderId;
            let allDocuments;
            try {
                allDocuments = await window.sealarcaDb.getDocuments(folderId);
            } catch (error) {
                console.error('Lecture des documents du dossier impossible:', error);
                this.isStartingFolderOperation = false;
                this.showToast(this.t('dossier.operationFailed'), 6000);
                return;
            }
            const ids = Array.isArray(requestedDocumentIds) && requestedDocumentIds.length
                ? requestedDocumentIds
                : this.selectedDocumentIds.length ? this.selectedDocumentIds : allDocuments.map(document => document.id);
            const selected = new Set(ids);
            const requestedDocuments = allDocuments.filter(document => selected.has(document.id));
            if (!requestedDocuments.length) {
                this.isStartingFolderOperation = false;
                this.showToast(this.t('dossier.noDocuments'));
                return;
            }

            const maxDocuments = 100;
            const documents = requestedDocuments.slice(0, maxDocuments);
            const operationNotices = [];
            if (requestedDocuments.length > maxDocuments) operationNotices.push(window.SealarcaOperations.createNotice('document_limit_reached', 'partial', { metadata: { limit: maxDocuments } }));
            let operation = window.SealarcaOperations.createOperation(type, folderId, requestedDocuments.map(document => document.id));
            operation.notices = operationNotices;

            try {
                await window.sealarcaDb.createOperation(operation);
                const ownerId = this.operationOwnerId;
                const leaseToken = window.SealarcaOperations.makeId('lease');
                const claimed = await window.sealarcaDb.claimOperation(operation.id, ownerId, leaseToken);
                if (!claimed) {
                    await window.sealarcaDb.failPendingOperation(operation.id, window.SealarcaOperations.createNotice('operation_busy', 'warning'));
                    await this.loadFolderOperations();
                    this.showToast(this.t('dossier.operationAlreadyRunning'));
                    return;
                }
                operation = claimed;
                const controller = new AbortController();
                const run = { controller, ownerId, leaseToken, promise: null };
                this.operationRuns.set(operation.id, run);
                await this.loadFolderOperations();
                const persist = async changes => {
                    if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
                    const saved = await window.sealarcaDb.updateOperationIfOwner(operation.id, ownerId, leaseToken, changes);
                    if (!saved) { const error = new Error('La session de cette opération a expiré.'); error.name = 'OperationLeaseError'; throw error; }
                    operation = saved;
                    if (this.activeFolderId === folderId) await this.loadFolderOperations();
                    return operation;
                };
                const setStep = async (id, status, detail = null) => {
                    const next = window.SealarcaOperations.updateOperationStep(operation, id, status, detail);
                    return persist({ steps: next.steps, progress: next.progress, notices: operation.notices, context: operation.context });
                };

                const runPromise = (async () => {
                    try {
                        await setStep('prepare', 'running');
                        await setStep('prepare', 'completed', { kind: 'documents', count: documents.length });
                        await setStep('context', 'running');
                        const profiles = await window.sealarcaDb.getDocumentProfiles(folderId);
                        const documentsById = new Map(documents.map(document => [document.id, document]));
                        const profileByDocument = new Map(profiles
                            .filter(profile => profile.status === 'valid' && documentsById.has(profile.documentId)
                                && profile.inputFingerprint === window.SealarcaP1.fingerprintDocument(documentsById.get(profile.documentId)))
                            .map(profile => [profile.documentId, profile]));
                        const validProfiles = documents.map(document => profileByDocument.get(document.id)).filter(Boolean);
                        const missingDocuments = documents.filter(document => !profileByDocument.has(document.id));
                        if (missingDocuments.length) operationNotices.push(window.SealarcaOperations.createNotice('profiles_missing', 'partial', { metadata: { count: missingDocuments.length } }));
                        for (const document of missingDocuments) operationNotices.push(window.SealarcaOperations.createNotice('document_profile_missing', 'partial', { documentId: document.id, metadata: { name: document.name } }));
                        for (const document of documents) {
                            const warnings = document.metadata?.extraction?.warnings || [];
                            if (profileByDocument.has(document.id) && warnings.length) operationNotices.push(window.SealarcaOperations.createNotice('document_extraction_partial', 'partial', { documentId: document.id, metadata: { name: document.name, warnings } }));
                        }

                        await setStep('context', 'completed', { kind: 'profiles', count: validProfiles.length, total: documents.length });
                        operation = await setStep('analyze', 'running', { kind: 'profiles', count: validProfiles.length, total: documents.length });
                        const model = window.SealarcaTimeline.buildDossierModel(validProfiles, documents);
                        const comparison = window.SealarcaTimeline.buildComparison(validProfiles, documents);
                        let selectedResult;
                        if (type === 'summary') {
                            const stats = window.SealarcaTimeline.buildDossierSummary(validProfiles, documents);
                            const overview = this.t('dossier.summaryOverview')
                                .replaceAll('{profiles}', String(stats.analyzedDocumentCount))
                                .replaceAll('{documents}', String(stats.documentCount))
                                .replaceAll('{events}', String(stats.eventCount))
                                .replaceAll('{people}', String(stats.personCount))
                                .replaceAll('{organizations}', String(stats.organizationCount))
                                .replaceAll('{amounts}', String(stats.amountCount))
                                .replaceAll('{obligations}', String(stats.obligationCount))
                                .replaceAll('{divergences}', String(stats.apparentDifferenceCount));
                            const summaries = [{ documentName: this.t('dossier.summaryLocalTitle'), summary: overview, sources: [] }];
                            if (stats.sharedParties.length) {
                                summaries.push({
                                    documentName: this.t('dossier.summarySharedTitle'),
                                    summary: this.t('dossier.summarySharedEntities')
                                        .replaceAll('{count}', String(stats.sharedParties.length))
                                        .replaceAll('{items}', stats.sharedParties.slice(0, 8).map(item => item.name).join(', ')),
                                    sources: stats.sharedParties.slice(0, 8).flatMap(item => item.sources || [])
                                });
                            }
                            summaries.push(...model.timeline.slice(0, 6).map(event => ({
                                id: 'summary_event_' + event.id,
                                documentName: this.t('dossier.timelineTitle'),
                                summary: [event.date, event.label, event.details].filter(Boolean).join(' — '),
                                sources: event.sources || []
                            })));
                            summaries.push(...model.entities.obligations.slice(0, 6).map(item => ({
                                id: 'summary_obligation_' + item.id,
                                documentName: this.t('dossier.obligationsTitle'),
                                summary: item.name,
                                sources: item.sources || []
                            })));
                            summaries.push(...model.entities.amounts.slice(0, 6).map(item => ({
                                id: 'summary_amount_' + item.id,
                                documentName: this.t('dossier.amountsTitle'),
                                summary: item.name,
                                sources: item.sources || []
                            })));
                            summaries.push(...comparison.divergences.slice(0, 6).map(item => ({
                                id: 'summary_difference_' + item.id,
                                documentName: this.t('dossier.actions.divergences'),
                                summary: item.label + ': ' + item.values.map(value => {
                                    const documentsLabel = value.documents.map(document => document.documentName).join(', ');
                                    return documentsLabel ? value.value + ' (' + documentsLabel + ')' : value.value;
                                }).join(' / '),
                                sources: item.values.flatMap(value => value.documents || [])
                            })));
                            summaries.push(...validProfiles.slice(0, 14).map(profile => ({
                                documentId: profile.documentId,
                                documentName: documentsById.get(profile.documentId)?.name || profile.documentId,
                                summary: String(profile.summary || '').slice(0, 2000),
                                sources: (profile.references || []).slice(0, 20).map(reference => ({ documentId: profile.documentId, documentName: documentsById.get(profile.documentId)?.name || profile.documentId, sourceId: reference.sourceId || null, reference: reference.label || '' }))
                            })));
                            selectedResult = { summaries, stats };
                        } else if (type === 'timeline') {
                            selectedResult = { timeline: model.timeline.slice(0, 100), analyzedDocumentCount: model.analyzedDocumentCount, documentCount: model.documentCount };
                        } else if (type === 'entities') {
                            selectedResult = { entities: Object.fromEntries(Object.entries(model.entities).map(([key, values]) => [key, values.slice(0, 100)])), analyzedDocumentCount: model.analyzedDocumentCount, documentCount: model.documentCount };
                        } else if (type === 'obligations') {
                            selectedResult = { obligations: model.entities.obligations.slice(0, 100), timeline: model.timeline.filter(event => event.kinds.includes('obligation')).slice(0, 100), analyzedDocumentCount: model.analyzedDocumentCount, documentCount: model.documentCount };
                        } else if (type === 'amounts') {
                            selectedResult = { amounts: model.entities.amounts.slice(0, 100), analyzedDocumentCount: model.analyzedDocumentCount, documentCount: model.documentCount };
                        } else if (type === 'compare') {
                            selectedResult = { comparisons: comparison.comparisons.slice(0, 100), analyzedDocumentCount: comparison.analyzedDocumentCount, documentCount: comparison.documentCount };
                        } else {
                            selectedResult = { divergences: comparison.divergences.slice(0, 100), analyzedDocumentCount: comparison.analyzedDocumentCount, documentCount: comparison.documentCount };
                        }

                        const traceDocuments = requestedDocuments.map(document => {
                            const profile = profileByDocument.get(document.id);
                            const fields = [
                                ...(profile?.references || []),
                                ...(profile?.entities || []).flatMap(item => item.references || []),
                                ...(profile?.importantDates || []).flatMap(item => item.references || []),
                                ...(profile?.importantAmounts || []).flatMap(item => item.references || []),
                                ...(profile?.events || []).flatMap(item => item.references || []),
                                ...(profile?.obligations || []).flatMap(item => item.references || []),
                                ...(profile?.importantItems || []).flatMap(item => item.references || [])
                            ];
                            const sourceIds = [...new Set(fields.map(item => item.sourceId).filter(Boolean))];
                            return { id: document.id, name: document.name, hash: document.hash || null, pageCount: Number(document.metadata?.pageCount) || null, included: Boolean(profile), characterCount: 0, sourceIds };
                        });
                        const traceSources = [];
                        for (const document of documents) {
                            const profile = profileByDocument.get(document.id);
                            if (!profile) continue;
                            const rows = [
                                ...(profile.references || []),
                                ...(profile.entities || []).flatMap(item => item.references || []),
                                ...(profile.importantDates || []).flatMap(item => item.references || []),
                                ...(profile.importantAmounts || []).flatMap(item => item.references || []),
                                ...(profile.events || []).flatMap(item => item.references || []),
                                ...(profile.obligations || []).flatMap(item => item.references || []),
                                ...(profile.importantItems || []).flatMap(item => item.references || [])
                            ];
                            for (const row of rows) {
                                const source = (document.sourceMap || []).find(item => item.id === row.sourceId);
                                const reference = String(row.label || (source ? window.SealarcaP1.sourceReference(document, source) : document.name));
                                if (!traceSources.some(item => item.documentId === document.id && item.sourceId === (row.sourceId || null))) {
                                    traceSources.push({ documentId: document.id, documentName: document.name, sourceId: row.sourceId || null, reference, locator: source?.locator || null, characterCount: 0 });
                                }
                            }
                        }

                        operation = await persist({
                            steps: operation.steps,
                            progress: operation.progress,
                            notices: operationNotices,
                            context: { mode: 'local_profiles', characters: 0, documentCount: validProfiles.length, sourceCount: traceSources.length }
                        });
                        await setStep('analyze', 'completed');
                        const resultCount = Object.values(selectedResult).find(Array.isArray)?.length || 0;
                        await setStep('save', 'running', { kind: 'results', count: resultCount, sources: traceSources.length });

                        const status = operationNotices.some(notice => notice.severity === 'partial') ? 'partial' : 'completed';
                        const completedSteps = window.SealarcaOperations.updateOperationStep(operation, 'save', 'completed', { kind: 'results', count: resultCount, sources: traceSources.length });
                        const trace = window.SealarcaOperations.createTrace({
                            folderId,
                            operation: { ...completedSteps, status, completedAt: Date.now() },
                            manifest: { mode: 'local_profiles', characters: 0, documents: traceDocuments, sources: traceSources },
                            notices: operationNotices,
                            model: null
                        });
                        const completed = await window.sealarcaDb.completeLocalOperation({
                            operationId: operation.id,
                            ownerId,
                            leaseToken,
                            operationChanges: { status, steps: completedSteps.steps, progress: completedSteps.progress, notices: operationNotices, context: { mode: 'local_profiles', characters: 0, documentCount: validProfiles.length, sourceCount: traceSources.length } },
                            trace,
                            resultRef: { section: type === 'timeline' || type === 'obligations' ? 'timeline' : 'overview', type, snapshot: selectedResult }
                        });
                        if (!completed) { const error = new Error('La session de cette opération a expiré.'); error.name = 'OperationLeaseError'; throw error; }
                        operation = completed.operation;

                        if (this.activeFolderId === folderId) {
                            this.documentProfiles = profiles;
                            this.buildFolderOverview();
                            if (status === 'partial') this.showToast(this.noticeText(operationNotices[operationNotices.length - 1]), 6000);
                        }
                    } catch (error) {
                        const terminalSteps = status => operation.steps.map(step => step.status === 'running' ? { ...step, status, completedAt: Date.now() } : step);
                        if (error?.name === 'AbortError' || controller.signal.aborted) {
                            operationNotices.push(window.SealarcaOperations.createNotice('operation_cancelled', 'info'));
                            await window.sealarcaDb.updateOperationIfOwner(operation.id, ownerId, leaseToken, { status: 'cancelled', steps: terminalSteps('cancelled'), notices: operationNotices });
                        } else if (error?.name !== 'OperationLeaseError') {
                            operationNotices.push(window.SealarcaOperations.createNotice('operation_failed', 'error'));
                            await window.sealarcaDb.updateOperationIfOwner(operation.id, ownerId, leaseToken, { status: 'failed', steps: terminalSteps('failed'), notices: operationNotices });
                            this.showToast(this.t('dossier.operationFailed'), 6000);
                        }
                    } finally {
                        this.operationRuns.delete(operation.id);
                        if (this.activeFolderId === folderId) {
                            await this.loadFolderOperations();
                            this.buildFolderOverview();
                        }
                    }
                })();
                run.promise = runPromise;
                this.isStartingFolderOperation = false;
                await runPromise;
            } catch (error) {
                console.error('Démarrage de l’opération impossible:', error);
                this.operationRuns.delete(operation.id);
                this.showToast(this.t('dossier.operationFailed'), 6000);
                if (this.activeFolderId === folderId) await this.loadFolderOperations();
            } finally {
                this.isStartingFolderOperation = false;
            }
        },

        async cancelFolderOperation(operationId = null) {
            const id = operationId || this.runningFolderOperation?.id;
            const run = id ? this.operationRuns.get(id) : null;
            if (!run) return;
            run.controller.abort('cancelled');
            await run.promise;
        },

        async retryFolderOperation(operationId) {
            const operation = this.folderOperations.find(item => item.id === operationId);
            if (operation && ['partial', 'failed', 'cancelled'].includes(operation.status)) {
                await this.runFolderAnalysis(operation.type, operation.documentIds);
            }
        },

        async openOperationResult(operation) {
            if (!operation?.resultRef?.section) return;
            if (operation.resultRef.section === 'timeline') this.openTimelineTab();
            else this.openOverviewTab();
        },

        async queueDocumentProfile(documentId) {
            await this.initializeP1Queue();
            const document = await window.sealarcaDb.getDocument(documentId);
            if (!document) return;
            const result = await this.p1Queue.enqueueDocument(document);
            this.showToast(result.skipped ? this.t('app.profileUpToDate') : this.t('app.profileQueued'));
            await this.refreshFolderWorkspace();
        },

        async queueAllDocumentProfiles() {
            await this.initializeP1Queue();
            const results = await this.p1Queue.enqueueDocuments(this.documents);
            const queued = results.filter(result => !result.skipped).length;
            this.showToast(queued ? this.t('app.profilesQueued').replaceAll('{count}', String(queued)) : this.t('app.profilesUpToDate'));
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
            lines.push('', '## Chronologie', '');
            this.folderOverview.timeline.forEach(item => lines.push('- ' + [item.date, item.label, item.details, item.sources?.[0]?.reference].filter(Boolean).join(' — ')));
            lines.push('', '## Montants', '');
            this.folderOverview.entities.amounts.forEach(item => lines.push('- ' + item.name + (item.sources?.[0]?.reference ? ' — ' + item.sources[0].reference : '')));
            lines.push('', '## Obligations', '');
            this.folderOverview.entities.obligations.forEach(item => lines.push('- ' + item.name + (item.sources?.[0]?.reference ? ' — ' + item.sources[0].reference : '')));
            lines.push('', '## Éléments importants', '');
            this.folderOverview.items.forEach(item => lines.push('- ' + (item.label || item.details) + (item.references?.[0]?.label ? ' — ' + item.references[0].label : '')));
            const blob = new Blob([lines.join('\n') + '\n'], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'index.md';
            document.body.appendChild(link);
            link.click();
            link.remove();
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
                    get isActive() { return app.activeConversationId === conversation.id; },
                    select() { app.selectConversation(conversation.id); },
                    remove() { app.deleteConversation(conversation.id); }
                };
                return decorated;
            });
        },

        decorateMessage(message) {
            const app = this;
            const trace = message.trace || null;
            const traceSources = Array.isArray(trace?.sources) ? trace.sources : [];
            const traceDocuments = (trace?.documents || []).map(item => ({
                ...item,
                traceStatusLabel: app.t(item.included ? 'dossier.traceIncluded' : 'dossier.traceOmitted')
                    .replaceAll('{count}', String(traceSources.filter(source => source.documentId === item.id).length)),
                visibleSources: traceSources.filter(source => source.documentId === item.id).map(source => ({
                    ...source,
                    open() { app.openProfileReference(source.documentId, source.sourceId); }
                }))
            }));
            const decorated = {
                ...message,
                _showReasoning: message._showReasoning !== false,
                _showTrace: message._showTrace === undefined ? Boolean(trace && traceDocuments.length <= 3 && traceSources.length <= 6) : message._showTrace,
                get senderInitial() { return message.role === 'assistant' ? 'S' : 'V'; },
                get senderName() { return message.role === 'assistant' ? 'Sealarca Vault' : app.t('app.you'); },
                get interruptedLabel() { return message.interrupted ? app.t('app.streamInterrupted') : ''; },
                get hasAttachments() { return Boolean((message.documentRefs && message.documentRefs.length) || (message.attachments && message.attachments.length)); },
                get visibleAttachments() { return (message.documentRefs || message.attachments || []).map((attachment, index) => ({ ...attachment, attachmentKey: attachment.id || attachment.name || ('attachment_' + index) })); },
                get hasReasoning() { return Boolean(message.reasoning); },
                get hasCitations() { return Array.isArray(message.citations) && message.citations.length > 0; },
                get visibleCitations() { return (message.citations || []).map(citation => ({ ...citation, open() { app.openProfileReference(citation.documentId, citation.sourceId); } })); },
                get hasTrace() { return Boolean(trace); },
                get traceDocuments() { return traceDocuments; },
                get traceVisible() { return Object.hasOwn(app.traceOpenState, message.id) ? app.traceOpenState[message.id] : decorated._showTrace !== false; },
                get traceToggleLabel() { return app.t(this.traceVisible ? 'dossier.hideTrace' : 'dossier.showTrace'); },
                get traceSummaryLabel() {
                    return app.t('dossier.traceSummary')
                        .replaceAll('{documents}', String(trace?.context?.documentCount || 0))
                        .replaceAll('{sources}', String(trace?.context?.sourceCount || 0))
                        .replaceAll('{characters}', new Intl.NumberFormat(app.currentLang).format(trace?.context?.characters || 0));
                },
                get traceNotices() {
                    return (trace?.notices || []).map((notice, index) => ({
                        id: (trace?.id || message.id || 'trace') + '_notice_' + index,
                        className: 'notice-box ' + (['info', 'warning', 'partial', 'error'].includes(notice.severity) ? notice.severity : 'warning'),
                        text: app.noticeText(notice)
                    }));
                },
                get reasoningLabel() { return app.t(this.reasoningVisible ? 'reasoning.hide' : 'reasoning.show'); },
                get reasoningVisible() { return Object.hasOwn(app.reasoningOpenState, message.id) ? app.reasoningOpenState[message.id] : decorated._showReasoning !== false; },
                get renderedContent() { return app.renderMarkdown(message.content); },
                toggleReasoning() { app.reasoningOpenState = { ...app.reasoningOpenState, [message.id]: !decorated.reasoningVisible }; },
                toggleTrace() { app.traceOpenState = { ...app.traceOpenState, [message.id]: !decorated.traceVisible }; },
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
            this.messages = await Promise.all(loadedMessages.map(async message => this.decorateMessage({
                ...message,
                trace: message.traceId ? await window.sealarcaDb.getTrace(message.traceId) : null
            })));
            this.selectedDocumentIds = [];
            this.attachedFiles = [];
            this.currentStreamingMessage = '';
            this.currentStreamingReasoning = '';
            this.scrollToBottom();
        },

        async deleteConversation(id) {
            if (id === this.activeConversationId) await this.cancelAndWaitForStream();
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
            this.persistSelectedRole(role);
            this.closeModal('isRolesOpen', 'roles', true);
            this.showToast(`${this.t('input.roleLabel')} : ${role.name}`);
        },

        // --- Envoi d'un Message ---
        async sendMessage() {
            const text = this.inputPrompt.trim();
            if ((!text && this.attachedFiles.length === 0) || this.isStreaming) return;

            if (!this.hasConfiguredApi || !this.selectedModel) {
                this.isSettingsOpen = true;
                this.apiError = this.hasApiKey
                    ? this.t('settings.noModels')
                    : this.t('settings.keyMissing');
                this.focusApiKeyInput();
                return;
            }

            let conversationId = this.activeConversationId;
            let pendingConversation = null;
            if (!conversationId) {
                const titleText = text || (this.attachedFiles[0] ? `Doc: ${this.attachedFiles[0].name}` : this.t('app.newChat'));
                pendingConversation = {
                    id: `conv_${window.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`}`,
                    title: titleText.length > 40 ? titleText.substring(0, 40) + '...' : titleText,
                    folderId: this.activeFolderId || window.SEALARCA_DEFAULT_FOLDER_ID,
                    model: this.selectedModel,
                    roleId: this.selectedRole ? this.selectedRole.id : null,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                conversationId = pendingConversation.id;
            }

            // 2. Conserver uniquement les références documentaires dans le message.
            const folderId = this.activeFolderId || window.SEALARCA_DEFAULT_FOLDER_ID;
            const contextMode = this.effectiveContextMode;
            const folderDocuments = await window.sealarcaDb.getDocuments(folderId);
            const automaticSelection = contextMode === 'automatic'
                ? (text
                    ? window.SealarcaP1.selectRelevantDocuments(folderDocuments, text, { limit: 5 })
                    : this.selectedDocumentIds.map(id => ({ document: folderDocuments.find(document => document.id === id), score: 0 })).filter(item => item.document))
                : [];
            const requestedIds = contextMode === 'automatic'
                ? automaticSelection.map(item => item.document.id)
                : this.selectedDocumentIds;
            const selectedDocuments = (await window.sealarcaDb.getDocumentsByIds(requestedIds))
                .filter(document => document.folderId === folderId);
            const documentRefs = selectedDocuments.map(document => ({
                id: document.id,
                name: document.name,
                size: document.size,
                extension: document.extension,
                hash: document.hash || null
            }));

            const userMsg = {
                id: this.createMessageId('user'),
                conversationId,
                role: 'user',
                content: text || (selectedDocuments[0] ? `[${selectedDocuments[0].name}]` : '...'),
                documentRefs,
                contextSelection: {
                    mode: contextMode === 'automatic' ? 'automatic' : 'manual',
                    scope: 'folder',
                    folderId,
                    documentIds: documentRefs.map(document => document.id)
                },
                createdAt: Date.now()
            };

            // Construire et borner exactement le texte qui serait envoyé avant de persister le message.
            const documentContext = this.buildDocumentContext(selectedDocuments, text, contextMode);
            const apiMessages = this.buildConversationHistory();
            apiMessages.push({ role: 'user', content: userMsg.content + documentContext.text });
            const systemPrompt = this.selectedRole ? this.selectedRole.systemPrompt : null;
            const contextCharacters = Array.from([systemPrompt || '', ...apiMessages.map(message => message.content || '')].join('')).length;
            if (contextCharacters > MAX_CHAT_CONTEXT_CHARACTERS) {
                this.showToast(this.t('app.contextTooLarge'), 7000);
                return;
            }

            if (pendingConversation) {
                await window.sealarcaDb.saveConversation(pendingConversation, { allowCreate: true });
                this.activeConversationId = pendingConversation.id;
                await this.loadConversations();
            }
            await window.sealarcaDb.saveMessage(userMsg);
            this.messages.push(this.decorateMessage(userMsg));

            // Réinitialiser les entrées uniquement après validation et persistance.
            this.inputPrompt = '';
            this.selectedDocumentIds = [];
            this.attachedFiles = [];
            this.currentStreamingMessage = '';
            this.currentStreamingReasoning = '';
            this.isStreaming = true;
            this.scrollToBottom();

            // 5. Lancer le streaming
            const requestModel = this.selectedModel;
            const streamPromise = window.sealarcaApi.streamResponse({
                apiKey: this.apiKey,
                model: requestModel,
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
                    try {
                        if (!finalText && !finalReasoning) {
                            const conv = await window.sealarcaDb.getConversation(conversationId);
                            if (conv) await this.loadConversations();
                            return;
                        }
                        if (finalText || finalReasoning) {
                            const assistantMsg = {
                                id: this.createMessageId('assistant'),
                                conversationId,
                                role: 'assistant',
                                content: finalText || (metadata.interrupted ? (metadata.reason === 'timeout' ? this.t('app.streamTimeout') : this.t('app.streamInterrupted')) : '(Réponse vide)'),
                                reasoning: finalReasoning || null,
                                model: requestModel,
                                interrupted: Boolean(metadata.interrupted),
                                interruptReason: metadata.reason || null,
                                citations: window.SealarcaP1.extractCitations(finalText, documentContext.citationDocuments),
                                createdAt: Date.now()
                            };
                            const hasDocumentContext = documentContext.manifest.documents.some(document => document.included);
                            const trace = hasDocumentContext ? window.SealarcaOperations.createTrace({
                                folderId,
                                conversationId,
                                messageId: assistantMsg.id,
                                manifest: documentContext.manifest,
                                notices: [
                                    ...documentContext.notices,
                                    ...(metadata.interrupted ? [window.SealarcaOperations.createNotice('response_interrupted', 'partial', { metadata: { reason: metadata.reason || 'cancelled' } })] : [])
                                ],
                                model: requestModel
                            }) : null;
                            if (trace) {
                                assistantMsg.traceId = trace.id;
                                await window.sealarcaDb.saveMessageWithTrace(assistantMsg, trace);
                            } else {
                                await window.sealarcaDb.saveMessage(assistantMsg);
                            }
                            this.messages.push(this.decorateMessage({ ...assistantMsg, trace }));
                        }

                        // Mettre à jour l'horodatage de la conversation
                        const conv = await window.sealarcaDb.getConversation(conversationId);
                        if (conv) {
                            await window.sealarcaDb.saveConversation(conv);
                            await this.loadConversations();
                        }
                    } catch (error) {
                        console.error('Persistance de la réponse impossible:', error);
                        this.showToast(`Erreur : ${error.message || 'Réponse non enregistrée'}`, 5000);
                    } finally {
                        this.currentStreamingMessage = '';
                        this.currentStreamingReasoning = '';
                        this.isStreaming = false;
                        this.scrollToBottom();
                    }
                }
            });
            this.activeStreamPromise = streamPromise;
            try { await streamPromise; }
            finally { if (this.activeStreamPromise === streamPromise) this.activeStreamPromise = null; }
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

        extractionWarnings(document) {
            return (document?.metadata?.extraction?.warnings || []).map(warning => {
                if (typeof warning === 'string') return warning;
                let text = this.t('extraction.' + warning.code);
                if (text === 'extraction.' + warning.code) text = warning.code;
                for (const [key, value] of Object.entries(warning)) text = text.replaceAll('{' + key + '}', String(value));
                return text;
            });
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
                    const warnings = this.extractionWarnings(saved);
                    if (warnings.length) this.showToast('⚠ ' + file.name + ': ' + warnings.join(' '), 10000);
                    else this.showToast(duplicate ? `↩️ ${file.name} déjà présent et sélectionné` : `✅ ${file.name}`);
                } catch (err) {
                    console.error('Erreur extraction document:', err);
                    const message = err.code === 'pdf_no_text' ? this.t('extraction.noText') : err.code === 'extracted_too_large' ? this.t('extraction.tooLarge') : err.message;
                    this.showToast(`❌ ${file.name} : ${message}`, 10000);
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
                    FORBID_ATTR: ['style', 'id'],
                    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.-]|$))/i
                });

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = cleanHtml;
                tempDiv.querySelectorAll('svg, math, style, script, link, meta, base').forEach(element => element.remove());
                tempDiv.querySelectorAll('[class]').forEach(element => {
                    const safeLanguageClasses = element.tagName === 'CODE'
                        ? Array.from(element.classList).filter(name => /^language-[a-z0-9_+#.-]{1,40}$/i.test(name))
                        : [];
                    if (safeLanguageClasses.length) element.className = safeLanguageClasses.join(' ');
                    else element.removeAttribute('class');
                });

                tempDiv.querySelectorAll('a').forEach(link => {
                    const href = link.getAttribute('href') || '';
                    if (/^\s*(javascript|data|vbscript):/i.test(href)) link.removeAttribute('href');
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
    let rawCode = '';
    try { rawCode = decodeURIComponent(button.dataset.code || ''); }
    catch (_) { rawCode = button.dataset.code || ''; }
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
