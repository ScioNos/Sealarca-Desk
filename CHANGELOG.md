# Changelog

## [1.1.0] - 2026-09-28

### Fixed

- Upgrade IndexedDB to v5 with a non-destructive v4 migration, orphan-reference guards, collision-safe messages, atomic job claims, owner-token leases, and guarded profile commits.
- Enforce `maxAttempts` with backoff on claim/recover, keep `running` leases intact on progress updates, and use atomic snapshot export `5.0` (folders, documents, chunks, profiles, jobs, conversations, messages, roles, settings) with idempotent single-transaction import.
- Wait for active streaming cancellation before deleting its conversation or folder; abort chat and profile (P1) requests together; use a sliding 120-second streaming timeout with a distinct `timeout` reason and close the SSE reader on `response.completed`.
- Reject oversized chat context above 250,000 characters and cite only sources actually sent, including the manual fallback document.
- Restrict Markdown-supplied classes and IDs, strip `svg`/`math`, restrict link protocols with `ALLOWED_URI_REGEXP`, correct Unicode-normalized search offsets, and mark streams without `response.completed` as interrupted while retaining partial output; empty cancellations no longer create ghost messages.
- Preflight Office/ODF archives before inflation and enforce expanded-size, per-entry (20 MiB), and entry-count limits; improve RTF, CSV, DOCX, XLSX, PPTX and ODT/ODS extraction and provenance with column/slide caps and warnings.
- Refresh locally bundled PDF.js, Marked, DOMPurify, JSZip and Alpine CSP and record versions and SHA-256 hashes in `vendor/dependencies.json`; `scripts/build-vendor.js` now verifies and copies Alpine, `scripts/build-release.ps1` refuses a vendor mismatch.
- Preserve existing local user data and the fixed Sealarca API endpoint/protocol.

### Verification

- Added regression coverage for storage migration and concurrency, deletion races, context and archive boundaries, Markdown safety, citations, incomplete SSE streams, Unicode offsets, and document-format fixtures.
- Archive verification and Windows/Chrome profile migration are part of release validation.

## [1.0.4] - 2026-09-19

### Fixed

- Surface partial-extraction warnings at import, in the document library and in previews, in all five interface languages.
- Limit ODS extraction to 100 logical rows per sheet, including repeated rows, and retain sheet/row provenance and original files.
- Identify PDF pages without extractable text and explain the absence of built-in OCR for scan-only PDFs.
- Align discovered model labels with the public catalogue without changing model IDs or automatic discovery.
- Preserve earlier release archives when building a new distribution.

### Verification

- Added boundary tests for CSV, multi-sheet ODS, repeated rows, mixed/scan-only PDFs and oversized documents.
- No IndexedDB schema change, stored document rewrite or API protocol change.

## [1.0.3] - 2026-09-05

### Improved

- Replaced the first-run connection modal with a clear two-step key verification and model selection flow.
- Added localized prerequisites and direct links to prepare a Sealarca account or open API keys.
- Clarified that the API key is supplied to the local application, kept in tab `sessionStorage`, and not embedded in the public site or persisted in IndexedDB.
- Added recoverable guidance when organizational browser policies block `file://` network access.
- Updated French, German, Italian, English, and Spanish onboarding copy.

All notable changes to **Sealarca-Desk** are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-08-31

### Fixed

- Add five system work modes with an explicit Document Analysis default, refreshed prompts and non-destructive synchronization of existing system modes.
- Preserve existing user-selected modes and custom modes while updating only unchanged built-in modes.
- Rename public role terminology to Work modes and remove professional-qualification wording from the UI and active prompts.
- Rebuild the distribution including the cumulative `1.0.1` and `1.0.2` first-screen and work-mode corrections.

### Verification

- Expanded the Node.js suite to 41 tests covering API, storage, document, security, first-screen and work-mode contracts.
- Rebuilt the `Sealarca-Desk-v1.0.2.zip` distribution and its SHA-256 checksum.

## [1.0.1] - 2026-08-31

### Fixed

- Preserve an existing session API key when migrating and remove stale legacy IndexedDB key material.
- Require an explicit discovered-model choice instead of silently selecting the first alphabetic model.
- Improve first-run key configuration with an accessible model selector, clearer session-storage wording, model-discovery errors and a Sealarca link.
- Add keyboard-accessible native controls, modal focus trapping, background inertness, ARIA tab semantics, visible focus styles and reduced-motion handling.
- Align the file picker with all supported parsers, including `.log` and `.xml`, and reject empty or malformed extracted documents.
- Improve small-screen layout, touch targets, long-name handling and localization of the document workspace.
- Prevent stale streaming cleanup from affecting a newer request and surface IndexedDB transaction aborts correctly.
- Add five system work modes with an explicit Document Analysis default, refreshed prompts, and non-destructive synchronization of existing system modes.

### Verification

- Expanded the Node.js suite to 40 tests covering the corrected UI, storage, document and work-mode contracts.
- Rebuilt the `Sealarca-Desk-v1.0.1.zip` distribution and its SHA-256 checksum.

## [1.0.0] - 2026-08-29

### First Official Release

### Added

- Static, zero-install browser application launched from `index.html`, with Alpine CSP, JSZip, Marked, DOMPurify and PDF.js bundled locally.
- Fixed Sealarca API integration with dynamic model discovery through `GET /v1/models` and Responses API calls through `POST /v1/responses`.
- Streaming text, supported reasoning-summary events, request cancellation, a 120-second timeout and retry/backoff for transient errors.
- Persistent folders/projects, multiple conversations, title filtering and local message history.
- Reusable folder documents with original Blob, canonical Markdown, MIME type, extension, size, SHA-256 hash when available, extraction metadata and provenance source maps.
- Local extraction for PDF, DOCX, XLSX, PPTX, ODT, ODS, CSV, TXT, Markdown, JSON, RTF, LOG and XML.
- Provenance locators for PDF pages, PowerPoint slides, spreadsheet ranges, CSV row ranges, DOCX paragraphs/tables, ODF paragraphs and text blocks.
- Manual document selection and automatic local relevance selection for each request.
- Document workspace with local full-text search, Markdown preview, source references, original-file download and folder overview export to `index.md`.
- AI-generated document profiles with validated source references, plus a persistent two-worker processing queue with retry, cancellation, deduplication and interruption recovery.
- Four built-in professional roles, five interface languages, light/dark themes and sanitized Markdown rendering.
- Node.js tests for API behavior, storage/migrations, document contracts, P1 search/profile/queue logic and static security invariants.

### Storage compatibility

- IndexedDB uses schema version 3.
- The version 2 migration creates a default folder and attaches legacy conversations without deleting them.
- The version 3 migration adds `documentProfiles` and `processingJobs` without deleting existing data.
- The complete storage export contract is version `3.0` and includes folders, documents, profiles, jobs, conversations, messages and roles.
- The API key is stored only in `sessionStorage`; a legacy IndexedDB key is moved to the current session and deleted from persistent storage.
- Conversation history is kept separate from document context, and messages retain document references rather than full document payloads.

### Security and licensing

- Strict CSP, CSP-compatible Alpine build, DOMPurify restrictions and a fixed API endpoint are enforced by static tests.
- The project is licensed under the PolyForm Perimeter License 1.0.1 and is presented as source available, not open source.
