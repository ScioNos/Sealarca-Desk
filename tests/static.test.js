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
