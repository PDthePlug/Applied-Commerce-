# Shared classroom refinements and first rollout batch

The shared refinements are implemented and verified on top of owner-accepted PR #48. The full programme rollout is **not complete**: 24 plans remain available; five additional individual drafts are prepared privately, with none added to the encrypted release. Original-key sealing is the blocker for that first batch. Its rendered delivery, responsive and print checks must pass before advancing it as complete.

- Review PR: https://github.com/PDthePlug/Applied-Commerce-/pull/49 (draft, based on PR #48; no merge).
- Verified isolated staging: https://applied-commerce-sa-staging-beqdm363r.vercel.app . Vercel protection and genuine application login still apply.
- Tested application commit: `21a2939dc39bbc1df23cefaa586a2ae5e5c55ea0`.
- Base inspected before edits: PR #48 open/unmerged, head `2d1937a3bf39c21f422e563ac2a548b36ae46799`. Subsequent follow-up commits contain evidence, private-fixture tooling and the coverage register; the three changed application files remain identical to the tested staging commit.

## What changed

Every contextual guidance panel loses its repeated previous/next stage and “Teaching navigator” button group. One teaching navigator remains at the beginning, with period sequence and contextual/later-work choices. It opens collapsed ancestors and focuses the existing anchor. Source placement, sequence and link metadata remain intact. Normal application/term/lesson navigation, period cues, preparation, deeper disclosures, presentation mode and fallback remain available.

Checkpoint presentation uses a number/text grid, hanging wrapped text, quieter helper instructions and the response immediately below. Questions have moderate spacing and restrained separation. Existing short controls remain; longer textareas have a comfortable initial height and vertical resizing. Wording, prompt splitting, field counts, stable keys, placeholders and saved feedback are preserved. The approved icons remain.

No canonical book, learner block, private encrypted release, classroom key, learning-store contract, Supabase schema or RLS policy changed. Runtime verification still reports **395 lessons, four assessments and 20,766 stable blocks**. The renderer-preservation check covers all 399 units against the accepted baseline, stripping only the deliberately added checkpoint wrapper before hash comparison. The excluded milestone was not recovered or used. The separate live application and Zimbabwe application were not touched.

## Tests actually completed

| Scope | Result | Evidence |
| --- | --- | --- |
| Runtime census | 395 lessons / 4 assessments / 20,766 stable blocks | Local runtime gate |
| Node regression suite | 196 passed | Includes 399-unit wording/control preservation |
| Typecheck, lint, production build | Passed | Local mode; staging build also ready |
| Existing browser acceptance | 249 passed | Local mode, fresh production server; desktop 1280, mobile 430/360 |
| Additional checkpoint browser suite | 15 passed | Local mode; 320/430/1280, text scales 1/1.28/2, edit/clear/reload and prior combined answers |
| All existing teaching plans | 24 passed | Genuine educator login; no repeated nav; 193 central targets open/focus; source placement; Learner View |
| Representative responsive checks | 72 passed | Genuine staging, G8 Lessons 1/8/10 and G12 Lesson 5, widths 320/360/430/768/1280/1920 × text scales 1/1.28/2 |
| Instructional field preservation | 1,867 fields exact | Genuine classroom API vs actual rendered panels across all 24 plans |
| Complete teacher print | 24 guides, 169 pages passed | All instructional fields preserved; A4 text within margins; no empty pages |
| Standalone fallback | 24 passed; learner/revoked denied | Genuine staging; existing benchmark fields or complete contextual-plan fields preserved |
| Auth/RLS/data operations | 37 passed | Genuine password sessions and supported revision-checked learner/review RPCs |
| Educator/admin/learner/revoked roles | Passed | Educator/platform admin/institution admin allowed; learner, unassigned/revoked and unrelated users denied |
| In-session revocation | Passed | Existing educator session receives 403, private panels removed on revalidation; assignment restored afterwards |
| Institutional boundary | Passed | Separate-institution active staff: zero fixture learner rows; private guidance 403 |
| Evidence review workspace | Passed | Actual synthetic learner response found through review search; learner/revoked roles have no private cards |
| Hosted learning persistence | Passed | Original answer, reflection, notes, completion and portfolio recover after reload and fresh password login |
| Hosted split-answer preservation | Passed | Original combined answer retained alongside split keys; real edit, clear, reload and fresh login verified |
| Natural JWT expiry | Passed | Original genuinely issued expired JWT rejected for explicit expiry: Auth 403, data 401 |
| Public asset content scan | 77 assets; no matches | 1,144 private prose sentinels from authorised existing payloads; key scan unavailable |

