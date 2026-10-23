# Applied Commerce classroom rollout

**44 of 395 lessons now have individually reviewed teaching support available in verified staging; 351 remain.** All 20 Grade 8 Term 2 plans are complete alongside the accepted 24 plans. Educator timing trials and owner classroom review of new content remain pending.

- Shared refinements: [PR #49](https://github.com/PDthePlug/Applied-Commerce-/pull/49), stacked on open/unmerged PR #48.
- Lessons 21–25: [PR #51](https://github.com/PDthePlug/Applied-Commerce-/pull/51).
- Lessons 26–40 and final cue corrections: [PR #52](https://github.com/PDthePlug/Applied-Commerce-/pull/52), stacked on PR #51.
- Current verified staging: https://applied-commerce-sa-staging-o56m9ujz4.vercel.app . Vercel protection and genuine application login apply.
- Tested application/content commit: `a2fce914c52b6a08f7b5e7252dea4ca2c17c60ea`. Later evidence/measurement-summary changes preserve that classroom implementation and encrypted content.

## Behaviour and preservation

Repeated previous-stage, next-stage and teaching-navigator button groups are removed from contextual panels. One navigator at the beginning retains stage/period sequence, support, later work, anchor focus and backward revisits. Normal application, term and previous/next lesson navigation remain.

Checkpoints retain continuous numbering beside hanging question text, quieter supporting instructions, moderate separation and original response controls immediately beneath. Long controls begin at a comfortable height and remain resizable. Wording, splitting, field counts, stable answer identities, placeholders, saved feedback and the restored icons remain intact.

Each new plan has individual preparation, brief contextual cues, useful optional local support and distinct later work. An explicit cue with no extra support does not create an empty deeper panel. Preparation, complete private printing and standalone fallback remain. The 24 owner-accepted plans retain exact original hashes. Three newly authored cue fields were corrected after visual review; no existing learner field or layout changed.

The original 395 lessons, four assessments, canonical books and 20,766 stable blocks remain. No learner activity, learning outcome, prompt, saved identity, learning-store contract, Supabase schema or RLS policy was changed. The excluded milestone was not recovered or used. No classroom PR was merged; the separate live production and Zimbabwe applications were not changed.

## Verification actually demonstrated

| Scope | Evidence |
| --- | --- |
| Current local Node suite | 206 passed, including 399-unit original wording/control preservation, accepted 24-plan hashes and guarded field-only corrections |
| Typecheck / lint / runtime | Passed; 395 lessons / four assessments / 20,766 stable blocks |
| Final staging build | Ready; all 44 plans validated with the original key; 77 public assets checked against 3,359 private sentinels and the bound key |
| Earlier local browser suites | PR #49: 249 existing + 15 targeted passed; not claimed as rerun on the later content batches |
| Final genuine classroom pass | All 44 plans / 2,546 fields exact; original response controls retained; no redundant deeper disclosures |
| Final central navigation | All 378 targets reached/focused, source placement verified, Learner View passed |
| Responsive checks for new batch | 270 combinations across all 15 new plans on initial release; 54 additional combinations for the three corrected guides on final release |
| Complete final integrated print | 44 guides / 240 A4 pages; all fields present, no empty pages, margins passed |
| Final standalone fallback | All 44 passed; ordinary learner and revoked educator denied |
| Genuine Auth/RLS operations | 37 passed; supported password sessions, Auth administration and application RPCs |
| Current roles | Educator, platform admin and institution admin allowed; learner, revoked/unassigned and unrelated users denied |
| In-session revocation | Existing educator session denied and private panels removed; assignment restored after test |
| Institutional boundary | Separate-institution active educator: zero fixture learner rows, guidance HTTP 403 |
| Review workspace | Actual synthetic learner evidence visible to assigned educator; learner/revoked roles have no private cards |
| Existing evidence persistence | Answer, reflection, note, completion and portfolio recover through reload and fresh password login |
| Combined/split answers | Previous combined answer retained with split fields; edit, clear, reload and fresh login passed |
| Every new lesson | Genuine first-response edit, clear, reload and fresh-login persistence passed; corrected guides retested on final release |
| Natural original JWT expiry | Earlier genuine issued token rejected explicitly for expiry: Auth 403 / data 401 |

Widths are 320/360/430/768/1280/1920 CSS pixels and application text scales 1/1.28/2. Initial new-batch checks cover Lessons 26–40. Final responsive rechecks cover Lessons 21, 29 and 38; all other new plans retain their exact tested hashes. Earlier 162 combinations cover G8 Lessons 1/8/10/21–25 and G12 Lesson 5. These are distinct runs, not a claim that every combination was rerun at the final commit. Mobile/desktop captures were visually read, including increased text and the corrected R7 cue.

Initial automated passes did not conceal the later instructional-reference defect. Visual reading found Lesson 38 referred to an original “Question 2” while the live checkpoint splits prompts into several numbered parts. Its cue now identifies the R7 calculation by content. Lessons 21 and 29 also lose an inaccurate “both questions” count. A hash-guarded field-only operation changed exactly three teacher fields, preserving the other 41 plans and all source/layout/period/response structure. Final classroom, print, fallback, navigation, responsive and persistence checks passed after correction.

The five original benchmark fallbacks retain their original guide renderer; other plans use the full contextual-plan fallback. Integrated printing includes all contextual fields. Hosted authentication is genuine: no intercepted roles, mocked requests or fabricated sessions. Local tests, hosted checks and educator trials are separate.

Current results and initial/final provenance are in [g8-t2-26-40](g8-t2-26-40/). First-batch evidence remains in [g8-t2-21-25](g8-t2-21-25/), with earlier PR #49 evidence at this directory's root. Private captures, PDFs, credentials, sessions and payloads stay protected. Manifests publish only filenames, sizes and hashes.

## Connectivity and protected packaging

Only Supabase `inxshlumnhcgiahxqewe` and Vercel project `applied-commerce-sa-staging` were targeted. Website backend configuration is verified through hosted health and genuine login. Coding access to PostgREST/RPC and a current supported Auth Admin fixture-user read succeed. No direct PostgreSQL connection or raw TCP grant is claimed. HTTP uses the enforced environment proxy.

The coding process still cannot see the owner-reported classroom key binding. This no longer blocks packaging: a guarded staging build authenticates the original bound key against the existing release, validates original hashes, processes private input in memory and returns only encrypted content and public hash metadata. The key is never exported or replaced. No public sealing API or plaintext guide asset exists.

Temporary draft/correction input Secrets and temporary sealing deployments were removed after each operation. The final normal staging build uses committed encrypted files with no temporary inputs; the project's default build command remains unchanged. Fixtures and authoring are in mode-0700 directories with private files, excluded from Git; a protected ignored workspace backup is also retained.

A prior scan false positive was an exact same-lesson canonical public title. The narrowly tested exclusion applies only to an `originalTitle` equal to that lesson's public catalogue title; private reasoning containing identical text remains scanned. No key/private-content scan was weakened more broadly.

No current network failure is reported. Expected role/RLS denials are permission results. Earlier Vercel share-access failures occurred before application login and were resolved privately; they were not Supabase authentication failures.

## Instructional coverage and timing

Every learner block was read before individual authoring. [coverage.json](coverage.json) records all 395 lessons with review, periods, verification and issues; [grade-term.csv](grade-term.csv) summarises it. Schema/field/source checks are supporting technical evidence, not educational approval.

Grade 8 Term 2 retains 20 authored lessons and has **24 provisional contact periods**. Lessons 24, 25, 36 and 40 use two each; the other sixteen use one. The second periods support existing calculations and accounting representation (24), a one-day journal and interpretation (25), maps/gap/closure reasoning (36), and budget/term reflection/equation retrieval (40). They close and reintroduce the same learner lesson. Later seller enquiries, observations and week-long records do not inflate contact time. Lesson 38 explicitly defers tracker-dependent answers until a real record exists.

The live reader suppresses Lesson 40's separate Part D experiment-log review. Its guide uses the visible seven-question reflection and existing portfolio evidence, without restoring a hidden task or adding responses. Similar source/rendering differences are checked individually as the rollout continues.

Existing Grade 8 Term 1 remains 20 authored lessons / 25 provisional periods, with the earlier timing rationale retained. All estimates need educator trials. Nineteen focused source proposals in [SOURCE_EDITORIAL_REGISTER.json](SOURCE_EDITORIAL_REGISTER.json) remain separate and unapplied, alongside the earlier [register](../staging-classroom-validation/SOURCE_EDITORIAL_REGISTER.json). Metaphors and legitimate developmental perspectives are retained; local safeguards address specific tasks.

## Delivery measurements and recommendation

See the original append and field-correction sealing summaries for exact current ciphertext/manifest sizes. The initial 44-plan file was 916,203 bytes and public hash/placement manifest 975,420 bytes; correction changes are recorded separately. Compact JSON explains why the earlier 29-plan file was smaller than the original 24-plan pretty-printed release. Content was not removed; preserved plan hashes prove it.

The initial expanded release was measured with 80 genuine authenticated sequential requests across 16 lessons: five per lesson, including an unchanged baseline lesson. New lesson responses were **10,359–13,785 decoded bytes**. Across the 75 new-lesson requests, median end-to-end latency was **584 ms**, range **495–1,000 ms**, through the coding proxy. Median first observed sample was 593 ms; subsequent samples 573 ms. First observed is not guaranteed cold. Responses remained private/no-store. Raw samples are retained; even-sized sample medians average the two central values.

The final classroom pass also repeats baseline requests. The reader still omits the full catalogue, preserving the earlier byte reduction for that baseline shape. Browser heap during all-plan navigation/PDF generation ranged approximately 6.44–85.76 MiB in the final pass; this is not hosted server RSS and does not demonstrate a leak.

Code inspection confirms each selected-plan request decrypts and validates the whole release; no server plaintext cache is introduced. These 44-plan observations do not establish 395-plan suitability. Trial smaller authenticated lesson/term releases with versioned bindings if loading becomes material, and measure decryption/validation, guaranteed cold processes and memory under concurrency before selecting a cache. Preserve fresh server authorisation for every response. No database migration or production architecture change is included.

## Remaining work

Continue the remaining 351 individually reviewed and verified guides through grade/term batches. The next ten Term 3 guides are drafted privately and remain outside the release until their checks pass. Configured maximum/inactivity session lifetime, hosted cold-process/server-memory measurements and educator timing trials remain pending. Natural JWT expiry is demonstrated separately. The isolated synthetic teaching browser harness still lacks its original-key fixture and has not been rerun; genuine hosted tests cover teaching behaviour instead. Owner approval remains required for merging the stack or deploying the separate live application.
