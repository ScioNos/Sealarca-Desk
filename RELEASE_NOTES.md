# Sealarca Desk v1.2.0

**Analyse de dossier & nouvelle expérience documentaire**

Release date: **September 29, 2026**.

This release adds a local multi-document dossier workspace. It preserves the 1.1.0 browser workspace and upgrades IndexedDB from v5 to v6 without deleting or rewriting existing records. The API endpoint and protocol remain unchanged.

## Changes

- Fix concurrent sends, stale navigation/model/search loads and imports whose destination changes or disappears.
- Preserve sparse XLSX columns and ODT document order, lists and tables. Legacy XLSX/ODT records offer explicit local re-extraction from the stored original, preserving identity and history, atomically updating Markdown/provenance and invalidating derivatives. No AI regeneration is triggered.
- Use profile schema v3 with independent complete/partial/unknown coverage, character/source counters, cut-source IDs and limiting reasons. Keep prompt v2 and the 120,000-character/100-source bounds. Historical profiles remain readable with unknown coverage; local analyses using partial or unknown profiles are partial and snapshot coverage in new metadata-only traces.
- Retry only explicit retryable HTTP errors. Unknown POST outcomes, expired dispatched leases and ambiguous legacy checkpoints require explicit retry; only unsent preparations resume automatically. Recover expired leases every 30 seconds, serialize queue pumping and refresh only changed workspace data.
- Bound excerpts to their source offsets. Run local search and automatic selection through a cached Blob worker compatible with the existing CSP, with cooperative fallback, a 150 ms debounce and stale-result guards.
- Build ZIP entries with `/` separators in Windows PowerShell 5.1 and PowerShell 7, verify each entry against staged content, then issue its SHA-256 checksum.

- Run dossier summaries, timelines, entity/party lists, obligation lists, amount lists, comparisons, and apparent-difference checks over current profiles already stored in the browser. Results are labeled as unverified and link to their source locations.
- Track operations with persistent status, four progress steps, notices, cancellation, retry, stale-run recovery, and a metadata-only provenance trace. Chat answer traces also record the documents and references used.
- Keep folder actions local. Traces store document/source IDs, locators, counts, and notices, not document text. Generating a profile remains an explicit action for a document; its Markdown is sent to the selected Sealarca model as in prior releases.
- Add per-folder manual/automatic chat-context overrides, clear document/profile status chips, profile amount/obligation details, and a richer `index.md` dossier export.
- Upgrade IndexedDB to v6 with `operations` and `traces` stores; export/import format is `6.0`. Existing profiles created with the v1 prompt fingerprint are marked stale and can be regenerated explicitly.
- Expand profile schema v3/prompt v2 to capture sourced entities, dates, events, amounts, obligations, important items and coverage. Keep the existing 120,000-character/100-source profile bounds and 250,000-character chat-context limit.
- Preserve every source of a consolidated event and give different events on the same page distinct stable identifiers. Expose dates and events in the local structured dossier model.
- Mark results based on partially extracted documents as partial, retain extraction notices and identify each missing or stale profile. Documents omitted by the operation limit remain listed in the trace.
- Snapshot operation steps and nested notice/locator metadata in historical traces. Record the model actually used even if the selection changes during streaming.
- Keep reasoning and source drawers reactive through message-ID state, including after reloading a conversation. Only reasoning delivered by the API is displayed.
- Prepare model-capability access from explicit boolean gateway metadata, with unknown capabilities remaining unknown. No model-name inference or independent catalogue is introduced.

## Verification

The release checks cover v5-to-v6 migration, export/import, cross-tab operation leases, trace persistence, source filtering, dossier aggregation, profile normalization, the five interface languages, and the full `npm run check` suite.

The September 30 correction pass passes 125 tests. Real Chromium 151 and Firefox 153 checks pass under HTTP and `file://`: local ODT repair preserves the original and identity, invalidates the old profile, refreshes visible text, and triggers no external request; concurrent sends produce one request/conversation. Local worker search over 20 documents of 500,000 characters remains responsive and reuses its cache. The generated ZIP is checked against every distributed source file, its CRC32 and SHA-256; the extracted copy runs the same browser checks. ZIP creation is validated with Windows PowerShell 5.1 and PowerShell 7, with Linux extraction also covered by CI. Publishing a remote release remains a separate action.

The September 30 audit adds regression coverage for multi-source events on the same page, partial extraction, historical traces after document/profile changes, real Alpine CSP drawer reactivity, cancellation during IndexedDB reads, interrupted chat provenance, and explicit model capabilities. The runtime remains a static browser application; no fork transport, external tools, corpus, pairing, or Python service is included.

The folder analysis is deterministic aggregation of current local profiles. Comparisons group extracted dates, amounts, obligations and important items by their labels and flag apparent differences; equivalent calendar dates are grouped and all source references are retained. Arbitrary semantic contradictions and missing facts still require the user's document-grounded chat and review. Version 1.3 can use the retained document/source IDs, locators and operation snapshots for claim verification; no claim scoring is implemented in 1.2.

## Download and verification

Build `Sealarca-Desk-v1.2.0.zip` with `npm run release:build` and compare it with the generated `Sealarca-Desk-v1.2.0.sha256` checksum. No API key or customer document is included in the distribution.

---

## Previous release: v1.1.0

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
