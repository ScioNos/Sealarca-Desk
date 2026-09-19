# Sealarca Desk v1.0.4

Release date: **September 19, 2026**.

This corrective release makes partial document extraction visible. Import warnings now remain available in the library and document preview, in French, English, German, Italian and Spanish.

## Changes

- ODS extraction respects 100 logical rows per sheet, including repeated rows, with sheet and row provenance.
- XLSX/CSV truncation warnings appear at import and remain visible afterwards.
- PDF pages without extractable text are identified. Scan-only PDFs receive an explicit explanation: Desk does not include OCR.
- Discovered model labels match the public catalogue; model selection remains explicit.
- Original files and existing local documents, conversations, profiles and settings are preserved. No database migration is required.

## Limits and local data

20 MiB per file, 500,000 extracted characters, 100 PDF pages, 100 rows per spreadsheet sheet/CSV file, and five files per addition. The first 100 rows are extracted when a table is longer; review the warning and preview before using it as context. PDFs need a text layer.

The key lasts only for the tab session. Workspace data remains in the browser profile. Reopen the same index.html at the same location, in the same browser/profile. Keep your original files separately. The index.md overview is not a complete restorable backup; there is no full backup/restore interface.

## Download and verification

Extract `Sealarca-Desk-v1.0.4.zip` and open `Sealarca-Desk/index.html`. Compare the archive SHA-256 with `Sealarca-Desk-v1.0.4.sha256`.

Verified on Windows 11 / Chrome 153: local opening, import, document warnings, original retrieval and persistence after reopening. Other browser/OS combinations have not been certified by this release check. Local file access can be restricted by organisation policy.

Desk continues to use `https://sealarca.ch/v1`. No key or customer document is included in the distribution. Source available under PolyForm Perimeter License 1.0.1.
