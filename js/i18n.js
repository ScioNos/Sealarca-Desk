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
            roles: 'Rôles métiers',
            vaultStatus: 'VAULT ISOLÉ',
            connecting: 'Connexion à Sealarca...',
            copy: 'Copier',
            copied: 'Copié !',
            delete: 'Supprimer',
            deleteConfirm: 'Voulez-vous supprimer cette consultation ?',
            you: 'Vous'
        },
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
            title: "🔐 Configuration Sealarca Vault",
            desc: "Renseignez votre clé API Sealarca. Vos identifiants restent stockés exclusivement sur votre machine locale.",
            apiKeyLabel: "Clé API Sealarca",
            apiKeyHint: "Disponible sur votre espace client sealarca.ch",
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
            roles: 'Fachrollen',
            vaultStatus: 'VAULT ISOLIERT',
            connecting: 'Verbindung zu Sealarca...',
            copy: 'Kopieren',
            copied: 'Kopiert!',
            delete: 'Löschen',
            deleteConfirm: 'Möchten Sie diese Konsultation löschen?',
            you: 'Sie'
        },
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
            title: "🔐 Sealarca Vault Konfiguration",
            desc: "Geben Sie Ihren Sealarca API-Schlüssel ein. Ihre Zugangsdaten bleiben ausschließlich auf Ihrem lokalen Rechner gespeichert.",
            apiKeyLabel: "Sealarca API-Schlüssel",
            apiKeyHint: "Verfügbar in Ihrem Kundenbereich auf sealarca.ch",
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
            roles: 'Ruoli professionali',
            vaultStatus: 'VAULT ISOLATO',
            connecting: 'Connessione a Sealarca...',
            copy: 'Copia',
            copied: 'Copiato!',
            delete: 'Elimina',
            deleteConfirm: 'Vuoi eliminare questa consultazione?',
            you: 'Tu'
        },
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
            title: "🔐 Configurazione Sealarca Vault",
            desc: "Inserisci la tua chiave API Sealarca. Le tue credenziali rimangono memorizzate esclusivamente sul tuo computer locale.",
            apiKeyLabel: "Chiave API Sealarca",
            apiKeyHint: "Disponibile nella tua area clienti su sealarca.ch",
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
            roles: 'Professional roles',
            vaultStatus: 'ISOLATED VAULT',
            connecting: 'Connecting to Sealarca...',
            copy: 'Copy',
            copied: 'Copied!',
            delete: 'Delete',
            deleteConfirm: 'Do you want to delete this consultation?',
            you: 'You'
        },
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
            title: "🔐 Sealarca Vault Settings",
            desc: "Enter your Sealarca API key. Your credentials stay strictly on your local machine.",
            apiKeyLabel: "Sealarca API Key",
            apiKeyHint: "Available in your client dashboard at sealarca.ch",
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
            roles: 'Roles profesionales',
            vaultStatus: 'VAULT AISLADO',
            connecting: 'Conectando a Sealarca...',
            copy: 'Copiar',
            copied: '¡Copiado!',
            delete: 'Eliminar',
            deleteConfirm: '¿Desea eliminar esta consulta?',
            you: 'Usted'
        },
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
            title: "🔐 Configuración Sealarca Vault",
            desc: "Introduzca su clave API Sealarca. Sus credenciales permanecen guardadas exclusivamente en su máquina local.",
            apiKeyLabel: "Clave API Sealarca",
            apiKeyHint: "Disponible en su área de cliente en sealarca.ch",
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
