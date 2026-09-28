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
            maxPptxSlides: 100,
            maxTabularRowsPerSheet: 100,
            maxTabularColumns: 200,
            maxOdsRepeatedColumns: 256,
            maxExpandedArchiveBytes: 100 * 1024 * 1024,
            maxXmlEntryBytes: 20 * 1024 * 1024,
            maxEntryBytes: 20 * 1024 * 1024,
            maxArchiveEntries: 2000
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
            case 'rtf': parsed = await this._parseRtf(file); break;
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
            if (markdownStart >= 0) {
                const probe = normalizedSource.slice(0, Math.min(24, normalizedSource.length));
                if (probe && markdown.slice(markdownStart, markdownStart + normalizedSource.length) !== normalizedSource) {
                    const retry = markdown.indexOf(probe, searchFrom);
                    markdownStart = retry >= 0 ? retry : -1;
                }
            }
            if (markdownStart < 0) markdownStart = Math.min(searchFrom, markdown.length);
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

    _preflightArchiveEntries(files, format) {
        const entries = Object.values(files || {}).filter(entry => entry && !entry.dir);
        if (entries.length > this.limits.maxArchiveEntries) {
            throw new Error(`Archive ${format} trop complexe (maximum ${this.limits.maxArchiveEntries} entrées).`);
        }
        let expandedBytes = 0;
        for (const entry of entries) {
            const size = Number(entry._data?.uncompressedSize);
            if (!Number.isSafeInteger(size) || size < 0) throw new Error(`Taille invalide dans l’archive ${format}.`);
            expandedBytes += size;
            if (expandedBytes > this.limits.maxExpandedArchiveBytes) {
                throw new Error(`Archive ${format} trop volumineuse après décompression (maximum 100 Mio).`);
            }
            if (size > this.limits.maxEntryBytes) {
                throw new Error(`Fichier ${format} trop volumineux (maximum 20 Mio).`);
            }
            if (/\.xml$/i.test(entry.name || '') && size > this.limits.maxXmlEntryBytes) {
                throw new Error(`Fichier XML ${format} trop volumineux (maximum 20 Mio).`);
            }
        }
        return { declaredExpandedBytes: expandedBytes, actualExpandedBytes: 0, cache: new Map() };
    }

    async _loadOfficeArchive(file, format) {
        if (!window.JSZip) throw new Error(`JSZip non disponible pour la lecture ${format}.`);
        const zip = await window.JSZip.loadAsync(file, { checkCRC32: false });
        const budget = this._preflightArchiveEntries(zip.files, format);
        return { zip, budget, format };
    }

    async _readArchiveXml(archive, path) {
        const entry = archive.zip.file(path);
        if (!entry) return null;
        if (!archive.budget.cache.has(path)) {
            const promise = entry.async('uint8array').then(bytes => {
                this._checkActualArchiveEntry(archive, path, bytes.byteLength);
                return new TextDecoder('utf-8').decode(bytes);
            });
            archive.budget.cache.set(path, promise);
        }
        return archive.budget.cache.get(path);
    }

    _checkActualArchiveEntry(archive, path, byteLength) {
        if (byteLength > this.limits.maxEntryBytes) {
            throw new Error(`Fichier ${archive.format} trop volumineux (maximum 20 Mio).`);
        }
        if (/\.xml$/i.test(path) && byteLength > this.limits.maxXmlEntryBytes) {
            throw new Error(`Fichier XML ${archive.format} trop volumineux (maximum 20 Mio).`);
        }
        archive.budget.actualExpandedBytes += byteLength;
        if (archive.budget.actualExpandedBytes > this.limits.maxExpandedArchiveBytes) {
            throw new Error(`Archive ${archive.format} trop volumineuse après décompression (maximum 100 Mio).`);
        }
    }

    _elementName(node) {
        return String(node?.localName || node?.nodeName || '').split(':').pop().toLowerCase();
    }

    _getElementsByLocalName(root, localName) {
        return Array.from(root?.getElementsByTagName?.('*') || []).filter(node => this._elementName(node) === String(localName).toLowerCase());
    }

    _attributeByLocalName(node, localName) {
        const attributes = Array.from(node?.attributes || []);
        const prefixed = attributes.find(attribute =>
            (attribute.localName === localName || String(attribute.name || '').split(':').pop() === localName)
            && String(attribute.name || '').includes(':')
        );
        if (prefixed) return prefixed.value;
        const plain = attributes.find(attribute => attribute.localName === localName || attribute.name === localName);
        if (plain) return plain.value;
        const direct = node?.getAttribute?.(localName);
        if (direct !== null && direct !== '') return direct;
        return '';
    }

    _resolveArchiveTarget(baseDirectory, target) {
        const parts = String(target || '').replace(/^\//, '').split('/');
        const pathParts = String(target || '').startsWith('/') ? [] : String(baseDirectory || '').split('/').filter(Boolean);
        for (const part of parts) {
            if (!part || part === '.') continue;
            if (part === '..') pathParts.pop();
            else pathParts.push(part);
        }
        return pathParts.join('/');
    }

    async _relationships(archive, path, baseDirectory) {
        const xml = await this._readArchiveXml(archive, path);
        if (!xml) return new Map();
        const doc = this._parseXml(xml, archive.format);
        const relations = new Map();
        for (const relation of this._getElementsByLocalName(doc, 'Relationship')) {
            const id = relation.getAttribute('Id');
            const target = relation.getAttribute('Target');
            if (id && target) relations.set(id, this._resolveArchiveTarget(baseDirectory, target));
        }
        return relations;
    }

    _dateStyleIds(stylesDoc) {
        const builtIn = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58]);
        const custom = new Map(this._getElementsByLocalName(stylesDoc, 'numFmt').map(item => [Number(item.getAttribute('numFmtId')), item.getAttribute('formatCode') || '']));
        const xfs = this._getElementsByLocalName(stylesDoc, 'cellXfs')[0];
        const formats = Array.from(xfs?.children || []);
        return formats.map(style => {
            const id = Number(style.getAttribute('numFmtId'));
            if (builtIn.has(id)) return true;
            const code = custom.get(id);
            if (!code) return false;
            const normalized = code.toLowerCase().replace(/"[^"]*"|\\./g, '').replace(/\[[^\]]*\]/g, '');
            return /[ydhs]/.test(normalized) || (/m/.test(normalized) && /[-/:]/.test(normalized));
        });
    }

    _excelDateValue(serialValue, date1904) {
        const serial = Number(serialValue);
        if (!Number.isFinite(serial)) return serialValue;
        const wholeDays = Math.floor(serial);
        const fraction = serial - wholeDays;
        if (!date1904 && wholeDays === 60) {
            const milliseconds = Math.round(fraction * 86400000);
            const hours = String(Math.floor(milliseconds / 3600000)).padStart(2, '0');
            const minutes = String(Math.floor((milliseconds % 3600000) / 60000)).padStart(2, '0');
            const seconds = String(Math.floor((milliseconds % 60000) / 1000)).padStart(2, '0');
            return `1900-02-29${milliseconds ? `T${hours}:${minutes}:${seconds}` : ''}`;
        }
        const base = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, wholeDays < 60 ? 31 : 30);
        const date = new Date(base + serial * 86400000);
        if (!Number.isFinite(date.getTime())) return serialValue;
        const iso = date.toISOString();
        return fraction === 0 ? iso.slice(0, 10) : iso.replace(/\.\d{3}Z$/, '').replace(/Z$/, '');
    }

    async _parsePdf(file) {
        this._initPdfWorker();
        if (!window.pdfjsLib) throw new Error('PDF.js non disponible en local.');
        const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        if (pdf.numPages > this.limits.maxPdfPages) throw new Error('Le PDF dépasse la limite de 100 pages.');
        const result = { markdown: `# Document PDF : ${file.name}\n\n`, sourceMap: [], metadata: { pageCount: pdf.numPages }, parser: 'pdfjs', warnings: [] };
        const emptyPages = [];
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
            if (!pageLines.length) emptyPages.push(pageNumber);
            if (pageLines.length) {
                this._appendSection(result, `## Page ${pageNumber}\n\n${pageLines.join('\n')}`, { type: 'pdf-page', page: pageNumber }, `Page ${pageNumber}`);
            }
        }
        if (emptyPages.length) result.warnings.push({ code: 'pdf_pages', pages: emptyPages.join(', ') });
        if (!result.sourceMap.length) {
            const error = new Error('Aucun texte exploitable trouvé dans ce PDF (sans couche texte, OCR non intégré).');
            error.code = 'pdf_no_text';
            throw error;
        }
        return result;
    }

    async _parseDocx(file) {
        const archive = await this._loadOfficeArchive(file, 'DOCX');
        const documentXml = await this._readArchiveXml(archive, 'word/document.xml');
        if (!documentXml) throw new Error('Fichier DOCX invalide (document.xml introuvable).');
        const xmlDoc = this._parseXml(documentXml, 'DOCX');
        const result = { markdown: `# Document Word : ${file.name}\n\n`, sourceMap: [], metadata: {}, parser: 'docx-xml' };
        const body = this._getElementsByLocalName(xmlDoc, 'body')[0];
        const counts = { paragraph: 0, table: 0 };
        if (body) this._appendDocxBlocks(result, body, 'docx-paragraph', 'docx-table', 'word/document.xml', counts);

        const partNames = Object.keys(archive.zip.files).filter(name =>
            /^word\/(?:header\d+|footer\d+|footnotes|endnotes)\.xml$/i.test(name)
        ).sort((a, b) => a.localeCompare(b));
        for (const partName of partNames) {
            const xml = await this._readArchiveXml(archive, partName);
            if (!xml) continue;
            const partDoc = this._parseXml(xml, 'DOCX');
            const kind = partName.match(/^word\/(header|footer|footnotes|endnotes)/i)?.[1]?.toLowerCase();
            if (kind === 'footnotes' || kind === 'endnotes') {
                const noteTag = kind === 'footnotes' ? 'footnote' : 'endnote';
                for (const note of this._getElementsByLocalName(partDoc, noteTag)) {
                    const noteType = this._attributeByLocalName(note, 'type') || note.getAttribute('w:type') || '';
                    if (['separator', 'continuationSeparator', 'continuationNotice'].includes(noteType)) continue;
                    const noteId = this._attributeByLocalName(note, 'id') || note.getAttribute('w:id') || '';
                    const type = kind === 'footnotes' ? 'docx-footnote' : 'docx-endnote';
                    this._appendDocxBlocks(result, note, type, `${type}-table`, partName, counts, noteId);
                }
            } else {
                const type = kind === 'header' ? 'docx-header' : 'docx-footer';
                this._appendDocxBlocks(result, partDoc.documentElement, type, `${type}-table`, partName, counts);
            }
        }
        result.metadata.paragraphCount = counts.paragraph;
        result.metadata.tableCount = counts.table;
        return result;
    }

    _docxParagraphText(paragraphNode) {
        let text = '';
        const walk = node => {
            for (const child of Array.from(node?.childNodes || [])) {
                const name = this._elementName(child);
                if (name === 't') text += child.textContent || '';
                else if (name === 'tab') text += '\t';
                else if (name === 'br') text += '\n';
                else if (child.childNodes?.length) walk(child);
            }
        };
        walk(paragraphNode);
        return text.replace(/[ \t]+\n/g, '\n').trim();
    }

    _appendDocxBlocks(result, container, paragraphType, tableType, part, counts, noteId = null) {
        for (const node of Array.from(container?.children || [])) {
            const nodeName = this._elementName(node);
            if (nodeName === 'p') {
                const text = this._docxParagraphText(node);
                if (!text) continue;
                counts.paragraph += 1;
                const styleNode = this._getElementsByLocalName(node, 'pStyle')[0];
                const style = this._attributeByLocalName(styleNode, 'val') || styleNode?.getAttribute?.('w:val') || '';
                const prefix = style.toLowerCase().includes('heading1') ? '## ' : style.toLowerCase().includes('heading2') ? '### ' : '';
                const locator = { type: paragraphType, part, paragraph: counts.paragraph };
                if (noteId !== null) locator.noteId = noteId;
                this._appendSection(result, prefix + text, locator, `${paragraphType.replace('docx-', '')} ${counts.paragraph}`);
            } else if (nodeName === 'tbl') {
                counts.table += 1;
                const locator = { type: tableType, part, table: counts.table };
                if (noteId !== null) locator.noteId = noteId;
                this._appendSection(result, this._parseDocxTable(node), locator, `Tableau ${counts.table}`);
            }
        }
    }

    _parseDocxTable(tableNode) {
        const rows = Array.from(tableNode?.children || []).filter(child => this._elementName(child) === 'tr');
        return rows.map((row, index) => {
            const cells = Array.from(row?.children || [])
                .filter(child => this._elementName(child) === 'tc')
                .map(cell => {
                    const directTexts = [];
                    const collect = node => {
                        for (const child of Array.from(node?.childNodes || [])) {
                            const name = this._elementName(child);
                            if (name === 'tbl') continue;
                            if (name === 't') directTexts.push(child.textContent || '');
                            else if (name === 'tab') directTexts.push('\t');
                            else if (name === 'br') directTexts.push('\n');
                            else if (child.childNodes?.length && name !== 'tbl') collect(child);
                        }
                    };
                    collect(cell);
                    return directTexts.join('').trim().replace(/\|/g, '\\|') || ' ';
                });
            const line = '| ' + cells.join(' | ') + ' |';
            return index === 0 ? line + '\n| ' + cells.map(() => '---').join(' | ') + ' |' : line;
        }).join('\n');
    }

    async _parseXlsx(file) {
        const archive = await this._loadOfficeArchive(file, 'XLSX');
        const zip = archive.zip;
        const sharedStrings = [];
        const sharedXml = await this._readArchiveXml(archive, 'xl/sharedStrings.xml');
        if (sharedXml) {
            const sharedDoc = this._parseXml(sharedXml, 'XLSX');
            for (const node of this._getElementsByLocalName(sharedDoc, 'si')) {
                sharedStrings.push(this._getElementsByLocalName(node, 't').map(text => text.textContent).join(''));
            }
        }

        const sheets = await this._xlsxSheets(archive);
        const stylesXml = await this._readArchiveXml(archive, 'xl/styles.xml');
        const dateStyles = stylesXml ? this._dateStyleIds(this._parseXml(stylesXml, 'XLSX')) : [];
        const workbookXml = await this._readArchiveXml(archive, 'xl/workbook.xml');
        const workbookDoc = workbookXml ? this._parseXml(workbookXml, 'XLSX') : null;
        const workbookPr = workbookDoc ? this._getElementsByLocalName(workbookDoc, 'workbookPr')[0] : null;
        const date1904 = ['1', 'true'].includes(String(workbookPr?.getAttribute('date1904') || '').toLowerCase());
        const result = { markdown: `# Classeur Excel : ${file.name}\n\n`, sourceMap: [], metadata: { sheetCount: sheets.length, dateSystem: date1904 ? '1904' : '1900' }, parser: 'xlsx-xml', warnings: [] };
        for (let index = 0; index < sheets.length; index++) {
            const { name: sheetName, path: sheetPath } = sheets[index];
            const sheetXml = await this._readArchiveXml(archive, sheetPath);
            if (!sheetXml) { result.warnings.push({ code: 'missing_sheet', sheet: sheetName }); continue; }
            const sheetDoc = this._parseXml(sheetXml, 'XLSX');
            const rows = this._getElementsByLocalName(sheetDoc, 'row');
            const usedRows = rows.slice(0, this.limits.maxTabularRowsPerSheet);
            const cellReferences = [];
            const markdownRows = [];
            let truncatedColumns = false;
            for (let rowIndex = 0; rowIndex < usedRows.length; rowIndex++) {
                const row = usedRows[rowIndex];
                const cells = this._getElementsByLocalName(row, 'c').slice(0, this.limits.maxTabularColumns);
                if (this._getElementsByLocalName(row, 'c').length > this.limits.maxTabularColumns) truncatedColumns = true;
                cells.forEach(cell => { if (cell.getAttribute('r')) cellReferences.push(cell.getAttribute('r')); });
                const values = cells.map(cell => {
                    const type = cell.getAttribute('t');
                    const valueNode = this._getElementsByLocalName(cell, 'v')[0];
                    let value = valueNode ? valueNode.textContent : '';
                    if (type === 's' && typeof value === 'string' && /^\d+$/.test(value.trim()) && sharedStrings[Number(value)] !== undefined) value = sharedStrings[Number(value)];
                    if (type === 'inlineStr') value = this._getElementsByLocalName(cell, 't').map(item => item.textContent).join('');
                    if ((!type || type === 'n') && dateStyles[Number(cell.getAttribute('s') || 0)]) value = this._excelDateValue(value, date1904);
                    return String(value).trim().replace(/\|/g, '\\|') || ' ';
                });
                if (!values.some(cell => cell.trim() && cell !== ' ')) continue;
                const line = '| ' + values.join(' | ') + ' |';
                markdownRows.push(rowIndex === 0 ? line + '\n| ' + values.map(() => '---').join(' | ') + ' |' : line);
            }
            const firstRow = usedRows[0]?.getAttribute('r') || (usedRows.length ? '1' : null);
            const lastRow = usedRows[usedRows.length - 1]?.getAttribute('r') || firstRow;
            const range = cellReferences.length ? `${cellReferences[0]}:${cellReferences[cellReferences.length - 1]}` : null;
            if (rows.length > usedRows.length) result.warnings.push({ code: 'rows', sheet: sheetName, used: usedRows.length, total: rows.length });
            if (truncatedColumns) result.warnings.push({ code: 'columns', sheet: sheetName, used: this.limits.maxTabularColumns });
            if (markdownRows.length) {
                this._appendSection(result, `## ${sheetName}\n\n${markdownRows.join('\n')}`, {
                    type: 'spreadsheet-range', sheet: sheetName, range, startRow: firstRow, endRow: lastRow, truncated: rows.length > usedRows.length || truncatedColumns
                }, sheetName);
            }
        }
        return result;
    }

    async _xlsxSheets(archive) {
        const workbookXml = await this._readArchiveXml(archive, 'xl/workbook.xml');
        if (!workbookXml) throw new Error('Fichier XLSX invalide (workbook.xml introuvable).');
        const doc = this._parseXml(workbookXml, 'XLSX');
        const relations = await this._relationships(archive, 'xl/_rels/workbook.xml.rels', 'xl');
        return Array.from(this._getElementsByLocalName(doc, 'sheet')).map((sheet, index) => {
            const id = this._attributeByLocalName(sheet, 'id');
            return {
                name: sheet.getAttribute('name') || `Feuille ${index + 1}`,
                path: relations.get(id) || ''
            };
        }).filter(sheet => sheet.path);
    }

    async _parsePptx(file) {
        const archive = await this._loadOfficeArchive(file, 'PPTX');
        const presentationXml = await this._readArchiveXml(archive, 'ppt/presentation.xml');
        if (!presentationXml) throw new Error('Fichier PPTX invalide (presentation.xml introuvable).');
        const presentation = this._parseXml(presentationXml, 'PPTX');
        const relations = await this._relationships(archive, 'ppt/_rels/presentation.xml.rels', 'ppt');
        const slides = this._getElementsByLocalName(presentation, 'sldId').map(slide =>
            relations.get(this._attributeByLocalName(slide, 'id'))
        ).filter(Boolean);
        const result = { markdown: `# Présentation PowerPoint : ${file.name}\n\n`, sourceMap: [], metadata: { slideCount: slides.length }, parser: 'pptx-xml', warnings: [] };
        const usedSlides = slides.slice(0, this.limits.maxPptxSlides);
        if (slides.length > usedSlides.length) result.warnings.push({ code: 'slides', used: usedSlides.length, total: slides.length });
        for (let index = 0; index < usedSlides.length; index++) {
            const slideXml = await this._readArchiveXml(archive, usedSlides[index]);
            if (!slideXml) continue;
            const slideDoc = this._parseXml(slideXml, 'PPTX');
            const texts = this._getElementsByLocalName(slideDoc, 't').map(node => node.textContent.trim()).filter(Boolean);
            const slideNumber = index + 1;
            if (texts.length) {
                this._appendSection(result, `## Diapositive ${slideNumber}\n\n${texts.map(text => '- ' + text).join('\n')}`, { type: 'presentation-slide', slide: slideNumber }, `Diapositive ${slideNumber}`);
            }
        }
        return result;
    }

    async _parseOdf(file, extension) {
        const archive = await this._loadOfficeArchive(file, 'OpenDocument');
        const content = await this._readArchiveXml(archive, 'content.xml');
        if (!content) throw new Error('Fichier OpenDocument invalide (content.xml introuvable).');
        const doc = this._parseXml(content, 'OpenDocument');
        if (extension === 'ods') return this._extractOds(doc, file.name);
        const result = { markdown: `# Document OpenDocument : ${file.name}\n\n`, sourceMap: [], metadata: {}, parser: 'odf-xml' };
        let paragraph = 0;
        const textNodes = [
            ...this._getElementsByLocalName(doc, 'h'),
            ...this._getElementsByLocalName(doc, 'p'),
            ...this._getElementsByLocalName(doc, 'list-item')
        ];
        const inTable = node => {
            let current = node?.parentNode;
            while (current) {
                if (this._elementName(current) === 'table') return true;
                current = current.parentNode;
            }
            return false;
        };
        for (const node of textNodes) {
            if (inTable(node)) continue;
            const text = (node.textContent || '').trim();
            if (!text) continue;
            paragraph += 1;
            this._appendSection(result, text, { type: 'odf-paragraph', paragraph }, `Bloc ${paragraph}`);
        }
        result.metadata.paragraphCount = paragraph;
        return result;
    }

    _extractOds(doc, name) {
        const result = { markdown: `# ${name}\n\n`, sourceMap: [], metadata: {}, parser: 'ods-xml', warnings: [] };
        let tables = this._getElementsByLocalName(doc, 'table');
        if (!tables.length && typeof doc?.getElementsByTagName === 'function') {
            tables = Array.from(doc.getElementsByTagName('table:table'));
        }
        result.metadata.sheetCount = tables.length;
        const repeated = (node, attr) => Math.max(1, Math.min(Number(node.getAttribute(attr)) || 1, Number.MAX_SAFE_INTEGER));
        for (const [index, table] of tables.entries()) {
            const sheet = table.getAttribute('table:name') || `Sheet ${index + 1}`;
            let rows = this._getElementsByLocalName(table, 'table-row');
            if (!rows.length && typeof table?.getElementsByTagName === 'function') {
                rows = Array.from(table.getElementsByTagName('table:table-row'));
            }
            let total = 0, used = 0;
            for (const row of rows) {
                const count = repeated(row, 'table:number-rows-repeated');
                total = Math.min(Number.MAX_SAFE_INTEGER, total + count);
                const take = Math.min(count, this.limits.maxTabularRowsPerSheet - used);
                if (take <= 0) continue;
                const cells = Array.from(row.children).filter(cell => ['table-cell', 'covered-table-cell'].includes(this._elementName(cell))).slice(0, this.limits.maxTabularColumns);
                if (Array.from(row.children).filter(cell => ['table-cell', 'covered-table-cell'].includes(this._elementName(cell))).length > this.limits.maxTabularColumns) {
                    result.warnings.push({ code: 'columns', sheet, used: this.limits.maxTabularColumns });
                }
                const values = [];
                let truncatedColumns = false;
                for (const cell of cells) {
                    let paragraphs = this._getElementsByLocalName(cell, 'p');
                    if (!paragraphs.length && typeof cell?.getElementsByTagName === 'function') {
                        paragraphs = Array.from(cell.getElementsByTagName('text:p'));
                    }
                    const text = paragraphs.map(p => (p.textContent || '').trim()).join(' ').replace(/\|/g, '\\|');
                    const columns = Math.min(repeated(cell, 'table:number-columns-repeated'), this.limits.maxOdsRepeatedColumns);
                    if (columns >= this.limits.maxOdsRepeatedColumns) truncatedColumns = true;
                    for (let c = 0; c < columns && values.length < this.limits.maxTabularColumns; c++) values.push(text);
                }
                if (truncatedColumns && !result.warnings.some(w => w.code === 'columns' && w.sheet === sheet)) {
                    result.warnings.push({ code: 'columns', sheet, used: values.length });
                }
                for (let i = 0; i < take; i++) {
                    used++;
                    if (values.some(Boolean)) {
                        const line = '| ' + values.join(' | ') + ' |';
                        this._appendSection(result, line, { type: 'spreadsheet-range', sheet, startRow: used, endRow: used }, `${sheet} — ${used}`);
                    }
                }
            }
            if (total > used) result.warnings.push({ code: 'rows', sheet, used, total });
        }
        return result;
    }

    async _parseCsv(file) {
        const raw = String(await this._readAsText(file) || '').replace(/^\uFEFF/, '');
        const delimiter = this._detectCsvDelimiter(raw);
        const { rows, warnings } = this._readCsvRowsTolerant(raw, delimiter);
        const filtered = rows.filter(row => row.some(cell => cell.trim()));
        const usedRows = filtered.slice(0, this.limits.maxTabularRowsPerSheet);
        const cappedRows = usedRows.map(row => row.slice(0, this.limits.maxTabularColumns));
        const table = cappedRows.map((row, index) => {
            const values = row.map(cell => cell.trim().replace(/\|/g, '\\|') || ' ');
            const line = '| ' + values.join(' | ') + ' |';
            return index === 0 ? line + '\n| ' + values.map(() => '---').join(' | ') + ' |' : line;
        }).join('\n');
        const result = { markdown: `# Données CSV : ${file.name}\n\n`, sourceMap: [], metadata: { rowCount: filtered.length, delimiter }, parser: 'csv', warnings: [...warnings] };
        if (filtered.length > usedRows.length) result.warnings.push({ code: 'rows', sheet: file.name, used: usedRows.length, total: filtered.length });
        if (filtered.some(row => row.length > this.limits.maxTabularColumns)) result.warnings.push({ code: 'columns', sheet: file.name, used: this.limits.maxTabularColumns });
        this._appendSection(result, table, { type: 'csv-row-range', startRow: cappedRows.length ? 1 : null, endRow: cappedRows.length, truncated: filtered.length > usedRows.length }, `Lignes 1–${cappedRows.length}`);
        return result;
    }

    _detectCsvDelimiter(raw) {
        const sample = String(raw || '').split(/\r?\n/).slice(0, 5).join('\n');
        const candidates = [',', ';', '\t'];
        const counts = new Map(candidates.map(delimiter => [delimiter, 0]));
        let quoted = false;
        for (let index = 0; index < sample.length; index++) {
            const character = sample[index];
            if (character === '"') {
                if (quoted && sample[index + 1] === '"') index++;
                else quoted = !quoted;
            } else if (!quoted && counts.has(character)) counts.set(character, counts.get(character) + 1);
        }
        return candidates.reduce((best, item) => counts.get(item) > counts.get(best) ? item : best, ',');
    }

    _readCsvRows(raw, delimiter) {
        return this._readCsvRowsTolerant(raw, delimiter).rows;
    }

    _readCsvRowsTolerant(raw, delimiter) {
        const source = String(raw || '').replace(/\r\n?/g, '\n');
        const rows = [];
        const warnings = [];
        let row = [];
        let field = '';
        let quoted = false;
        for (let index = 0; index < source.length; index++) {
            const character = source[index];
            if (quoted) {
                if (character === '"' && source[index + 1] === '"') { field += '"'; index++; }
                else if (character === '"') quoted = false;
                else field += character;
                continue;
            }
            if (character === '"' && field.trim().length === 0) { quoted = true; field = ''; }
            else if (character === delimiter) { row.push(field); field = ''; }
            else if (character === '\n') {
                row.push(field); field = '';
                if (row.some(cell => cell.trim())) rows.push(row);
                row = [];
            } else field += character;
        }
        if (quoted) {
            warnings.push({ code: 'csv_parse', detail: 'champ cité non terminé — ligne conservée telle quelle' });
            row.push(field);
            if (row.some(cell => cell.trim())) rows.push(row);
            return { rows, warnings };
        }
        if (field.length || row.length) {
            row.push(field);
            if (row.some(cell => cell.trim())) rows.push(row);
        }
        return { rows, warnings };
    }

    async _parseRtf(file) {
        const raw = String(await this._readAsText(file) || '');
        const text = this._extractRtfText(raw);
        const lineCount = text ? text.split('\n').length : 0;
        const markdown = text ? `# ${file.name}\n\n${text}` : '';
        return {
            markdown,
            sourceMap: text ? [{ id: 'source_1', markdownStart: 0, markdownEnd: markdown.length, label: `Lignes 1–${lineCount}`, locator: { type: 'rtf-line-range', startLine: 1, endLine: lineCount } }] : [],
            metadata: { lineCount },
            parser: 'rtf-text'
        };
    }

    _extractRtfText(rtf) {
        const skipDestinations = new Set(['fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'object', 'datastore', 'themedata', 'xmlnstbl', 'listtable', 'listoverridetable', 'generator', 'colorschememapping']);
        const stack = [];
        let state = { skip: false, uc: 1, skipFallback: 0 };
        let output = '';
        const emit = value => { if (!state.skip) output += value; };
        for (let index = 0; index < rtf.length; index++) {
            const character = rtf[index];
            if (character === '{') {
                stack.push({ ...state });
                continue;
            }
            if (character === '}') {
                state = stack.pop() || { skip: false, uc: 1, skipFallback: 0 };
                continue;
            }
            if (character !== '\\') {
                if (character === '\r' || character === '\n') continue;
                if (state.skipFallback > 0) { state.skipFallback--; continue; }
                emit(character);
                continue;
            }
            const next = rtf[index + 1];
            if (!next) break;
            if (!/[a-z]/i.test(next)) {
                index++;
                if (next === '*') state.skip = true;
                else if (next === '\\' || next === '{' || next === '}') {
                    if (state.skipFallback > 0) state.skipFallback--;
                    else emit(next);
                } else if (next === '~') emit('\u00a0');
                else if (next === '_') emit('\u2011');
                else if (next === '-') emit('');
                else if (next === "'") {
                    const hex = rtf.slice(index + 1, index + 3);
                    if (/^[\da-f]{2}$/i.test(hex)) {
                        index += 2;
                        const decoded = new TextDecoder('windows-1252').decode(Uint8Array.of(parseInt(hex, 16)));
                        if (state.skipFallback > 0) state.skipFallback--;
                        else emit(decoded);
                    }
                } else if (state.skipFallback > 0) state.skipFallback--;
                continue;
            }
            const match = rtf.slice(index + 1).match(/^([a-z]+)(-?\d+)? ?/i);
            if (!match) continue;
            index += match[0].length;
            const word = match[1].toLowerCase();
            const parameter = match[2] === undefined ? null : Number(match[2]);
            if (skipDestinations.has(word)) state.skip = true;
            else if (word === 'uc' && Number.isFinite(parameter)) state.uc = Math.max(0, parameter);
            else if (word === 'u' && Number.isFinite(parameter)) {
                const codeUnit = parameter < 0 ? parameter + 65536 : parameter;
                emit(String.fromCharCode(codeUnit));
                state.skipFallback = state.uc;
            } else if (word === 'par' || word === 'line') emit('\n');
            else if (word === 'tab') emit('\t');
            else if (word === 'emdash') emit('\u2014');
            else if (word === 'endash') emit('\u2013');
            else if (word === 'bullet') emit('\u2022');
            else if (word === 'lquote') emit('\u2018');
            else if (word === 'rquote') emit('\u2019');
            else if (word === 'ldblquote') emit('\u201c');
            else if (word === 'rdblquote') emit('\u201d');
            else if (word === 'bin' && Number.isFinite(parameter) && parameter > 0) index += parameter;
        }
        return output.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
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
