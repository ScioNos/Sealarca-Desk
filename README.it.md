<div align="center">

# 🛡️ Sealarca-Desk

Le schede v3 distinguono validità e copertura completa, parziale o sconosciuta. Le analisi con copertura parziale o sconosciuta restano parziali. Le vecchie estrazioni XLSX/ODT si possono riparare esplicitamente e localmente dall'originale: identità e storico conservati, scheda precedente obsoleta, nessuna chiamata IA automatica. La ricerca usa un worker locale e una cache, con fallback cooperativo e ritardo di 150 ms. Le richieste POST con esito di rete indeterminato richiedono un nuovo tentativo esplicito; solo le preparazioni non inviate riprendono automaticamente. IndexedDB rimane v6.

**Client browser locale autonomo per il gateway IA svizzero [Sealarca](https://sealarca.ch)**  
*Preparazione locale dei documenti, selezione esplicita del contesto e accesso diretto al Vault.*

[![Licenza: PolyForm Perimeter 1.0.1](https://img.shields.io/badge/Licenza-PolyForm%20Perimeter%201.0.1-087F68.svg)](LICENSE)
[![Versione: v1.2.0](https://img.shields.io/badge/Versione-v1.2.0-137A52.svg)](https://github.com/ScioNos/Sealarca-Desk/releases/tag/v1.2.0)

🌐 **Language / Langue / Sprache / Lingua / Idioma**  
[English 🇬🇧](README.md) · [Français 🇫🇷](README.fr.md) · [Deutsch 🇩🇪](README.de.md) · **Italiano** · [Español 🇪🇸](README.es.md)

</div>

## Panoramica

Sealarca-Desk è un’applicazione statica a pagina singola per chat e lavoro documentale con Sealarca Vault. L’interfaccia e tutte le librerie di runtime vengono caricate localmente; la scoperta dei modelli, le risposte chat e i profili documentali generati dall’IA richiedono una connessione all’endpoint API fisso `https://api.sealarca.ch/v1`.

Il runtime non usa backend applicativi intermedi, SDK di analisi o CDN.

## Funzionalità attuali

- **Cartelle/progetti** con più conversazioni e una libreria documentale riutilizzabile.
- **Cronologia locale delle conversazioni** con filtro dei titoli nella barra laterale.
- **Conservazione dei documenti in IndexedDB**: Blob originale, Markdown canonico, tipo MIME, estensione, dimensione, hash SHA-256 quando Web Crypto è disponibile, metadati di estrazione e mappa della provenienza.
- **Importazioni supportate**: `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.odt`, `.ods`, `.csv`, `.txt`, `.md`, `.json`, `.rtf`, `.log` e `.xml`.
- **Limiti documentali**: 20 MiB per file, 500.000 caratteri estratti, 100 pagine PDF, 100 diapositive PPTX, 100 righe per foglio di calcolo/CSV, 200 colonne al massimo e massimo 5 file per operazione di aggiunta. Gli archivi Office/ODF sono limitati a 100 MiB decompressi, 20 MiB per voce e 2.000 voci. I profili includono al massimo 120.000 caratteri e 100 fonti.
- **Limite del contesto chat**: 250.000 caratteri complessivi per istruzioni, cronologia e contesto documentale selezionato; le richieste più grandi vengono bloccate senza tagliare il contesto.
- **Modalità contesto manuale** per scegliere i documenti inviati con la richiesta successiva.
- **Modalità contesto automatica** che classifica localmente i documenti della cartella e invia estratti pertinenti e citabili da un massimo di 5 documenti.
- **Area documenti** con ricerca full-text locale, anteprima del Markdown canonico, riferimenti alle fonti, download del file originale, panoramica della cartella ed esportazione della panoramica in `index.md`.
- **Analisi della cartella** dai profili locali aggiornati: sintesi, cronologia, parti, obblighi, importi, confronti e differenze apparenti. I risultati rimandano alle fonti e vanno verificati. Queste azioni non inviano contenuti documentali; la generazione del profilo resta esplicita per ogni documento.
- **Registro delle operazioni e tracce** con passaggi, avvisi, annullamento/riprova ove possibile e riferimenti alle fonti per le risposte chat e le analisi locali. La modalità contesto può essere configurata per cartella.
- **Profili documentali generati dall’IA** (sintesi, persone, organizzazioni, date ed elementi importanti), elaborati da una coda persistente a due worker con retry, annullamento, deduplicazione e ripresa dopo un’interruzione. La generazione invia il Markdown del documento al modello Sealarca selezionato.
- **Integrazione Responses API**: scoperta dinamica tramite `GET /v1/models`; richieste streaming e non streaming tramite `POST /v1/responses`, con `store: false`, timeout scorrevole di 120 secondi, backoff HTTP e annullamento per chat più profili.
- **Output in streaming** con pannello di ragionamento quando il gateway emette gli eventi di riepilogo del ragionamento supportati.
- **Cinque modalità di lavoro**: Analisi documentale, Sintesi e redazione, Diritto e contratti, Fiscale e fiduciario, Conformità e riservatezza.
- **Cinque lingue dell’interfaccia**: francese, tedesco, italiano, inglese e spagnolo.
- **Temi chiaro/scuro**, CSP rigorosa, rendering Markdown sanificato e dipendenze locali.

## Modello dati e rete

- La chiave API resta in `sessionStorage` per la scheda/sessione corrente e viene rimossa dal precedente archivio IndexedDB durante la migrazione.
- Conversazioni, messaggi, cartelle, documenti, profili, job di elaborazione, operazioni, tracce di metadati, ruoli, lingua, modello e preferenze UI sono memorizzati localmente in IndexedDB. Il tema è in `localStorage`. L’esportazione `6.0` include operazioni e tracce, che conservano riferimenti e conteggi, non il testo dei documenti.
- Le richieste chat inviano la cronologia testuale e soltanto i documenti scelti manualmente o gli estratti selezionati automaticamente.
- I job di profilazione inviano il Markdown del documento interessato al modello Sealarca selezionato.
- Le chiamate API dell’applicazione puntano a `https://api.sealarca.ch/v1`. La CSP consente anche origini locali di sviluppo su `localhost` e `127.0.0.1`.
- “Locale” e “senza CDN” descrivono caricamento, analisi, indicizzazione e archiviazione; le operazioni IA non funzionano offline.

## Avvio rapido

1. Scarica ed estrai l’archivio della release.
2. Apri `Sealarca-Desk/index.html` in un browser moderno.
3. Inserisci una chiave API Sealarca. Se non esiste una chiave di sessione, la finestra di configurazione si apre automaticamente.
4. Seleziona un modello rilevato, crea o scegli una cartella, quindi avvia una conversazione o aggiungi documenti.

L’API Sealarca deve accettare richieste da una pagina locale `file://`. Se una regola del browser o dell’organizzazione blocca questa origine, servi la cartella tramite un server statico locale approvato senza modificare l’endpoint API.

## Architettura

```text
Sealarca-Desk/
├── index.html                 # Interfaccia Alpine.js e CSP
├── css/                       # Temi, layout e componenti
├── images/                    # Loghi e bandiere locali
├── js/
│   ├── boot-theme.js          # Applica il tema prima del rendering
│   ├── i18n.js                # Dizionari per cinque lingue
│   ├── db.js                  # Schema IndexedDB v6 e persistenza
│   ├── doc-handler.js         # Estrazione locale, Markdown, provenienza
│   ├── api.js                 # Client fisso Sealarca Responses API
│   ├── p1.js                  # Ricerca, profili, citazioni e coda persistente
│   ├── operations.js          # Ciclo di vita delle operazioni e tracce
│   ├── timeline.js            # Cronologia e confronti locali
│   └── app.js                 # Stato Alpine.js e flussi applicativi
├── vendor/                    # Alpine CSP, JSZip, Marked, DOMPurify, PDF.js
├── tests/                     # Test Node.js
└── scripts/build-release.ps1  # Creazione ZIP e SHA-256
```

## Sviluppo e verifica

Node.js non è necessario per eseguire l’applicazione distribuita, ma serve per i controlli del repository:

```bash
npm test
npm run check
```

Per creare gli artefatti della release in PowerShell:

```powershell
npm run release:build
```

## Licenza

Questo progetto **source available** è distribuito con **PolyForm Perimeter License 1.0.1**. Vedi [LICENSE](LICENSE). Non viene presentato come software open source.

Copyright (c) 2026 **eyelo SA (ScioNos)** — Svizzera.
