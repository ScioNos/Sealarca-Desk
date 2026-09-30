/**
 * Sealarca-Desk — Dictionnaire Internationalisation (i18n)
 * Support complet : Français (FR), Deutsch (DE), Italiano (IT), English (EN), Español (ES)
 * Aligné avec le vocabulaire officiel de sealarca.ch
 */

const SEALARCA_I18N = {
    // --- 🇫🇷 Français ---
    fr: {
        extraction: {"tooLarge": "Le tableau extrait dépasse la limite de 500 000 caractères.", "rows": "{sheet} : seules les {used} premières lignes sur {total} ont été extraites.", "columns": "{sheet} : colonnes limitées à {used} (contenu tronqué).", "slides": "Seules les {used} premières diapositives sur {total} ont été extraites.", "missing_sheet": "Feuille manquante : {sheet}.", "csv_parse": "CSV : {detail}.", "pdf_pages": "Pages sans texte exploitable : {pages}. Aucun OCR intégré ; ces pages ne sont pas transmises comme texte.", "noText": "Ce PDF ne contient aucun texte exploitable. Desk ne fait pas d’OCR. Utilisez une copie avec couche texte."},
        app: {
            name: 'Sealarca',
            desk: 'Desk',
            newChat: 'Nouvelle consultation',
            searchPlaceholder: 'Rechercher...',
            noConversations: 'Aucune consultation enregistrée',
            apiKey: 'Clé API',
            edit: 'Modifier',
            model: 'Modèle · moteur IA',
            modelHint: 'Choisissez un modèle pour commencer. Vous pourrez le changer à tout moment.',
            roleHint: 'Façon de travailler adaptée à votre tâche.',
            close: 'Fermer',
            themeDark: 'Activer le thème sombre',
            themeLight: 'Activer le thème clair',
            roles: 'Modes de travail',
            vaultStatus: 'VAULT · SERVICE SEALARCA',
            connecting: 'Connexion à Sealarca...',
            copy: 'Copier',
            copied: 'Copié !',
            delete: 'Supprimer',
            deleteConfirm: 'Voulez-vous supprimer cette consultation ?',
            contextTooLarge: 'Le contexte dépasse la limite de 250 000 caractères. Réduisez l’historique ou désélectionnez des documents avant de réessayer.',
            streamInterrupted: 'Réponse interrompue — vérifiez le contenu partiel avant de l’utiliser.',
            you: 'Vous'
        },
        folders: { title: 'Dossiers', new: 'Nouveau dossier', none: 'Aucun dossier', defaultName: 'Nouveau dossier', namePrompt: 'Nom du dossier :', descriptionPrompt: 'Description du dossier :', tagsPrompt: 'Étiquettes séparées par des virgules :', deleteConfirm: 'Supprimer ce dossier, ses conversations et ses documents ?', keepOne: 'Au moins un dossier doit être conservé.' },
        documents: { title: 'Bibliothèque', add: 'Ajouter des documents', close: 'Terminé', empty: 'Aucun document dans ce dossier.', selectionHint: 'Sélectionnez les documents à utiliser uniquement pour la prochaine demande.', preview: 'Consulter', download: 'Original', provenance: 'Repères de provenance', downloadOriginal: 'Télécharger le fichier original', deleteConfirm: 'Supprimer ce document du dossier ?', workspaceKicker: 'DOSSIER ACTIF', workspaceSubtitle: 'Vue d’ensemble, recherche locale et traitements documentaires', contextTitle: 'Contexte de la prochaine demande', manualMode: 'Manuel', automaticMode: 'Automatique local', automaticHint: 'Desk recherche localement les passages pertinents avant l’envoi ; seuls ces extraits sont transmis.', searchLabel: 'Rechercher dans les documents', searchPlaceholder: 'Rechercher dans le Markdown du dossier…', searchScope: 'Recherche locale — aucun contenu n’est envoyé au réseau.', noSearchResults: 'Aucun passage correspondant dans ce dossier.', queueTitle: 'Queue locale', queueDescription: 'Deux traitements simultanés au maximum. Les checkpoints permettent la reprise.', queueAction: 'Ajouter les fiches manquantes', noJobs: 'Aucun traitement enregistré.', jobCancel: 'Annuler', jobRetry: 'Reprendre', overviewTab: 'Vue d’ensemble', libraryTab: 'Documents', searchTab: 'Recherche locale', jobsTab: 'Traitements', overviewTitle: 'Registre du dossier', overviewDescription: 'Cette vue est calculée depuis les documents et fiches conservés dans IndexedDB.', exportOverview: 'Exporter index.md', generateMissing: 'Générer les fiches manquantes', documentStat: 'Documents', volumeStat: 'Volume connu', profilesStat: 'Fiches disponibles', documentsSection: 'Documents', peopleOrganizationsSection: 'Personnes / organisations', datesSection: 'Dates principales', itemsSection: 'Éléments importants', overviewEmpty: 'Ajoutez un document pour constituer le dossier.', overviewEntitiesEmpty: 'Les entités apparaîtront après génération des fiches.', generateProfile: 'Générer la fiche', profileTitle: 'FICHE DOCUMENTAIRE', people: 'Personnes', organizations: 'Organisations', profileAvailable: 'Fiche disponible', profileToGenerate: 'Fiche à générer', statusPending: 'En attente', statusRunning: 'En cours', statusCompleted: 'Terminée', statusFailed: 'Échec', statusCancelled: 'Annulée' },
        empty: {
            title: "L'IA dans un coffre-fort numérique.",
            desc: "Traitez vos contrats, bilans, dossiers et documents confidentiels en toute sérénité. Vos requêtes sont traitées dans un environnement d’exécution protégé et matériellement isolé.",
            card1Title: "⚖️ Analyser un contrat",
            card1Desc: "Glissez un document Word ou PDF pour auditer ses clauses et risques.",
            card1Prompt: "Analyse ce contrat et identifie les clauses à risque, obligations réciproques et points de vigilance :",
            card2Title: "📄 Résumer un dossier",
            card2Desc: "Structurez les informations clés d'un long rapport ou dossier.",
            card2Prompt: "Synthétise ce dossier en dégageant les faits marquants, conclusions et prochaines étapes d'action :",
            card3Title: "📊 Analyse financière",
            card3Desc: "Déposez un classeur Excel ou un fichier CSV.",
            card3Prompt: "Examine ce tableau financier et présente une synthèse des ratios de rentabilité et de solvabilité :"
        },
        input: {
            placeholder: "Posez une question ou glissez-déposez un document (PDF, Word, Excel)...",
            attachDoc: "Joindre un document",
            roleLabel: "Mode de travail",
            send: "Envoyer",
            stop: "Arrêter la génération"
        },
        settings: {
            title: "Connecter Desk à Sealarca",
            desc: "Vous fournissez votre clé à cette application locale. Elle reste uniquement dans la session de cet onglet et sert à appeler le service Sealarca.",
            apiKeyLabel: "Clé API Sealarca",
            apiKeyHint: "La clé n’est ni intégrée au site public ni conservée dans IndexedDB.",
            getKey: "Préparer mon accès Sealarca",
            openKeys: "Ouvrir mes clés",
            prerequisitesTitle: "Avant de connecter Desk",
            prerequisites: [{ number: "1", label: "Créer et confirmer votre compte" }, { number: "2", label: "Ajouter des crédits" }, { number: "3", label: "Créer et copier une clé API" }],
            stepOne: "Vérifier la clé et charger les modèles",
            stepTwo: "Choisir un modèle et commencer",
            chooseModel: "Choisissez un modèle",
            modelRequired: "Choisissez un modèle avant d’enregistrer.",
            closeBtn: "Fermer",
            networkError: "Impossible de joindre Sealarca. Vérifiez votre connexion. Si votre organisation bloque les pages file://, demandez à votre service informatique d’autoriser cette page locale.",
            endpointLabel: "Endpoint API",
            endpointHint: "Par défaut : https://api.sealarca.ch/v1",
            modelsTitle: "Modèles disponibles pour cet accès Sealarca",
            modelsHint: "La liste est chargée automatiquement depuis votre accès Sealarca. Vous pouvez changer de modèle à tout moment.",
            testBtn: "Vérifier la clé et charger les modèles",
            syncing: "Synchronisation...",
            saveBtn: "Commencer avec Desk",
            keyMissing: "Veuillez renseigner votre clé API Sealarca.",
            syncSuccess: "Clé vérifiée et modèles chargés",
            forgetBtn: "Oublier la clé",
            showKey: "Afficher la clé",
            hideKey: "Masquer la clé"
        },
        roles: {
            title: "⚖️ Modes de travail",
            desc: "Choisissez une méthode de travail adaptée à votre tâche.",
            activeBadge: "✓ ACTIF",
            closeBtn: "Fermer",
            'document-analysis': {
                name: "Analyse documentaire",
                icon: "📄",
                desc: "Analysez vos documents, comparez les informations et identifiez les éléments importants."
            },
            legal: {
                name: "Juridique & Contrats",
                icon: "⚖️",
                desc: "Analyse de contrats, clauses, obligations, risques et documents juridiques."
            },
            fiduciary: {
                name: "Fiscal & Fiduciaire",
                icon: "📊",
                desc: "Analyse financière, comptable, fiduciaire et fiscale à partir de vos documents."
            },
            compliance: {
                name: "Conformité & Confidentialité",
                icon: "🛡️",
                desc: "Analyse des exigences de conformité, confidentialité, diligence et protection des données."
            },
            executive: {
                name: "Synthèse & Rédaction",
                icon: "✍️",
                desc: "Résumés, notes de synthèse, comptes-rendus, mémos et rédaction professionnelle."
            }
        },
        reasoning: {
            thinking: "🧠 RÉFLEXION DU VAULT EN COURS...",
            drawerTitle: "🧠 RAISONNEMENT DU VAULT",
            show: "▼ Déplier",
            hide: "▲ Masquer"
        }
    },

    // --- 🇩🇪 Deutsch ---
    de: {
        extraction: {"tooLarge": "Die extrahierte Tabelle überschreitet die Grenze von 500 000 Zeichen.", "rows": "{sheet}: Nur die ersten {used} von {total} Zeilen wurden extrahiert.", "columns": "{sheet}: Spalten auf {used} begrenzt (Inhalt gekürzt).", "slides": "Nur die ersten {used} von {total} Folien wurden extrahiert.", "missing_sheet": "Fehlendes Blatt: {sheet}.", "csv_parse": "CSV: {detail}.", "pdf_pages": "Seiten ohne auslesbaren Text: {pages}. Keine integrierte OCR; diese Seiten werden nicht als Text gesendet.", "noText": "Dieses PDF enthält keinen auslesbaren Text. Desk bietet keine OCR. Verwenden Sie eine Kopie mit Textebene."},
        app: {
            name: 'Sealarca',
            desk: 'Desk',
            newChat: 'Neue Konsultation',
            searchPlaceholder: 'Suchen...',
            noConversations: 'Keine Konsultationen gespeichert',
            apiKey: 'API-Schlüssel',
            edit: 'Bearbeiten',
            model: 'Modell · KI-System',
            modelHint: 'Wählen Sie ein Modell aus. Sie können es jederzeit ändern.',
            roleHint: 'Arbeitsweise passend zu Ihrer Aufgabe.',
            close: 'Schließen',
            themeDark: 'Dunkles Thema aktivieren',
            themeLight: 'Helles Thema aktivieren',
            roles: 'Arbeitsmodi',
            vaultStatus: 'VAULT · SEALARCA-DIENST',
            connecting: 'Verbindung zu Sealarca...',
            copy: 'Kopieren',
            copied: 'Kopiert!',
            delete: 'Löschen',
            deleteConfirm: 'Möchten Sie diese Konsultation löschen?',
            contextTooLarge: 'Der Kontext überschreitet die Grenze von 250.000 Zeichen. Kürzen Sie den Verlauf oder wählen Sie weniger Dokumente aus.',
            streamInterrupted: 'Antwort unterbrochen — prüfen Sie den Teilauszug, bevor Sie ihn verwenden.',
            you: 'Sie'
        },
        folders: { title: 'Ordner', new: 'Neuer Ordner', none: 'Kein Ordner', defaultName: 'Neuer Ordner', namePrompt: 'Ordnername:', descriptionPrompt: 'Ordnerbeschreibung:', tagsPrompt: 'Kommagetrennte Schlagwörter:', deleteConfirm: 'Diesen Ordner mit Gesprächen und Dokumenten löschen?', keepOne: 'Mindestens ein Ordner muss erhalten bleiben.' },
        documents: { title: 'Dokumentenbibliothek', add: 'Dokumente hinzufügen', close: 'Fertig', empty: 'Keine Dokumente in diesem Ordner.', selectionHint: 'Wählen Sie Dokumente nur für die nächste Anfrage aus.', preview: 'Ansehen', download: 'Original', provenance: 'Quellenverweise', downloadOriginal: 'Originaldatei herunterladen', deleteConfirm: 'Dieses Dokument löschen?', workspaceKicker: 'AKTIVER ORDNER', workspaceSubtitle: 'Übersicht, lokale Suche und Dokumentverarbeitung', contextTitle: 'Kontext für die nächste Anfrage', manualMode: 'Manuell', automaticMode: 'Automatisch lokal', automaticHint: 'Desk sucht relevante Passagen lokal, bevor sie gesendet werden; nur diese Auszüge werden übertragen.', searchLabel: 'Dokumente durchsuchen', searchPlaceholder: 'Im Markdown dieses Ordners suchen…', searchScope: 'Lokale Suche — keine Inhalte werden ins Netzwerk gesendet.', noSearchResults: 'Keine passenden Passagen in diesem Ordner.', queueTitle: 'Lokale Warteschlange', queueDescription: 'Maximal zwei parallele Verarbeitungen. Checkpoints ermöglichen die Wiederaufnahme.', queueAction: 'Fehlende Profile hinzufügen', noJobs: 'Keine Verarbeitung gespeichert.', jobCancel: 'Abbrechen', jobRetry: 'Fortsetzen', overviewTab: 'Übersicht', libraryTab: 'Dokumente', searchTab: 'Lokale Suche', jobsTab: 'Verarbeitung', overviewTitle: 'Ordnerregister', overviewDescription: 'Diese Ansicht wird aus den in IndexedDB gespeicherten Dokumenten und Profilen berechnet.', exportOverview: 'index.md exportieren', generateMissing: 'Fehlende Profile erstellen', documentStat: 'Dokumente', volumeStat: 'Bekanntes Volumen', profilesStat: 'Profile verfügbar', documentsSection: 'Dokumente', peopleOrganizationsSection: 'Personen / Organisationen', datesSection: 'Wichtige Daten', itemsSection: 'Wichtige Punkte', overviewEmpty: 'Fügen Sie ein Dokument hinzu, um den Ordner aufzubauen.', overviewEntitiesEmpty: 'Entitäten erscheinen nach der Profilerstellung.', generateProfile: 'Profil erstellen', profileTitle: 'DOKUMENTPROFIL', people: 'Personen', organizations: 'Organisationen', profileAvailable: 'Profil verfügbar', profileToGenerate: 'Profil ausstehend', statusPending: 'Ausstehend', statusRunning: 'In Bearbeitung', statusCompleted: 'Abgeschlossen', statusFailed: 'Fehlgeschlagen', statusCancelled: 'Abgebrochen' },
        empty: {
            title: "KI im digitalen Tresor.",
            desc: "Verarbeiten Sie Verträge, Bilanzen, Akten und vertrauliche Dokumente mit voller Sicherheit. Ihre Anfragen werden in einer geschützten, hardwareisolierten Ausführungsumgebung verarbeitet.",
            card1Title: "⚖️ Vertrag analysieren",
            card1Desc: "Ziehen Sie ein Word- oder PDF-Dokument hinein, um Klauseln und Risiken zu prüfen.",
            card1Prompt: "Analysieren Sie diesen Vertrag und identifizieren Sie Risikoklauseln, gegenseitige Verpflichtungen und Prüfpunkte:",
            card2Title: "📄 Akte zusammenfassen",
            card2Desc: "Strukturieren Sie Kerninformationen eines langen Berichts oder einer Akte.",
            card2Prompt: "Fassen Sie diese Akte zusammen und heben Sie wesentliche Fakten, Schlussfolgerungen und nächste Schritte hervor:",
            card3Title: "📊 Finanzanalyse",
            card3Desc: "Legen Sie eine Excel-Arbeitsmappe oder eine CSV-Datei ab.",
            card3Prompt: "Prüfen Sie diese Finanztabelle und erstellen Sie eine Übersicht der Rentabilitäts- und Liquiditätskennzahlen:"
        },
        input: {
            placeholder: "Stellen Sie eine Frage oder ziehen Sie ein Dokument hinein (PDF, Word, Excel)...",
            attachDoc: "Dokument anhängen",
            roleLabel: "Arbeitsmodus",
            send: "Senden",
            stop: "Generierung stoppen"
        },
        settings: {
            title: "Desk mit Sealarca verbinden",
            desc: "Sie geben Ihren Schlüssel in diese lokale Anwendung ein. Er bleibt nur während der Sitzung dieses Tabs erhalten und wird für Aufrufe des Sealarca-Dienstes verwendet.",
            apiKeyLabel: "Sealarca API-Schlüssel",
            apiKeyHint: "Der Schlüssel ist weder in der öffentlichen Website eingebettet noch in IndexedDB gespeichert.",
            getKey: "Sealarca-Zugang vorbereiten",
            openKeys: "Meine Schlüssel öffnen",
            prerequisitesTitle: "Vor der Verbindung mit Desk",
            prerequisites: [{ number: "1", label: "Konto erstellen und bestätigen" }, { number: "2", label: "Guthaben hinzufügen" }, { number: "3", label: "API-Schlüssel erstellen und kopieren" }],
            stepOne: "Schlüssel prüfen und Modelle laden",
            stepTwo: "Modell wählen und beginnen",
            chooseModel: "Modell auswählen",
            modelRequired: "Wählen Sie vor dem Speichern ein Modell aus.",
            closeBtn: "Schließen",
            networkError: "Sealarca ist nicht erreichbar. Prüfen Sie Ihre Verbindung. Falls Ihre Organisation file://-Seiten blockiert, lassen Sie diese lokale Seite durch Ihre IT freigeben.",
            endpointLabel: "API-Endpunkt",
            endpointHint: "Standard: https://api.sealarca.ch/v1",
            modelsTitle: "Modelle für diesen Sealarca-Zugang",
            modelsHint: "Die Liste wird automatisch aus Ihrem Sealarca-Zugang geladen. Sie können das Modell jederzeit ändern.",
            testBtn: "Schlüssel prüfen und Modelle laden",
            syncing: "Synchronisierung...",
            saveBtn: "Mit Desk beginnen",
            keyMissing: "Bitte geben Sie Ihren Sealarca API-Schlüssel ein.",
            syncSuccess: "Schlüssel geprüft und Modelle geladen",
            forgetBtn: "Schlüssel vergessen",
            showKey: "Schlüssel anzeigen",
            hideKey: "Schlüssel ausblenden"
        },
        roles: {
            title: "⚖️ Arbeitsmodi",
            desc: "Wählen Sie eine Arbeitsweise passend zu Ihrer Aufgabe.",
            activeBadge: "✓ AKTIV",
            closeBtn: "Schließen",
            'document-analysis': {
                name: "Dokumentenanalyse",
                icon: "📄",
                desc: "Analysieren Sie Ihre Dokumente, vergleichen Sie Informationen und erkennen Sie wichtige Punkte."
            },
            legal: {
                name: "Recht & Verträge",
                icon: "⚖️",
                desc: "Analyse von Verträgen, Klauseln, Pflichten, Risiken und juristischen Dokumenten."
            },
            fiduciary: {
                name: "Steuern & Treuhand",
                icon: "📊",
                desc: "Finanzielle, buchhalterische, treuhänderische und steuerliche Analyse Ihrer Dokumente."
            },
            compliance: {
                name: "Compliance & Vertraulichkeit",
                icon: "🛡️",
                desc: "Analyse von Compliance-, Vertraulichkeits-, Sorgfalts- und Datenschutzanforderungen."
            },
            executive: {
                name: "Zusammenfassung & Redaktion",
                icon: "✍️",
                desc: "Zusammenfassungen, Entscheidungsnotizen, Protokolle, Memos und professionelle Texte."
            }
        },
        reasoning: {
            thinking: "🧠 VAULT-DENKPROZESS LÄUFT...",
            drawerTitle: "🧠 VAULT-BEGRÜNDUNG",
            show: "▼ Ausklappen",
            hide: "▲ Einklappen"
        }
    },

    // --- 🇮🇹 Italiano ---
    it: {
        extraction: {"tooLarge": "La tabella estratta supera il limite di 500 000 caratteri.", "rows": "{sheet}: estratte solo le prime {used} righe su {total}.", "columns": "{sheet}: colonne limitate a {used} (contenuto troncato).", "slides": "Estratte solo le prime {used} di {total} diapositive.", "missing_sheet": "Foglio mancante: {sheet}.", "csv_parse": "CSV: {detail}.", "pdf_pages": "Pagine senza testo estraibile: {pages}. Nessun OCR integrato; queste pagine non vengono inviate come testo.", "noText": "Questo PDF non contiene testo estraibile. Desk non dispone di OCR. Utilizzare una copia con un livello di testo."},
        app: {
            name: 'Sealarca',
            desk: 'Desk',
            newChat: 'Nuova consultazione',
            searchPlaceholder: 'Cerca...',
            noConversations: 'Nessuna consultazione salvata',
            apiKey: 'Chiave API',
            edit: 'Modifica',
            model: 'Modello · motore IA',
            modelHint: 'Scegli un modello per iniziare. Potrai cambiarlo in qualsiasi momento.',
            roleHint: 'Metodo di lavoro adatto alla tua attività.',
            close: 'Chiudi',
            themeDark: 'Attiva tema scuro',
            themeLight: 'Attiva tema chiaro',
            roles: 'Modalità di lavoro',
            vaultStatus: 'VAULT · SERVIZIO SEALARCA',
            connecting: 'Connessione a Sealarca...',
            copy: 'Copia',
            copied: 'Copiato!',
            delete: 'Elimina',
            deleteConfirm: 'Vuoi eliminare questa consultazione?',
            contextTooLarge: 'Il contesto supera il limite di 250.000 caratteri. Riduci la cronologia o deseleziona alcuni documenti.',
            streamInterrupted: 'Risposta interrotta — verifica il contenuto parziale prima di usarlo.',
            you: 'Tu'
        },
        folders: { title: 'Cartelle', new: 'Nuova cartella', none: 'Nessuna cartella', defaultName: 'Nuova cartella', namePrompt: 'Nome della cartella:', descriptionPrompt: 'Descrizione della cartella:', tagsPrompt: 'Etichette separate da virgole:', deleteConfirm: 'Eliminare la cartella con conversazioni e documenti?', keepOne: 'Deve rimanere almeno una cartella.' },
        documents: { title: 'Biblioteca documenti', add: 'Aggiungi documenti', close: 'Fine', empty: 'Nessun documento in questa cartella.', selectionHint: 'Seleziona i documenti da usare solo per la prossima richiesta.', preview: 'Consulta', download: 'Originale', provenance: 'Riferimenti di provenienza', downloadOriginal: 'Scarica file originale', deleteConfirm: 'Eliminare questo documento?', workspaceKicker: 'CARTELLA ATTIVA', workspaceSubtitle: 'Panoramica, ricerca locale ed elaborazione documenti', contextTitle: 'Contesto della prossima richiesta', manualMode: 'Manuale', automaticMode: 'Automatico locale', automaticHint: 'Desk cerca localmente i passaggi pertinenti prima dell’invio; vengono trasmessi solo questi estratti.', searchLabel: 'Cerca nei documenti', searchPlaceholder: 'Cerca nel Markdown della cartella…', searchScope: 'Ricerca locale — nessun contenuto viene inviato alla rete.', noSearchResults: 'Nessun passaggio corrispondente in questa cartella.', queueTitle: 'Coda locale', queueDescription: 'Massimo due elaborazioni simultanee. I checkpoint consentono la ripresa.', queueAction: 'Aggiungi schede mancanti', noJobs: 'Nessuna elaborazione registrata.', jobCancel: 'Annulla', jobRetry: 'Riprendi', overviewTab: 'Panoramica', libraryTab: 'Documenti', searchTab: 'Ricerca locale', jobsTab: 'Elaborazioni', overviewTitle: 'Registro della cartella', overviewDescription: 'Questa vista è calcolata dai documenti e dai profili conservati in IndexedDB.', exportOverview: 'Esporta index.md', generateMissing: 'Genera i profili mancanti', documentStat: 'Documenti', volumeStat: 'Volume noto', profilesStat: 'Profili disponibili', documentsSection: 'Documenti', peopleOrganizationsSection: 'Persone / organizzazioni', datesSection: 'Date principali', itemsSection: 'Elementi importanti', overviewEmpty: 'Aggiungi un documento per costituire la cartella.', overviewEntitiesEmpty: 'Le entità appariranno dopo la generazione dei profili.', generateProfile: 'Genera profilo', profileTitle: 'SCHEDA DOCUMENTO', people: 'Persone', organizations: 'Organizzazioni', profileAvailable: 'Profilo disponibile', profileToGenerate: 'Profilo da generare', statusPending: 'In attesa', statusRunning: 'In corso', statusCompleted: 'Completato', statusFailed: 'Errore', statusCancelled: 'Annullato' },
        empty: {
            title: "L'IA in una cassaforte digitale.",
            desc: "Elabora contratti, bilanci, fascicoli e documenti riservati in totale sicurezza. Le tue richieste vengono trattate in un ambiente di esecuzione protetto e isolato a livello hardware.",
            card1Title: "⚖️ Analizzare un contratto",
            card1Desc: "Trascina un documento Word o PDF per verificare clausole e rischi.",
            card1Prompt: "Analizza questo contratto e identifica le clausole a rischio, gli obblighi reciproci e i punti di attenzione:",
            card2Title: "📄 Riassumere un fascicolo",
            card2Desc: "Struttura le informazioni chiave di una lunga relazione o fascicolo.",
            card2Prompt: "Sintetizza questo fascicolo evidenziando i fatti salienti, le conclusioni e i passi successivi:",
            card3Title: "📊 Analisi finanziaria",
            card3Desc: "Rilascia una cartella di lavoro Excel o un file CSV.",
            card3Prompt: "Esamina questa tabella finanziaria e presenta una sintesi degli indici di redditività e liquidità:"
        },
        input: {
            placeholder: "Fai una domanda o trascina un documento (PDF, Word, Excel)...",
            attachDoc: "Allega documento",
            roleLabel: "Modalità di lavoro",
            send: "Invia",
            stop: "Interrompi generazione"
        },
        settings: {
            title: "Collegare Desk a Sealarca",
            desc: "La chiave viene fornita a questa applicazione locale. Resta solo per la sessione della scheda e viene usata per chiamare il servizio Sealarca.",
            apiKeyLabel: "Chiave API Sealarca",
            apiKeyHint: "La chiave non è integrata nel sito pubblico né conservata in IndexedDB.",
            getKey: "Preparare l’accesso Sealarca",
            openKeys: "Aprire le mie chiavi",
            prerequisitesTitle: "Prima di collegare Desk",
            prerequisites: [{ number: "1", label: "Creare e confermare l’account" }, { number: "2", label: "Aggiungere crediti" }, { number: "3", label: "Creare e copiare una chiave API" }],
            stepOne: "Verificare la chiave e caricare i modelli",
            stepTwo: "Scegliere un modello e iniziare",
            chooseModel: "Scegli un modello",
            modelRequired: "Scegli un modello prima di salvare.",
            closeBtn: "Chiudi",
            networkError: "Impossibile contattare Sealarca. Verificate la connessione. Se l’organizzazione blocca le pagine file://, chiedete all’IT di autorizzare questa pagina locale.",
            endpointLabel: "Endpoint API",
            endpointHint: "Predefinito: https://api.sealarca.ch/v1",
            modelsTitle: "Modelli disponibili per questo accesso Sealarca",
            modelsHint: "L’elenco viene caricato automaticamente dal tuo accesso Sealarca. Puoi cambiare modello in qualsiasi momento.",
            testBtn: "Verificare la chiave e caricare i modelli",
            syncing: "Sincronizzazione...",
            saveBtn: "Iniziare con Desk",
            keyMissing: "Inserisci la tua chiave API Sealarca.",
            syncSuccess: "Chiave verificata e modelli caricati",
            forgetBtn: "Dimentica la chiave",
            showKey: "Mostra chiave",
            hideKey: "Nascondi chiave"
        },
        roles: {
            title: "⚖️ Modalità di lavoro",
            desc: "Scegli un metodo di lavoro adatto alla tua attività.",
            activeBadge: "✓ ATTIVO",
            closeBtn: "Chiudi",
            'document-analysis': {
                name: "Analisi documentale",
                icon: "📄",
                desc: "Analizza i tuoi documenti, confronta le informazioni e individua gli elementi importanti."
            },
            legal: {
                name: "Diritto & Contratti",
                icon: "⚖️",
                desc: "Analisi di contratti, clausole, obblighi, rischi e documenti giuridici."
            },
            fiduciary: {
                name: "Fiscale & Fiduciario",
                icon: "📊",
                desc: "Analisi finanziaria, contabile, fiduciaria e fiscale a partire dai tuoi documenti."
            },
            compliance: {
                name: "Conformità & Riservatezza",
                icon: "🛡️",
                desc: "Analisi di requisiti di conformità, riservatezza, diligenza e protezione dei dati."
            },
            executive: {
                name: "Sintesi & Redazione",
                icon: "✍️",
                desc: "Sintesi, note decisionali, verbali, memorandum e redazione professionale."
            }
        },
        reasoning: {
            thinking: "🧠 RAGIONAMENTO DEL VAULT IN CORSO...",
            drawerTitle: "🧠 RAGIONAMENTO DEL VAULT",
            show: "▼ Espandi",
            hide: "▲ Comprimi"
        }
    },

    // --- 🇬🇧 English ---
    en: {
        extraction: {"tooLarge": "The extracted table exceeds the 500,000-character limit.", "rows": "{sheet}: only the first {used} of {total} rows were extracted.", "columns": "{sheet}: columns limited to {used} (content truncated).", "slides": "Only the first {used} of {total} slides were extracted.", "missing_sheet": "Missing sheet: {sheet}.", "csv_parse": "CSV: {detail}.", "pdf_pages": "Pages without extractable text: {pages}. No built-in OCR; these pages are not sent as text.", "noText": "This PDF has no extractable text. Desk has no OCR. Use a copy with a text layer."},
        app: {
            name: 'Sealarca',
            desk: 'Desk',
            newChat: 'New consultation',
            searchPlaceholder: 'Search...',
            noConversations: 'No saved consultations',
            apiKey: 'API Key',
            edit: 'Edit',
            model: 'Model · AI engine',
            modelHint: 'Choose a model to get started. You can change it at any time.',
            roleHint: 'A way of working suited to your task.',
            close: 'Close',
            themeDark: 'Enable dark theme',
            themeLight: 'Enable light theme',
            roles: 'Work modes',
            vaultStatus: 'VAULT · SEALARCA SERVICE',
            connecting: 'Connecting to Sealarca...',
            copy: 'Copy',
            copied: 'Copied!',
            delete: 'Delete',
            deleteConfirm: 'Do you want to delete this consultation?',
            contextTooLarge: 'The context exceeds the 250,000-character limit. Reduce the history or deselect documents before trying again.',
            streamInterrupted: 'Response interrupted — review the partial content before using it.',
            you: 'You'
        },
        folders: { title: 'Folders', new: 'New folder', none: 'No folder', defaultName: 'New folder', namePrompt: 'Folder name:', descriptionPrompt: 'Folder description:', tagsPrompt: 'Comma-separated tags:', deleteConfirm: 'Delete this folder, its conversations and documents?', keepOne: 'At least one folder must remain.' },
        documents: { title: 'Document library', add: 'Add documents', close: 'Done', empty: 'No documents in this folder.', selectionHint: 'Select documents to use only for the next request.', preview: 'View', download: 'Original', provenance: 'Source references', downloadOriginal: 'Download original file', deleteConfirm: 'Delete this document from the folder?', workspaceKicker: 'ACTIVE FOLDER', workspaceSubtitle: 'Overview, local search, and document processing', contextTitle: 'Context for the next request', manualMode: 'Manual', automaticMode: 'Automatic local', automaticHint: 'Desk searches for relevant passages locally before sending; only those excerpts are transmitted.', searchLabel: 'Search documents', searchPlaceholder: 'Search this folder’s Markdown…', searchScope: 'Local search — no content is sent to the network.', noSearchResults: 'No matching passage in this folder.', queueTitle: 'Local queue', queueDescription: 'Up to two processes run at once. Checkpoints allow resuming.', queueAction: 'Add missing profiles', noJobs: 'No processing recorded.', jobCancel: 'Cancel', jobRetry: 'Resume', overviewTab: 'Overview', libraryTab: 'Documents', searchTab: 'Local search', jobsTab: 'Processing', overviewTitle: 'Folder register', overviewDescription: 'This view is calculated from documents and profiles stored in IndexedDB.', exportOverview: 'Export index.md', generateMissing: 'Generate missing profiles', documentStat: 'Documents', volumeStat: 'Known volume', profilesStat: 'Profiles available', documentsSection: 'Documents', peopleOrganizationsSection: 'People / organizations', datesSection: 'Key dates', itemsSection: 'Important items', overviewEmpty: 'Add a document to build this folder.', overviewEntitiesEmpty: 'Entities appear after profiles are generated.', generateProfile: 'Generate profile', profileTitle: 'DOCUMENT PROFILE', people: 'People', organizations: 'Organizations', profileAvailable: 'Profile available', profileToGenerate: 'Profile to generate', statusPending: 'Pending', statusRunning: 'Running', statusCompleted: 'Completed', statusFailed: 'Failed', statusCancelled: 'Cancelled' },
        empty: {
            title: "AI in a digital vault.",
            desc: "Process confidential contracts, statements, files, and reports with confidence. Your requests are handled in a protected, hardware-isolated execution environment.",
            card1Title: "⚖️ Analyze a contract",
            card1Desc: "Drop a Word or PDF file to audit clauses, risks, and obligations.",
            card1Prompt: "Analyze this contract and identify risk clauses, mutual obligations, and key focus points:",
            card2Title: "📄 Summarize a case file",
            card2Desc: "Structure core insights and facts from a lengthy brief or report.",
            card2Prompt: "Summarize this case file highlighting key facts, findings, and recommended next steps:",
            card3Title: "📊 Financial analysis",
            card3Desc: "Drop an Excel workbook or a CSV file.",
            card3Prompt: "Examine this financial table and provide a summary of profitability and solvency ratios:"
        },
        input: {
            placeholder: "Ask a question or drop a document (PDF, Word, Excel)...",
            attachDoc: "Attach document",
            roleLabel: "Work mode",
            send: "Send",
            stop: "Stop generation"
        },
        settings: {
            title: "Connect Desk to Sealarca",
            desc: "You provide your key to this local application. It stays only for this tab session and is used to call the Sealarca service.",
            apiKeyLabel: "Sealarca API Key",
            apiKeyHint: "The key is not embedded in the public site or stored in IndexedDB.",
            getKey: "Prepare my Sealarca access",
            openKeys: "Open my keys",
            prerequisitesTitle: "Before connecting Desk",
            prerequisites: [{ number: "1", label: "Create and confirm your account" }, { number: "2", label: "Add credits" }, { number: "3", label: "Create and copy an API key" }],
            stepOne: "Verify the key and load models",
            stepTwo: "Choose a model and get started",
            chooseModel: "Choose a model",
            modelRequired: "Choose a model before saving.",
            closeBtn: "Close",
            networkError: "Sealarca could not be reached. Check your connection. If your organization blocks file:// pages, ask your IT team to allow this local page.",
            endpointLabel: "API Endpoint",
            endpointHint: "Default: https://api.sealarca.ch/v1",
            modelsTitle: "Models available for this Sealarca access",
            modelsHint: "The list is loaded automatically from your Sealarca access. You can change models at any time.",
            testBtn: "Verify the key and load models",
            syncing: "Syncing...",
            saveBtn: "Start using Desk",
            keyMissing: "Please enter your Sealarca API key.",
            syncSuccess: "Key verified and models loaded",
            forgetBtn: "Forget key",
            showKey: "Show key",
            hideKey: "Hide key"
        },
        roles: {
            title: "⚖️ Work modes",
            desc: "Choose a working method suited to your task.",
            activeBadge: "✓ ACTIVE",
            closeBtn: "Close",
            'document-analysis': {
                name: "Document analysis",
                icon: "📄",
                desc: "Analyze your documents, compare information, and identify important elements."
            },
            legal: {
                name: "Legal & Contracts",
                icon: "⚖️",
                desc: "Analyze contracts, clauses, obligations, risks, and legal documents."
            },
            fiduciary: {
                name: "Tax & Fiduciary",
                icon: "📊",
                desc: "Analyze financial, accounting, fiduciary, and tax information from your documents."
            },
            compliance: {
                name: "Compliance & Confidentiality",
                icon: "🛡️",
                desc: "Analyze compliance, confidentiality, due diligence, and data-protection requirements."
            },
            executive: {
                name: "Summary & Drafting",
                icon: "✍️",
                desc: "Summaries, decision notes, minutes, memos, and professional drafting."
            }
        },
        reasoning: {
            thinking: "🧠 VAULT REASONING IN PROGRESS...",
            drawerTitle: "🧠 VAULT REASONING",
            show: "▼ Expand",
            hide: "▲ Collapse"
        }
    },

    // --- 🇪🇸 Español ---
    es: {
        extraction: {"tooLarge": "La tabla extraída supera el límite de 500 000 caracteres.", "rows": "{sheet}: solo se han extraído las primeras {used} de {total} filas.", "columns": "{sheet}: columnas limitadas a {used} (contenido truncado).", "slides": "Solo se han extraído las primeras {used} de {total} diapositivas.", "missing_sheet": "Hoja ausente: {sheet}.", "csv_parse": "CSV: {detail}.", "pdf_pages": "Páginas sin texto extraíble: {pages}. Sin OCR integrado; estas páginas no se envían como texto.", "noText": "Este PDF no contiene texto extraíble. Desk no dispone de OCR. Utilice una copia con una capa de texto."},
        app: {
            name: 'Sealarca',
            desk: 'Desk',
            newChat: 'Nueva consulta',
            searchPlaceholder: 'Buscar...',
            noConversations: 'Sin consultas guardadas',
            apiKey: 'Clave API',
            edit: 'Modificar',
            model: 'Modelo · motor de IA',
            modelHint: 'Elija un modelo para empezar. Podrá cambiarlo en cualquier momento.',
            roleHint: 'Forma de trabajo adaptada a su tarea.',
            close: 'Cerrar',
            themeDark: 'Activar el tema oscuro',
            themeLight: 'Activar el tema claro',
            roles: 'Modos de trabajo',
            vaultStatus: 'VAULT · SERVICIO SEALARCA',
            connecting: 'Conectando a Sealarca...',
            copy: 'Copiar',
            copied: '¡Copiado!',
            delete: 'Eliminar',
            deleteConfirm: '¿Desea eliminar esta consulta?',
            contextTooLarge: 'El contexto supera el límite de 250.000 caracteres. Reduzca el historial o deseleccione documentos antes de intentarlo de nuevo.',
            streamInterrupted: 'Respuesta interrumpida — revise el contenido parcial antes de utilizarlo.',
            you: 'Usted'
        },
        folders: { title: 'Carpetas', new: 'Nueva carpeta', none: 'Sin carpeta', defaultName: 'Nueva carpeta', namePrompt: 'Nombre de la carpeta:', descriptionPrompt: 'Descripción de la carpeta:', tagsPrompt: 'Etiquetas separadas por comas:', deleteConfirm: '¿Eliminar esta carpeta, sus conversaciones y documentos?', keepOne: 'Debe conservarse al menos una carpeta.' },
        documents: { title: 'Biblioteca documental', add: 'Añadir documentos', close: 'Listo', empty: 'No hay documentos en esta carpeta.', selectionHint: 'Seleccione documentos para usarlos solo en la próxima solicitud.', preview: 'Consultar', download: 'Original', provenance: 'Referencias de origen', downloadOriginal: 'Descargar archivo original', deleteConfirm: '¿Eliminar este documento?', workspaceKicker: 'CARPETA ACTIVA', workspaceSubtitle: 'Resumen, búsqueda local y procesamiento documental', contextTitle: 'Contexto de la próxima solicitud', manualMode: 'Manual', automaticMode: 'Automático local', automaticHint: 'Desk busca localmente los pasajes pertinentes antes del envío; solo se transmiten esos extractos.', searchLabel: 'Buscar en los documentos', searchPlaceholder: 'Buscar en el Markdown de la carpeta…', searchScope: 'Búsqueda local — no se envía contenido a la red.', noSearchResults: 'No hay pasajes coincidentes en esta carpeta.', queueTitle: 'Cola local', queueDescription: 'Se ejecutan como máximo dos procesos a la vez. Los checkpoints permiten reanudar.', queueAction: 'Añadir fichas que faltan', noJobs: 'No hay procesos registrados.', jobCancel: 'Cancelar', jobRetry: 'Reanudar', overviewTab: 'Resumen', libraryTab: 'Documentos', searchTab: 'Búsqueda local', jobsTab: 'Procesos', overviewTitle: 'Registro de la carpeta', overviewDescription: 'Esta vista se calcula a partir de los documentos y fichas guardados en IndexedDB.', exportOverview: 'Exportar index.md', generateMissing: 'Generar fichas que faltan', documentStat: 'Documentos', volumeStat: 'Volumen conocido', profilesStat: 'Fichas disponibles', documentsSection: 'Documentos', peopleOrganizationsSection: 'Personas / organizaciones', datesSection: 'Fechas principales', itemsSection: 'Elementos importantes', overviewEmpty: 'Añada un documento para formar la carpeta.', overviewEntitiesEmpty: 'Las entidades aparecerán después de generar las fichas.', generateProfile: 'Generar ficha', profileTitle: 'FICHA DOCUMENTAL', people: 'Personas', organizations: 'Organizaciones', profileAvailable: 'Ficha disponible', profileToGenerate: 'Ficha pendiente', statusPending: 'Pendiente', statusRunning: 'En curso', statusCompleted: 'Completado', statusFailed: 'Error', statusCancelled: 'Cancelado' },
        empty: {
            title: "IA en una bóveda digital.",
            desc: "Procese contratos, balances, expedientes y documentos confidenciales con tranquilidad. Sus solicitudes se procesan en un entorno de ejecución protegido y aislado por hardware.",
            card1Title: "⚖️ Analizar un contrato",
            card1Desc: "Arrastre un documento Word o PDF para auditar cláusulas y riesgos.",
            card1Prompt: "Analice este contrato e identifique cláusulas de riesgo, obligaciones recíprocas y puntos de atención:",
            card2Title: "📄 Resumir un expediente",
            card2Desc: "Estructure los puntos clave de un informe o expediente extenso.",
            card2Prompt: "Sintetice este expediente destacando hechos relevantes, conclusiones y próximos pasos:",
            card3Title: "📊 Análisis financiero",
            card3Desc: "Arrastre un libro de Excel o un archivo CSV.",
            card3Prompt: "Examine esta tabla financiera y presente un resumen de ratios de rentabilidad y liquidez:"
        },
        input: {
            placeholder: "Haga una pregunta o arrastre un documento (PDF, Word, Excel)...",
            attachDoc: "Adjuntar documento",
            roleLabel: "Modo de trabajo",
            send: "Enviar",
            stop: "Detener generación"
        },
        settings: {
            title: "Conectar Desk a Sealarca",
            desc: "La clave se proporciona a esta aplicación local. Permanece solo durante la sesión de la pestaña y se usa para llamar al servicio Sealarca.",
            apiKeyLabel: "Clave API Sealarca",
            apiKeyHint: "La clave no está integrada en el sitio público ni se conserva en IndexedDB.",
            getKey: "Preparar mi acceso Sealarca",
            openKeys: "Abrir mis claves",
            prerequisitesTitle: "Antes de conectar Desk",
            prerequisites: [{ number: "1", label: "Crear y confirmar la cuenta" }, { number: "2", label: "Añadir créditos" }, { number: "3", label: "Crear y copiar una clave API" }],
            stepOne: "Verificar la clave y cargar los modelos",
            stepTwo: "Elegir un modelo y empezar",
            chooseModel: "Elija un modelo",
            modelRequired: "Elija un modelo antes de guardar.",
            closeBtn: "Cerrar",
            networkError: "No se puede contactar con Sealarca. Compruebe la conexión. Si su organización bloquea páginas file://, pida a TI que autorice esta página local.",
            endpointLabel: "Endpoint API",
            endpointHint: "Por defecto: https://api.sealarca.ch/v1",
            modelsTitle: "Modelos disponibles para este acceso de Sealarca",
            modelsHint: "La lista se carga automáticamente desde su acceso de Sealarca. Puede cambiar de modelo en cualquier momento.",
            testBtn: "Verificar la clave y cargar los modelos",
            syncing: "Sincronizando...",
            saveBtn: "Empezar con Desk",
            keyMissing: "Por favor, introduzca su clave API Sealarca.",
            syncSuccess: "Clave verificada y modelos cargados",
            forgetBtn: "Olvidar clave",
            showKey: "Mostrar clave",
            hideKey: "Ocultar clave"
        },
        roles: {
            title: "⚖️ Modos de trabajo",
            desc: "Elija un método de trabajo adaptado a su tarea.",
            activeBadge: "✓ ACTIVO",
            closeBtn: "Cerrar",
            'document-analysis': {
                name: "Análisis documental",
                icon: "📄",
                desc: "Analice sus documentos, compare la información e identifique los elementos importantes."
            },
            legal: {
                name: "Jurídico y Contratos",
                icon: "⚖️",
                desc: "Análisis de contratos, cláusulas, obligaciones, riesgos y documentos jurídicos."
            },
            fiduciary: {
                name: "Fiscal y Fiduciario",
                icon: "📊",
                desc: "Análisis financiero, contable, fiduciario y fiscal a partir de sus documentos."
            },
            compliance: {
                name: "Cumplimiento y Confidencialidad",
                icon: "🛡️",
                desc: "Análisis de requisitos de cumplimiento, confidencialidad, diligencia y protección de datos."
            },
            executive: {
                name: "Síntesis y Redacción",
                icon: "✍️",
                desc: "Resúmenes, notas de decisión, actas, memorandos y redacción profesional."
            }
        },
        reasoning: {
            thinking: "🧠 RAZONAMIENTO DEL VAULT EN CURSO...",
            drawerTitle: "🧠 RAZONAMIENTO DEL VAULT",
            show: "▼ Desplegar",
            hide: "▲ Plegar"
        }
    }
};

