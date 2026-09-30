<div align="center">

# 🛡️ Sealarca-Desk

**Self-contained local browser client for the Swiss AI gateway [Sealarca](https://sealarca.ch)**  
*Local document preparation, explicit context selection, and direct Vault access.*

[![License: PolyForm Perimeter 1.0.1](https://img.shields.io/badge/License-PolyForm%20Perimeter%201.0.1-087F68.svg)](LICENSE)
[![Release: v1.2.0](https://img.shields.io/badge/Release-v1.2.0-137A52.svg)](https://github.com/ScioNos/Sealarca-Desk/releases/tag/v1.2.0)

🌐 **Language / Langue / Sprache / Lingua / Idioma**  
**English** · [Français 🇫🇷](README.fr.md) · [Deutsch 🇩🇪](README.de.md) · [Italiano 🇮🇹](README.it.md) · [Español 🇪🇸](README.es.md)

</div>

## Overview

Sealarca-Desk is a static single-page application for chat and document-assisted work with Sealarca Vault. The interface and all runtime libraries are loaded locally; model discovery, chat responses, and AI-generated document profiles require a network connection to the fixed API endpoint `https://api.sealarca.ch/v1`.

No application backend, analytics SDK, or CDN is used by the runtime.

## Current features

- **Folders/projects** containing multiple conversations and a reusable document library.
- **Local conversation history** with title filtering in the sidebar.
- **Document preservation** in IndexedDB: original Blob, canonical Markdown, MIME type, extension, size, SHA-256 hash when Web Crypto is available, extraction metadata, and provenance source map.
- **Supported imports**: `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.odt`, `.ods`, `.csv`, `.txt`, `.md`, `.json`, `.rtf`, `.log`, and `.xml`.
- **Document limits**: 20 MiB per file, 500,000 extracted characters, 100 PDF pages, 100 PPTX slides, 100 rows per spreadsheet/CSV sheet, 200 columns max, and at most 5 files per add operation. Office/ODF archives are limited to 100 MiB expanded, 20 MiB per entry, and 2,000 entries. Profile requests include at most 120,000 characters and 100 sources.
- **Chat context limit**: 250,000 characters across instructions, conversation history, and selected document context; oversized requests are blocked without truncating the context.
- **Manual context mode** to choose the documents sent with the next request.
- **Automatic context mode** that ranks folder documents locally and sends relevant, citable excerpts from up to 5 documents.
- **Document workspace** with local full-text search, canonical Markdown preview, source references, original-file download, folder overview, and `index.md` overview export.
- **Dossier analysis** from current local profiles: summaries, chronology, parties, obligations, amounts, comparisons, and apparent differences. Results link to source locations and are marked for verification. These actions do not send document contents; profile generation remains an explicit per-document action.
- **Operation history and traces** with progress steps, notices, cancellation/retry where applicable, and source manifests for chat responses and local dossier actions. Folder-level context mode can override the general setting.
- **AI-generated document profiles** (summary, people, organizations, dates, and important items) processed through a persistent two-worker queue with retry, cancellation, deduplication, and recovery after interruption. Profile generation sends document Markdown to the selected Sealarca model.
- **Responses API integration**: dynamic model discovery through `GET /v1/models`; streaming and non-streaming requests through `POST /v1/responses`, with `store: false`, sliding 120-second timeout, retryable HTTP backoff, and chat plus profile cancellation.
- **Streaming output** with a reasoning drawer when the gateway emits supported reasoning-summary events.
- **Five work modes**: Document Analysis, Summary & Drafting, Legal & Contracts, Tax & Fiduciary, and Compliance & Confidentiality.
- **Five interface languages**: French, German, Italian, English, and Spanish.
- **Light/dark themes**, strict CSP, sanitized Markdown rendering, and local vendor dependencies.

## Data and network model

- The API key is kept in `sessionStorage` for the current browser tab/session and is removed from legacy IndexedDB storage during migration.
- Conversations, messages, folders, documents, document profiles, processing jobs, roles, language, selected model, and UI preferences are stored locally in IndexedDB. The theme is stored in `localStorage`.
- Dossier operations and metadata-only traces are also stored locally in IndexedDB and included in `6.0` exports. Traces retain references and counts, not document text.
- Chat requests send conversation text plus only the manually selected documents or automatically selected excerpts.
- Document-profile jobs send the relevant document Markdown to the selected Sealarca model.
- Application API calls target `https://api.sealarca.ch/v1`. The CSP also permits local development origins on `localhost` and `127.0.0.1`.
- “Local” and “no CDN” describe application loading, parsing, indexing, and storage; AI operations are not offline.

## Quick start

1. Download and extract the release archive.
2. Open `Sealarca-Desk/index.html` in a modern browser.
3. Enter a Sealarca API key. The configuration dialog opens automatically when no session key is available.
4. Select a discovered model, create or select a folder, then start a conversation or add documents.

The Sealarca API must accept requests from a local `file://` page. If a browser or organization policy blocks this origin, serve the directory from an approved local static server without changing the API endpoint.

## Architecture

```text
Sealarca-Desk/
├── index.html                 # Alpine.js single-page interface and CSP
├── css/
│   ├── theme.css              # Design tokens and light/dark themes
│   ├── layout.css             # Responsive application layout
│   └── components.css         # UI and Markdown components
├── images/
│   ├── logo.png
│   ├── logo-light.png
│   └── flags/                 # Local language flags
├── js/
│   ├── boot-theme.js          # Applies the saved theme before rendering
│   ├── i18n.js                # Five-language UI dictionaries
│   ├── db.js                  # IndexedDB schema v6 and persistence APIs
│   ├── doc-handler.js         # Local extraction, canonical Markdown, provenance
│   ├── api.js                 # Fixed Sealarca Responses API client
│   ├── p1.js                  # Search, profiles, citations, persistent job queue
│   ├── operations.js          # Operation lifecycle, notices and provenance traces
│   ├── timeline.js            # Local dossier timeline and comparisons
│   └── app.js                 # Alpine.js application state and workflows
├── vendor/
│   ├── alpine-csp.min.js
│   ├── jszip.min.js
│   ├── marked.min.js
│   ├── purify.min.js
│   ├── pdf.min.js
│   └── pdf.worker.min.js
├── tests/                     # Node.js unit/static tests
└── scripts/build-release.ps1  # Release ZIP and SHA-256 builder
```

## Development and verification

Node.js is not required to run the released application. It is required for repository checks:

```bash
npm test
npm run check
npm run release:build
```

Build the release artifacts on PowerShell with:

```powershell
npm run release:build
```

## License

This source-available project is licensed under the **PolyForm Perimeter License 1.0.1**. See [LICENSE](LICENSE). It is not presented as open-source software.

Copyright (c) 2026 **eyelo SA (ScioNos)** — Switzerland.
