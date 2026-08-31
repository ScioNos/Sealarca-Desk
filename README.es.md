<div align="center">

# 🛡️ Sealarca-Desk

**Cliente de navegador local autónomo para la pasarela de IA suiza [Sealarca](https://sealarca.ch)**  
*Preparación local de documentos, selección explícita del contexto y acceso directo al Vault.*

[![Licencia: PolyForm Perimeter 1.0.1](https://img.shields.io/badge/Licencia-PolyForm%20Perimeter%201.0.1-087F68.svg)](LICENSE)
[![Versión: v1.0.1](https://img.shields.io/badge/Versión-v1.0.1-137A52.svg)](https://github.com/ScioNos/Sealarca-Desk/releases/tag/v1.0.1)

🌐 **Language / Langue / Sprache / Lingua / Idioma**  
[English 🇬🇧](README.md) · [Français 🇫🇷](README.fr.md) · [Deutsch 🇩🇪](README.de.md) · [Italiano 🇮🇹](README.it.md) · **Español**

</div>

## Descripción general

Sealarca-Desk es una aplicación estática de una sola página para chat y trabajo documental con Sealarca Vault. La interfaz y todas las bibliotecas de ejecución se cargan localmente; el descubrimiento de modelos, las respuestas de chat y los perfiles documentales generados por IA requieren conexión al endpoint fijo `https://sealarca.ch/v1`.

El programa no utiliza un backend de aplicación intermedio, SDK de analítica ni CDN durante la ejecución.

## Funcionalidades actuales

- **Carpetas/proyectos** con varias conversaciones y una biblioteca documental reutilizable.
- **Historial local de conversaciones** con filtro de títulos en la barra lateral.
- **Conservación de documentos en IndexedDB**: Blob original, Markdown canónico, tipo MIME, extensión, tamaño, hash SHA-256 cuando Web Crypto está disponible, metadatos de extracción y mapa de procedencia.
- **Importaciones compatibles**: `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.odt`, `.ods`, `.csv`, `.txt`, `.md`, `.json`, `.rtf`, `.log` y `.xml`.
- **Límites documentales**: 20 MiB por archivo, 500.000 caracteres extraídos, 100 páginas PDF, 100 filas por hoja de cálculo/CSV y un máximo de 5 archivos por operación de añadido.
- **Modo de contexto manual** para elegir los documentos enviados con la siguiente solicitud.
- **Modo de contexto automático** que clasifica localmente los documentos de la carpeta y envía extractos pertinentes y citables de hasta 5 documentos.
- **Área documental** con búsqueda local de texto completo, vista previa del Markdown canónico, referencias de origen, descarga del archivo original, resumen de la carpeta y exportación del resumen como `index.md`.
- **Perfiles documentales generados por IA** (resumen, personas, organizaciones, fechas y elementos importantes), procesados mediante una cola persistente de dos workers con reintentos, cancelación, deduplicación y recuperación tras una interrupción. La generación envía el Markdown del documento al modelo Sealarca elegido.
- **Integración con Responses API**: descubrimiento dinámico mediante `GET /v1/models`; solicitudes con y sin streaming mediante `POST /v1/responses`, con `store: false`, timeout, backoff HTTP y cancelación.
- **Salida en streaming** con panel de razonamiento cuando la pasarela emite eventos de resumen de razonamiento compatibles.
- **Cuatro roles integrados**: Derecho y contratos, Experto fiscal y fiduciario, Cumplimiento y secreto profesional, Resumen ejecutivo y redacción.
- **Cinco idiomas de interfaz**: francés, alemán, italiano, inglés y español.
- **Temas claro/oscuro**, CSP estricta, renderizado Markdown saneado y dependencias locales.

## Modelo de datos y red

- La clave API se conserva en `sessionStorage` durante la pestaña/sesión actual y se elimina del almacenamiento IndexedDB antiguo durante la migración.
- Conversaciones, mensajes, carpetas, documentos, perfiles, trabajos de procesamiento, roles, idioma, modelo y preferencias de UI se guardan localmente en IndexedDB. El tema se guarda en `localStorage`.
- Las solicitudes de chat envían el historial textual y únicamente los documentos seleccionados manualmente o los extractos elegidos automáticamente.
- Los trabajos de perfil envían el Markdown del documento correspondiente al modelo Sealarca seleccionado.
- Las llamadas API de la aplicación se dirigen a `https://sealarca.ch/v1`. La CSP también permite orígenes locales de desarrollo en `localhost` y `127.0.0.1`.
- “Local” y “sin CDN” describen la carga, el análisis, la indexación y el almacenamiento; las operaciones de IA no funcionan sin conexión.

## Inicio rápido

1. Descargue y extraiga el archivo de la versión.
2. Abra `Sealarca-Desk/index.html` en un navegador moderno.
3. Introduzca una clave API de Sealarca. La ventana de configuración se abre automáticamente cuando no hay una clave de sesión.
4. Seleccione un modelo descubierto, cree o elija una carpeta y después inicie una conversación o añada documentos.

La API de Sealarca debe aceptar solicitudes procedentes de una página local `file://`. Si una política del navegador o de la organización bloquea este origen, sirva el directorio desde un servidor estático local aprobado sin cambiar el endpoint de la API.

## Arquitectura

```text
Sealarca-Desk/
├── index.html                 # Interfaz Alpine.js y CSP
├── css/                       # Temas, diseño y componentes
├── images/                    # Logotipos y banderas locales
├── js/
│   ├── boot-theme.js          # Aplica el tema antes del renderizado
│   ├── i18n.js                # Diccionarios para cinco idiomas
│   ├── db.js                  # Esquema IndexedDB v3 y persistencia
│   ├── doc-handler.js         # Extracción local, Markdown y procedencia
│   ├── api.js                 # Cliente fijo de Sealarca Responses API
│   ├── p1.js                  # Búsqueda, perfiles, citas y cola persistente
│   └── app.js                 # Estado Alpine.js y flujos de la aplicación
├── vendor/                    # Alpine CSP, JSZip, Marked, DOMPurify, PDF.js
├── tests/                     # Pruebas Node.js
└── scripts/build-release.ps1  # Creación de ZIP y SHA-256
```

## Desarrollo y verificación

Node.js no es necesario para ejecutar la aplicación distribuida, pero sí para las comprobaciones del repositorio:

```bash
npm test
npm run check
```

Para crear los artefactos de versión en PowerShell:

```powershell
npm run release:build
```

## Licencia

Este proyecto **source available** se distribuye bajo la **PolyForm Perimeter License 1.0.1**. Consulte [LICENSE](LICENSE). No se presenta como software de código abierto.

Copyright (c) 2026 **eyelo SA (ScioNos)** — Suiza.
