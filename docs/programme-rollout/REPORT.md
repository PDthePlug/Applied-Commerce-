# Programme rollout from the accepted PR #48 standard

The shared refinements and first five individually reviewed new plans are verified in isolated staging. **29 of 395 lessons have reviewed teaching support; 366 remain.** This is an instructional and engineering review result, not an educator timing trial or owner acceptance of new content.

- Shared refinements: [draft PR #49](https://github.com/PDthePlug/Applied-Commerce-/pull/49), based on open, unmerged PR #48.
- First batch: [draft PR #51](https://github.com/PDthePlug/Applied-Commerce-/pull/51), based on PR #49.
- Verified staging: https://applied-commerce-sa-staging-9xx001d5n.vercel.app . Vercel protection and genuine application login apply.
- Tested application/content commit: `e0e1e6a210b042a6c11c05e186e40d4cc8991d5c`. Later evidence-only changes preserve that application and release.

## Preserved behaviour and shared changes

Contextual panels lose their repeated previous-stage, next-stage and teaching-navigator button groups. One navigator at the beginning reaches classroom stages, contextual support and later work, opening ancestors and focusing existing anchors. Normal application, term and lesson navigation remain.

Checkpoints use continuous numbers beside hanging question text, quieter supporting instructions and existing controls immediately beneath. Long answers begin at a moderate height and remain resizable. Placeholders, saved feedback, wording, prompt splitting, field counts, answer identities and restored icons remain intact.

New plans explicitly identify a brief facilitation cue. Relevant deeper support expands locally; panels without extra support do not gain an empty disclosure. Preparation, complete integrated private printing and standalone fallbacks remain available. The original 24 plans retain their exact accepted content.

No canonical book, learner block, answer identity, learning-store contract, Supabase schema or RLS policy changed. The original 395 lessons, four assessments and 20,766 stable blocks remain. The excluded milestone was not inspected or used. No classroom PR was merged; the separate live and Zimbabwe applications were not changed.

## Verification actually completed

| Scope | Result |
| --- | --- |
| Current Node suite | 205 passed, including 399-unit original wording/control preservation and exact original 24-plan hashes |
| Current typecheck / lint | Passed |
| Current staging build | Ready; original-key release validation and public asset/key scan passed |
| Earlier local shared-interface browser suites | 249 existing + 15 targeted passed on PR #49; not claimed as rerun on this batch |
| Genuine educator classroom review | All 29 plans; 2,066 instructional fields and original response controls retained |
| Central navigator | All 248 targets reached and focused; source placement and Learner View passed |
| Responsive checks | 162 combinations: nine representatives × six widths × three text scales |
| Integrated private printing | 29 guides / 190 pages; every field retained, no blank pages, A4 margins passed |
| Standalone fallback | All 29 passed; learner and revoked educator denied |
| Genuine Auth/RLS operations | 37 passed, with supported sessions, administration and application RPCs |
| Roles | Educator/platform admin/institution admin allowed; learner, revoked, unassigned and unrelated users denied |
| Revocation | Existing educator session denied; assignment restored afterwards |
| Institutional boundary | Active educator in separate institution: zero fixture learner rows and guidance HTTP 403 |
| Educator review workspace | Actual synthetic evidence found; learner/revoked roles have no private cards |
| Existing learner persistence | Answer, reflection, note, completion and portfolio survive reload and fresh login |
| Combined-answer regression | Combined answer and split keys recover; edit/clear/reload/fresh login passed |
| Each new lesson | Genuine edit, clear, reload and fresh password-login persistence passed |
| Natural original JWT expiry | Earlier genuine token rejected explicitly for expiry: Auth 403 / data 401 |

Responsive representatives are G8 Lessons 1, 8, 10, 21–25 and G12 Lesson 5. Widths: 320/360/430/768/1280/1920 CSS pixels; application text scales: 1/1.28/2. This does not claim every operating-system accessibility setting. Other plans have direct source-field, navigation and print checks with shared responsive coverage. Mobile/desktop captures were visually inspected, including 200% text at 320 pixels.

The original five benchmark fallbacks retain their original guide renderer; the other 24 use the complete contextual-plan fallback. Integrated printing includes all contextual fields. Hosted tests use real password logins and assignments, without intercepted authentication. Local tests and classroom trials are distinct.

Current sanitised results are in [g8-t2-21-25](g8-t2-21-25/). Earlier PR #49 evidence remains separately recorded at this directory's root. Captures, API payloads, credentials and sessions remain protected. The evidence manifest publishes names, sizes and hashes only.

## Connectivity and original-key packaging

Only Supabase `inxshlumnhcgiahxqewe` and Vercel `applied-commerce-sa-staging` were targeted. Hosted health and real login verify the website backend. Coding PostgREST/RPC and supported Auth Admin access work through the enforced HTTP proxy. No direct PostgreSQL connectivity or raw TCP grant is claimed.

Observed coding configuration revision 20 exposes Supabase/Vercel credentials but this process still cannot see `AC_CLASSROOM_CONTENT_KEY`. That discrepancy no longer blocks authoring: a guarded staging build authenticated the original bound key against the existing release, appended private drafts in memory and returned only ciphertext and public hash metadata. The key was never exported or replaced. All original plan hashes and key identity were preserved.

Five temporary sensitive draft-input Secrets and all three temporary sealing deployments were removed. The final normal staging deployment builds the committed encrypted release with no temporary inputs. The project's default build command remains unchanged. No public sealing API or plaintext guide asset was introduced.

Two initial privacy scans stopped on an exact canonical public lesson title. The narrowly tested correction excludes only a same-lesson `originalTitle` equal to the public catalogue; identical text in private reasoning remains scanned. Final verification checked 77 public assets against 2,693 private sentinels and the bound key. See [sealing provenance](g8-t2-21-25/sealing-provenance.json).

No current network failure is reported. Expected application/RLS denials are permission results. Earlier Vercel share-access failures occurred before application login and were resolved privately; they were not Supabase authentication failures.

## Individual review and provisional timing

Every learner block in G8 Term 2 Lessons 21–25 was read before writing distinct preparation, brief cues, optional support and later-work guidance. Original activities and response controls remain. See [individual review](first-batch-review.json), [all-lesson coverage](coverage.json) and [grade/term totals](grade-term.csv).

| Lesson | Provisional periods | Learning work |
| --- | ---: | --- |
| 21 — Term 2 introduction | 1 | Prior-learning reflection, three-part intention audit and checkpoint; home sharing later |
| 22 — Money flows | 1 | Incoming/outgoing diagrams, comparison and checkpoint; seller enquiry later |
| 23 — Work and value | 1 | Unpaid-work estimate, interpretation, proposal and checkpoint; acknowledgement later |
| 24 — Costs and profit | 2 | Bread/waste calculations first; accounting relationship, balance sheet and checkpoint second |
| 25 — Journals | 2 | Receipts/payments first; one-day journal, leakage hunt and checkpoint second; week-long tracking later |

Two-period plans close and reintroduce the same lesson. Seven provisional contact periods support five authored lessons. Educator timing trials remain pending. Existing G8 Term 1 remains 20 authored lessons / 25 provisional periods with its prior timing rationale retained.

Six source proposals are isolated in [SOURCE_EDITORIAL_REGISTER.json](SOURCE_EDITORIAL_REGISTER.json), with the earlier [editorial register](../staging-classroom-validation/SOURCE_EDITORIAL_REGISTER.json) retained. None is applied. Focused safeguards stay beside the relevant activity; personal reflection remains.

## Expanded delivery measurements

The 29-plan encrypted file is 691,991 bytes; the public hash/placement manifest is 737,807 bytes and availability 636 bytes. The decrease from the earlier 873,263-byte file reflects compact JSON serialisation, not removed content: original plan hashes remain exact. Other benchmark/enrichment files are unchanged.

Five sequential genuine requests per shape through the coding proxy measured:

| Response | Decoded bytes | Median | Range |
| --- | ---: | ---: | ---: |
| Full catalogue | 101,791 | 798 ms | 720–998 ms |
| Reader without catalogue | 20,092 | 765 ms | 544–988 ms |

These deliver the unchanged first lesson from the expanded server release. They measure authenticated repeated end-to-end requests, not a guaranteed cold process. The 80.26% catalogue-omission byte reduction remains. Small sequential samples and proxy overhead do not establish a causal latency regression. Browser heap samples are retained in the results; they are not server RSS or proof of a leak.

Continue per-batch measurement. Smaller authenticated lesson/term releases with versioned bindings are a reasonable experiment if server loading becomes material. Preserve fresh authorisation before every private response; choose caching only after hosted decryption, validation and concurrency evidence supports it. No database migration or production architecture change is included.

## Remaining work

Continue the remaining 366 lessons in individually reviewed grade-and-term batches. Educator timing trials, configured maximum/inactivity session lifetime, guaranteed hosted cold-start and server-memory measurements remain pending. Natural JWT expiry is demonstrated separately. The isolated synthetic teaching browser harness still needs its original-key fixture and has not been rerun; genuine hosted checks cover teaching behaviour instead. Owner approval remains required for merging or deploying the separate live application.
