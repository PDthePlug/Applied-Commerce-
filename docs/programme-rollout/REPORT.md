# Applied Commerce classroom rollout

**64 of 395 lessons have individually reviewed teaching support in verified staging; 331 remain.** All 60 Grade 8 lessons in Terms 1–3 and the four higher-grade benchmarks are available. New guides still require owner classroom review and educator timing trials. “Completed” records source/instructional review and demonstrated staging checks, not owner approval of every new lesson.

The open, unmerged stack is PR #48 → [#49](https://github.com/PDthePlug/Applied-Commerce-/pull/49) shared refinements → [#51](https://github.com/PDthePlug/Applied-Commerce-/pull/51) Lessons 21–25 → [#52](https://github.com/PDthePlug/Applied-Commerce-/pull/52) Lessons 26–40 → [#54](https://github.com/PDthePlug/Applied-Commerce-/pull/54) Lessons 41–50 → [#55](https://github.com/PDthePlug/Applied-Commerce-/pull/55) Lessons 51–60 and standalone print correction.

Current staging: https://applied-commerce-sa-staging-jifondqth.vercel.app . Vercel protection and genuine application login apply. Latest application/print commit: `f097214ac39fffc712c2dca02ec1922e21720a52`. Integrated classroom/navigation/responsive evidence for this batch is from `792d40ba693bf9599f4aeb6e42bf450da1f3d26a`. The later product change is scoped to standalone print padding; encrypted content and integrated teaching UI are unchanged. Documentation and test-runner commits do not imply another deployment or rerun.

## Behaviour and preservation

Contextual panels have no repeated previous/next-stage or teaching-navigator button groups. One navigator at the beginning reaches source, support and later-work targets, including earlier sections. Normal application, term and lesson navigation remain. Checkpoints retain continuous numbers beside hanging question text, quiet supporting instructions and original controls. Longer fields remain resizable; wording, splitting, field counts, answer identities, placeholders, saved feedback and icons remain.

Every new lesson was read before individual authoring. Preparation, brief cues, targeted optional support, later work and provisional timing follow actual source/rendered material. No empty deeper panel is added. The first 54 plan bindings remain exact in this release, including the accepted 24 hashes and the three previously reviewed teacher-field corrections. All 395 lessons, four assessments, canonical books, 20,766 stable blocks, saved-work contracts, private authorisation and institutional boundaries remain. No excluded milestone, source rewrite, migration, merge, separate live deployment or Zimbabwe change is included.

A stronger earlier fallback audit found omitted contextual enrichment in the benchmark renderer; PR #54 fixes complete-plan fallback while retaining the original scaffold and presentation mode. The current all-plan PDF check then found a genuine blank final page in Lesson 55. A duplicated 12 mm staff-shell padding combined with the named teacher page’s own 12 mm margins. PR #55 removes only the extra standalone shell padding; institution report padding and integrated print behaviour remain. Initial failures and corrections are retained, not hidden.

## Demonstrated verification

| Scope | Actual result |
| --- | --- |
| Current local suite | 210 Node tests, runtime, typecheck and lint pass; 395 lessons / four assessments / 20,766 stable blocks |
| Local synthetic print regression | One browser test passes: teacher shell avoids duplicate padding; ordinary reports retain 12 mm |
| Final normal staging build | All 64 plans / 3,221 fields validate with original key; 77 public assets / 4,291 private sentinels plus bound key scanned |
| Direct integrated classroom this batch | Ten additions plus G8 1/8/10 and G12 5: 14 plans / 774 exact fields, original controls retained |
| Direct navigator / Learner View | 137 targets reached/focused for those 14; source placement and absence of repeated panel controls pass |
| Responsive | 252 combinations: all ten additions plus four benchmarks, six widths × three text scales |
| New first-response persistence | All ten: genuine edit, clear, reload, direct cloud check and fresh password login |
| Existing evidence / combined answers | Answer, reflection, note, completion, portfolio and earlier combined/split answers recover through reload/fresh login |
| Integrated private printing this batch | 14 guides / 76 pages; exact DOM fields, PDF text and A4 margins pass |
| Final full standalone fallback | All 64 plans / 3,221 fields; learner and revoked educator denied |
| Final full fallback printing | 64 guides / 323 nonempty A4 pages; all margins and instructional text pass |
| Physical PDF content | 78 PDFs / 3,995 expected field occurrences / zero missing; wrapped scaffold cells verified within their fixed columns |
| Genuine three-period lesson | Lesson 60: preparation, 3 × 45-minute periods, opening/closing navigator targets and all print/fallback fields pass |
| Supported Auth/RLS/RPC | 37 pass, including revoked role, logged-out JWT and refresh-token denial |
| Role checks | Assigned educator and administrators allowed; learner, revoked and unrelated accounts denied; in-session assignment revocation removes panels |
| Final evidence review / institution boundary | Assigned educator sees synthetic submission; learner/revoked users have no private cards; unrelated-institution educator has zero learner rows and guidance 403 |
| Completed logout | Educator and learner: supported Auth 204, zero Auth cookies and classroom 401 |
| Natural original JWT expiry | Earlier genuine issued token explicitly rejected for expiry: Auth 403 / data 401 |

