# Sealarca Desk v1.0.0

This is the **first official public release** of Sealarca Desk, a source-available local client for Sealarca Vault.

## Highlights

- Folders/projects group multiple conversations, persistent documents, and project metadata.
- Documents retain their original local file, normalized canonical Markdown, MIME type, extension, size, SHA-256 hash, and provenance source map.
- PDF pages, PowerPoint slides, spreadsheet sheets/ranges, and reliable non-paginated locators are preserved where available.
- Users explicitly select which folder documents are sent for each request; full documents are not automatically reinjected with conversation history.
- IndexedDB schema version 2 retains the migration needed to recover data created with the development schema version 1, without deleting conversations or messages.
- Chunk storage is prepared as a derivation of canonical Markdown for future large-document processing.
- Available models are discovered dynamically from `GET /v1/models`.
- Licensed under the PolyForm Perimeter License 1.0.1 and presented as source available.

## Download

Download **`Sealarca-Desk-v1.0.0.zip`**, extract it, then open `Sealarca-Desk/index.html`.

## Integrity verification

Compare the archive SHA-256 hash with **`Sealarca-Desk-v1.0.0.sha256`**.

PowerShell:

```powershell
Get-FileHash .\Sealarca-Desk-v1.0.0.zip -Algorithm SHA256
```

## Important

Your Sealarca API must allow requests from the local browser environment. Never publish or share an API key in an issue, screenshot, or support request.
