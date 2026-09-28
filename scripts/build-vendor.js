const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const vendor = path.join(root, 'vendor');
const packageRoot = name => path.join(root, 'node_modules', name);
const readPackage = async name => JSON.parse(await fs.readFile(path.join(packageRoot(name), 'package.json'), 'utf8'));
const sha256 = async file => crypto.createHash('sha256').update(await fs.readFile(path.join(vendor, file))).digest('hex');

async function verifyVersion(packageName, expected) {
    const manifest = await readPackage(packageName);
    if (manifest.version !== expected) throw new Error(`${packageName} ${expected} requis; trouvé ${manifest.version || 'version inconnue'}.`);
}

async function buildPdf(entry, outfile, globalName) {
    await esbuild.build({
        entryPoints: [path.join(packageRoot('pdfjs-dist'), 'legacy', 'build', entry)],
        outfile: path.join(vendor, outfile),
        bundle: true,
        platform: 'browser',
        format: 'iife',
        ...(globalName ? { globalName } : {}),
        target: ['chrome120'],
        minify: true,
        legalComments: 'inline',
        sourcemap: false
    });
}

async function main() {
    await fs.mkdir(vendor, { recursive: true });
    await Promise.all([
        verifyVersion('pdfjs-dist', '6.3.289'),
        verifyVersion('marked', '18.0.7'),
        verifyVersion('dompurify', '3.4.16'),
        verifyVersion('jszip', '3.10.2'),
        verifyVersion('@alpinejs/csp', '3.16.2')
    ]);

    await buildPdf('pdf.worker.mjs', 'pdf.worker.min.js');
    await buildPdf('pdf.mjs', 'pdf.min.js', 'pdfjsLib');
    await Promise.all([
        fs.copyFile(path.join(packageRoot('marked'), 'lib', 'marked.umd.js'), path.join(vendor, 'marked.min.js')),
        fs.copyFile(path.join(packageRoot('dompurify'), 'dist', 'purify.min.js'), path.join(vendor, 'purify.min.js')),
        fs.copyFile(path.join(packageRoot('jszip'), 'dist', 'jszip.min.js'), path.join(vendor, 'jszip.min.js')),
        fs.copyFile(path.join(packageRoot('@alpinejs/csp'), 'dist', 'cdn.min.js'), path.join(vendor, 'alpine-csp.min.js'))
    ]);

    const notices = [
        ['pdfjs-dist', 'PDF.js', 'Apache-2.0', 'https://github.com/mozilla/pdf.js', 'LICENSE', 'PDF.js-LICENSE.txt'],
        ['marked', 'Marked', 'MIT', 'https://github.com/markedjs/marked', 'LICENSE', 'Marked-LICENSE.txt'],
        ['dompurify', 'DOMPurify', 'MPL-2.0 OR Apache-2.0', 'https://github.com/cure53/DOMPurify', 'LICENSE', 'DOMPurify-Apache-LICENSE.txt'],
        ['jszip', 'JSZip', 'MIT OR GPL-3.0-or-later', 'https://github.com/Stuk/jszip', 'LICENSE.markdown', 'JSZip-LICENSE.txt']
    ];
    for (const [packageName, , , , sourceLicense, targetLicense] of notices) {
        await fs.copyFile(path.join(packageRoot(packageName), sourceLicense), path.join(vendor, targetLicense));
    }
    await fs.copyFile(path.join(packageRoot('dompurify'), 'LICENSE-MPL'), path.join(vendor, 'DOMPurify-MPL-LICENSE.txt'));
    try {
        await fs.copyFile(path.join(packageRoot('@alpinejs/csp'), 'LICENSE.md'), path.join(vendor, 'Alpine-LICENSE.txt'));
    } catch (_) {
        const alpineManifest = await readPackage('@alpinejs/csp');
        await fs.writeFile(path.join(vendor, 'Alpine-LICENSE.txt'), `Alpine.js CSP ${alpineManifest.version || '3.16.2'} — MIT (https://github.com/alpinejs/alpine)\n`, 'utf8');
    }

    for (const licenseFile of [
        'PDF.js-LICENSE.txt', 'Marked-LICENSE.txt', 'DOMPurify-Apache-LICENSE.txt',
        'DOMPurify-MPL-LICENSE.txt', 'JSZip-LICENSE.txt', 'Alpine-LICENSE.txt'
    ]) {
        const licensePath = path.join(vendor, licenseFile);
        const contents = await fs.readFile(licensePath, 'utf8');
        await fs.writeFile(licensePath, contents.replace(/[ \t]+$/gm, ''), 'utf8');
    }

    const files = [
        'pdf.min.js', 'pdf.worker.min.js', 'marked.min.js', 'purify.min.js', 'jszip.min.js', 'alpine-csp.min.js'
    ];
    const checksums = Object.fromEntries(await Promise.all(files.map(async file => [file, await sha256(file)])));
    const manifest = {
        schemaVersion: 1,
        files: checksums,
        dependencies: [
            { name: 'PDF.js', package: 'pdfjs-dist', version: '6.3.289', license: 'Apache-2.0', source: 'https://github.com/mozilla/pdf.js', files: ['pdf.min.js', 'pdf.worker.min.js'], workerMode: 'local main-thread worker bundle loaded before pdf.min.js' },
            { name: 'Marked', package: 'marked', version: '18.0.7', license: 'MIT', source: 'https://github.com/markedjs/marked', files: ['marked.min.js'] },
            { name: 'DOMPurify', package: 'dompurify', version: '3.4.16', license: 'MPL-2.0 OR Apache-2.0', source: 'https://github.com/cure53/DOMPurify', files: ['purify.min.js'] },
            { name: 'JSZip', package: 'jszip', version: '3.10.2', license: 'MIT OR GPL-3.0-or-later', source: 'https://github.com/Stuk/jszip', files: ['jszip.min.js'] },
            { name: 'Alpine.js CSP', package: '@alpinejs/csp', version: '3.16.2', license: 'MIT', source: 'https://github.com/alpinejs/alpine', files: ['alpine-csp.min.js'], versionEvidence: 'embedded version string' }
        ]
    };
    await fs.writeFile(path.join(vendor, 'dependencies.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

main().catch(error => {
    console.error(`Build des dépendances locales impossible : ${error.message}`);
    process.exitCode = 1;
});
