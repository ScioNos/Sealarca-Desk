# Security Policy

## Supported versions

Security fixes target the latest release line.

| Version | Supported |
| --- | --- |
| 1.1.x | Yes |
| 1.0.x | No |

## Reporting a vulnerability

Do not disclose security vulnerabilities in a public GitHub issue.

Report them privately to **security@scionos.ch** and include:

- the affected file and version;
- clear reproduction steps;
- expected and observed behavior;
- a minimal proof of concept that contains no real API key, confidential document, personal data or production credential.

## Implemented security model

- Runtime scripts and parsing libraries are bundled locally; the application does not load a CDN or analytics SDK.
- `vendor/dependencies.json` records embedded library versions, upstream license identifiers, and SHA-256 hashes for bundled runtime assets.
- Application API requests target the fixed base URL `https://sealarca.ch/v1`. The UI does not expose an endpoint override.
- The Content Security Policy permits local resources, Sealarca, and local development origins on `localhost` / `127.0.0.1`; scripts use the CSP-compatible Alpine build.
- Markdown is parsed with Marked and sanitized by DOMPurify. Frames, embedded objects, forms, inputs and buttons are forbidden in rendered Markdown; inline style attributes are removed. `svg`/`math` nodes are stripped after sanitization and links are restricted to `http/https/mailto/tel` plus relative URLs (`ALLOWED_URI_REGEXP`) with `rel="noopener noreferrer"`.
- The API key is stored in `sessionStorage` for the current browser tab/session, not in IndexedDB. Closing the session or using “forget key” removes it from the application session. The UI theme (`localStorage sealarca_theme`) is the only persistent preference; it contains no secret.
- Conversations, messages, documents, document profiles and jobs are stored in the browser’s IndexedDB. This storage is local but is **not application-level encrypted**; browser profile and operating-system access controls remain part of the threat model.
- Original document files and extracted Markdown remain local until selected for a chat request or used to generate a document profile.
- Chat requests transmit the conversation text and the selected document context. Profile jobs transmit the relevant document Markdown to the selected Sealarca model.
- Requests use the Responses API with `store: false`, but transport and server-side handling remain subject to the Sealarca service configuration and policy.
- The `<meta http-equiv="Content-Security-Policy">` cannot set `frame-ancestors`. When Desk is served over HTTP (instead of `file://`), serve it with `frame-ancestors 'none'` in addition to the meta CSP.

## User precautions

- Use a trusted device, operating-system account and browser profile.
- Avoid shared browser profiles for confidential work.
- Lock the workstation when unattended and clear site data before transferring or decommissioning a device.
- Verify the release SHA-256 before use.
- Never include real secrets or confidential customer data in vulnerability reports.
