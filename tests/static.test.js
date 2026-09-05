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
        documents: ['workspaceSubtitle', 'manualMode', 'automaticMode', 'automaticHint', 'overviewTab', 'queueAction', 'statusPending', 'statusCancelled']
    };
    for (const language of ['fr', 'de', 'it', 'en', 'es']) {
        for (const group of Object.keys(required)) {
            for (const key of required[group]) assert.equal(typeof context.window.SEALARCA_I18N[language][group][key], 'string', `${language}.${group}.${key}`);
        }
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