Hosted tests use real Supabase password logins, supported Auth administration and current institutional assignments, without intercepted auth or role responses. Local browser tests use local mode and do not establish staging permissions. Increased-text checks use the application CSS text scale; they are not a claim about every operating-system accessibility setting. These are engineering checks, not educator classroom trials.

The standalone route was also checked with genuine staging login across all 24 plans. The five original benchmarks retain their original guide renderer; the other 19 use the complete contextual-plan fallback. This does not claim that the legacy benchmark fallback displays every additional contextual-plan enrichment field. Complete integrated private printing does preserve all 1,867 fields. New encrypted drafts have no hosted fallback or print result yet. Direct responsive reruns are recorded for the four representatives; the other 20 plans have genuine navigation, source-field and print checks rather than an invented per-lesson responsive pass.

Earlier harness attempts are retained privately: the new local seed initially overwrote state on every reload (fixed), and an existing-suite attempt reused a server that was then stopped (aborted and rerun with a fresh server). A review assertion initially assumed the default selected evidence item was the earlier Lesson 1 response; adding Lesson 8 evidence changed that selection. The runner now searches for the actual synthetic response before asserting its visibility. Temporary expired/stale Vercel share access was refreshed privately; it was a deployment-protection setup failure before application login, not a Supabase permission failure. Final completed outcomes above are from passing reruns.

## Connectivity and protected fixtures

Only `inxshlumnhcgiahxqewe` was targeted. Website backend configuration is confirmed through hosted health plus genuine role flows. Coding access to PostgREST and RPCs works through the environment proxy. `SUPABASE_SECRET_KEY` is present and a supported Auth Admin read returned HTTP 200. No direct database URL/PGHOST is configured; direct PostgreSQL connectivity is not claimed. The current cloud policy provides HTTP proxy access and no raw TCP grant.

`AC_ROLE_FIXTURES` remains outside the checkout in a mode-0700 directory. Credentials, sessions, original expired tokens, access links, private authoring and captures are protected and excluded from Git. Existing fixture provisioning uses supported Supabase Auth Admin APIs, not password-hash SQL or fabricated sessions. Accounts retain active educator/admin, ordinary learner, inactive assignment and unrelated-institution cases. All writes are controlled synthetic staging fixtures.

[connectivity.json](connectivity.json), [http-results.json](http-results.json), [hosted-results.json](hosted-results.json), [shared-results.json](shared-results.json), [review-results.json](review-results.json), [boundary-results.json](boundary-results.json), [fallback-results.json](fallback-results.json) and [expiry-results.json](expiry-results.json) contain sanitised outcomes. No current network failure is reported. Expected application/RLS denials and deployment-protection access failures are distinguished above.

## Coverage and first private batch

[coverage.json](coverage.json) lists all 395 lessons, and [grade-term.csv](grade-term.csv) groups them by the actual grade/term inventory. Existing 24 plans remain accepted and unchanged. There are **371 uncompleted lessons**, including **five private unsealed drafts** and 366 not yet drafted. A schema pass is never counted as a completed educational or hosted review.

Every block in Grade 8 Term 2 Lessons 21–25 was read before writing the individual drafts. The private drafts contain distinct preparation, brief contextual cues, relevant optional explanation, explicit existing activity coverage and separate later-work guidance. They do not add learner activities or response controls. Draft source hashes, plan hashes, timing rationale and review limitations are in [first-batch-review.json](first-batch-review.json); teaching prose remains private.

| Lesson | Provisional periods | Learning work supporting the estimate |
| --- | ---: | --- |
| 21 — Term 2 introduction | 1 | Story, specific prior-learning reflection, three-part intention audit and checkpoint; home sharing later |
| 22 — Money flows | 1 | Story, incoming/outgoing diagrams, comparison and checkpoint; seller enquiry later |
| 23 — Work and value | 1 | Story/types, unpaid-work estimate and proposal, checkpoint; acknowledgement later |
| 24 — Costs and profit | 2 | First period: bread calculations and waste strategy. Second: accounting relationship, balance sheet and checkpoint feedback |
| 25 — Journals | 2 | First period: shop receipts/payments tables. Second: one-day journal, leakage hunt and checkpoint; one-week tracking later |

