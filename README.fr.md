<div align="center">

# 🛡️ Sealarca-Desk

**Client navigateur local autonome pour la passerelle IA suisse [Sealarca](https://sealarca.ch)**  
*Préparation documentaire locale, sélection explicite du contexte et accès direct au Vault.*

[![Licence : PolyForm Perimeter 1.0.1](https://img.shields.io/badge/Licence-PolyForm%20Perimeter%201.0.1-087F68.svg)](LICENSE)
[![Version : v1.0.2](https://img.shields.io/badge/Version-v1.0.2-137A52.svg)](https://github.com/ScioNos/Sealarca-Desk/releases/tag/v1.0.2)

🌐 **Language / Langue / Sprache / Lingua / Idioma**  
[English 🇬🇧](README.md) · **Français** · [Deutsch 🇩🇪](README.de.md) · [Italiano 🇮🇹](README.it.md) · [Español 🇪🇸](README.es.md)

</div>

## Présentation

Sealarca-Desk est une application statique monopage de discussion et de travail documentaire avec Sealarca Vault. L’interface et toutes les bibliothèques d’exécution sont chargées localement ; la découverte des modèles, les réponses de chat et la génération des fiches documentaires nécessitent une connexion au point d’API fixe `https://sealarca.ch/v1`.

Le programme n’utilise ni serveur applicatif intermédiaire, ni SDK analytique, ni CDN à l’exécution.

## Fonctionnalités actuelles

- **Dossiers/projets** regroupant plusieurs conversations et une bibliothèque documentaire réutilisable.
- **Historique local des conversations** avec filtrage des titres dans la barre latérale.
- **Conservation des documents** dans IndexedDB : Blob original, Markdown canonique, type MIME, extension, taille, empreinte SHA-256 lorsque Web Crypto est disponible, métadonnées d’extraction et carte de provenance.
- **Formats importés** : `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.odt`, `.ods`, `.csv`, `.txt`, `.md`, `.json`, `.rtf`, `.log` et `.xml`.
- **Limites documentaires** : 20 Mio par fichier, 500 000 caractères extraits, 100 pages PDF, 100 lignes par feuille de calcul/CSV et 5 fichiers au maximum par ajout.
- **Mode de contexte manuel** pour choisir les documents envoyés avec la prochaine requête.
- **Mode de contexte automatique** qui classe localement les documents du dossier et transmet des extraits pertinents et citables provenant de 5 documents au maximum.
- **Espace documentaire** avec recherche plein texte locale, aperçu du Markdown canonique, références de source, téléchargement du fichier original, vue d’ensemble du dossier et export de cette vue en `index.md`.
- **Fiches documentaires générées par IA** (résumé, personnes, organisations, dates et éléments importants) traitées par une file persistante de deux workers avec reprise, annulation, déduplication et récupération après interruption. La génération d’une fiche envoie le Markdown du document au modèle Sealarca sélectionné.
- **Intégration Responses API** : découverte dynamique via `GET /v1/models` ; requêtes streaming et non-streaming via `POST /v1/responses`, avec `store: false`, délai maximal, reprises HTTP et annulation.
- **Réponse en streaming** avec tiroir de raisonnement lorsque la passerelle émet les événements de résumé de raisonnement pris en charge.
- **Cinq modes de travail** : Analyse documentaire, Synthèse & Rédaction, Juridique & Contrats, Fiscal & Fiduciaire, Conformité & Confidentialité.
- **Cinq langues d’interface** : français, allemand, italien, anglais et espagnol.
- **Thèmes clair/sombre**, CSP stricte, rendu Markdown assaini et dépendances locales.

## Modèle de données et réseau

- La clé API est conservée dans `sessionStorage` pour l’onglet/la session du navigateur et supprimée de l’ancien stockage IndexedDB lors de la migration.
- Conversations, messages, dossiers, documents, fiches, jobs de traitement, rôles, langue, modèle choisi et préférences UI sont stockés localement dans IndexedDB. Le thème est stocké dans `localStorage`.
- Les requêtes de chat transmettent l’historique textuel ainsi que les seuls documents choisis manuellement ou extraits sélectionnés automatiquement.
- Les jobs de fiche transmettent le Markdown du document concerné au modèle Sealarca sélectionné.
- Les appels API applicatifs ciblent `https://sealarca.ch/v1`. La CSP autorise aussi les origines locales de développement sur `localhost` et `127.0.0.1`.
- « Local » et « sans CDN » décrivent le chargement, l’analyse, l’indexation et le stockage ; les opérations IA ne fonctionnent pas hors connexion.

## Démarrage rapide

1. Téléchargez et extrayez l’archive de version.
2. Ouvrez `Sealarca-Desk/index.html` dans un navigateur moderne.
3. Saisissez une clé API Sealarca. La fenêtre de configuration s’ouvre automatiquement lorsqu’aucune clé de session n’est disponible.
4. Choisissez un modèle découvert, créez ou sélectionnez un dossier, puis démarrez une conversation ou ajoutez des documents.

L’API Sealarca doit accepter les requêtes provenant d’une page locale `file://`. Si une politique du navigateur ou de l’organisation bloque cette origine, servez le dossier depuis un serveur statique local autorisé sans modifier le point d’API.

## Architecture

```text
Sealarca-Desk/
├── index.html                 # Interface Alpine.js et CSP
├── css/                       # Thèmes, mise en page et composants
├── images/                    # Logos et drapeaux locaux
├── js/
│   ├── boot-theme.js          # Applique le thème avant le rendu
│   ├── i18n.js                # Dictionnaires pour cinq langues
│   ├── db.js                  # Schéma IndexedDB v4 et persistance
│   ├── doc-handler.js         # Extraction locale, Markdown, provenance
│   ├── api.js                 # Client Responses API Sealarca fixe
│   ├── p1.js                  # Recherche, fiches, citations et file persistante
│   └── app.js                 # État Alpine.js et parcours applicatifs
├── vendor/                    # Alpine CSP, JSZip, Marked, DOMPurify, PDF.js
├── tests/                     # Tests Node.js
└── scripts/build-release.ps1  # Construction ZIP et SHA-256
```

## Développement et vérification

Node.js n’est pas requis pour exécuter la version distribuée. Il est requis pour vérifier le dépôt :

```bash
npm test
npm run check
```

Construction des artefacts de version sous PowerShell :

```powershell
npm run release:build
```

## Licence

Ce projet **source available** est distribué sous **PolyForm Perimeter License 1.0.1**. Consultez [LICENSE](LICENSE). Il n’est pas présenté comme logiciel open source.

Copyright (c) 2026 **eyelo SA (ScioNos)** — Suisse.
