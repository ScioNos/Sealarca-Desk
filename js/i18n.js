/**
 * Sealarca-Desk — Dictionnaire Internationalisation (i18n)
 * Support complet : Français (FR), Deutsch (DE), Italiano (IT), English (EN), Español (ES)
 * Aligné avec le vocabulaire officiel de sealarca.ch
 */

const SEALARCA_I18N = {
    // --- 🇫🇷 Français ---
    fr: {
        extraction: {"tooLarge": "Le tableau extrait dépasse la limite de 500 000 caractères.", "rows": "{sheet} : seules les {used} premières lignes sur {total} ont été extraites.", "pdf_pages": "Pages sans texte exploitable : {pages}. Aucun OCR intégré ; ces pages ne sont pas transmises comme texte.", "noText": "Ce PDF ne contient aucun texte exploitable. Desk ne fait pas d’OCR. Utilisez une copie avec couche texte."},
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
            endpointHint: "Par défaut : https://sealarca.ch/v1",
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
        extraction: {"tooLarge": "Die extrahierte Tabelle überschreitet die Grenze von 500 000 Zeichen.", "rows": "{sheet}: Nur die ersten {used} von {total} Zeilen wurden extrahiert.", "pdf_pages": "Seiten ohne auslesbaren Text: {pages}. Keine integrierte OCR; diese Seiten werden nicht als Text gesendet.", "noText": "Dieses PDF enthält keinen auslesbaren Text. Desk bietet keine OCR. Verwenden Sie eine Kopie mit Textebene."},
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
            endpointHint: "Standard: https://sealarca.ch/v1",
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
        extraction: {"tooLarge": "La tabella estratta supera il limite di 500 000 caratteri.", "rows": "{sheet}: estratte solo le prime {used} righe su {total}.", "pdf_pages": "Pagine senza testo estraibile: {pages}. Nessun OCR integrato; queste pagine non vengono inviate come testo.", "noText": "Questo PDF non contiene testo estraibile. Desk non dispone di OCR. Utilizzare una copia con un livello di testo."},
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
            endpointHint: "Predefinito: https://sealarca.ch/v1",
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
        extraction: {"tooLarge": "The extracted table exceeds the 500,000-character limit.", "rows": "{sheet}: only the first {used} of {total} rows were extracted.", "pdf_pages": "Pages without extractable text: {pages}. No built-in OCR; these pages are not sent as text.", "noText": "This PDF has no extractable text. Desk has no OCR. Use a copy with a text layer."},
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
            endpointHint: "Default: https://sealarca.ch/v1",
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
        extraction: {"tooLarge": "La tabla extraída supera el límite de 500 000 caracteres.", "rows": "{sheet}: solo se han extraído las primeras {used} de {total} filas.", "pdf_pages": "Páginas sin texto extraíble: {pages}. Sin OCR integrado; estas páginas no se envían como texto.", "noText": "Este PDF no contiene texto extraíble. Desk no dispone de OCR. Utilice una copia con una capa de texto."},
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
            endpointHint: "Por defecto: https://sealarca.ch/v1",
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

window.SEALARCA_I18N = SEALARCA_I18N;
