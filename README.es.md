<div align="center">

# 🛡️ Sealarca-Desk

**Cliente de Escritorio y Web Local Autónomo para la Pasarela de IA Suiza [Sealarca](https://sealarca.ch)**  
*IA en una bóveda digital para datos altamente confidenciales y regulados.*

[![License: MIT](https://img.shields.io/badge/License-MIT-087F68.svg)](LICENSE)
[![Zero-Install](https://img.shields.io/badge/Instalaci%C3%B3n-0%20Install-101820.svg)](#-inicio-r%C3%A1pido)
[![Offline-Ready](https://img.shields.io/badge/Dependencias-100%25%20Local-137A52.svg)](#-arquitectura-y-confidencialidad)

---

🌐 **Language / Langue / Sprache / Lingua / Idioma**  
[English 🇬🇧](README.md) · [Français 🇫🇷](README.fr.md) · [Deutsch 🇩🇪](README.de.md) · [Italiano 🇮🇹](README.it.md) · **Español**

---

</div>

## 📖 Descripción General

**Sealarca-Desk** es una interfaz de chat y análisis documental diseñada específicamente para profesionales sujetos al secreto profesional y a estrictos requisitos de cumplimiento normativo (**bufetes de abogados, notarías, asesores fiscales y fiduciarios, banca e instituciones financieras, sanidad, responsables de cumplimiento**).

La aplicación se ejecuta **íntegramente en el navegador local de su equipo**, no requiere infraestructura de servidor intermedia, no incluye rastreadores externos y se conecta directamente a su **Bóveda Sealarca (Vault)** mediante sus credenciales de API.

---

## ✨ Características Principales

* 🔒 **Confidencialidad y Anonimato Absolutos**:
  * Sin telemetría ni servidores intermediarios.
  * El historial de chat y los documentos permanecen exclusivamente en su base de datos local (**IndexedDB**).
* 🔑 **Experiencia "Cero Configuración"**:
  * Simplemente introduzca su **Clave API de Sealarca**.
  * Detección automática y dinámica de los modelos disponibles en su Vault (`GET /v1/models`).
* 📄 **Procesador Multidocumento 100% Local**:
  * Arrastre y suelte cualquier documento de trabajo directamente en la interfaz:
    * **Microsoft Office**: Word (`.docx`), Excel (`.xlsx`), PowerPoint (`.pptx`).
    * **LibreOffice / OpenDocument**: Texto (`.odt`), Hojas de cálculo (`.ods`).
    * **PDF y Texto**: Documentos PDF (`.pdf`), hojas CSV (`.csv`), Markdown y texto plano (`.txt`, `.md`, `.json`).
  * La extracción de texto y tablas se convierte a Markdown estructurado **directamente en su equipo** antes de la transmisión cifrada al Vault.
* 🧠 **Transmisión en Tiempo Real y Razonamiento Profundo**:
  * Streaming fluido Server-Sent Events (SSE) con panel desplegable dedicado para los tokens de razonamiento (*thinking mode*).
* ⚖️ **Perfiles Profesionales Suizos Integrados (Personas)**:
  * *Jurista y Derecho Contractual* (Auditoría de cláusulas, análisis de riesgos y cumplimiento CO/LPD suizo).
  * *Experto Fiscal y Fiduciario* (Balances, cuentas de resultados, ratios financieros).
  * *Cumplimiento y Secreto Profesional* (Diligencia debida PBC/KYC, revisiones normativas).
  * *Resumen Ejecutivo y Redacción* (Notas ejecutivas de síntesis y correspondencia oficial).
* 🌐 **Internacionalización Completa en 5 Idiomas**:
  * Soporte para **Español (`ES`)**, **Français (`FR`)**, **Deutsch (`DE`)**, **Italiano (`IT`)** e **English (`EN`)**.
  * Detección automática del idioma del sistema y selector rápido en la cabecera.
* ⚡ **Cero Instalación / 100% Sin Conexión (Sin CDN)**:
  * No requiere `Node.js` ni `npm`.
  * Todas las librerías están almacenadas localmente en la carpeta `vendor/`.

---

## 🚀 Inicio Rápido

### 1. Iniciar la Aplicación
Haga doble clic en el archivo **`index.html`** en su explorador de archivos.  
La aplicación se abrirá instantáneamente en su navegador web predeterminado (Chrome, Edge, Safari, Firefox).

```text
Sealarca-Desk/
├── index.html       <─── ¡Haga doble clic aquí para iniciar!
```

### 2. Introduzca su Clave API
1. En el primer inicio, la ventana de configuración se abrirá automáticamente.
2. Introduzca su clave API de Sealarca (disponible en su panel de cliente en [sealarca.ch](https://sealarca.ch)).
3. Haga clic en **"Guardar"**: sus modelos del Vault se sincronizarán automáticamente.

---

## 🛠️ Arquitectura Técnica

```text
Sealarca-Desk/
├── index.html               # Aplicación reactiva de página única (Alpine.js)
├── css/
│   ├── theme.css            # Tokens de diseño oficiales de Sealarca y modo oscuro
│   ├── layout.css           # Estructura Flexbox/Grid adaptable
│   └── components.css       # Burbujas de mensajes, Markdown, bloques de código
├── vendor/                  # Dependencias 100% locales (Cero CDN)
│   ├── alpine-csp.min.js    # Motor UI reactivo compatible con CSP
│   ├── marked.min.js        # Procesador Markdown
│   ├── purify.min.js        # Desinfección anti-XSS
│   ├── pdf.min.js           # Extractor de PDF local
│   └── jszip.min.js         # Descompresor local DOCX / XLSX / PPTX / ODF
├── js/
│   ├── i18n.js              # Diccionario en 5 idiomas (FR, DE, IT, EN, ES)
│   ├── api.js               # Cliente de API Sealarca Vault (Streaming SSE)
│   ├── db.js                # Capa de persistencia local IndexedDB
│   ├── doc-handler.js       # Extractor universal de documentos
│   └── app.js               # Almacén principal de Alpine.js
└── images/                  # Recursos gráficos oficiales de Sealarca
```

---

## 🔒 Seguridad y Privacidad

1. **Content Security Policy (CSP)**: Aplica reglas estrictas que impiden la carga de scripts externos no autorizados.
2. **Sin Telemetría**: Sin cookies ni herramientas de análisis externo.
3. **Pasarela Vault Cifrada**: Todas las solicitudes a `https://sealarca.ch/v1` se transmiten mediante TLS seguro directamente a los enclaves de hardware aislados en Suiza.

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia **MIT**. Consulte el archivo [LICENSE](LICENSE) para más información.

Copyright (c) 2026 **eyelo SA (ScioNos)** — Suiza.


