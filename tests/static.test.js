const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('la CSP reste stricte et le build Alpine CSP est utilisé', () => {
    const html = read('index.html');
    assert.match(html, /script-src 'self' file:;/);
    assert.doesNotMatch(html, /unsafe-eval/);
    assert.doesNotMatch(html, /script-src[^;]*unsafe-inline/);
    assert.match(html, /vendor\/alpine-csp\.min\.js/);
    assert.ok(fs.existsSync(path.join(root, 'vendor', 'alpine-csp.min.js')));
});

test('le client n’utilise plus Chat Completions', () => {
    const api = read('js/api.js');
    assert.doesNotMatch(api, /chat\/completions/);
    assert.match(api, /\/responses/);
    assert.match(api, /response\.output_text\.delta/);
});

test('l’endpoint API n’est pas configurable par l’utilisateur', () => {
    const html = read('index.html');
    const app = read('js/app.js');
    assert.doesNotMatch(html, /base-url-input/);
    assert.doesNotMatch(app, /baseUrl\s*:/);
});

test('l’endpoint API fixe utilise api.sealarca.ch partout et la CSP l’autorise', () => {
    const api = read('js/api.js');
    const html = read('index.html');
    const i18n = read('js/i18n.js');
    assert.match(api, /https:\/\/api\.sealarca\.ch\/v1/);
    assert.doesNotMatch(api, /https:\/\/sealarca\.ch\/v1/);
    assert.match(html, /connect-src[^;]*https:\/\/api\.sealarca\.ch/);
    assert.doesNotMatch(html, /connect-src[^;]*https:\/\/sealarca\.ch\//);
    assert.ok(!html.includes('connect-src') || !/connect-src[^;]*\shttps:\/\/sealarca\.ch[\s"';]/.test(html));
    assert.doesNotMatch(html, /https:\/\/sealarca\.ch\/v1/);
    for (const hint of i18n.match(/https:\/\/[a-z0-9.-]+\/v1/g) || []) {
        assert.equal(hint, 'https://api.sealarca.ch/v1');
    }
    for (const file of ['README.md', 'README.fr.md', 'README.de.md', 'README.it.md', 'README.es.md', 'SECURITY.md', 'RELEASE_NOTES.md']) {
        const contents = read(file);
        assert.doesNotMatch(contents, /https:\/\/sealarca\.ch\/v1/);
    }
    assert.match(read('README.md'), /https:\/\/api\.sealarca\.ch\/v1/);
    assert.match(read('SECURITY.md'), /https:\/\/api\.sealarca\.ch\/v1/);
});

test('le rendu Markdown interdit les contenus actifs', () => {
    const app = read('js/app.js');
    const html = read('index.html');
    assert.match(app, /FORBID_TAGS: \['iframe', 'object', 'embed', 'form', 'input', 'button'\]/);
    assert.doesNotMatch(app, /ADD_TAGS:\s*\['iframe'\]/);
    assert.doesNotMatch(app, /onclick=/);
    assert.doesNotMatch(html, /x-html=/);
    assert.match(html, /x-safe-html=/);
});

test('la clé API n’est plus persistée dans IndexedDB', () => {
    const app = read('js/app.js');
    assert.doesNotMatch(app, /setSetting\(['"]sealarca_api_key/);
    assert.match(app, /sessionStorage\.setItem\('sealarca_api_key_session'/);
});

test('la sélection du modèle reste explicite et la migration ne remplace pas une clé de session', () => {
    const html = read('index.html');
    const app = read('js/app.js');
    assert.match(html, /id="header-model-picker"/);
    assert.match(html, /id="settings-model-picker"/);
    assert.match(html, /<option value="" x-text="modelChoosePrompt"><\/option>/);
    assert.doesNotMatch(app, /this\.models\[0\]\.id/);
    assert.match(app, /if \(!savedKey && legacyKey\)/);
});

test('les contrôles interactifs utilisent des éléments natifs et les modales isolent le reste de l’interface', () => {
    const html = read('index.html');
    const app = read('js/app.js');
    assert.doesNotMatch(html, /<div[^>]*class="suggestion-card"/);
    assert.doesNotMatch(html, /<div[^>]*class="conv-item"[^>]*@click/);
    assert.doesNotMatch(html, /<div[^>]*@click="role\.select"/);
    assert.match(html, /:inert="hasAnyModal"/);
    assert.match(html, /data-modal="settings"/);
    assert.match(app, /trapModalFocus\(event\)/);
    assert.match(html, /role="tab"/);
    assert.match(html, /:aria-selected="isOverviewTab"/);
    assert.match(html, /role="tabpanel"/);
});

test('le sélecteur de fichiers propose tous les formats effectivement parsés', () => {
    const html = read('index.html');
    for (const extension of ['.pdf', '.docx', '.xlsx', '.pptx', '.odt', '.ods', '.csv', '.txt', '.md', '.json', '.rtf', '.log', '.xml']) {
        assert.match(html, new RegExp(`accept="[^"]*${extension.replace('.', '\\.')}`));
    }
});

test('les nouvelles chaînes de configuration et d’espace documentaire existent dans les cinq langues', () => {
    const vm = require('node:vm');
    const context = { window: {} };
    vm.createContext(context);
    vm.runInContext(read('js/i18n.js'), context, { filename: 'i18n.js' });
    const required = {
        app: ['modelHint', 'roleHint'],
        settings: ['getKey', 'openKeys', 'prerequisitesTitle', 'stepOne', 'stepTwo', 'chooseModel', 'modelRequired', 'modelsHint', 'closeBtn', 'networkError'],
        documents: ['workspaceSubtitle', 'manualMode', 'automaticMode', 'automaticHint', 'overviewTab', 'queueAction', 'statusPending', 'statusCancelled', 'pagesUnit', 'lastProfileDate'],
        dossier: ['actionsTitle', 'timelineTitle', 'timelineTab', 'timelineEmpty', 'operationsTitle', 'operationsEmpty', 'localActionHelp', 'profileCoverage', 'traceSummary', 'extractionUnverified']
    };
    for (const language of ['fr', 'de', 'it', 'en', 'es']) {
        for (const group of Object.keys(required)) {
            for (const key of required[group]) assert.equal(typeof context.window.SEALARCA_I18N[language][group][key], 'string', `${language}.${group}.${key}`);
        }
        for (const key of ['summary', 'timeline', 'entities', 'obligations', 'compare', 'divergences', 'amounts']) assert.equal(typeof context.window.SEALARCA_I18N[language].dossier.actions[key], 'string', `${language}.dossier.actions.${key}`);
        for (const key of ['pending', 'running', 'completed', 'partial', 'failed', 'cancelled', 'ready', 'not_analyzed']) assert.equal(typeof context.window.SEALARCA_I18N[language].dossier.status[key], 'string', `${language}.dossier.status.${key}`);
        assert.equal(typeof context.window.SEALARCA_I18N[language].dossier.notices.document_deleted, 'string', `${language}.dossier.notices.document_deleted`);
        for (const key of ['documents', 'profiles', 'results']) assert.equal(typeof context.window.SEALARCA_I18N[language].dossier.stepDetails[key], 'string', `${language}.dossier.stepDetails.${key}`);
        const prerequisites = context.window.SEALARCA_I18N[language].settings.prerequisites;
        assert.equal(Array.isArray(prerequisites), true, `${language}.settings.prerequisites`);
        assert.equal(prerequisites.length, 3, `${language}.settings.prerequisites length`);
    }
    const html = read('index.html');
    const app = read('js/app.js');
    assert.match(html, /settingsPrerequisites/);
    assert.match(html, /settingsStepOne/);
    assert.match(html, /settingsStepTwo/);
    assert.match(app, /commencer#desk/);
    assert.match(app, /hasVerifiedApiKey/);
    assert.match(html, /doc\.pageLabel/);
    assert.match(html, /doc\.profileAnalysisDateLabel/);
});

test('l’expérience de dossier consolide les fiches localement et garde des traces sourcées sans infrastructure fork', () => {
    const html = read('index.html');
    const app = read('js/app.js');
    const operations = read('js/operations.js');
    const timeline = read('js/timeline.js');
    const localAction = app.slice(app.indexOf('async runFolderAnalysis'), app.indexOf('async cancelFolderOperation'));
    assert.ok(fs.existsSync(path.join(root, 'css', 'document-experience.css')));
    assert.match(html, /css\/document-experience\.css/);
    assert.match(html, /js\/operations\.js\?v=1\.2\.0/);
    assert.match(html, /js\/timeline\.js\?v=1\.2\.0/);
    assert.ok(html.indexOf('js/operations.js') < html.indexOf('js/app.js'));
    assert.match(html, /id="timeline-panel"/);
    assert.match(html, /status-chip/);
    assert.match(html, /step\.detailLabel/);
    assert.match(operations, /function createTrace/);
    assert.match(operations, /sourceIds/);
    assert.match(timeline, /function buildDossierSummary/);
    assert.match(localAction, /buildDossierSummary/);
    assert.match(timeline, /apparent_difference/);
    assert.doesNotMatch(localAction, /completeResponse|streamResponse|sealarcaApi/);
    assert.doesNotMatch(operations + timeline, /\bmcp\b|researchStream|OpenCaseLaw/i);
    assert.doesNotMatch(html, /mcp-plan|mcp-drawer/);
    assert.doesNotMatch(html, /x-text="t\(/);
});

test('le premier écran explique le modèle et le rôle sans promesse géographique', () => {
    const html = read('index.html');
    const i18n = read('js/i18n.js');
    assert.match(html, /class="model-picker-group"/);
    assert.match(html, /x-text="modelPickerHint"/);
    assert.match(html, /x-text="roleButtonHint"/);
    assert.match(i18n, /environnement d’exécution protégé et matériellement isolé/);
    assert.doesNotMatch(i18n, /environnement matériellement isolé et chiffré en Suisse/);
});

test('les langues utilisent des drapeaux locaux accessibles sans codes visibles', () => {
    const html = read('index.html');
    const app = read('js/app.js');
    const flags = ['fr.svg', 'de.svg', 'it.svg', 'gb.svg', 'es.svg'];

    for (const flag of flags) {
        assert.ok(fs.existsSync(path.join(root, 'images', 'flags', flag)));
        assert.match(app, new RegExp(`images/flags/${flag.replace('.', '\\.')}`));
    }

    assert.match(html, /class="language-flag"/);
    assert.match(html, /:aria-label="lang\.name"/);
    assert.match(html, /:aria-pressed="lang\.isActive"/);
    assert.doesNotMatch(app, /🇫🇷|🇩🇪|🇮🇹|🇬🇧|🇪🇸/);
    assert.doesNotMatch(html, /x-text="lang\.label"/);
});

test('les logos clair et sombre utilisent les fichiers dédiés', () => {
    const html = read('index.html');
    assert.match(html, /images\/logo\.png/);
    assert.match(html, /images\/logo-light\.png/);
    assert.doesNotMatch(html, /images\/sealarca-black-433\.png/);
    assert.match(html, /theme-logo-light/);
    assert.match(html, /theme-logo-dark/);
    assert.ok(fs.existsSync(path.join(root, 'images', 'logo.png')));
    assert.ok(fs.existsSync(path.join(root, 'images', 'logo-light.png')));
});

test('le thème sombre reprend le fond officiel et définit les contrastes désactivés', () => {
    const theme = read('css/theme.css');
    const components = read('css/components.css');
    const layout = read('css/layout.css');
    assert.match(theme, /--sealarca-paper:\s*#09090B/);
    assert.match(theme, /--sealarca-action-text:/);
    assert.match(theme, /--sealarca-disabled-text:/);
    assert.match(components, /\.btn-primary:disabled/);
    assert.match(components, /\.btn:focus-visible/);
    assert.match(layout, /\.btn-send\s*\{[^}]*background-color:\s*var\(--sealarca-action\)/s);
    assert.match(layout, /\.btn-send\s*\{[^}]*color:\s*var\(--sealarca-action-text\)/s);
    assert.match(layout, /\.btn-send:focus-visible/);
});
