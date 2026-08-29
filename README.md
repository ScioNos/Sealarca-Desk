<div align="center">

# 🛡️ Sealarca-Desk

**Self-contained Desktop & Local Web Client for the Swiss AI Gateway [Sealarca](https://sealarca.ch)**  
*AI in a digital vault for highly sensitive and regulated data.*

[![License: PolyForm Perimeter 1.0.1](https://img.shields.io/badge/License-PolyForm%20Perimeter%201.0.1-087F68.svg)](LICENSE)
[![Release: v1.0.0](https://img.shields.io/badge/Release-v1.0.0-137A52.svg)](https://github.com/ScioNos/Sealarca-Desk/releases/tag/v1.0.0)
[![Zero-Install](https://img.shields.io/badge/Installation-0%20Install-101820.svg)](#-quick-start)
[![Offline-Ready](https://img.shields.io/badge/Dependencies-100%25%20Local-137A52.svg)](#-architecture--confidentiality)

---

🌐 **Language / Langue / Sprache / Lingua / Idioma**  
**English** · [Français 🇫🇷](README.fr.md) · [Deutsch 🇩🇪](README.de.md) · [Italiano 🇮🇹](README.it.md) · [Español 🇪🇸](README.es.md)

---

</div>

## 📖 Overview

**Sealarca-Desk** is a dedicated chat and document analysis interface built specifically for professionals governed by strict professional secrecy and compliance regulations (**law firms, notaries, tax & fiduciary advisors, banking & financial institutions, healthcare providers, compliance officers**).

The application runs **entirely in your local browser**, requires zero server infrastructure, has no external trackers, and connects directly to your **Sealarca Vault** using your official API credentials.

---

## ✨ Key Features

* 🗂️ **Persistent folders and document library**: multiple conversations and reusable Markdown documents per folder, with source provenance and explicit per-request AI context selection.

* 🔒 **Absolute Confidentiality & Anonymity**:
  * Zero telemetry, no intermediary backend, no third-party tracking.
  * Chat history and document data remain strictly on your local machine (**IndexedDB**).
* 🔑 **Zero Configuration Experience**:
  * Simply enter your **Sealarca API Key**.
  * Dynamic auto-discovery of available Vault models (`GET /v1/models`).
* 📄 **Universal 100% Local Multi-Document Parser**:
  * Drag & drop any business document directly into the interface:
    * **Microsoft Office**: Word (`.docx`), Excel (`.xlsx`), PowerPoint (`.pptx`).
    * **LibreOffice / OpenDocument**: Text (`.odt`), Spreadsheets (`.ods`).
    * **PDF & Text**: PDF files (`.pdf`), CSV spreadsheets (`.csv`), Markdown & raw text (`.txt`, `.md`, `.json`).
  * Text and table extraction converted into structured Markdown **locally on your machine** before encrypted transmission to the Vault.
* 🧠 **Real-Time Streaming & Deep Reasoning**:
  * Real-time Server-Sent Events (SSE) streaming with a dedicated collapsible drawer for thinking/reasoning model tokens.
* ⚖️ **Built-In Swiss Professional Roles (Personas)**:
  * *Legal & Contract Law* (Clause auditing, risk assessment, CO/FADP Swiss compliance).
  * *Tax & Fiduciary Expert* (Balance sheet reviews, financial ratios, P&L statements).
  * *Compliance & Professional Secrecy* (KYC/AMLA due diligence, regulatory compliance).
  * *Executive Summary & Drafting* (Executive briefing memos, board minutes, official correspondence).
* 🌐 **Full 5-Language Internationalization**:
  * Instant support for **English (`EN`)**, **French (`FR`)**, **German (`DE`)**, **Italian (`IT`)**, and **Spanish (`ES`)**.
  * Automatic system language detection and one-click switcher in the header.
* ⚡ **Zero Installation / 100% Offline (No CDN)**:
  * No `Node.js` or `npm` required.
  * All vendor libraries are stored locally in the `vendor/` folder.

---

## 🚀 Quick Start

### 1. Launching the Application
Double-click on **`index.html`** in your file explorer.  
The application will open instantly in your default web browser (Chrome, Edge, Safari, Firefox).

```text
Sealarca-Desk/
├── index.html       <─── Double-click here to launch!
```

### 2. Enter your API Key
1. On first launch, the configuration window will open automatically.
2. Enter your Sealarca API Key (available on your client portal at [sealarca.ch](https://sealarca.ch)).
3. Click **"Save"**: your Vault models will synchronize automatically.

---

## 🛠️ Technical Architecture

```text
Sealarca-Desk/
├── index.html               # Reactive single-page application (Alpine.js)
├── css/
│   ├── theme.css            # Official Sealarca semantic design tokens & Dark mode
│   ├── layout.css           # Responsive Flexbox/Grid structure (Sidebar, Chat, Modals)
│   └── components.css       # Message bubbles, Markdown typography, Code blocks, Reasoning drawer
├── vendor/                  # 100% local vendor dependencies (Zero CDN)
│   ├── alpine-csp.min.js    # CSP-compatible reactive UI engine
│   ├── marked.min.js        # Markdown parser
│   ├── purify.min.js        # XSS sanitizer
│   ├── pdf.min.js           # Local PDF extractor
│   └── jszip.min.js         # Local DOCX / XLSX / PPTX / ODF decompressor
├── js/
│   ├── i18n.js              # 5-Language dictionary (FR, DE, IT, EN, ES)
│   ├── api.js               # Sealarca Vault API client (Auto-discovery + SSE streaming)
│   ├── db.js                # IndexedDB folders, documents, conversations and migrations
│   ├── doc-handler.js       # Universal local document extractor
│   └── app.js               # Root Alpine.js application store
└── images/                  # Official Sealarca brand assets & provider icons
```

---

## 🔒 Security & Privacy

1. **Content Security Policy (CSP)**: Enforces strict rules preventing any unauthorized external scripts from loading.
2. **Zero Telemetry**: No tracking pixels, cookies, or external analytics scripts.
3. **Encrypted Vault Gateway**: All requests to `https://sealarca.ch/v1` are securely transmitted via TLS directly to Sealarca's isolated Swiss hardware enclaves.

---

## 📄 License

This source-available project is licensed under the **PolyForm Perimeter License 1.0.1**. See [LICENSE](LICENSE). It is not presented as open-source software.

Copyright (c) 2026 **eyelo SA (ScioNos)** — Switzerland.

