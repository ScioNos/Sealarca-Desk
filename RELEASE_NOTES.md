# Sealarca-Desk v1.0.0

First public release of **Sealarca-Desk**, the local client for Sealarca Vault.

## Highlights

- Enter only your Sealarca API key; available models are discovered automatically.
- OpenAI-compatible `POST /v1/responses` support with typed SSE streaming.
- Strict Content Security Policy using the official Alpine.js CSP build.
- Local parsing for PDF, DOCX, XLSX, PPTX, ODT, ODS, CSV and text documents.
- Light and dark themes with five interface languages.
- Local conversation history; API keys are retained only for the current browser session.
- Hardened Markdown rendering and file-processing safety limits.

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
