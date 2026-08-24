# Security Policy

## Supported versions

Sealarca-Desk is not yet published. Security updates will target the latest released version.

| Version | Supported |
| --- | --- |
| 1.0.x | Yes |

## Reporting a vulnerability

Please do not disclose security vulnerabilities in a public GitHub issue.

Report vulnerabilities privately to **security@scionos.ch** and include:

- the affected file and version;
- clear reproduction steps;
- the expected and observed behavior;
- any proof of concept that does not expose real API keys or confidential documents.

Never include a Sealarca API key, customer document, personal data, or production credentials in a report.

## Local security model

- The application connects only to `https://sealarca.ch/v1`.
- API keys are retained only for the current browser session and are not persisted in IndexedDB.
- Documents are parsed locally before their extracted text is sent to the configured Sealarca model.
- The distributed application uses a strict Content Security Policy and the CSP-compatible Alpine.js build.

Users should download release assets only from the official GitHub Releases page and verify the published SHA-256 checksum before use.
