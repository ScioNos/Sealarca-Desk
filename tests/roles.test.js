const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function loadRoleApp(rawRoles) {
    let persistedRole = null;
    const context = {
        window: {},
        console,
        document: {
            addEventListener(eventName, callback) {
                if (eventName === 'alpine:init') callback();
            },
            documentElement: { classList: { toggle() {} }, style: {} }
        },
        Alpine: {
            directive() {},
            data(name, factory) { context.appFactory = factory; }
        }
    };
    vm.createContext(context);
    vm.runInContext(read('js/i18n.js'), context, { filename: 'i18n.js' });
    vm.runInContext(read('js/db.js'), context, { filename: 'db.js' });
    context.window.sealarcaDb = {
        async getRoles() { return rawRoles.map(role => ({ ...role })); },
        async setSetting(key, value) { if (key === 'sealarca_active_role') persistedRole = value; }
    };
    vm.runInContext(read('js/app.js'), context, { filename: 'app.js' });
    return { app: context.appFactory(), dbHelpers: context.window, getPersistedRole: () => persistedRole };
}

function catalog() {
    const context = { window: {}, console };
    vm.createContext(context);
    vm.runInContext(read('js/db.js'), context, { filename: 'db.js' });
    return { definitions: context.window.SEALARCA_SYSTEM_ROLE_DEFINITIONS, merge: context.window.SEALARCA_MERGE_SYSTEM_ROLES, defaultId: context.window.SEALARCA_DEFAULT_ROLE_ID };
}

test('les cinq modes système existent et le défaut est explicite', async () => {
    const roles = catalog();
    assert.equal(roles.definitions.length, 5);
    assert.deepEqual(Array.from(roles.definitions, role => role.id), [
        'role-document-analysis', 'role-executive', 'role-legal', 'role-fiduciary', 'role-compliance'
    ]);
    assert.equal(roles.defaultId, 'role-document-analysis');
    for (const role of roles.definitions) {
        assert.ok(role.name);
        assert.ok(role.description);
        assert.ok(role.systemPrompt);
        for (const principle of ['contenu fourni', 'N’invente aucun fait', 'Sépare clairement', 'informations manquantes', 'Préserve fidèlement', 'Cite ou identifie', 'langue de l’utilisateur']) {
            assert.match(role.systemPrompt, new RegExp(principle, 'i'), `${role.id} missing ${principle}`);
        }
        assert.doesNotMatch(role.systemPrompt, /Tu es un juriste|Tu es un expert|Tu es un officier de conformité|te présenter comme avocat/i);
    }

    const reversed = Array.from(roles.definitions).reverse();
    const harness = loadRoleApp(reversed);
    await harness.app.refreshRoles();
    assert.equal(harness.app.selectedRole.id, 'role-document-analysis');
});

test('un mode déjà sélectionné est conservé après synchronisation des modes système', async () => {
    const roles = catalog();
    const harness = loadRoleApp(Array.from(roles.definitions).reverse());
    harness.app.selectedRole = { id: 'role-legal', name: 'Ancien nom', systemPrompt: 'ancien prompt' };
    await harness.app.refreshRoles();
    assert.equal(harness.app.selectedRole.id, 'role-legal');
    assert.match(harness.app.selectedRole.systemPrompt, /analyse juridique et contractuelle rigoureuse/i);
    assert.match(harness.getPersistedRole().systemPrompt, /analyse juridique et contractuelle rigoureuse/i);
});

test('un mode personnalisé portant un ancien identifiant système n’est pas écrasé et aucun doublon n’est créé', () => {
    const roles = catalog();
    const custom = {
        id: 'role-legal',
        name: 'Mode personnalisé',
        description: 'Méthode personnalisée',
        systemPrompt: 'Prompt personnalisé',
        kind: 'custom'
    };
    const merged = roles.merge([custom]);
    const matching = merged.filter(role => role.id === 'role-legal');
    assert.equal(matching.length, 1);
    assert.equal(matching[0].name, 'Mode personnalisé');
    assert.equal(matching[0].systemPrompt, 'Prompt personnalisé');
    assert.equal(new Set(merged.map(role => role.id)).size, merged.length);
    assert.equal(merged.length, 5);
});

test('un ancien mode système reçoit le nouveau prompt pendant la migration', () => {
    const roles = catalog();
    const legacyLegal = {
        id: 'role-legal',
        name: 'Juriste & Droit des Contrats',
        description: 'Analyse rigoureuse de clauses contractuelles, identification des risques et conformité (CO/LPD).',
        systemPrompt: `Tu es un juriste expert de haut niveau spécialisé en droit suisse (Code des Obligations, Loi sur la protection des données - LPD) et droit comparé.
Ton rôle est d'analyser minutieusement les contrats, actes et pièces juridiques.
- Identifie les clauses à risque, ambiguïtés et déséquilibres.
- Propose des reformulations claires et protectrices.
- Structure tes réponses avec méthode : Constat, Analyse juridique, Recommandations concrètes.`
    };
    const merged = roles.merge([legacyLegal]);
    const updated = merged.find(role => role.id === 'role-legal');
    assert.equal(updated.kind, 'system');
    assert.equal(updated.name, 'Juridique & Contrats');
    assert.match(updated.systemPrompt, /méthode d’analyse juridique et contractuelle rigoureuse/i);
    assert.equal(merged.filter(role => role.id === 'role-legal').length, 1);
});

test('les chaînes des modes sont disponibles dans les cinq langues sans persona public', () => {
    const context = { window: {}, console };
    vm.createContext(context);
    vm.runInContext(read('js/i18n.js'), context, { filename: 'i18n.js' });
    for (const language of ['fr', 'de', 'it', 'en', 'es']) {
        const roles = context.window.SEALARCA_I18N[language].roles;
        assert.equal(roles.title.includes('Persona'), false);
        assert.equal(typeof roles['document-analysis'].name, 'string');
        assert.equal(typeof roles.legal.name, 'string');
        assert.equal(typeof roles.fiduciary.name, 'string');
        assert.equal(typeof roles.compliance.name, 'string');
        assert.equal(typeof roles.executive.name, 'string');
    }
});
