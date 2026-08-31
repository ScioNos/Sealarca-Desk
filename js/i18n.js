/**
 * Sealarca-Desk — Dictionnaire Internationalisation (i18n)
 * Support complet : Français (FR), Deutsch (DE), Italiano (IT), English (EN), Español (ES)
 * Aligné avec le vocabulaire officiel de sealarca.ch
 */

const SEALARCA_I18N = {
    // --- 🇫🇷 Français ---
    fr: {
        app: {
            name: 'Sealarca',
            desk: 'Desk',
            newChat: 'Nouvelle consultation',
            searchPlaceholder: 'Rechercher...',
            noConversations: 'Aucune consultation enregistrée',
            apiKey: 'Clé API',
            edit: 'Modifier',
            model: 'Modèle',
            close: 'Fermer',
            themeDark: 'Activer le thème sombre',
            themeLight: 'Activer le thème clair',
            roles: 'Rôles métiers',
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
            desc: "Traitez vos contrats, bilans, dossiers et documents confidentiels en toute sérénité. Vos requêtes sont traitées dans un environnement matériellement isolé et chiffré en Suisse.",
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
            roleLabel: "Rôle",
            send: "Envoyer",
            stop: "Arrêter la génération"
        },
        settings: {
            title: "🔐 Connecter Sealarca Desk",
            desc: "Saisissez votre clé API Sealarca pour connecter Desk. Elle reste dans la session de cet onglet et est supprimée quand la session se termine ou quand vous l’oubliez.",
            apiKeyLabel: "Clé API Sealarca",
            apiKeyHint: "Disponible dans votre espace client sealarca.ch. Elle sert uniquement aux appels vers le Vault.",
            getKey: "Obtenir une clé sur sealarca.ch",
            chooseModel: "Choisissez un modèle",
            modelRequired: "Choisissez un modèle avant d’enregistrer.",
            closeBtn: "Fermer",
            networkError: "Impossible de joindre Sealarca. Vérifiez votre connexion et l’accès réseau de la page locale.",
            endpointLabel: "Endpoint API",
            endpointHint: "Par défaut : https://sealarca.ch/v1",
            modelsTitle: "Modèles disponibles dans votre Vault",
            testBtn: "🔄 Tester & Découvrir",
            syncing: "Synchronisation...",
            saveBtn: "Enregistrer",
            keyMissing: "Veuillez renseigner votre clé API Sealarca.",
            syncSuccess: "✅ Modèles Sealarca synchronisés",
            forgetBtn: "Oublier la clé",
            showKey: "Afficher la clé",
            hideKey: "Masquer la clé"
        },
        roles: {
            title: "⚖️ Rôles & Personas Métiers",
            desc: "Sélectionnez un profil pour adapter le comportement de l'IA à vos exigences professionnelles :",
            activeBadge: "✓ ACTIF",
            closeBtn: "Fermer",
            legal: {
                name: "Juriste & Droit des Contrats",
                icon: "⚖️",
                desc: "Analyse rigoureuse de clauses contractuelles, identification des risques et conformité (CO/LPD)."
            },
            fiduciary: {
                name: "Expert Fiscal & Fiduciaire",
                icon: "📊",
                desc: "Analyse de bilans, comptes de résultat, ratios financiers et conformité fiscale."
            },
            compliance: {
                name: "Conformité & Secret Professionnel",
                icon: "🛡️",
                desc: "Vérification de conformité réglementaire, diligence raisonnable (KYC/LBA) et confidentialité."
            },
            executive: {
                name: "Synthèse Exécutive & Rédaction",
                icon: "✍️",
                desc: "Restitution synthétique, mémos de direction, comptes-rendus et courriers officiels."
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
        app: {
            name: 'Sealarca',
            desk: 'Desk',
            newChat: 'Neue Konsultation',
            searchPlaceholder: 'Suchen...',
            noConversations: 'Keine Konsultationen gespeichert',
            apiKey: 'API-Schlüssel',
            edit: 'Bearbeiten',
            model: 'Modell',
            close: 'Schließen',
            themeDark: 'Dunkles Thema aktivieren',
            themeLight: 'Helles Thema aktivieren',
            roles: 'Fachrollen',
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
            desc: "Verarbeiten Sie Verträge, Bilanzen, Akten und vertrauliche Dokumente mit voller Sicherheit. Ihre Anfragen werden in einer hardware-isolierten und verschlüsselten Umgebung in der Schweiz verarbeitet.",
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
            roleLabel: "Rolle",
            send: "Senden",
            stop: "Generierung stoppen"
        },
        settings: {
            title: "🔐 Sealarca Desk verbinden",
            desc: "Geben Sie Ihren Sealarca API-Schlüssel ein. Er bleibt in der Sitzung dieses Tabs und wird beim Sitzungsende oder beim Vergessen gelöscht.",
            apiKeyLabel: "Sealarca API-Schlüssel",
            apiKeyHint: "Verfügbar in Ihrem Kundenbereich auf sealarca.ch. Er wird nur für Aufrufe an den Vault verwendet.",
            getKey: "Schlüssel auf sealarca.ch erhalten",
            chooseModel: "Modell auswählen",
            modelRequired: "Wählen Sie vor dem Speichern ein Modell aus.",
            closeBtn: "Schließen",
            networkError: "Sealarca ist nicht erreichbar. Prüfen Sie Verbindung und Netzwerkzugriff der lokalen Seite.",
            endpointLabel: "API-Endpunkt",
            endpointHint: "Standard: https://sealarca.ch/v1",
            modelsTitle: "Verfügbare Modelle in Ihrem Vault",
            testBtn: "🔄 Testen & Erkennen",
            syncing: "Synchronisierung...",
            saveBtn: "Speichern",
            keyMissing: "Bitte geben Sie Ihren Sealarca API-Schlüssel ein.",
            syncSuccess: "✅ Sealarca-Modelle synchronisiert",
            forgetBtn: "Schlüssel vergessen",
            showKey: "Schlüssel anzeigen",
            hideKey: "Schlüssel ausblenden"
        },
        roles: {
            title: "⚖️ Fachrollen & Personas",
            desc: "Wählen Sie ein Profil, um das KI-Verhalten an Ihre beruflichen Anforderungen anzupassen:",
            activeBadge: "✓ AKTIV",
            closeBtn: "Schließen",
            legal: {
                name: "Recht & Vertragsrecht",
                icon: "⚖️",
                desc: "Sorgfältige Klauselprüfung, Risikoerkennung und Schweizer Rechtskonformität (OR/DSG)."
            },
            fiduciary: {
                name: "Steuer- & Treuhandexperte",
                icon: "📊",
                desc: "Analyse von Bilanzen, Erfolgsrechnungen, Finanzkennzahlen und Steuerfragen."
            },
            compliance: {
                name: "Compliance & Berufsgeheimnis",
                icon: "🛡️",
                desc: "Prüfung regulatorischer Vorgaben, Sorgfaltspflichten (GwG/VSB) und Datenschutz."
            },
            executive: {
                name: "Executive Summary & Redaktion",
                icon: "✍️",
                desc: "Präzise Direktionsmemos, Sitzungsprotokolle und offizielle Korrespondenz."
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
        app: {
            name: 'Sealarca',
            desk: 'Desk',
            newChat: 'Nuova consultazione',
            searchPlaceholder: 'Cerca...',
            noConversations: 'Nessuna consultazione salvata',
            apiKey: 'Chiave API',
            edit: 'Modifica',
            model: 'Modello',
            close: 'Chiudi',
            themeDark: 'Attiva tema scuro',
            themeLight: 'Attiva tema chiaro',
            roles: 'Ruoli professionali',
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
            desc: "Elabora contratti, bilanci, fascicoli e documenti riservati in totale sicurezza. Le tue richieste vengono elaborate in un ambiente crittografato e isolato a livello hardware in Svizzera.",
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
            roleLabel: "Ruolo",
            send: "Invia",
            stop: "Interrompi generazione"
        },
        settings: {
            title: "🔐 Collega Sealarca Desk",
            desc: "Inserisci la tua chiave API Sealarca. Rimane nella sessione di questa scheda e viene eliminata alla fine della sessione o quando la dimentichi.",
            apiKeyLabel: "Chiave API Sealarca",
            apiKeyHint: "Disponibile nella tua area clienti su sealarca.ch. Viene usata solo per le chiamate al Vault.",
            getKey: "Ottieni una chiave su sealarca.ch",
            chooseModel: "Scegli un modello",
            modelRequired: "Scegli un modello prima di salvare.",
            closeBtn: "Chiudi",
            networkError: "Impossibile contattare Sealarca. Verifica la connessione e l’accesso di rete della pagina locale.",
            endpointLabel: "Endpoint API",
            endpointHint: "Predefinito: https://sealarca.ch/v1",
            modelsTitle: "Modelli disponibili nel tuo Vault",
            testBtn: "🔄 Testa & Rileva",
            syncing: "Sincronizzazione...",
            saveBtn: "Salva",
            keyMissing: "Inserisci la tua chiave API Sealarca.",
            syncSuccess: "✅ Modelli Sealarca sincronizzati",
            forgetBtn: "Dimentica la chiave",
            showKey: "Mostra chiave",
            hideKey: "Nascondi chiave"
        },
        roles: {
            title: "⚖️ Ruoli & Profili Professionali",
            desc: "Seleziona un profilo per adattare il comportamento dell'IA alle tue esigenze professionali:",
            activeBadge: "✓ ATTIVO",
            closeBtn: "Chiudi",
            legal: {
                name: "Giurista & Diritto Contrattuale",
                icon: "⚖️",
                desc: "Analisi rigorosa delle clausole, identificazione dei rischi e conformità (CO/LPD svizzera)."
            },
            fiduciary: {
                name: "Esperto Fiscale & Fiduciario",
                icon: "📊",
                desc: "Analisi di bilanci, conti economici, indici finanziari e conformità fiscale."
            },
            compliance: {
                name: "Compliance & Segreto Professionale",
                icon: "🛡️",
                desc: "Verifica della conformità normativa, due diligence (RDLA/CDB) e riservatezza."
            },
            executive: {
                name: "Sintesi Esecutiva & Redazione",
                icon: "✍️",
                desc: "Note di sintesi dirigenziali, verbali e corrispondenza istituzionale."
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
        app: {
            name: 'Sealarca',
            desk: 'Desk',
            newChat: 'New consultation',
            searchPlaceholder: 'Search...',
            noConversations: 'No saved consultations',
            apiKey: 'API Key',
            edit: 'Edit',
            model: 'Model',
            close: 'Close',
            themeDark: 'Enable dark theme',
            themeLight: 'Enable light theme',
            roles: 'Professional roles',
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
            desc: "Process confidential contracts, statements, files, and reports with full peace of mind. Your requests are processed inside a hardware-isolated, encrypted environment in Switzerland.",
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
            roleLabel: "Role",
            send: "Send",
            stop: "Stop generation"
        },
        settings: {
            title: "🔐 Connect Sealarca Desk",
            desc: "Enter your Sealarca API key. It stays in this tab’s session and is removed when the session ends or when you forget it.",
            apiKeyLabel: "Sealarca API Key",
            apiKeyHint: "Available in your client dashboard at sealarca.ch. It is used only for Vault requests.",
            getKey: "Get a key at sealarca.ch",
            chooseModel: "Choose a model",
            modelRequired: "Choose a model before saving.",
            closeBtn: "Close",
            networkError: "Sealarca could not be reached. Check your connection and the local page’s network access.",
            endpointLabel: "API Endpoint",
            endpointHint: "Default: https://sealarca.ch/v1",
            modelsTitle: "Available models in your Vault",
            testBtn: "🔄 Test & Discover",
            syncing: "Syncing...",
            saveBtn: "Save",
            keyMissing: "Please enter your Sealarca API key.",
            syncSuccess: "✅ Sealarca models synchronized",
            forgetBtn: "Forget key",
            showKey: "Show key",
            hideKey: "Hide key"
        },
        roles: {
            title: "⚖️ Professional Roles & Personas",
            desc: "Select a profile to align AI behavior with your exact professional standards:",
            activeBadge: "✓ ACTIVE",
            closeBtn: "Close",
            legal: {
                name: "Legal & Contract Law",
                icon: "⚖️",
                desc: "Thorough clause review, risk assessment, and Swiss/international compliance (CO/FADP)."
            },
            fiduciary: {
                name: "Tax & Fiduciary Expert",
                icon: "📊",
                desc: "Balance sheet reviews, financial ratios, P&L statements, and tax compliance."
            },
            compliance: {
                name: "Compliance & Professional Secrecy",
                icon: "🛡️",
                desc: "Regulatory compliance checks, KYC/AMLA due diligence, and confidentiality."
            },
            executive: {
                name: "Executive Summary & Drafting",
                icon: "✍️",
                desc: "Concise executive briefing memos, board minutes, and official correspondence."
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
        app: {
            name: 'Sealarca',
            desk: 'Desk',
            newChat: 'Nueva consulta',
            searchPlaceholder: 'Buscar...',
            noConversations: 'Sin consultas guardadas',
            apiKey: 'Clave API',
            edit: 'Modificar',
            model: 'Modelo',
            close: 'Cerrar',
            themeDark: 'Activar el tema oscuro',
            themeLight: 'Activar el tema claro',
            roles: 'Roles profesionales',
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
            desc: "Procese contratos, balances, expedientes y documentos confidenciales con total seguridad. Sus solicitudes se procesan en un entorno aislado por hardware y cifrado en Suiza.",
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
            roleLabel: "Rol",
            send: "Enviar",
            stop: "Detener generación"
        },
        settings: {
            title: "🔐 Conectar Sealarca Desk",
            desc: "Introduzca su clave API Sealarca. Permanece en la sesión de esta pestaña y se elimina al finalizar la sesión o al olvidarla.",
            apiKeyLabel: "Clave API Sealarca",
            apiKeyHint: "Disponible en su área de cliente en sealarca.ch. Solo se utiliza para las solicitudes al Vault.",
            getKey: "Obtener una clave en sealarca.ch",
            chooseModel: "Elija un modelo",
            modelRequired: "Elija un modelo antes de guardar.",
            closeBtn: "Cerrar",
            networkError: "No se puede contactar con Sealarca. Compruebe la conexión y el acceso de red de la página local.",
            endpointLabel: "Endpoint API",
            endpointHint: "Por defecto: https://sealarca.ch/v1",
            modelsTitle: "Modelos disponibles en su Vault",
            testBtn: "🔄 Probar y Descubrir",
            syncing: "Sincronizando...",
            saveBtn: "Guardar",
            keyMissing: "Por favor, introduzca su clave API Sealarca.",
            syncSuccess: "✅ Modelos de Sealarca sincronizados",
            forgetBtn: "Olvidar clave",
            showKey: "Mostrar clave",
            hideKey: "Ocultar clave"
        },
        roles: {
            title: "⚖️ Roles y Perfiles Profesionales",
            desc: "Seleccione un perfil para adaptar el comportamiento de la IA a sus requisitos profesionales:",
            activeBadge: "✓ ACTIVO",
            closeBtn: "Cerrar",
            legal: {
                name: "Jurista y Derecho Contractual",
                icon: "⚖️",
                desc: "Análisis riguroso de cláusulas, detección de riesgos y cumplimiento normativo (CO/LPD)."
            },
            fiduciary: {
                name: "Experto Fiscal y Fiduciario",
                icon: "📊",
                desc: "Análisis de balances, estados de resultados, ratios financieros y fiscalidad."
            },
            compliance: {
                name: "Cumplimiento y Secreto Profesional",
                icon: "🛡️",
                desc: "Verificación de cumplimiento normativo, debida diligencia (PBC/KYC) y confidencialidad."
            },
            executive: {
                name: "Resumen Ejecutivo y Redacción",
                icon: "✍️",
                desc: "Notas ejecutivas de síntesis, actas y correspondencia institucional."
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