const SEALARCA_I18N_FALLBACKS = {
    fr: {
        'app.streamTimeout': 'Aucune donnée reçue pendant 120 secondes ; la génération a été interrompue. Relancez avec un contexte réduit.',
        'app.profileUpToDate': 'Fiche déjà à jour.',
        'app.profileQueued': 'Fiche ajoutée à la queue.',
        'app.profilesQueued': '{count} fiche(s) ajoutée(s) à la queue.',
        'app.profilesUpToDate': 'Toutes les fiches sont déjà à jour.',
        'settings.noModels': 'Aucun modèle disponible pour cette clé API.',
        'documents.pagesUnavailable': 'Pages non disponibles',
        'documents.pagesUnit': 'pages',
        dossier: {
            actionsTitle: 'Actions du dossier', timelineTitle: 'Chronologie', timelineTab: 'Chronologie', timelineEmpty: 'Aucun événement extrait des fiches disponibles.',
            operationsTitle: 'Opérations récentes', operationsEmpty: 'Aucune opération dans ce dossier.', advancedOptions: 'Options du dossier',
            folderContextSetting: 'Contexte des prochaines demandes', inheritContextSetting: 'Suivre le réglage général', manualContextSetting: 'Manuel', automaticContextSetting: 'Automatique local',
            profileCoverage: '{ready} fiches à jour sur {total} documents', localActionHelp: 'Ces actions regroupent uniquement les fiches locales des documents sélectionnés, ou de tout le dossier si aucun n’est sélectionné. Elles n’envoient pas de nouveau contenu. Générer une fiche reste une action explicite.',
            summaryLocalTitle: 'Synthèse locale', summarySharedTitle: 'Éléments communs', summaryOverview: '{profiles} fiches à jour sur {documents} documents : {events} événements, {people} personnes, {organizations} organisations, {amounts} montants et {obligations} obligations. Comparaison : {divergences} différences apparentes à vérifier.', summarySharedEntities: '{count} personnes ou organisations apparaissent dans plusieurs fiches : {items}.',
            cancelOperation: 'Annuler', retryOperation: 'Relancer', openResult: 'Ouvrir les résultats', entitiesTitle: 'Parties et organisations', amountsTitle: 'Montants', obligationsTitle: 'Obligations', amountsEmpty: 'Aucun montant dans les fiches disponibles.', obligationsEmpty: 'Aucune obligation dans les fiches disponibles.',
            extractionUnverified: 'Extraction à vérifier dans le document source.', dateUnknown: 'Date non précisée', progress: '{done} étapes terminées sur {total}', localOnly: 'Traitement local · aucune donnée envoyée',
            traceSummary: '{documents} documents · {sources} références · {characters} caractères de contexte', traceIncluded: '{count} références retenues', traceOmitted: 'Document non retenu', showTrace: 'Afficher les sources utilisées', hideTrace: 'Masquer les sources utilisées',
            localActionEmpty: 'Aucun contenu exploitable dans les fiches sélectionnées.', operationAlreadyRunning: 'Une opération est déjà en cours pour ce dossier.', noDocuments: 'Ajoutez un document avant de lancer une action.', operationFailed: 'L’opération a échoué. Consultez son journal pour les détails.',
            actions: { summary: 'Synthèse', timeline: 'Construire la chronologie', entities: 'Lister les parties', obligations: 'Examiner les obligations', compare: 'Comparer les informations', divergences: 'Repérer les différences apparentes', amounts: 'Lister les montants' },
            steps: { prepare: 'Préparer le dossier', context: 'Charger les fiches locales', analyze: 'Regrouper les éléments', save: 'Enregistrer les résultats et les références' },
            stepDetails: { documents: '{count} document(s) retenu(s)', profiles: '{count} fiche(s) à jour sur {total} document(s)', results: '{count} élément(s) · {sources} référence(s)' },
            status: { pending: 'En attente', running: 'En cours', completed: 'Terminée', partial: 'Partielle', failed: 'Échec', cancelled: 'Annulée', warning: 'À vérifier', processing: 'Fiche en cours', ready: 'Fiche prête', not_analyzed: 'Fiche à générer', error: 'Erreur de fiche' },
            notices: { document_limit_reached: 'La limite de {limit} documents a été atteinte.', operation_busy: 'Une autre session traite déjà cette opération.', profiles_missing: '{count} document(s) sans fiche à jour ont été ignorés.', operation_cancelled: 'Opération annulée.', document_deleted: 'Document supprimé; opération en attente annulée. Son résultat historique est conservé.', operation_failed: 'L’opération n’a pas pu aboutir.', operation_interrupted: 'Le navigateur a été fermé pendant cette opération.', response_interrupted: 'La réponse du modèle a été interrompue.', document_not_in_context: 'Document ignoré car aucun extrait admissible n’a été retenu.', context_limit_reached: 'La limite de contexte de {limit} caractères a été atteinte.', unknown_notice: 'Un point demande votre attention.' }
        }
    },
    de: {
        'app.streamTimeout': '120 Sekunden lang wurden keine Daten empfangen; die Generierung wurde unterbrochen. Mit kleinerem Kontext erneut versuchen.',
        'app.profileUpToDate': 'Profil bereits aktuell.',
        'app.profileQueued': 'Profil zur Warteschlange hinzugefügt.',
        'app.profilesQueued': '{count} Profil(e) zur Warteschlange hinzugefügt.',
        'app.profilesUpToDate': 'Alle Profile sind bereits aktuell.',
        'settings.noModels': 'Kein Modell für diesen API-Schlüssel verfügbar.',
        'documents.pagesUnavailable': 'Seiten nicht verfügbar',
        'documents.pagesUnit': 'Seiten',
        dossier: {
            actionsTitle: 'Aktionen für den Ordner', timelineTitle: 'Zeitachse', timelineTab: 'Zeitachse', timelineEmpty: 'Aus den verfügbaren Profilen wurden keine Ereignisse extrahiert.',
            operationsTitle: 'Letzte Vorgänge', operationsEmpty: 'Keine Vorgänge in diesem Ordner.', advancedOptions: 'Ordnereinstellungen',
            folderContextSetting: 'Kontext für nächste Anfragen', inheritContextSetting: 'Allgemeine Einstellung übernehmen', manualContextSetting: 'Manuell', automaticContextSetting: 'Automatisch lokal',
            profileCoverage: '{ready} von {total} Dokumentprofilen aktuell', localActionHelp: 'Diese Aktionen fassen nur lokale Profile der ausgewählten Dokumente oder des ganzen Ordners zusammen, wenn nichts ausgewählt ist. Dabei werden keine neuen Inhalte gesendet. Ein Profil wird ausdrücklich gestartet.',
            summaryLocalTitle: 'Lokale Zusammenfassung', summarySharedTitle: 'Gemeinsame Angaben', summaryOverview: '{profiles} aktuelle Profile aus {documents} Dokumenten: {events} Ereignisse, {people} Personen, {organizations} Organisationen, {amounts} Beträge und {obligations} Pflichten. Vergleich: {divergences} mögliche Unterschiede zur Prüfung.', summarySharedEntities: '{count} Personen oder Organisationen kommen in mehreren Profilen vor: {items}.',
            cancelOperation: 'Abbrechen', retryOperation: 'Erneut starten', openResult: 'Ergebnisse öffnen', entitiesTitle: 'Parteien und Organisationen', amountsTitle: 'Beträge', obligationsTitle: 'Pflichten', amountsEmpty: 'In den verfügbaren Profilen wurden keine Beträge gefunden.', obligationsEmpty: 'In den verfügbaren Profilen wurden keine Pflichten gefunden.',
            extractionUnverified: 'Extraktion im Quelldokument prüfen.', dateUnknown: 'Kein Datum angegeben', progress: '{done} von {total} Schritten abgeschlossen', localOnly: 'Lokal verarbeitet · keine Daten gesendet',
            traceSummary: '{documents} Dokumente · {sources} Verweise · {characters} Kontextzeichen', traceIncluded: '{count} Verweise berücksichtigt', traceOmitted: 'Dokument nicht berücksichtigt', showTrace: 'Verwendete Quellen anzeigen', hideTrace: 'Verwendete Quellen ausblenden',
            localActionEmpty: 'Die ausgewählten Profile enthalten keine verwendbaren Angaben.', operationAlreadyRunning: 'Für diesen Ordner läuft bereits ein Vorgang.', noDocuments: 'Fügen Sie vor einer Aktion ein Dokument hinzu.', operationFailed: 'Der Vorgang ist fehlgeschlagen. Weitere Informationen stehen im Protokoll.',
            actions: { summary: 'Zusammenfassung', timeline: 'Zeitachse erstellen', entities: 'Parteien auflisten', obligations: 'Pflichten prüfen', compare: 'Angaben vergleichen', divergences: 'Mögliche Abweichungen finden', amounts: 'Beträge auflisten' },
            steps: { prepare: 'Ordner vorbereiten', context: 'Lokale Profile laden', analyze: 'Angaben zusammenführen', save: 'Ergebnisse und Quellen speichern' },
            stepDetails: { documents: '{count} Dokument(e) berücksichtigt', profiles: '{count} aktuelle Profile aus {total} Dokumenten', results: '{count} Einträge · {sources} Verweise' },
            status: { pending: 'Ausstehend', running: 'In Bearbeitung', completed: 'Abgeschlossen', partial: 'Teilweise', failed: 'Fehlgeschlagen', cancelled: 'Abgebrochen', warning: 'Prüfen', processing: 'Profil wird erstellt', ready: 'Profil bereit', not_analyzed: 'Profil erstellen', error: 'Profilfehler' },
            notices: { document_limit_reached: 'Die Grenze von {limit} Dokumenten wurde erreicht.', operation_busy: 'Eine andere Sitzung bearbeitet diesen Vorgang bereits.', profiles_missing: '{count} Dokument(e) ohne aktuelles Profil wurden übersprungen.', operation_cancelled: 'Vorgang abgebrochen.', document_deleted: 'Dokument gelöscht; ausstehender Vorgang abgebrochen. Das historische Ergebnis bleibt erhalten.', operation_failed: 'Der Vorgang konnte nicht abgeschlossen werden.', operation_interrupted: 'Der Browser wurde während dieses Vorgangs geschlossen.', response_interrupted: 'Die Modellantwort wurde unterbrochen.', document_not_in_context: 'Dokument ausgelassen, weil kein geeigneter Auszug ausgewählt wurde.', context_limit_reached: 'Die Kontextgrenze von {limit} Zeichen wurde erreicht.', unknown_notice: 'Ein Hinweis erfordert Ihre Aufmerksamkeit.' }
        }
    },
    it: {
        'app.streamTimeout': 'Nessun dato ricevuto per 120 secondi; generazione interrotta. Riprova con un contesto ridotto.',
        'app.profileUpToDate': 'Profilo già aggiornato.',
        'app.profileQueued': 'Profilo aggiunto alla coda.',
        'app.profilesQueued': '{count} scheda(e) aggiunta(e) alla coda.',
        'app.profilesUpToDate': 'Tutti i profili sono già aggiornati.',
        'settings.noModels': 'Nessun modello disponibile per questa chiave API.',
        'documents.pagesUnavailable': 'Pagine non disponibili',
        'documents.pagesUnit': 'pagine',
        dossier: {
            actionsTitle: 'Azioni della cartella', timelineTitle: 'Cronologia', timelineTab: 'Cronologia', timelineEmpty: 'Nessun evento estratto dai profili disponibili.',
            operationsTitle: 'Operazioni recenti', operationsEmpty: 'Nessuna operazione in questa cartella.', advancedOptions: 'Opzioni della cartella',
            folderContextSetting: 'Contesto per le prossime richieste', inheritContextSetting: 'Usa l’impostazione generale', manualContextSetting: 'Manuale', automaticContextSetting: 'Automatico locale',
            profileCoverage: '{ready} profili aggiornati su {total} documenti', localActionHelp: 'Queste azioni raggruppano solo i profili locali dei documenti selezionati o dell’intera cartella se non c’è una selezione. Non inviano nuovi contenuti. La generazione del profilo è esplicita.',
            summaryLocalTitle: 'Sintesi locale', summarySharedTitle: 'Elementi comuni', summaryOverview: '{profiles} profili aggiornati su {documents} documenti: {events} eventi, {people} persone, {organizations} organizzazioni, {amounts} importi e {obligations} obblighi. Confronto: {divergences} possibili differenze da verificare.', summarySharedEntities: '{count} persone o organizzazioni compaiono in più profili: {items}.',
            cancelOperation: 'Annulla', retryOperation: 'Riprova', openResult: 'Apri i risultati', entitiesTitle: 'Parti e organizzazioni', amountsTitle: 'Importi', obligationsTitle: 'Obblighi', amountsEmpty: 'Nessun importo nei profili disponibili.', obligationsEmpty: 'Nessun obbligo nei profili disponibili.',
            extractionUnverified: 'Verificare l’estrazione nel documento originale.', dateUnknown: 'Data non specificata', progress: '{done} passaggi completati su {total}', localOnly: 'Elaborazione locale · nessun dato inviato',
            traceSummary: '{documents} documenti · {sources} riferimenti · {characters} caratteri di contesto', traceIncluded: '{count} riferimenti inclusi', traceOmitted: 'Documento escluso', showTrace: 'Mostra le fonti usate', hideTrace: 'Nascondi le fonti usate',
            localActionEmpty: 'I profili selezionati non contengono informazioni utilizzabili.', operationAlreadyRunning: 'È già in corso un’operazione per questa cartella.', noDocuments: 'Aggiungi un documento prima di avviare un’azione.', operationFailed: 'Operazione non riuscita. Consulta il registro per i dettagli.',
            actions: { summary: 'Sintesi', timeline: 'Crea cronologia', entities: 'Elenca le parti', obligations: 'Esamina gli obblighi', compare: 'Confronta le informazioni', divergences: 'Individua possibili differenze', amounts: 'Elenca gli importi' },
            steps: { prepare: 'Prepara la cartella', context: 'Carica i profili locali', analyze: 'Raggruppa le informazioni', save: 'Salva risultati e riferimenti' },
            stepDetails: { documents: '{count} documenti considerati', profiles: '{count} profili aggiornati su {total} documenti', results: '{count} elementi · {sources} riferimenti' },
            status: { pending: 'In attesa', running: 'In corso', completed: 'Completata', partial: 'Parziale', failed: 'Non riuscita', cancelled: 'Annullata', warning: 'Da verificare', processing: 'Profilo in corso', ready: 'Profilo pronto', not_analyzed: 'Genera il profilo', error: 'Errore del profilo' },
            notices: { document_limit_reached: 'È stato raggiunto il limite di {limit} documenti.', operation_busy: 'Un’altra sessione sta già elaborando questa operazione.', profiles_missing: 'Saltati {count} documenti senza un profilo aggiornato.', operation_cancelled: 'Operazione annullata.', document_deleted: 'Documento eliminato; l’operazione in attesa è stata annullata. La traccia storica è conservata.', operation_failed: 'Impossibile completare l’operazione.', operation_interrupted: 'Il browser è stato chiuso durante l’operazione.', response_interrupted: 'La risposta del modello è stata interrotta.', document_not_in_context: 'Documento escluso perché non è stato trovato un estratto utilizzabile.', context_limit_reached: 'Raggiunto il limite di contesto di {limit} caratteri.', unknown_notice: 'Un avviso richiede attenzione.' }
        }
    },
    en: {
        'app.streamTimeout': 'No data was received for 120 seconds; generation was interrupted. Retry with a smaller context.',
        'app.profileUpToDate': 'Profile already up to date.',
        'app.profileQueued': 'Profile added to the queue.',
        'app.profilesQueued': '{count} profile(s) added to the queue.',
        'app.profilesUpToDate': 'All profiles are already up to date.',
        'settings.noModels': 'No model available for this API key.',
        'documents.pagesUnavailable': 'Pages unavailable',
        'documents.pagesUnit': 'pages',
        dossier: {
            actionsTitle: 'Folder actions', timelineTitle: 'Timeline', timelineTab: 'Timeline', timelineEmpty: 'No events were extracted from the available profiles.',
            operationsTitle: 'Recent operations', operationsEmpty: 'No operations in this folder.', advancedOptions: 'Folder options',
            folderContextSetting: 'Context for future requests', inheritContextSetting: 'Use the general setting', manualContextSetting: 'Manual', automaticContextSetting: 'Automatic local',
            profileCoverage: '{ready} of {total} document profiles are current', localActionHelp: 'These actions group only local profiles for selected documents, or the whole folder when nothing is selected. They send no new content. Generating a profile remains an explicit action.',
            summaryLocalTitle: 'Local synthesis', summarySharedTitle: 'Shared items', summaryOverview: '{profiles} current profiles from {documents} documents: {events} events, {people} people, {organizations} organizations, {amounts} amounts, and {obligations} obligations. Comparison found {divergences} apparent differences to review.', summarySharedEntities: '{count} people or organizations appear in multiple profiles: {items}.',
            cancelOperation: 'Cancel', retryOperation: 'Retry', openResult: 'Open results', entitiesTitle: 'People and organizations', amountsTitle: 'Amounts', obligationsTitle: 'Obligations', amountsEmpty: 'No amounts in the available profiles.', obligationsEmpty: 'No obligations in the available profiles.',
            extractionUnverified: 'Check this extraction against the source document.', dateUnknown: 'Date not specified', progress: '{done} of {total} steps complete', localOnly: 'Processed locally · no data sent',
            traceSummary: '{documents} documents · {sources} references · {characters} context characters', traceIncluded: '{count} references included', traceOmitted: 'Document not included', showTrace: 'Show sources used', hideTrace: 'Hide sources used',
            localActionEmpty: 'The selected profiles contain no usable information.', operationAlreadyRunning: 'An operation is already running for this folder.', noDocuments: 'Add a document before starting an action.', operationFailed: 'The operation failed. See its log for details.',
            actions: { summary: 'Summary', timeline: 'Build timeline', entities: 'List parties', obligations: 'Review obligations', compare: 'Compare information', divergences: 'Find apparent differences', amounts: 'List amounts' },
            steps: { prepare: 'Prepare folder', context: 'Load local profiles', analyze: 'Group information', save: 'Save results and references' },
            stepDetails: { documents: '{count} documents selected', profiles: '{count} current profiles from {total} documents', results: '{count} items · {sources} references' },
            status: { pending: 'Pending', running: 'In progress', completed: 'Completed', partial: 'Partial', failed: 'Failed', cancelled: 'Cancelled', warning: 'Review needed', processing: 'Profile processing', ready: 'Profile ready', not_analyzed: 'Profile needed', error: 'Profile error' },
            notices: { document_limit_reached: 'The limit of {limit} documents was reached.', operation_busy: 'Another session is already processing this operation.', profiles_missing: 'Skipped {count} document(s) without a current profile.', operation_cancelled: 'Operation cancelled.', document_deleted: 'Document deleted; the pending operation was cancelled. Its historical result is retained.', operation_failed: 'The operation could not be completed.', operation_interrupted: 'The browser closed while this operation was running.', response_interrupted: 'The model response was interrupted.', document_not_in_context: 'Document omitted because no usable excerpt was selected.', context_limit_reached: 'The context limit of {limit} characters was reached.', unknown_notice: 'An item needs your attention.' }
        }
    },
    es: {
        'app.streamTimeout': 'No se recibieron datos durante 120 segundos; la generación se interrumpió. Reintente con un contexto reducido.',
        'app.profileUpToDate': 'Ficha ya actualizada.',
        'app.profileQueued': 'Ficha añadida a la cola.',
        'app.profilesQueued': '{count} ficha(s) añadida(s) a la cola.',
        'app.profilesUpToDate': 'Todas las fichas ya están actualizadas.',
        'settings.noModels': 'Ningún modelo disponible para esta clave API.',
        'documents.pagesUnavailable': 'Páginas no disponibles',
        'documents.pagesUnit': 'páginas',
        dossier: {
            actionsTitle: 'Acciones de la carpeta', timelineTitle: 'Cronología', timelineTab: 'Cronología', timelineEmpty: 'No se extrajeron eventos de las fichas disponibles.',
            operationsTitle: 'Operaciones recientes', operationsEmpty: 'No hay operaciones en esta carpeta.', advancedOptions: 'Opciones de la carpeta',
            folderContextSetting: 'Contexto para próximas solicitudes', inheritContextSetting: 'Usar el ajuste general', manualContextSetting: 'Manual', automaticContextSetting: 'Automático local',
            profileCoverage: '{ready} de {total} fichas de documentos están actualizadas', localActionHelp: 'Estas acciones agrupan solo fichas locales de los documentos seleccionados o de toda la carpeta si no hay selección. No envían contenido nuevo. Generar una ficha sigue siendo explícito.',
            summaryLocalTitle: 'Síntesis local', summarySharedTitle: 'Elementos comunes', summaryOverview: '{profiles} fichas actualizadas de {documents} documentos: {events} eventos, {people} personas, {organizations} organizaciones, {amounts} importes y {obligations} obligaciones. La comparación señala {divergences} posibles diferencias que revisar.', summarySharedEntities: '{count} personas u organizaciones aparecen en varias fichas: {items}.',
            cancelOperation: 'Cancelar', retryOperation: 'Reintentar', openResult: 'Abrir resultados', entitiesTitle: 'Partes y organizaciones', amountsTitle: 'Importes', obligationsTitle: 'Obligaciones', amountsEmpty: 'No hay importes en las fichas disponibles.', obligationsEmpty: 'No hay obligaciones en las fichas disponibles.',
            extractionUnverified: 'Compruebe la extracción en el documento de origen.', dateUnknown: 'Fecha no especificada', progress: '{done} de {total} pasos completados', localOnly: 'Procesado localmente · no se enviaron datos',
            traceSummary: '{documents} documentos · {sources} referencias · {characters} caracteres de contexto', traceIncluded: '{count} referencias incluidas', traceOmitted: 'Documento no incluido', showTrace: 'Mostrar fuentes utilizadas', hideTrace: 'Ocultar fuentes utilizadas',
            localActionEmpty: 'Las fichas seleccionadas no contienen información utilizable.', operationAlreadyRunning: 'Ya hay una operación en curso en esta carpeta.', noDocuments: 'Añada un documento antes de iniciar una acción.', operationFailed: 'La operación falló. Consulte su registro para ver los detalles.',
            actions: { summary: 'Resumen', timeline: 'Crear cronología', entities: 'Listar partes', obligations: 'Revisar obligaciones', compare: 'Comparar información', divergences: 'Detectar diferencias aparentes', amounts: 'Listar importes' },
            steps: { prepare: 'Preparar carpeta', context: 'Cargar fichas locales', analyze: 'Agrupar información', save: 'Guardar resultados y referencias' },
            stepDetails: { documents: '{count} documentos seleccionados', profiles: '{count} fichas actualizadas de {total} documentos', results: '{count} elementos · {sources} referencias' },
            status: { pending: 'Pendiente', running: 'En curso', completed: 'Completada', partial: 'Parcial', failed: 'Fallida', cancelled: 'Cancelada', warning: 'Revisar', processing: 'Ficha en curso', ready: 'Ficha lista', not_analyzed: 'Generar ficha', error: 'Error de ficha' },
            notices: { document_limit_reached: 'Se alcanzó el límite de {limit} documentos.', operation_busy: 'Otra sesión ya está procesando esta operación.', profiles_missing: 'Se omitieron {count} documentos sin una ficha actualizada.', operation_cancelled: 'Operación cancelada.', document_deleted: 'Documento eliminado; se canceló la operación pendiente. Se conserva su resultado histórico.', operation_failed: 'No se pudo completar la operación.', operation_interrupted: 'El navegador se cerró durante esta operación.', response_interrupted: 'La respuesta del modelo se interrumpió.', document_not_in_context: 'Documento omitido porque no se seleccionó ningún extracto adecuado.', context_limit_reached: 'Se alcanzó el límite de contexto de {limit} caracteres.', unknown_notice: 'Un aviso requiere atención.' }
        }
    }
};
function mergeMissingTranslations(target, source) {
    for (const [key, value] of Object.entries(source)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            target[key] = target[key] && typeof target[key] === 'object' ? target[key] : {};
            mergeMissingTranslations(target[key], value);
        } else if (typeof target[key] !== 'string') target[key] = value;
    }
}
for (const [lang, entries] of Object.entries(SEALARCA_I18N_FALLBACKS)) {
    const root = SEALARCA_I18N[lang] || (SEALARCA_I18N[lang] = {});
    for (const [path, value] of Object.entries(entries)) {
        if (typeof value === 'string' && path.includes('.')) {
            const parts = path.split('.');
            let target = root;
            for (const part of parts.slice(0, -1)) {
                target[part] = target[part] && typeof target[part] === 'object' ? target[part] : {};
                target = target[part];
            }
            if (typeof target[parts[parts.length - 1]] !== 'string') target[parts[parts.length - 1]] = value;
        } else mergeMissingTranslations(root, { [path]: value });
    }
}

