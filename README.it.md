<div align="center">

# 🛡️ Sealarca-Desk

**Client Desktop & Web Locale Autonomo per il Gateway IA Svizzero [Sealarca](https://sealarca.ch)**  
*L'IA in una cassaforte digitale per dati altamente sensibili e regolamentati.*

[![License: PolyForm Perimeter 1.0.1](https://img.shields.io/badge/License-PolyForm%20Perimeter%201.0.1-087F68.svg)](LICENSE)
[![Release: v1.0.0](https://img.shields.io/badge/Release-v1.0.0-137A52.svg)](https://github.com/ScioNos/Sealarca-Desk/releases/tag/v1.0.0)
[![Zero-Install](https://img.shields.io/badge/Installazione-0%20Install-101820.svg)](#-guida-rapida)
[![Offline-Ready](https://img.shields.io/badge/Dipendenze-100%25%20Locale-137A52.svg)](#-architettura--riservatezza)

---

🌐 **Language / Langue / Sprache / Lingua / Idioma**  
[English 🇬🇧](README.md) · [Français 🇫🇷](README.fr.md) · [Deutsch 🇩🇪](README.de.md) · **Italiano** · [Español 🇪🇸](README.es.md)

---

</div>

## 📖 Panoramica

**Sealarca-Desk** è un'interfaccia di chat e analisi documentale progettata specificamente per i professionisti soggetti a segreto professionale e a rigorosi requisiti di conformità (**studi legali, notai, fiduciari e consulenti fiscali, banche e istituzioni finanziarie, sanità, compliance officer**).

L'applicazione viene eseguita **interamente nel browser locale del tuo computer**, non richiede server intermedi, non ha tracciatori esterni e si connette direttamente al tuo **Sealarca Vault** tramite le tue credenziali API.

---

## ✨ Caratteristiche Principali

* 🔒 **Riservatezza & Anonimato Assoluti**:
  * Nessuna telemetria, nessun server applicativo intermedio.
  * Cronologia delle conversazioni e documenti rimangono esclusivamente nel database locale (**IndexedDB**).
* 🔑 **Esperienza "Zero Configurazione"**:
  * Inserisci semplicemente la tua **Chiave API Sealarca**.
  * Rilevamento automatico e dinamico dei modelli disponibili nel Vault (`GET /v1/models`).
* 📄 **Parser Multi-Documento 100% Locale**:
  * Trascina qualsiasi documento di lavoro direttamente nell'interfaccia:
    * **Microsoft Office**: Word (`.docx`), Excel (`.xlsx`), PowerPoint (`.pptx`).
    * **LibreOffice / OpenDocument**: Testo (`.odt`), Fogli di calcolo (`.ods`).
    * **PDF & Testo**: Documenti PDF (`.pdf`), fogli CSV (`.csv`), Markdown e testo (`.txt`, `.md`, `.json`).
  * Estrazione di testo e tabelle convertita in Markdown strutturato **direttamente sul tuo computer** prima della trasmissione crittografata al Vault.
* 🧠 **Streaming in Tempo Reale & Ragionamento Profondo**:
  * Streaming fluido Server-Sent Events (SSE) con cassetto comprimibile dedicato per i token di ragionamento (*thinking mode*).
* ⚖️ **Profili Professionali Svizzeri Integrati (Personas)**:
  * *Giurista & Diritto Contrattuale* (Verifica clausole, analisi dei rischi, conformità CO/LPD svizzera).
  * *Esperto Fiscale & Fiduciario* (Bilanci, conti economici, indici finanziari).
  * *Compliance & Segreto Professionale* (Due diligence RDLA/CDB, verifiche normative).
  * *Sintesi Esecutiva & Redazione* (Note di sintesi dirigenziali e verbali).
* 🌐 **Internazionalizzazione Completa in 5 Lingue**:
  * Supporto per **Italiano (`IT`)**, **Français (`FR`)**, **Deutsch (`DE`)**, **English (`EN`)** e **Español (`ES`)**.
  * Rilevamento automatico della lingua di sistema e selettore rapido nell'intestazione.
* ⚡ **Nessuna Installazione / 100% Offline (Nessun CDN)**:
  * Non richiede `Node.js` né `npm`.
  * Tutte le librerie fornitore sono salvate localmente nella cartella `vendor/`.

---

## 🚀 Guida Rapida

### 1. Avvio dell'Applicazione
Fai doppio clic sul file **`index.html`** nel tuo esploratore di file.  
L'applicazione si aprirà immediatamente nel tuo browser web predefinito (Chrome, Edge, Safari, Firefox).

```text
Sealarca-Desk/
├── index.html       <─── Fai doppio clic qui per avviare!
```

### 2. Inserisci la tua Chiave API
1. Al primo avvio, la finestra di configurazione si aprirà automaticamente.
2. Inserisci la tua chiave API Sealarca (disponibile nella tua area clienti su [sealarca.ch](https://sealarca.ch)).
3. Clicca su **"Salva"**: i tuoi modelli del Vault verranno sincronizzati automaticamente.

---

## 🛠️ Architettura Tecnica

```text
Sealarca-Desk/
├── index.html               # Applicazione a pagina singola reattiva (Alpine.js)
├── css/
│   ├── theme.css            # Token di design ufficiali Sealarca & Dark mode
│   ├── layout.css           # Struttura Flexbox/Grid responsive
│   └── components.css       # Bolle di messaggio, Markdown, Blocchi di codice
├── vendor/                  # Dipendenze 100% locali (Zero CDN)
│   ├── alpine-csp.min.js    # Motore UI reattivo compatibile CSP
│   ├── marked.min.js        # Parser Markdown
│   ├── purify.min.js        # Protezione anti-XSS
│   ├── pdf.min.js           # Estrattore PDF locale
│   └── jszip.min.js         # Decompressore locale DOCX / XLSX / PPTX / ODF
├── js/
│   ├── i18n.js              # Dizionario in 5 lingue (FR, DE, IT, EN, ES)
│   ├── api.js               # Client API Sealarca Vault (Streaming SSE)
│   ├── db.js                # Livello di persistenza locale IndexedDB
│   ├── doc-handler.js       # Estrattore universale di documenti
│   └── app.js               # Store principale Alpine.js
└── images/                  # Risorse grafiche ufficiali Sealarca
```

---

## 🔒 Sicurezza & Privacy

1. **Content Security Policy (CSP)**: Blocca il caricamento di script esterni non autorizzati.
2. **Nessuna Telemetria**: Nessun cookie o strumento di analisi.
3. **Gateway Vault Crittografato**: Tutte le richieste verso `https://sealarca.ch/v1` vengono trasmesse tramite TLS sicuro direttamente alle enclave hardware isolate in Svizzera.

---

## 📄 Licenza

Questo progetto **source available** è distribuito con la **PolyForm Perimeter License 1.0.1**. Vedere [LICENSE](LICENSE). Non è presentato come software open source.

Copyright (c) 2026 **eyelo SA (ScioNos)** — Svizzera.


