const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const JSZip = require('jszip');

async function main() {
    const root = path.resolve(__dirname, '..');
    const version = require('../package.json').version;
    const archivePath = path.join(root, '.release', `Sealarca-Desk-v${version}.zip`);
    const bytes = await fs.readFile(archivePath);
    const archive = await JSZip.loadAsync(bytes, { checkCRC32: true });
    const target = path.join(root, '.release', 'verified', 'Sealarca-Desk');
    const expected = new Set(['index.html', 'LICENSE', 'CHANGELOG.md', 'SECURITY.md', 'RELEASE_NOTES.md', 'README.md', 'README.fr.md', 'README.de.md', 'README.it.md', 'README.es.md']);
    async function inventory(directory) {
        for (const entry of await fs.readdir(path.join(root, directory), { withFileTypes: true })) {
            const relative = directory + '/' + entry.name;
            if (entry.isDirectory()) await inventory(relative); else expected.add(relative);
        }
    }
    for (const directory of ['css', 'images', 'js', 'vendor']) await inventory(directory);
    for (const entry of Object.values(archive.files)) {
        const name = entry.unsafeOriginalName || entry.name;
        if (name.includes('\\') || !name.startsWith('Sealarca-Desk/') || name.split('/').includes('..')) throw new Error('Unsafe ZIP entry: ' + name);
        if (entry.dir) continue;
        const relative = name.slice('Sealarca-Desk/'.length);
        if (!expected.delete(relative)) throw new Error('Unexpected or duplicate ZIP entry: ' + name);
        const content = await entry.async('nodebuffer');
        if (!content.equals(await fs.readFile(path.join(root, relative)))) throw new Error('Content mismatch: ' + relative);
        const destination = path.resolve(target, relative);
        if (!destination.startsWith(target + path.sep)) throw new Error('Unsafe extraction path');
        await fs.mkdir(path.dirname(destination), { recursive: true }); await fs.writeFile(destination, content);
    }
    if (expected.size) throw new Error('Missing entries: ' + [...expected].join(', '));
    const actual = crypto.createHash('sha256').update(bytes).digest('hex');
    const recorded = (await fs.readFile(archivePath.replace(/\.zip$/, '.sha256'), 'utf8')).trim().split(/\s+/)[0];
    if (actual !== recorded) throw new Error('Archive SHA-256 mismatch');
    console.log(`Verified ${Object.keys(archive.files).length} ZIP entries, CRC32, source contents, extraction and SHA-256: ${actual}`);
    console.log('Extracted application: ' + target);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
