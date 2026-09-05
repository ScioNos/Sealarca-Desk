# Sealarca Desk v1.0.3

Release date: **August 31, 2026**.

Sealarca Desk v1.0.3 improves first-run activation for the source-available local browser client. Runtime assets, document parsing, indexing and browser storage are local; model discovery, chat and document-profile generation require access to `https://sealarca.ch/v1`.

## First-run improvements in v1.0.3

- Presents account, credits, and API-key prerequisites before configuration.
- Separates key verification/model discovery from explicit model selection.
- Links to the localized Sealarca onboarding page and the account key area.
- Clarifies session-only key handling and provides recovery guidance for blocked `file://` network access.

## Highlights

- Folders/projects group multiple conversations and reusable documents.
- Imported documents retain the original file, canonical Markdown, metadata, SHA-256 hash when available and a provenance source map.
- Supported imports: PDF, DOCX, XLSX, PPTX, ODT, ODS, CSV, TXT, Markdown, JSON, RTF, LOG and XML.
- Manual context selection sends only chosen documents; automatic mode performs local relevance ranking and sends citable excerpts from up to five documents.
- The document workspace provides local search, Markdown preview, original download, provenance references, folder overview and `index.md` export.
- AI-generated profiles summarize documents and extract people, organizations, dates and important items. A persistent two-worker queue supports retries, cancellation, deduplication and recovery after interruption.
- Models are discovered through `GET /v1/models`. Streaming chat and non-streaming profile generation use `POST /v1/responses` with `store: false`.
- The API key remains in browser `sessionStorage`; application data uses IndexedDB schema version 4.
- The interface supports French, German, Italian, English and Spanish, five work modes, and light/dark themes.

## Earlier cumulative fixes

- Keeps an existing session key ahead of stale legacy IndexedDB data and requires an explicit discovered-model choice.
- Improves first-run configuration, model errors, keyboard navigation, modal focus management, ARIA states and reduced-motion behavior.
- Aligns the file picker with all supported formats, rejects empty or malformed documents, and improves responsive behavior at narrow widths.
- Adds localized document-workspace labels and safer streaming/IndexedDB cleanup.
- Adds five system work modes with an explicit Document Analysis default and a non-destructive migration for existing selections and custom modes.
- Uses the cumulative first-screen, accessibility, responsive, document, storage and security corrections from v1.0.1.
- Updates the public work-mode names and prompts without inventing model capabilities or changing the Sealarca API.

## Operational limits

- 20 MiB maximum per document.
- 500,000 extracted characters per document.
- 100 PDF pages.
- 100 rows per spreadsheet/CSV sheet.
- 5 files per add operation.
- Automatic context uses at most 5 documents.

## Download

Download `Sealarca-Desk-v1.0.3.zip`, extract it, then open `Sealarca-Desk/index.html` in a modern browser.

The Sealarca API must allow requests from the local `file://` origin. If local-file requests are blocked by browser or organization policy, serve the extracted directory from an approved local static server.

## Integrity verification

Compare the archive SHA-256 with `Sealarca-Desk-v1.0.3.sha256`.

```powershell
Get-FileHash .\Sealarca-Desk-v1.0.3.zip -Algorithm SHA256
```

## Security note

Do not publish or share API keys, confidential documents, IndexedDB exports, screenshots containing sensitive content, or generated files derived from customer data.

## License

PolyForm Perimeter License 1.0.1. The project is source available and is not presented as open-source software.