window.SEALARCA_I18N = SEALARCA_I18N;

const PROFILE_DATE_LABELS = {
    fr: 'Dernière fiche : {date}',
    de: 'Letztes Profil: {date}',
    it: 'Ultimo profilo: {date}',
    en: 'Last profile: {date}',
    es: 'Última ficha: {date}'
};
for (const [language, label] of Object.entries(PROFILE_DATE_LABELS)) {
    SEALARCA_I18N[language].documents.lastProfileDate = label;
}

const DOCUMENT_NOTICE_LABELS = {
    fr: { document_profile_missing: 'Document non traité, fiche absente ou périmée : {name}.', document_extraction_partial: 'Extraction partielle du document : {name}. Le résultat repose sur le texte disponible.' },
    de: { document_profile_missing: 'Dokument nicht verarbeitet, Profil fehlt oder ist veraltet: {name}.', document_extraction_partial: 'Dokument teilweise extrahiert: {name}. Das Ergebnis beruht auf dem verfügbaren Text.' },
    it: { document_profile_missing: 'Documento non elaborato, scheda assente o obsoleta: {name}.', document_extraction_partial: 'Estrazione parziale del documento: {name}. Il risultato si basa sul testo disponibile.' },
    en: { document_profile_missing: 'Document not processed; profile missing or outdated: {name}.', document_extraction_partial: 'Partially extracted document: {name}. The result uses the available text.' },
    es: { document_profile_missing: 'Documento no procesado, ficha ausente o desactualizada: {name}.', document_extraction_partial: 'Extracción parcial del documento: {name}. El resultado se basa en el texto disponible.' }
};
for (const [language, labels] of Object.entries(DOCUMENT_NOTICE_LABELS)) {
    Object.assign(SEALARCA_I18N[language].dossier.notices, labels);
}

