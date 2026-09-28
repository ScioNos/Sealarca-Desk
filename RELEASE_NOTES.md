# Sealarca Desk v1.1.0

Release date: **September 28, 2026**.

This reliability release preserves the local workspace created by 1.0.4 and migrates IndexedDB from v4 to v5 without deleting or rewriting existing records. The Sealarca API endpoint and protocol are unchanged.

## Changes

- Job creation and claims are atomic across tabs. Workers claim jobs with an owner and token, renew a 180-second lease every 30 seconds, and commit profiles only while they still own the job and its source document exists. `maxAttempts` (default 5) is enforced with backoff; exhausted jobs fail explicitly. Export is an atomic `5.0` snapshot including chunks and settings; import is validated and idempotent.
- Conversation and folder deletion waits for an active stream to cancel and aborts chat plus profile (P1) work. Writes reject missing parents, message ID collisions cannot overwrite records, and closed database connections are discarded on version change.
- Chat requests are limited to 250,000 effective characters across instructions, history, and selected document context. Oversized sends are blocked with a localized explanation; the context is never silently truncated. Streaming uses a sliding 120-second timeout with a distinct timeout message; the SSE reader is closed on `response.completed`.
- Citations refer only to document excerpts actually sent, including the manual fallback. Search offsets account for Unicode normalization, and user Markdown cannot assign interface CSS classes or IDs; `svg`/`math` are stripped and link protocols are allow-listed.
- A stream succeeds only after `response.completed`; an incomplete stream retains partial output and is visibly marked interrupted. Empty cancellations no longer create ghost messages.
- Office/ODF archives are prevalidated at 100 MiB total expanded, 20 MiB per entry, and 2,000 entries. CSV quoting, RTF Unicode text, OOXML relationship order, Excel dates and shared-string edge cases, DOCX headers/footers/notes/tables, ODT headings, ODS repeated rows/columns caps, and a 100-slide PPTX cap are handled with provenance and warnings.
- PDF.js 6.3.289, Marked 18.0.7, DOMPurify 3.4.16, JSZip 3.10.2 and Alpine CSP 3.16.2 are bundled locally. `vendor/dependencies.json` lists versions, licenses, and SHA-256 hashes; the vendor build verifies Alpine and the release build refuses a vendor mismatch. Runtime libraries remain local under the strict CSP.

## Limits and local data

20 MiB per input file, 500,000 extracted characters, 100 PDF pages, 100 PPTX slides, 100 rows per spreadsheet/CSV sheet, 200 columns max, and five files per addition. Profile requests include at most 120,000 document characters and 100 sources. The key lasts only for the tab session. Workspace data remains in the browser profile; reopen the same `index.html` at the same location, in the same browser/profile. Keep original files separately; `index.md` is not a restorable backup. Document tabs support Left/Right/Home/End keyboard navigation.

The audit also noted that a retry after a network failure may duplicate a billable request if the server already processed it. The scenario is conditional and was not demonstrated as an exploit; the API protocol is unchanged in this release.

## Download and verification

Extract `Sealarca-Desk-v1.1.0.zip` and open `Sealarca-Desk/index.html`. Compare the archive SHA-256 with `Sealarca-Desk-v1.1.0.sha256`.

Desk continues to use `https://api.sealarca.ch/v1`. No key or customer document is included in the distribution. Source available under PolyForm Perimeter License 1.0.1.
