/**
 * Sealarca-Desk — Extracteur & Parseur Multi-Documents Local
 * 100% exécuté dans le navigateur du client (Zéro upload tiers)
 * Formats supportés : PDF, DOCX, XLSX, PPTX, ODT, ODS, CSV, TXT, MD, JSON
 */

class SealarcaDocHandler {
    constructor() {
        this.isPdfWorkerConfigured = false;
    }

    _initPdfWorker() {
        if (this.isPdfWorkerConfigured) return;
        if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
            this.isPdfWorkerConfigured = true;
        }
    }

    /**
     * Point d'entrée universel pour parser n'importe quel fichier
     * @param {File} file - Objet File HTML5
     * @returns {Promise<{ name: string, type: string, size: number, text: string, previewMarkdown: string }>}
     */
    async parseFile(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        const allowedExtensions = new Set(['pdf', 'docx', 'xlsx', 'pptx', 'odt', 'ods', 'csv', 'txt', 'md', 'json', 'rtf', 'log', 'xml']);
        const maxFileSize = 20 * 1024 * 1024;
        const maxExtractedCharacters = 500000;

        if (!allowedExtensions.has(ext)) {
            throw new Error(`Format .${ext || '?'} non pris en charge.`);
        }
        if (file.size > maxFileSize) {
            throw new Error('Fichier trop volumineux (maximum 20 Mo).');
        }
        let extractedText = '';

        switch (ext) {
            case 'pdf':
                extractedText = await this._parsePdf(file);
                break;
            case 'docx':
                extractedText = await this._parseDocx(file);
                break;
            case 'xlsx':
                extractedText = await this._parseXlsx(file);
                break;
            case 'pptx':
                extractedText = await this._parsePptx(file);
                break;
            case 'odt':
            case 'ods':
                extractedText = await this._parseOdf(file);
                break;
            case 'csv':
                extractedText = await this._parseCsv(file);
                break;
            case 'txt':
            case 'md':
            case 'json':
            case 'rtf':
            case 'log':
            case 'xml':
                extractedText = await this._readAsText(file);
                break;
            default:
                throw new Error(`Format .${ext} non pris en charge.`);
        }

        const cleanText = extractedText.trim();
        if (!cleanText) throw new Error('Aucun texte exploitable trouvé dans ce fichier.');
        if (cleanText.length > maxExtractedCharacters) {
            throw new Error('Le document extrait dépasse la limite de 500 000 caractères.');
        }
        const header = `\n\n--- 📄 DOCUMENT JOINT : "${file.name}" (${(file.size / 1024).toFixed(1)} Ko) ---\n\n`;
        
        return {
            name: file.name,
            extension: ext,
            size: file.size,
            rawText: cleanText,
            formattedPromptText: header + cleanText + `\n\n--- FIN DU DOCUMENT "${file.name}" ---\n`
        };
    }

    // --- 1. Parser PDF (via PDF.js) ---
    async _parsePdf(file) {
        this._initPdfWorker();
        if (!window.pdfjsLib) throw new Error('PDF.js non disponible en local.');

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        if (totalPages > 100) {
            throw new Error('Le PDF dépasse la limite de 100 pages.');
        }
        let fullText = `# 📄 Document PDF : ${file.name} (${totalPages} pages)\n\n`;

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            let lastY = null;
            let pageLines = [];
            let currentLine = '';

            for (const item of textContent.items) {
                if (lastY === null || Math.abs(item.transform[5] - lastY) > 5) {
                    if (currentLine.trim()) pageLines.push(currentLine.trim());
                    currentLine = item.str;
                } else {
                    currentLine += (currentLine.endsWith(' ') || item.str.startsWith(' ') ? '' : ' ') + item.str;
                }
                lastY = item.transform[5];
            }
            if (currentLine.trim()) pageLines.push(currentLine.trim());

            fullText += `## --- Page ${i} / ${totalPages} ---\n` + pageLines.join('\n') + '\n\n';
        }

        return fullText;
    }

    // --- 2. Parser Word DOCX (via JSZip + DOMParser) ---
    async _parseDocx(file) {
        if (!window.JSZip) throw new Error('JSZip non disponible pour la lecture DOCX.');
        const zip = await window.JSZip.loadAsync(file);
        const docXmlFile = zip.file('word/document.xml');
        if (!docXmlFile) throw new Error('Fichier DOCX invalide (document.xml introuvable).');

        const xmlString = await docXmlFile.async('string');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

        let textOutput = `# 📄 Contrat / Document Word : ${file.name}\n\n`;
        const body = xmlDoc.getElementsByTagName('w:body')[0];
        if (!body) return textOutput;

        const children = body.children;
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            const nodeName = node.nodeName.toLowerCase();

            // Paragraphes
            if (nodeName === 'w:p') {
                const textNodes = node.getElementsByTagName('w:t');
                let pText = '';
                for (let t of textNodes) {
                    pText += t.textContent;
                }
                if (pText.trim()) {
                    // Détection des titres par style
                    const styleNode = node.getElementsByTagName('w:pStyle')[0];
                    const styleVal = styleNode ? styleNode.getAttribute('w:val') : '';
                    if (styleVal && styleVal.toLowerCase().includes('heading1')) {
                        textOutput += `\n## ${pText.trim()}\n\n`;
                    } else if (styleVal && styleVal.toLowerCase().includes('heading2')) {
                        textOutput += `\n### ${pText.trim()}\n\n`;
                    } else {
                        textOutput += pText.trim() + '\n\n';
                    }
                }
            }

            // Tableaux
            if (nodeName === 'w:tbl') {
                textOutput += this._parseDocxTable(node) + '\n\n';
            }
        }

        return textOutput;
    }

    _parseDocxTable(tblNode) {
        const rows = tblNode.getElementsByTagName('w:tr');
        if (rows.length === 0) return '';
        let markdownTable = '';
        let colCount = 0;

        for (let r = 0; r < rows.length; r++) {
            const cells = rows[r].getElementsByTagName('w:tc');
            const rowValues = [];
            for (let c = 0; c < cells.length; c++) {
                const texts = cells[c].getElementsByTagName('w:t');
                let cellText = '';
                for (let t of texts) cellText += t.textContent;
                rowValues.push(cellText.trim().replace(/\|/g, '\\|') || ' ');
            }
            if (r === 0) {
                colCount = rowValues.length;
                markdownTable += '| ' + rowValues.join(' | ') + ' |\n';
                markdownTable += '| ' + rowValues.map(() => '---').join(' | ') + ' |\n';
            } else {
                markdownTable += '| ' + rowValues.join(' | ') + ' |\n';
            }
        }
        return markdownTable;
    }

    // --- 3. Parser Excel XLSX (via JSZip + DOMParser) ---
    async _parseXlsx(file) {
        if (!window.JSZip) throw new Error('JSZip non disponible pour la lecture XLSX.');
        const zip = await window.JSZip.loadAsync(file);

        // 1. Lire la table des chaînes partagées (sharedStrings.xml)
        const sharedStrings = [];
        const sharedStringsFile = zip.file('xl/sharedStrings.xml');
        if (sharedStringsFile) {
            const ssXml = await sharedStringsFile.async('string');
            const ssDoc = new DOMParser().parseFromString(ssXml, 'application/xml');
            const siNodes = ssDoc.getElementsByTagName('si');
            for (let si of siNodes) {
                const tNodes = si.getElementsByTagName('t');
                let sText = '';
                for (let t of tNodes) sText += t.textContent;
                sharedStrings.push(sText);
            }
        }

        // 2. Trouver les feuilles
        let textOutput = `# 📊 Classeur Excel : ${file.name}\n\n`;
        const sheetFiles = Object.keys(zip.files).filter(k => k.startsWith('xl/worksheets/sheet') && k.endsWith('.xml'));

        for (let sIdx = 0; sIdx < sheetFiles.length; sIdx++) {
            const sFile = zip.file(sheetFiles[sIdx]);
            if (!sFile) continue;
            const sheetXml = await sFile.async('string');
            const sheetDoc = new DOMParser().parseFromString(sheetXml, 'application/xml');
            const rows = sheetDoc.getElementsByTagName('row');
            
            textOutput += `## Feuille ${sIdx + 1}\n\n`;
            if (rows.length === 0) {
                textOutput += '*(Feuille vide)*\n\n';
                continue;
            }

            let tableMarkdown = '';
            for (let r = 0; r < Math.min(rows.length, 100); r++) { // Limite de sécurité 100 lignes par feuille
                const cells = rows[r].getElementsByTagName('c');
                const rowValues = [];
                for (let c of cells) {
                    const type = c.getAttribute('t');
                    const vNode = c.getElementsByTagName('v')[0];
                    let val = vNode ? vNode.textContent : '';
                    if (type === 's' && sharedStrings[parseInt(val, 10)]) {
                        val = sharedStrings[parseInt(val, 10)];
                    }
                    rowValues.push(val.trim().replace(/\|/g, '\\|') || '-');
                }

                if (r === 0) {
                    tableMarkdown += '| ' + rowValues.join(' | ') + ' |\n';
                    tableMarkdown += '| ' + rowValues.map(() => '---').join(' | ') + ' |\n';
                } else {
                    tableMarkdown += '| ' + rowValues.join(' | ') + ' |\n';
                }
            }
            textOutput += tableMarkdown + '\n\n';
        }

        return textOutput;
    }

    // --- 4. Parser PowerPoint PPTX (via JSZip + DOMParser) ---
    async _parsePptx(file) {
        if (!window.JSZip) throw new Error('JSZip non disponible pour la lecture PPTX.');
        const zip = await window.JSZip.loadAsync(file);
        const slideFiles = Object.keys(zip.files)
            .filter(k => k.startsWith('ppt/slides/slide') && k.endsWith('.xml'))
            .sort((a, b) => {
                const numA = parseInt(a.replace(/[^0-9]/g, ''), 10) || 0;
                const numB = parseInt(b.replace(/[^0-9]/g, ''), 10) || 0;
                return numA - numB;
            });

        let textOutput = `# 📽️ Présentation PowerPoint : ${file.name} (${slideFiles.length} diapositives)\n\n`;

        for (let i = 0; i < slideFiles.length; i++) {
            const slideFile = zip.file(slideFiles[i]);
            if (!slideFile) continue;
            const slideXml = await slideFile.async('string');
            const slideDoc = new DOMParser().parseFromString(slideXml, 'application/xml');
            const textNodes = slideDoc.getElementsByTagName('a:t');
            let slideTexts = [];

            for (let t of textNodes) {
                if (t.textContent.trim()) slideTexts.push(t.textContent.trim());
            }

            textOutput += `### Diapositive ${i + 1}\n`;
            if (slideTexts.length > 0) {
                textOutput += slideTexts.map(t => `- ${t}`).join('\n') + '\n\n';
            } else {
                textOutput += '*(Sans texte)*\n\n';
            }
        }

        return textOutput;
    }

    // --- 5. Parser OpenDocument ODT / ODS (via JSZip) ---
    async _parseOdf(file) {
        if (!window.JSZip) throw new Error('JSZip non disponible pour la lecture ODF.');
        const zip = await window.JSZip.loadAsync(file);
        const contentXmlFile = zip.file('content.xml');
        if (!contentXmlFile) throw new Error('Fichier OpenDocument invalide (content.xml introuvable).');

        const xmlString = await contentXmlFile.async('string');
        const xmlDoc = new DOMParser().parseFromString(xmlString, 'application/xml');
        let textOutput = `# 📄 Document OpenOffice / LibreOffice : ${file.name}\n\n`;

        const pNodes = xmlDoc.getElementsByTagName('text:p');
        for (let p of pNodes) {
            if (p.textContent.trim()) {
                textOutput += p.textContent.trim() + '\n\n';
            }
        }
        return textOutput;
    }

    // --- 6. Parser CSV ---
    async _parseCsv(file) {
        const rawText = await this._readAsText(file);
        const lines = rawText.split(/\r?\n/).filter(l => l.trim());
        if (lines.length === 0) return '';

        let tableMarkdown = `# 📊 Données CSV : ${file.name}\n\n`;
        const delimiter = lines[0].includes(';') ? ';' : ',';

        for (let i = 0; i < Math.min(lines.length, 100); i++) {
            const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, '').replace(/\|/g, '\\|') || ' ');
            if (i === 0) {
                tableMarkdown += '| ' + cols.join(' | ') + ' |\n';
                tableMarkdown += '| ' + cols.map(() => '---').join(' | ') + ' |\n';
            } else {
                tableMarkdown += '| ' + cols.join(' | ') + ' |\n';
            }
        }
        return tableMarkdown;
    }

    // --- Helper lecture texte brut ---
    _readAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }
}

// Instance singleton exportée globalement
window.sealarcaDocHandler = new SealarcaDocHandler();