Widths are 320/360/430/768/1280/1920 CSS pixels; text scales 1/1.28/2. Earlier all-54 integrated runs and original PR #49 local browser suites remain historical, not claimed as rerun. The new explicit batch-scope guard rejects empty, duplicate or unknown selections; default full-release checks remain. Current final fallback/print checks cover all 64. Exact scope/provenance: [RESULTS.json](g8-t3-51-60/RESULTS.json), its initial/final evidence directories and earlier batch records.

The initial logout runner checked immediately after dispatching an asynchronous click and observed 403 before completed logout had been established. It now waits for the signed-out form before requiring 401. Focused genuine checks confirm completed logout, cookie removal and supported Auth success. The initial timing failure is retained. The PDF checker separately handles Poppler’s interleaving of wrapped table cells; it does not discard non-whitespace field characters or use loose subsequence matching.

Authenticated captures, PDFs, payloads, sessions and credentials remain protected outside Git. Public evidence manifests contain only paths, sizes and hashes. Local synthetic layout checks, genuine hosted checks and classroom trials are distinct.

## Connectivity and protected packaging

Only staging Supabase `inxshlumnhcgiahxqewe` and Vercel `applied-commerce-sa-staging` are targets. Hosted health and genuine password login demonstrate website configuration; supported Auth Admin, PostgREST and RPC operations demonstrate coding access separately. Application permission is tested with actual roles. No direct PostgreSQL connection or raw TCP grant is claimed. HTTP uses the enforced proxy; expected permission denials are not network failures.

Observed environment revision 40 reports ready VERCEL_TOKEN and SUPABASE_SECRET_KEY, but no coding-process classroom key binding. A guarded staging build packages with the original server-bound key without exporting it: existing ciphertext authenticates the key, prior hashes are validated, private input is processed in memory, and only ciphertext/hash metadata are returned. All eight temporary input Secrets and the sealing deployment were removed. Final normal builds use committed encrypted files, no temporary input and the unchanged project default build command. Protected fixtures and ignored backups are excluded from Git. No public plaintext guide asset, key or sealing endpoint exists.

## Instructional coverage and timing

[coverage.json](coverage.json) records all 395 authored lessons; [grade-term.csv](grade-term.csv) separates lessons and provisional contacts. Grade 8 Term 1 retains 20 lessons / 25 contacts; Term 2 retains 20 / 24; Term 3 now has 20 / 23. Term 3 Lesson 46 uses two contacts for calculation and application. Lesson 60 uses three for existing habit reflections/legacy, term reflection/equation retrieval, then letter/final checkpoint. Each continuation reopens the same lesson. All other Term 3 lessons provisionally use one contact.

The 21-day habit project uses real calendar days. Lessons 58/59 depend on actual seven-/fourteen-day evidence; future records are not fabricated. A weekly planning habit uses the existing Notes column to distinguish unscheduled opportunities. Source calendar/weighting claims need institution confirmation. Lesson 60’s separate Activity 63 log-review heading is suppressed by the learner renderer; guidance uses visible reflection and existing evidence without recreating hidden work or adding responses.

Thirty-five focused [editorial proposals](SOURCE_EDITORIAL_REGISTER.json) remain separate and unapplied, alongside the earlier staging register. They distinguish arithmetic, contextual safeguards, attribution and current-verification needs from retained metaphors. Earlier [factual checks](g8-t3-41-50/FACT_CHECKS.md) retain primary-source support and unresolved legal/attribution limits. Further private Grade 8 Term 4 and initial Grade 9 drafts are not counted as completed or released; their batch registers advance with actual verification.

## Delivery and scale

The current ciphertext is 1,229,967 bytes; public hash/placement manifest 1,310,414 bytes. Build-process memory is recorded separately from hosted request memory. The final sequential authenticated run made 55 requests across 11 lessons. The ten additions produced 10,569–17,880 decoded bytes; median 665.5 ms across 50 new-lesson requests, range 475–1,047 ms through the coding proxy. First observed requests are not guaranteed cold. Responses remain private/no-store.

Browser heap across the selected 14-plan navigation/PDF run ranged approximately 6.60–42.60 MiB. This is neither hosted server RSS nor a comparable all-plan leak test. Each request still decrypts/validates the whole release; no plaintext cache is introduced. Current measurements do not establish suitability for 395 plans. Measure guaranteed cold processes, concurrent server memory and decryption/validation before choosing smaller authenticated lesson/term releases, versioned manifests or a server cache. Retain fresh authorisation on every response. No architecture migration is included.

## Remaining work

Continue 331 lessons in individually reviewed grade/term batches. Configured maximum/inactivity session lifetime, hosted cold-process/server-memory measurements and educator timing trials remain pending. Natural JWT expiry and a genuine three-period lesson are now demonstrated. The isolated synthetic teaching browser harness still lacks its original-key fixture; genuine hosted checks cover teaching behaviour. Owner approval remains required for merging the classroom stack or deploying the separate live application.