const RELEASE_REPAIR_LABELS = {
    fr: ['Réextraire localement', 'Original absent : réimportez le document', 'Extraction à actualiser', 'Extraction actualisée localement. La fiche précédente est périmée.', 'Échec de la réextraction', 'Import arrêté : le dossier destinataire a été supprimé.', 'Couverture complète : {sent}/{total} caractères, {sources}/{allSources} sources', 'Couverture partielle : {sent}/{total} caractères, {sources}/{allSources} sources', 'Couverture inconnue — régénérez explicitement la fiche', 'Résultat réseau indéterminé. La requête peut avoir été traitée ; une relance explicite peut la répéter.', 'Fiche de couverture partielle : {name}.', 'Fiche de couverture inconnue : {name}.', 'Extraction à actualiser : {name}.', 'Structure ODT non prise en charge : {structure}. Son texte peut être absent.'],
    de: ['Lokal neu extrahieren', 'Original fehlt: Dokument erneut importieren', 'Extraktion aktualisieren', 'Extraktion lokal aktualisiert. Das bisherige Profil ist veraltet.', 'Erneute Extraktion fehlgeschlagen', 'Import gestoppt: Zielordner wurde gelöscht.', 'Vollständige Abdeckung: {sent}/{total} Zeichen, {sources}/{allSources} Quellen', 'Teilweise Abdeckung: {sent}/{total} Zeichen, {sources}/{allSources} Quellen', 'Abdeckung unbekannt — Profil ausdrücklich neu erstellen', 'Netzwerkergebnis unbestimmt. Die Anfrage könnte verarbeitet worden sein; ein ausdrücklicher Neustart kann sie wiederholen.', 'Profil mit teilweiser Abdeckung: {name}.', 'Profil mit unbekannter Abdeckung: {name}.', 'Extraktion aktualisieren: {name}.', 'Nicht unterstützte ODT-Struktur: {structure}. Text kann fehlen.'],
    it: ['Estrarre di nuovo localmente', 'Originale assente: reimportare il documento', 'Estrazione da aggiornare', 'Estrazione aggiornata localmente. La scheda precedente è obsoleta.', 'Nuova estrazione non riuscita', 'Importazione interrotta: cartella di destinazione eliminata.', 'Copertura completa: {sent}/{total} caratteri, {sources}/{allSources} fonti', 'Copertura parziale: {sent}/{total} caratteri, {sources}/{allSources} fonti', 'Copertura sconosciuta — rigenerare esplicitamente la scheda', 'Esito di rete indeterminato. La richiesta potrebbe essere stata elaborata; un nuovo tentativo esplicito può ripeterla.', 'Scheda con copertura parziale: {name}.', 'Scheda con copertura sconosciuta: {name}.', 'Estrazione da aggiornare: {name}.', 'Struttura ODT non supportata: {structure}. Il testo può essere assente.'],
    en: ['Re-extract locally', 'Original unavailable: import the document again', 'Extraction needs updating', 'Extraction updated locally. The previous profile is outdated.', 'Re-extraction failed', 'Import stopped: the destination folder was deleted.', 'Complete coverage: {sent}/{total} characters, {sources}/{allSources} sources', 'Partial coverage: {sent}/{total} characters, {sources}/{allSources} sources', 'Unknown coverage — explicitly regenerate the profile', 'Network outcome unknown. The request may have been processed; an explicit retry may repeat it.', 'Profile with partial coverage: {name}.', 'Profile with unknown coverage: {name}.', 'Extraction needs updating: {name}.', 'Unsupported ODT structure: {structure}. Its text may be missing.'],
    es: ['Volver a extraer localmente', 'Original ausente: vuelva a importar el documento', 'Extracción pendiente de actualizar', 'Extracción actualizada localmente. La ficha anterior está desactualizada.', 'Error al volver a extraer', 'Importación detenida: carpeta de destino eliminada.', 'Cobertura completa: {sent}/{total} caracteres, {sources}/{allSources} fuentes', 'Cobertura parcial: {sent}/{total} caracteres, {sources}/{allSources} fuentes', 'Cobertura desconocida — regenere explícitamente la ficha', 'Resultado de red indeterminado. La solicitud puede haberse procesado; un reintento explícito puede repetirla.', 'Ficha con cobertura parcial: {name}.', 'Ficha con cobertura desconocida: {name}.', 'Extracción pendiente de actualizar: {name}.', 'Estructura ODT no compatible: {structure}. Su texto puede faltar.']
};
for (const [language, labels] of Object.entries(RELEASE_REPAIR_LABELS)) {
    const keys = ['reextract', 'reimportRequired', 'extractionOutdated', 'reextractSuccess', 'reextractFailed', 'importFolderDeleted', 'coverageComplete', 'coveragePartial', 'coverageUnknown', 'outcomeUnknown'];
    keys.forEach((key, index) => { SEALARCA_I18N[language].documents[key] = labels[index]; });
    ['profile_coverage_partial', 'profile_coverage_unknown', 'document_extraction_outdated'].forEach((key, index) => { SEALARCA_I18N[language].dossier.notices[key] = labels[index + 10]; });
    SEALARCA_I18N[language].extraction.odf_structure = labels[13];
}
