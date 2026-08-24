<div align="center">

# 🛡️ Sealarca-Desk

**Eigenständiger Desktop- & Lokaler Web-Client für das Schweizer KI-Gateway [Sealarca](https://sealarca.ch)**  
*KI im digitalen Tresor für hochsensible und regulierte Daten.*

[![License: MIT](https://img.shields.io/badge/License-MIT-087F68.svg)](LICENSE)
[![Zero-Install](https://img.shields.io/badge/Installation-0%20Install-101820.svg)](#-schnellstart)
[![Offline-Ready](https://img.shields.io/badge/Abh%C3%A4ngigkeiten-100%25%20Lokal-137A52.svg)](#-architektur--vertraulichkeit)

---

🌐 **Language / Langue / Sprache / Lingua / Idioma**  
[English 🇬🇧](README.md) · [Français 🇫🇷](README.fr.md) · **Deutsch** · [Italiano 🇮🇹](README.it.md) · [Español 🇪🇸](README.es.md)

---

</div>

## 📖 Übersicht

**Sealarca-Desk** ist eine Chat- und Dokumentenanalyse-Oberfläche, die speziell für Berufsgeheimnisträger und streng regulierte Branchen entwickelt wurde (**Anwaltskanzleien, Notariate, Steuerberater & Treuhänder, Banken & Finanzinstitute, Gesundheitswesen, Compliance-Beauftragte**).

Die Anwendung läuft **vollständig im lokalen Browser Ihres Rechners**, benötigt keine Server-Infrastruktur, verzichtet auf externe Tracker und verbindet sich direkt mit Ihrem **Sealarca Vault** über Ihre API-Schlüssel.

---

## ✨ Hauptfunktionen

* 🔒 **Absolute Vertraulichkeit & Anonymität**:
  * Keine Telemetrie, kein zwischengeschalteter Server.
  * Chat-Verlauf und Dokumente verbleiben ausschließlich in Ihrer lokalen Browser-Datenbank (**IndexedDB**).
* 🔑 **Null-Konfigurations-Erlebnis**:
  * Geben Sie einfach Ihren **Sealarca API-Schlüssel** ein.
  * Automatische und dynamische Modellerkennung Ihres Vaults (`GET /v1/models`).
* 📄 **Universeller 100% lokaler Multi-Dokumenten-Parser**:
  * Ziehen Sie beliebige Geschäftsdokumente per Drag & Drop in die Oberfläche:
    * **Microsoft Office**: Word (`.docx`), Excel (`.xlsx`), PowerPoint (`.pptx`).
    * **LibreOffice / OpenDocument**: Text (`.odt`), Tabellen (`.ods`).
    * **PDF & Text**: PDF-Dokumente (`.pdf`), CSV-Tabellen (`.csv`), Markdown & Text (`.txt`, `.md`, `.json`).
  * Text- und Tabellenextraktion in strukturiertes Markdown erfolgt **direkt auf Ihrem Rechner** vor der verschlüsselten Übertragung in den Vault.
* 🧠 **Echtzeit-Streaming & Tiefenbegründung**:
  * Flüssiges Server-Sent Events (SSE) Streaming mit speziellem einklappbarem Bereich für Denk- und Begründungsprozesse (*Thinking Mode*).
* ⚖️ **Integrierte Schweizer Fachrollen (Personas)**:
  * *Recht & Vertragsrecht* (Klauselprüfung, Risikoanalyse, OR/DSG-Konformität).
  * *Steuer- & Treuhandexperte* (Bilanzen, Erfolgsrechnungen, Finanzkennzahlen).
  * *Compliance & Berufsgeheimnis* (GwG/VSB-Sorgfaltspflichten, regulatorische Prüfungen).
  * *Executive Summary & Redaktion* (Präzise Direktionsmemos und Protokolle).
* 🌐 **Vollständige 5-Sprachen-Unterstützung**:
  * Unterstützung für **Deutsch (`DE`)**, **Français (`FR`)**, **Italiano (`IT`)**, **English (`EN`)** und **Español (`ES`)**.
  * Automatische Erkennung der Systemsprache und Umschaltung mit einem Klick im Header.
* ⚡ **Null Installation / 100% Offline (Kein CDN)**:
  * Weder `Node.js` noch `npm` erforderlich.
  * Alle Bibliotheken sind lokal im Ordner `vendor/` gespeichert.

---

## 🚀 Schnellstart

### 1. Anwendung starten
Doppelklicken Sie einfach auf **`index.html`** in Ihrem Datei-Explorer.  
Die Anwendung öffnet sich sofort in Ihrem Standard-Webbrowser (Chrome, Edge, Safari, Firefox).

```text
Sealarca-Desk/
├── index.html       <─── Hier doppelklicken zum Starten!
```

### 2. API-Schlüssel eingeben
1. Beim ersten Start öffnet sich das Einstellungsfenster automatisch.
2. Geben Sie Ihren Sealarca API-Schlüssel ein (erhältlich in Ihrem Kundenportal auf [sealarca.ch](https://sealarca.ch)).
3. Klicken Sie auf **"Speichern"**: Ihre Vault-Modelle werden automatisch synchronisiert.

---

## 🛠️ Technische Architektur

```text
Sealarca-Desk/
├── index.html               # Reaktive Single-Page-Anwendung (Alpine.js)
├── css/
│   ├── theme.css            # Offizielle Sealarca Design-Tokens & Dark Mode
│   ├── layout.css           # Responsive Flexbox/Grid-Struktur
│   └── components.css       # Nachrichtenblasen, Markdown, Code-Blöcke
├── vendor/                  # 100% lokale Abhängigkeiten (Kein CDN)
│   ├── alpine-csp.min.js    # CSP-kompatibles reaktives UI-Framework
│   ├── marked.min.js        # Markdown-Parser
│   ├── purify.min.js        # XSS-Schutz
│   ├── pdf.min.js           # Lokaler PDF-Extraktor
│   └── jszip.min.js         # Lokale Dekomprimierung DOCX / XLSX / PPTX / ODF
├── js/
│   ├── i18n.js              # 5-Sprachen-Wörterbuch (FR, DE, IT, EN, ES)
│   ├── api.js               # Sealarca Vault API-Client (SSE-Streaming)
│   ├── db.js                # Lokale IndexedDB-Persistenz
│   ├── doc-handler.js       # Universeller Dokumenten-Extraktor
│   └── app.js               # Alpine.js Hauptanwendungs-Store
└── images/                  # Offizielle Sealarca Marken-Assets & Icons
```

---

## 🔒 Sicherheit & Datenschutz

1. **Content Security Policy (CSP)**: Verhindert das Nachladen externer, nicht autorisierter Skripte.
2. **Keine Telemetrie**: Keine Tracking-Pixel, Cookies oder Analyse-Tools.
3. **Verschlüsseltes Vault-Gateway**: Alle Anfragen an `https://sealarca.ch/v1` erfolgen über sicheres TLS direkt in isolierte Schweizer Hardware-Enklaven.

---

## 📄 Lizenz

Dieses Projekt ist unter der **MIT-Lizenz** lizenziert. Weitere Informationen finden Sie in der Datei [LICENSE](LICENSE).

Copyright (c) 2026 **eyelo SA (ScioNos)** — Schweiz.


