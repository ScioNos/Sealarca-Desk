# 📋 Changelog

All notable changes to **Sealarca-Desk** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-29

### 🎉 First Official Release

### Added
- Self-contained, zero-install browser application launched from `index.html`, with all runtime dependencies bundled locally for offline use.
- Sealarca Vault integration with dynamic model discovery, Responses API streaming, reasoning display, and request cancellation.
- Persistent folders/projects with their own metadata, conversations, and document libraries.
- Reusable local documents with canonical Markdown, original source blobs, SHA-256 hashes, and extensible source maps.
- Local extraction for PDF, DOCX, XLSX, PPTX, ODT, ODS, CSV, TXT, Markdown, and JSON files.
- Provenance locators for PDF pages, PowerPoint slides, spreadsheet sheets/ranges, and reliable non-paginated references.
- Explicit per-request document selection and a document preview/download interface.
- Derived Markdown chunk storage contract for future large-folder processing.
- Five-language interface: French, German, Italian, English, and Spanish.
- Light and dark themes, local conversation history, custom roles, full data import/export, and strict Content Security Policy.

### Storage compatibility
- IndexedDB uses schema version 2.
- The existing migration from development schema version 1 is retained so folders are created and development data, conversations, and messages are recovered without deletion.
- Historical conversation context is separated from selected folder documents; old full document payloads are not automatically reinjected.

### License
- First official release under the PolyForm Perimeter License 1.0.1.
- The project is presented as source available, not as open-source software.
