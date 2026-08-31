/**
 * Sealarca-Desk — Extracteur multi-documents local.
 * Le Markdown est la représentation canonique; sourceMap conserve la provenance.
 */
class SealarcaDocHandler {
    constructor() {
        this.isPdfWorkerConfigured = false;
        this.limits = Object.freeze({
            maxFileSize: 20 * 1024 * 1024,
            maxExtractedCharacters: 500000,
            maxPdfPages: 100,
            maxTabularRowsPerSheet: 100
        });
    }

    _initPdfWorker() {
        if (this.isPdfWorkerConfigured) return;
        if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
            this.isPdfWorkerConfigured = true;
        }
    }

    async parseFile(file) {
        const extension = this._extension(file.name);
        const allowed = new Set(['pdf', 'docx', 'xlsx', 'pptx', 'odt', 'ods', 'csv', 'txt', 'md', 'json', 'rtf', 'log', 'xml']);
        if (!allowed.has(extension)) throw new Error(`Format .${extension || '?'} non pris en charge.`);
        if (file.size > this.limits.maxFileSize) throw new Error('Fichier trop volumineux (maximum 20 Mo).');

        let parsed;
        switch (extension) {
            case 'pdf': parsed = await this._parsePdf(file); break;
            case 'docx': parsed = await this._parseDocx(file); break;
            case 'xlsx': parsed = await this._parseXlsx(file); break;
            case 'pptx': parsed = await this._parsePptx(file); break;
            case 'odt':
            case 'ods': parsed = await this._parseOdf(file, extension); break;
            case 'csv': parsed = await this._parseCsv(file); break;
            default: parsed = await this._parseText(file, extension); break;
        }

        if (!Array.isArray(parsed?.sourceMap) || parsed.sourceMap.length === 0) {
            throw new Error('Aucun texte exploitable trouvé dans ce fichier.');
        }
        const { markdown, sourceMap } = this._normalizeParsedDocument(parsed);
        if (!markdown) throw new Error('Aucun texte exploitable trouvé dans ce fichier.');
        if (markdown.length > this.limits.maxExtractedCharacters) {
            throw new Error('Le document extrait dépasse la limite de 500 000 caractères.');
        }

        const hash = await this._sha256(file);
        const now = Date.now();
        return {
            id: `doc_${now}_${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            originalName: file.name,
            extension,
            mimeType: file.type || this._mimeFor(extension),
            size: file.size,
            hash,
            hashAlgorithm: hash ? 'SHA-256' : null,
            canonicalFormat: 'markdown',
            markdown,
            sourceMapVersion: 1,
            sourceMap,
            sourceFile: file.slice(0, file.size, file.type || this._mimeFor(extension)),
            source: {
                fileName: file.name,
                mimeType: file.type || this._mimeFor(extension),
                extension,
                size: file.size,
                lastModified: file.lastModified || null,
                blobField: 'sourceFile'
            },
            metadata: {
                ...(parsed.metadata || {}),
                extraction: {
                    parser: parsed.parser || extension,
                    parserVersion: 2,
                    local: true,
                    extractedAt: new Date(now).toISOString(),
                    warnings: parsed.warnings || [],
                    limits: { ...this.limits }
                }
            },
            derivations: {
                chunks: { status: 'not_generated', source: 'markdown' }
            },
            createdAt: now,
            updatedAt: now
        };
    }

    _normalizeMarkdown(value) {
        const normalized = String(value || '')
            .replace(/\r\n?/g, '\n')
            .replace(/[ \t]+$/gm, '')
            .replace(/\n{4,}/g, '\n\n\n')
            .trim();
        return normalized ? normalized + '\n' : '';
    }

    _normalizeParsedDocument(parsed) {
        const rawMarkdown = String(parsed?.markdown || '');
        const markdown = this._normalizeMarkdown(rawMarkdown);
        let searchFrom = 0;
        const sourceMap = (parsed?.sourceMap || []).map(entry => {
            const rawStart = Math.max(0, Number(entry.markdownStart) || 0);
            const rawEnd = Math.max(rawStart, Number(entry.markdownEnd) || rawStart);
            const sourceMarkdown = entry._sourceMarkdown || rawMarkdown.slice(rawStart, rawEnd);
            const normalizedSource = this._normalizeMarkdown(sourceMarkdown).trimEnd();
            let markdownStart = normalizedSource ? markdown.indexOf(normalizedSource, searchFrom) : -1;
            if (markdownStart < 0) markdownStart = Math.min(rawStart, markdown.length);
            const markdownEnd = normalizedSource
                ? Math.min(markdownStart + normalizedSource.length, markdown.length)
                : Math.min(Math.max(markdownStart, rawEnd), markdown.length);
            searchFrom = Math.max(searchFrom, markdownEnd);
            const { _sourceMarkdown, ...publicEntry } = entry;
            return { ...publicEntry, markdownStart, markdownEnd };
        });
        return { markdown, sourceMap };
    }

    _appendSection(target, markdown, locator, label, extra = {}) {
        const clean = String(markdown || '').trim();
        if (!clean) return;
        if (target.markdown && !target.markdown.endsWith('\n\n')) target.markdown += '\n\n';
        const start = target.markdown.length;
        target.markdown += clean + '\n\n';
        target.sourceMap.push({
            id: `source_${target.sourceMap.length + 1}`,
            markdownStart: start,
            markdownEnd: target.markdown.length,
            label,
            locator,
            _sourceMarkdown: clean,
            ...extra
        });
    }

    async _parsePdf(file) {
        this._initPdfWorker();
        if (!window.pdfjsLib) throw new Error('PDF.js non disponible en local.');
        const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        if (pdf.numPages > this.limits.maxPdfPages) throw new Error('Le PDF dépasse la limite de 100 pages.');
        const result = { markdown: `# Document PDF : ${file.name}\n\n`, sourceMap: [], metadata: { pageCount: pdf.numPages }, parser: 'pdfjs' };
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            let lastY = null;
            const pageLines = [];
            let currentLine = '';
            for (const item of content.items) {
                const y = item.transform && item.transform[5];
                if (lastY === null || Math.abs(y - lastY) > 5) {
                    if (currentLine.trim()) pageLines.push(currentLine.trim());
                    currentLine = item.str || '';
                } else {
                    currentLine += (currentLine.endsWith(' ') || String(item.str).startsWith(' ') ? '' : ' ') + (item.str || '');
                }
                lastY = y;
            }
            if (currentLine.trim()) pageLines.push(currentLine.trim());
            if (pageLines.length) {
                this._appendSection(result, `## Page ${pageNumber}\n\n${pageLines.join('\n')}`, { type: 'pdf-page', page: pageNumber }, `Page ${pageNumber}`);
            }
        }
        return result;
    }

    async _parseDocx(file) {
        if (!window.JSZip) throw new Error('JSZip non disponible pour la lecture DOCX.');
        const zip = await window.JSZip.loadAsync(file);
        const documentXml = zip.file('word/document.xml');
        if (!documentXml) throw new Error('Fichier DOCX invalide (document.xml introuvable).');
        const xmlDoc = this._parseXml(await documentXml.async('string'), 'DOCX');
        const result = { markdown: `# Document Word : ${file.name}\n\n`, sourceMap: [], metadata: {}, parser: 'docx-xml' };
        const body = xmlDoc.getElementsByTagName('w:body')[0];
        if (!body) return result;
        let paragraph = 0;
        let table = 0;
        for (const node of body.children) {
            const nodeName = node.nodeName.toLowerCase();
            if (nodeName === 'w:p') {
                const text = Array.from(node.getElementsByTagName('w:t')).map(item => item.textContent).join('').trim();
                if (!text) continue;
                paragraph += 1;
                const style = node.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val') || '';
                const prefix = style.toLowerCase().includes('heading1') ? '## ' : style.toLowerCase().includes('heading2') ? '### ' : '';
                this._appendSection(result, prefix + text, { type: 'docx-paragraph', paragraph }, `Paragraphe ${paragraph}`);
            } else if (nodeName === 'w:tbl') {
                table += 1;
                this._appendSection(result, this._parseDocxTable(node), { type: 'docx-table', table }, `Tableau ${table}`);
            }
        }
        result.metadata.paragraphCount = paragraph;
        result.metadata.tableCount = table;
        return result;
    }

    _parseDocxTable(tableNode) {
        const rows = Array.from(tableNode.getElementsByTagName('w:tr'));
        return rows.map((row, index) => {
            const cells = Array.from(row.getElementsByTagName('w:tc')).map(cell =>
                Array.from(cell.getElementsByTagName('w:t')).map(text => text.textContent).join('').trim().replace(/\|/g, '\\|') || ' '
            );
            const line = '| ' + cells.join(' | ') + ' |';
            return index === 0 ? line + '\n| ' + cells.map(() => '---').join(' | ') + ' |' : line;
        }).join('\n');
    }

    async _parseXlsx(file) {
        if (!window.JSZip) throw new Error('JSZip non disponible pour la lecture XLSX.');
        const zip = await window.JSZip.loadAsync(file);
        const sharedStrings = [];
        const sharedFile = zip.file('xl/sharedStrings.xml');
        if (sharedFile) {
            const sharedDoc = this._parseXml(await sharedFile.async('string'), 'XLSX');
            for (const node of sharedDoc.getElementsByTagName('si')) {
                sharedStrings.push(Array.from(node.getElementsByTagName('t')).map(text => text.textContent).join(''));
            }
        }

        const names = await this._xlsxSheetNames(zip);
        const sheetFiles = Object.keys(zip.files).filter(key => /^xl\/worksheets\/sheet\d+\.xml$/.test(key)).sort((a, b) => this._numberIn(a) - this._numberIn(b));
        const result = { markdown: `# Classeur Excel : ${file.name}\n\n`, sourceMap: [], metadata: { sheetCount: sheetFiles.length }, parser: 'xlsx-xml', warnings: [] };
        for (let index = 0; index < sheetFiles.length; index++) {
            const sheetName = names[index] || `Feuille ${index + 1}`;
            const sheetDoc = this._parseXml(await zip.file(sheetFiles[index]).async('string'), 'XLSX');
            const rows = Array.from(sheetDoc.getElementsByTagName('row'));
            const usedRows = rows.slice(0, this.limits.maxTabularRowsPerSheet);
            const cellReferences = [];
            let hasCellText = false;
            const markdownRows = usedRows.map((row, rowIndex) => {
                const cells = Array.from(row.getElementsByTagName('c'));
                cells.forEach(cell => { if (cell.getAttribute('r')) cellReferences.push(cell.getAttribute('r')); });
                const values = cells.map(cell => {
                    const type = cell.getAttribute('t');
                    const valueNode = cell.getElementsByTagName('v')[0];
                    let value = valueNode ? valueNode.textContent : '';
                    if (type === 's' && sharedStrings[Number(value)] !== undefined) value = sharedStrings[Number(value)];
                    if (type === 'inlineStr') value = Array.from(cell.getElementsByTagName('t')).map(item => item.textContent).join('');
                    if (String(value).trim()) hasCellText = true;
                    return String(value).trim().replace(/\|/g, '\\|') || ' ';
                });
                const line = '| ' + values.join(' | ') + ' |';
                return rowIndex === 0 ? line + '\n| ' + values.map(() => '---').join(' | ') + ' |' : line;
            });
            const firstRow = usedRows[0]?.getAttribute('r') || (usedRows.length ? '1' : null);
            const lastRow = usedRows[usedRows.length - 1]?.getAttribute('r') || firstRow;
            const range = cellReferences.length ? `${cellReferences[0]}:${cellReferences[cellReferences.length - 1]}` : null;
            if (rows.length > usedRows.length) result.warnings.push(`${sheetName}: extraction limitée aux ${usedRows.length} premières lignes sur ${rows.length}.`);
            if (markdownRows.length && hasCellText) {
                this._appendSection(result, `## ${sheetName}\n\n${markdownRows.join('\n')}`, {
                    type: 'spreadsheet-range', sheet: sheetName, range, startRow: firstRow, endRow: lastRow, truncated: rows.length > usedRows.length
                }, sheetName);
            }
        }
        return result;
    }

    async _xlsxSheetNames(zip) {
        const workbook = zip.file('xl/workbook.xml');
        if (!workbook) return [];
        const doc = this._parseXml(await workbook.async('string'), 'XLSX');
        return Array.from(doc.getElementsByTagName('sheet')).map((sheet, index) => sheet.getAttribute('name') || `Feuille ${index + 1}`);
    }

    async _parsePptx(file) {
        if (!window.JSZip) throw new Error('JSZip non disponible pour la lecture PPTX.');
        const zip = await window.JSZip.loadAsync(file);
        const slides = Object.keys(zip.files).filter(key => /^ppt\/slides\/slide\d+\.xml$/.test(key)).sort((a, b) => this._numberIn(a) - this._numberIn(b));
        const result = { markdown: `# Présentation PowerPoint : ${file.name}\n\n`, sourceMap: [], metadata: { slideCount: slides.length }, parser: 'pptx-xml' };
        for (let index = 0; index < slides.length; index++) {
            const slideDoc = this._parseXml(await zip.file(slides[index]).async('string'), 'PPTX');
            const texts = Array.from(slideDoc.getElementsByTagName('a:t')).map(node => node.textContent.trim()).filter(Boolean);
            const slideNumber = index + 1;
            if (texts.length) {
                this._appendSection(result, `## Diapositive ${slideNumber}\n\n${texts.map(text => '- ' + text).join('\n')}`, { type: 'presentation-slide', slide: slideNumber }, `Diapositive ${slideNumber}`);
            }
        }
        return result;
    }

    async _parseOdf(file, extension) {
        if (!window.JSZip) throw new Error('JSZip non disponible pour la lecture ODF.');
        const zip = await window.JSZip.loadAsync(file);
        const content = zip.file('content.xml');
        if (!content) throw new Error('Fichier OpenDocument invalide (content.xml introuvable).');
        const doc = this._parseXml(await content.async('string'), 'OpenDocument');
        const result = { markdown: `# Document OpenDocument : ${file.name}\n\n`, sourceMap: [], metadata: {}, parser: 'odf-xml' };
        let paragraph = 0;
        for (const node of doc.getElementsByTagName('text:p')) {
            const text = node.textContent.trim();
            if (!text) continue;
            paragraph += 1;
            this._appendSection(result, text, { type: extension === 'ods' ? 'odf-cell-text' : 'odf-paragraph', paragraph }, `Bloc ${paragraph}`);
        }
        result.metadata.paragraphCount = paragraph;
        return result;
    }

    async _parseCsv(file) {
        const raw = await this._readAsText(file);
        const rows = raw.split(/\r?\n/).filter(line => line.split(/[;,]/).some(cell => cell.trim().replace(/^"|"$/g, '')));
        const delimiter = rows[0]?.includes(';') ? ';' : ',';
        const usedRows = rows.slice(0, this.limits.maxTabularRowsPerSheet);
        const table = usedRows.map((row, index) => {
            const values = row.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, '').replace(/\|/g, '\\|') || ' ');
            const line = '| ' + values.join(' | ') + ' |';
            return index === 0 ? line + '\n| ' + values.map(() => '---').join(' | ') + ' |' : line;
        }).join('\n');
        const result = { markdown: `# Données CSV : ${file.name}\n\n`, sourceMap: [], metadata: { rowCount: rows.length, delimiter }, parser: 'csv', warnings: [] };
        if (rows.length > usedRows.length) result.warnings.push(`Extraction limitée aux ${usedRows.length} premières lignes sur ${rows.length}.`);
        this._appendSection(result, table, { type: 'csv-row-range', startRow: usedRows.length ? 1 : null, endRow: usedRows.length, truncated: rows.length > usedRows.length }, `Lignes 1–${usedRows.length}`);
        return result;
    }

    async _parseText(file, extension) {
        const raw = await this._readAsText(file);
        if (!String(raw || '').trim()) return { markdown: '', sourceMap: [], metadata: { lineCount: 0 }, parser: extension === 'md' ? 'markdown-pass-through' : 'plain-text' };
        const markdown = extension === 'md' ? raw : `# ${file.name}\n\n${raw}`;
        const lineCount = raw.split(/\r?\n/).length;
        return {
            markdown,
            sourceMap: [{ id: 'source_1', markdownStart: 0, markdownEnd: markdown.length, label: `Lignes 1–${lineCount}`, locator: { type: 'text-line-range', startLine: 1, endLine: lineCount } }],
            metadata: { lineCount },
            parser: extension === 'md' ? 'markdown-pass-through' : 'plain-text'
        };
    }

    _extension(name) { return String(name || '').includes('.') ? String(name).split('.').pop().toLowerCase() : ''; }
    _numberIn(value) { return Number(String(value).match(/(\d+)/)?.[1] || 0); }
    _parseXml(value, format) {
        const document = new DOMParser().parseFromString(String(value || ''), 'application/xml');
        if (document.getElementsByTagName('parsererror').length > 0) throw new Error(`Fichier ${format} corrompu ou XML invalide.`);
        return document;
    }
    _readAsText(file) { return file.text ? file.text() : new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(reader.error); reader.readAsText(file); }); }
    async _sha256(file) {
        if (!window.crypto?.subtle) return null;
        const digest = await window.crypto.subtle.digest('SHA-256', await file.arrayBuffer());
        return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
    }
    _mimeFor(extension) {
        return ({ pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', odt: 'application/vnd.oasis.opendocument.text', ods: 'application/vnd.oasis.opendocument.spreadsheet', csv: 'text/csv', md: 'text/markdown', json: 'application/json', xml: 'application/xml', txt: 'text/plain', rtf: 'application/rtf', log: 'text/plain' })[extension] || 'application/octet-stream';
    }
}

window.sealarcaDocHandler = new SealarcaDocHandler();
