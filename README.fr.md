<div align="center">

# 🛡️ Sealarca-Desk

**Client de bureau & web local autonome pour la passerelle IA suisse [Sealarca](https://sealarca.ch)**  
*L'IA dans un coffre-fort numérique pour les données hautement sensibles.*

[![License: MIT](https://img.shields.io/badge/License-MIT-087F68.svg)](LICENSE)
[![Zero-Install](https://img.shields.io/badge/Installation-0%20Install-101820.svg)](#-démarrage-rapide)
[![Offline-Ready](https://img.shields.io/badge/Dépendances-100%25%20Local-137A52.svg)](#-architecture--confidentialité)

---

🌐 **Language / Langue / Sprache / Lingua / Idioma**  
[English 🇬🇧](README.md) · **Français** · [Deutsch 🇩🇪](README.de.md) · [Italiano 🇮🇹](README.it.md) · [Español 🇪🇸](README.es.md)

---

</div>

## 📖 Présentation

**Sealarca-Desk** est une interface de discussion et d'analyse documentaire conçue pour les professionnels soumis au secret professionnel et aux exigences de conformité les plus strictes (**avocats, notaires, fiduciaires, banques, professionnels de santé, compliance**).

L'application s'exécute **intégralement dans le navigateur de votre machine locale**, sans nécessiter de serveur applicatif tiers, et se connecte directement au **Vault Sealarca** via vos propres identifiants API.

---

## ✨ Points Forts & Fonctionnalités

* 🔒 **Confidentialité & Anonymat total** :
  * Aucune télémétrie, aucun serveur intermédiaire.
  * Historique des conversations et documents stockés exclusivement dans votre base locale (**IndexedDB**).
* 🔑 **Expérience "Zéro Configuration"** :
  * Renseignez uniquement votre **clé API Sealarca**.
  * Découverte automatique des modèles du Vault (`GET /v1/models`).
* 📄 **Analyse Multi-Documents 100% Locale** :
  * Glissez-déposez n'importe quel document professionnel dans l'interface :
    * **Microsoft Office** : Word (`.docx`), Excel (`.xlsx`), PowerPoint (`.pptx`).
    * **LibreOffice / OpenDocument** : Texte (`.odt`), Tableurs (`.ods`).
    * **PDF & Texte** : Documents PDF (`.pdf`), classeurs CSV (`.csv`), fichiers texte et Markdown (`.txt`, `.md`, `.json`).
  * Extraction et conversion structurée en Markdown effectuées **directement sur votre poste** avant transmission chiffrée au Vault.
* 🧠 **Streaming & Raisonnement en Temps Réel** :
  * Affichage fluide au fil de l'eau avec tiroir de réflexion dédié pour les modèles avec tokens de raisonnement (*thinking mode*).
* ⚖️ **Rôles & Personas Métiers Intégrés** :
  * *Juriste & Droit des Contrats* (Audit de clauses, détection de risques et conformité CO/LPD).
  * *Expert Fiscal & Fiduciaire* (Analyse de bilans, comptes de résultat et ratios).
  * *Conformité & Secret Professionnel* (Vérification LBA, CDB, diligence raisonnable).
  * *Synthèse Exécutive & Rédaction* (Notes de synthèse et courriers officiels).
* 🌐 **Internationalisation Complète (5 Langues)** :
  * Support de **Français (`FR`)**, **Deutsch (`DE`)**, **Italiano (`IT`)**, **English (`EN`)**, et **Español (`ES`)**.
  * Détection automatique de la langue du système et sélecteur instantané dans l'en-tête.
* ⚡ **Zéro Installation / Zéro CDN** :
  * Aucune installation de `Node.js` ou `npm` requise.
  * 100% des librairies sont stockées localement dans le dossier `vendor/`.

---

## 🚀 Démarrage Rapide

### 1. Ouverture de l'application
Double-cliquez simplement sur le fichier **`index.html`** dans votre explorateur de fichiers.  
L'application s'ouvre instantanément dans votre navigateur par défaut (Chrome, Edge, Safari, Firefox).

```text
Sealarca-Desk/
├── index.html       <─── Double-cliquez ici pour lancer !
```

### 2. Saisie de votre clé API
1. Lors du premier lancement, la fenêtre de configuration s'ouvre automatiquement.
2. Saisissez votre clé API Sealarca (obtenue sur votre espace client [sealarca.ch](https://sealarca.ch)).
3. Cliquez sur **« Enregistrer »** : vos modèles du Vault se synchronisent automatiquement.

---

## 🛠️ Architecture Technique

```text
Sealarca-Desk/
├── index.html               # Page unique d'accueil réactive (Alpine.js)
├── css/
│   ├── theme.css            # Charte graphique officielle Sealarca & Dark mode
│   ├── layout.css           # Structure Flexbox/Grid (Sidebar, Chat, Modales)
│   └── components.css       # Bulles, Markdown, Blocs de code, Raisonnement
├── vendor/                  # 100% autonome en local (aucun appel CDN)
│   ├── alpine-csp.min.js    # Moteur réactif UI compatible CSP
│   ├── marked.min.js        # Parseur Markdown
│   ├── purify.min.js        # Sécurité anti-XSS
│   ├── pdf.min.js           # Lecteur PDF local
│   └── jszip.min.js         # Décompression locale DOCX / XLSX / PPTX / ODF
├── js/
│   ├── i18n.js              # Dictionnaire 5 langues (FR, DE, IT, EN, ES)
│   ├── api.js               # Client API Sealarca (Auto-découverte + Streaming SSE)
│   ├── db.js                # Gestionnaire IndexedDB local
│   ├── doc-handler.js       # Extracteur universel de documents
│   └── app.js               # Composant racine Alpine.js
└── images/                  # Identité visuelle officielle Sealarca
```

---

## 🔒 Sécurité & Confidentialité

1. **Content Security Policy (CSP)** : L'application applique une politique de sécurité stricte interdisant le chargement de scripts externes non contrôlés.
2. **Pas de télémétrie** : Aucun traceur, cookie publicitaire ou outil de mesure d'audience n'est présent dans le code.
3. **Chiffrement Vault** : Toutes les requêtes vers `https://sealarca.ch/v1` transitent via TLS sécurisé vers l'enclave confinée de Sealarca en Suisse.

---

## 📄 Licence

Ce projet est distribué sous licence **MIT**. Consultez le fichier [LICENSE](LICENSE) pour plus d'informations.

Copyright (c) 2026 **eyelo SA (ScioNos)** — Suisse.


