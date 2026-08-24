# 📋 Changelog

All notable changes to **Sealarca-Desk** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-23

### 🎉 Initial Release (Official Version)

#### Added
* **100% Client-Side & Zero-Installation Architecture**:
  * Direct launch via double-click on `index.html`.
  * Local bundling of all vendor dependencies in `vendor/` (Alpine.js CSP 3.16.2, Marked.js, DOMPurify, PDF.js, JSZip).
  * Zero CDN network calls, fully functional in isolated/offline environments.
  * Strict CSP without `unsafe-eval` or inline JavaScript.
* **Sealarca Vault API Integration**:
  * Dynamic auto-discovery of Vault models via `GET https://sealarca.ch/v1/models`.
  * Real-time Server-Sent Events (SSE) streaming via `POST https://sealarca.ch/v1/responses`.
  * Typed Responses API event handling and strict model normalization.
  * API-key-only onboarding: the Sealarca endpoint is fixed and cannot be changed by the user.
  * Dedicated collapsible drawer for thinking/reasoning model tokens.
  * Instant request abortion via `AbortController`.
* **Universal Multi-Document Parser (`js/doc-handler.js`)**:
  * Microsoft Word documents (`.docx`).
  * Microsoft Excel workbooks (`.xlsx`).
  * Microsoft PowerPoint presentations (`.pptx`).
  * LibreOffice / OpenDocument files (`.odt`, `.ods`).
  * PDF documents (`.pdf`), CSV tables, TXT, Markdown, JSON.
  * Local extraction and structured Markdown conversion on client machine before transmission.
  * File count, file size, PDF page, and extracted-text safety limits.
* **Secure Local Persistence (`js/db.js`)**:
  * IndexedDB storage (`sealarca_desk_db`) for full conversation history, messages, and settings.
  * API keys remain in browser session storage only and are not persisted in IndexedDB.
  * Zero server-side log or data retention.
* **Swiss Professional Personas & Roles**:
  * *Legal & Contract Law* (Clause auditing, CO/FADP Swiss compliance).
  * *Tax & Fiduciary Expert* (Balance sheet reviews, financial ratios).
  * *Compliance & Professional Secrecy* (KYC/AMLA due diligence).
  * *Executive Summary & Drafting* (Executive memos and board minutes).
* **Complete 5-Language Internationalization (`js/i18n.js`)**:
  * Full support for **French (`FR`)**, **German (`DE`)**, **Italian (`IT`)**, **English (`EN`)**, and **Spanish (`ES`)**.
  * Automatic OS/browser language detection with one-click switcher in the header.
  * Full translation of all UI strings, empty state prompt suggestions, and role personas.
* **Sealarca Design System**:
  * Official Sealarca color tokens (`--sealarca-paper`, `--sealarca-evergreen`, `--sealarca-ink`, `--sealarca-technical`).
  * Dynamic Light and Dark modes.
  * Clean Markdown rendering with code block headers and one-click copy buttons.
* **Quality Assurance**:
  * Local JavaScript syntax checks and Responses API regression tests.
  * Browser validation of first-run setup, theme switching, model discovery, and streaming output.