Period conclusions and continuation cues are included in the two-period drafts. Their second periods support learner calculations and representations, not longer teacher explanations. These estimates require educator timing trials; the existing Grade 8 Term 1 remains 20 authored lessons and 25 provisional contact periods.

Six proposed source issues from this preliminary batch are isolated in [SOURCE_EDITORIAL_REGISTER.json](SOURCE_EDITORIAL_REGISTER.json), alongside the retained earlier [source register](../staging-classroom-validation/SOURCE_EDITORIAL_REGISTER.json). They concern exclusive monetary-origin wording, sensitive household-income comparison, a contradictory bread checkpoint, unclear equity wording, ambiguous journal-table references and cash/profit context. Exact passages, proposed wording and identity-preservation implications are recorded. Legitimate identity, dignity, circulation and motivational metaphors are retained. No source proposal was applied.

## Delivery measurements and recommendation

These measurements cover the unchanged **24-plan** encrypted release, not a 395-guide package. Current ciphertext sizes remain: original benchmarks 233,203 file bytes, contextual enrichment 8,403, teaching release 873,263 (654,723 ciphertext bytes). Requests still authenticate and check current educator authority before server-side private delivery. Responses remain private/no-store.

Five genuine repeated requests per shape through the coding-environment proxy measured:

| Response | Decoded bytes | Median | Range |
| --- | ---: | ---: | ---: |
| Full catalogue | 101,791 | 722 ms | 478–771 ms |
| Reader, catalogue omitted | 20,092 | 508 ms | 481–733 ms |

The existing catalogue omission retains the 80.26% byte reduction. Overlapping ranges and the small sequential sample do not prove a universal latency improvement. Browser JS heap was 10.00 MiB before the first sample and reached 57.71 MiB during lesson navigation/PDF generation; this is neither hosted server RSS nor evidence by itself of a leak.

No guaranteed cold process was observed or instrumented. Hosted auth/decryption/validation timings, server memory under concurrency and expanded-release behaviour remain pending. The earlier [delivery recommendation](../staging-classroom-validation/DELIVERY.md) still applies: trial smaller authenticated per-lesson/term releases with versioned source/content bindings, measure before choosing a cache, and preserve fresh authorisation before every private response. No packaging architecture, cache, database migration or production architecture was changed in this PR.

## Evidence and exact remaining dependency

The protected capture set contains mobile/desktop before-and-after learner and teacher screenshots plus complete PDFs. [private-evidence-manifest.json](private-evidence-manifest.json) publishes only names, byte counts and hashes. [before-provenance.json](before-provenance.json) and [after-provenance.json](after-provenance.json) identify genuine password-login captures on the original and refined hosted applications. Plaintext teaching captures and fixture secrets are not published in the repository.

The original classroom key is present only in the staging server binding. The coding environment has neither `AC_CLASSROOM_CONTENT_KEY_FILE` nor `AC_CLASSROOM_CONTENT_KEY`; the documented private key file is absent. Auth/database credentials do not supply it. The owner was asked to bind the **existing** key privately or identify an approved secure sealing workflow, without sending a key in chat. This is a content-sealing dependency, not a request to export a server key merely to view existing authorised guidance.

The first five drafts cannot be encrypted with the original key or delivered through the real staging path until that dependency is resolved. Their runtime/print/responsive review remains pending, and the next batch must not be reported complete before that review. No fresh permission is needed for passing batches once the secure input is available. Natural JWT expiry is demonstrated; maximum/inactivity session lifetime, hosted cold-start/server-memory results, educator timing trials and the remaining 371 completed guides are explicitly outstanding.

The isolated synthetic contextual-teaching browser harness was updated for the single navigator but was not rerun: creating that private fixture also requires the unavailable original key. Its changed behaviour was exercised through genuine hosted navigation across all 24 plans instead. This limitation is separate from the passing local 249 + 15 browser cases.
