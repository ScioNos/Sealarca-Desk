# Changelog

All notable changes to **Sealarca-Desk** are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
