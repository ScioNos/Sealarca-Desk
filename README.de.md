<div align="center">

# 🛡️ Sealarca-Desk

**Eigenständiger lokaler Browser-Client für das Schweizer KI-Gateway [Sealarca](https://sealarca.ch)**  
*Lokale Dokumentaufbereitung, explizite Kontextauswahl und direkter Vault-Zugriff.*

[![Lizenz: PolyForm Perimeter 1.0.1](https://img.shields.io/badge/Lizenz-PolyForm%20Perimeter%201.0.1-087F68.svg)](LICENSE)
[![Version: v1.1.0](https://img.shields.io/badge/Version-v1.1.0-137A52.svg)](https://github.com/ScioNos/Sealarca-Desk/releases/tag/v1.1.0)

🌐 **Language / Langue / Sprache / Lingua / Idioma**  
[English 🇬🇧](README.md) · [Français 🇫🇷](README.fr.md) · **Deutsch** · [Italiano 🇮🇹](README.it.md) · [Español 🇪🇸](README.es.md)

</div>

## Überblick

Sealarca-Desk ist eine statische Single-Page-Anwendung für Chats und dokumentgestützte Arbeit mit Sealarca Vault. Oberfläche und Laufzeitbibliotheken werden lokal geladen; Modellabfrage, Chat-Antworten und KI-generierte Dokumentprofile benötigen eine Netzwerkverbindung zum festen API-Endpunkt `https://api.sealarca.ch/v1`.

Zur Laufzeit werden weder ein zwischengeschaltetes Anwendungs-Backend noch Analyse-SDKs oder ein CDN verwendet.

## Aktuelle Funktionen

- **Ordner/Projekte** mit mehreren Unterhaltungen und einer wiederverwendbaren Dokumentbibliothek.
- **Lokaler Gesprächsverlauf** mit Titelfilter in der Seitenleiste.
- **Dokumentablage in IndexedDB**: Original-Blob, kanonisches Markdown, MIME-Typ, Erweiterung, Größe, SHA-256-Hash (wenn Web Crypto verfügbar ist), Extraktionsmetadaten und Herkunftskarte.
- **Unterstützte Importe**: `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.odt`, `.ods`, `.csv`, `.txt`, `.md`, `.json`, `.rtf`, `.log` und `.xml`.
- **Dokumentgrenzen**: 20 MiB pro Datei, 500.000 extrahierte Zeichen, 100 PDF-Seiten, 100 PPTX-Folien, 100 Zeilen pro Tabellen-/CSV-Blatt, maximal 200 Spalten und höchstens 5 Dateien pro Hinzufügen-Vorgang. Office-/ODF-Archive sind auf 100 MiB entpackte Daten, 20 MiB pro Eintrag und 2.000 Einträge begrenzt. Profile umfassen höchstens 120.000 Zeichen und 100 Quellen.
- **Chat-Kontextgrenze**: insgesamt 250.000 Zeichen für Anweisungen, Gesprächsverlauf und ausgewählten Dokumentkontext; größere Anfragen werden ohne Kürzung blockiert.
- **Manueller Kontextmodus** zur Auswahl der Dokumente für die nächste Anfrage.
- **Automatischer Kontextmodus**, der Ordnerdokumente lokal bewertet und relevante, zitierfähige Auszüge aus höchstens 5 Dokumenten sendet.
- **Dokumentarbeitsbereich** mit lokaler Volltextsuche, Markdown-Vorschau, Quellenangaben, Download der Originaldatei, Ordnerübersicht und Export der Übersicht als `index.md`.
- **KI-generierte Dokumentprofile** (Zusammenfassung, Personen, Organisationen, Daten und wichtige Punkte) über eine persistente Queue mit zwei Workern, Wiederholung, Abbruch, Deduplizierung und Wiederaufnahme nach Unterbrechung. Dafür wird das Dokument-Markdown an das gewählte Sealarca-Modell gesendet.
- **Responses-API-Integration**: dynamische Modellabfrage über `GET /v1/models`; Streaming- und Nicht-Streaming-Anfragen über `POST /v1/responses` mit `store: false`, gleitendem 120-Sekunden-Timeout, HTTP-Backoff und Abbruch für Chat plus Profile.
- **Streaming-Ausgabe** mit Reasoning-Bereich, wenn das Gateway unterstützte Reasoning-Summary-Ereignisse liefert.
- **Fünf Arbeitsmodi**: Dokumentenanalyse, Zusammenfassung & Redaktion, Recht & Verträge, Steuern & Treuhand sowie Compliance & Vertraulichkeit.
- **Fünf Oberflächensprachen**: Französisch, Deutsch, Italienisch, Englisch und Spanisch.
- **Helles/dunkles Design**, strikte CSP, bereinigte Markdown-Ausgabe und lokale Abhängigkeiten.

## Daten- und Netzwerkmodell

- Der API-Schlüssel bleibt für den aktuellen Browser-Tab/die aktuelle Sitzung in `sessionStorage` und wird bei der Migration aus dem früheren IndexedDB-Speicher entfernt.
- Unterhaltungen, Nachrichten, Ordner, Dokumente, Profile, Verarbeitungsjobs, Rollen, Sprache, Modellwahl und UI-Einstellungen liegen lokal in IndexedDB. Das Design liegt in `localStorage`.
- Chat-Anfragen senden den Textverlauf sowie nur manuell gewählte Dokumente oder automatisch gewählte Auszüge.
- Profiljobs senden das Markdown des betreffenden Dokuments an das gewählte Sealarca-Modell.
- Anwendungs-API-Aufrufe richten sich an `https://api.sealarca.ch/v1`. Die CSP erlaubt zusätzlich lokale Entwicklungsursprünge auf `localhost` und `127.0.0.1`.
- „Lokal“ und „ohne CDN“ beziehen sich auf Laden, Analyse, Indexierung und Speicherung; KI-Funktionen arbeiten nicht offline.

## Schnellstart

1. Release-Archiv herunterladen und entpacken.
2. `Sealarca-Desk/index.html` in einem modernen Browser öffnen.
3. Einen Sealarca-API-Schlüssel eingeben. Ohne Sitzungsschlüssel öffnet sich der Konfigurationsdialog automatisch.
4. Ein gefundenes Modell wählen, einen Ordner erstellen oder öffnen und danach chatten oder Dokumente hinzufügen.

Die Sealarca-API muss Anfragen von einer lokalen `file://`-Seite zulassen. Blockiert eine Browser- oder Organisationsrichtlinie diesen Ursprung, kann das Verzeichnis über einen genehmigten lokalen statischen Server bereitgestellt werden, ohne den API-Endpunkt zu ändern.

## Architektur

```text
Sealarca-Desk/
├── index.html                 # Alpine.js-Oberfläche und CSP
├── css/                       # Designs, Layout und Komponenten
├── images/                    # Lokale Logos und Sprachflaggen
├── js/
│   ├── boot-theme.js          # Wendet das Design vor dem Rendern an
│   ├── i18n.js                # Wörterbücher für fünf Sprachen
│   ├── db.js                  # IndexedDB-Schema v5 und Persistenz
│   ├── doc-handler.js         # Lokale Extraktion, Markdown, Herkunft
│   ├── api.js                 # Fester Sealarca-Responses-API-Client
│   ├── p1.js                  # Suche, Profile, Zitate und persistente Queue
│   └── app.js                 # Alpine.js-Zustand und Abläufe
├── vendor/                    # Alpine CSP, JSZip, Marked, DOMPurify, PDF.js
├── tests/                     # Node.js-Tests
└── scripts/build-release.ps1  # ZIP- und SHA-256-Erstellung
```

## Entwicklung und Prüfung

Node.js wird für die veröffentlichte Anwendung nicht benötigt, wohl aber für die Repository-Prüfungen:

```bash
npm test
npm run check
```

Release-Artefakte unter PowerShell erstellen:

```powershell
npm run release:build
```

## Lizenz

Dieses **source-available** Projekt steht unter der **PolyForm Perimeter License 1.0.1**. Siehe [LICENSE](LICENSE). Es wird nicht als Open-Source-Software bezeichnet.

Copyright (c) 2026 **eyelo SA (ScioNos)** — Schweiz.
