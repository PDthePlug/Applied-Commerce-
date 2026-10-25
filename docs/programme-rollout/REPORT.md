# Applied Commerce classroom rollout

**137 of 395 lessons have individually reviewed teaching support in verified staging; 258 remain.** All 80 Grade 8 lessons and all 54 Grade 9 Terms 1–3 lessons are covered, alongside the three existing higher-grade benchmarks. Completion records instructional review and demonstrated checks; classroom timing and owner review of new content remain pending.

Current staging: https://applied-commerce-sa-staging-lim9942my.vercel.app . Deployment protection and genuine application login apply. Tested application/content commit: `7751ac35ec5b4be13d15ae1051ea9095f018f715`. Later documentation or validation-harness commits do not imply another application deployment.

The owner merged PR #60 and the initial PR #61 candidate. PR #61 merged head `7becdcc`, before the later title fix and teacher-reference corrections. [Follow-up PR #62](https://github.com/PDthePlug/Applied-Commerce-/pull/62) contains those corrections and final evidence. This work did not merge the classroom stack or initiate a deployment to the separate live application.

## Workbook and teaching experience

All 395 lessons, four assessments, canonical books, 20,766 stable source blocks, learner activities and saved-work identities remain. The workbook leads; preparation, brief contextual cues, useful local depth, central navigation, complete private printing and fallback remain. Continuous checkpoint numbering, hanging text, original response controls, moderate spacing, placeholders, saved feedback and restored icons are retained. No repeated panel toolbar, new learner activity, source rewrite, database migration or Zimbabwe change is included. The abandoned milestone is excluded.

The initial candidate reproduced a 337px-wide authored title on a 320px screen. The shared title style now wraps long words while preserving wording, type size and visible overflow. Genuine before/after runs cover 30 cases each: six overflows before, zero after. Source/checkpoint text and controls are unchanged. See [defect evidence](g9-t3-35-54/layout-defect.json).

The instructional audit also incorrectly inferred missing digital rows from header-only source tables. Actual rendering supplies them. Fifteen teacher fields in seven plans are corrected; six editorial claims are withdrawn. The Grade 12 criteria table has twelve editable fields; only its separate scoring-grid gap remains proposed. The Grade 9 household totals-only table remains read-only. See [rendered tables](g9-t3-35-54/evidence/table-results.json), [strict amendment hashes](g9-t3-35-54/table-reference-amendments.json) and both editorial registers. No learner rows or response fields were added.

## Demonstrated verification

| Check | Current evidence |
| --- | --- |
| Local gates | 213 Node tests, runtime, typecheck and lint pass; title regression failed before and passed after |
| Normal original-key build | 137 plans / 5,511 fields / 184 raw period allocations; 77 public assets checked against 7,319 private sentinels plus key |
| Preservation | Approved 24 hashes unchanged; 113 of the earlier 117 bindings identical; four earlier and three new plans have the reviewed field-only corrections |
| Integrated classroom | 29 selected lessons / 1256 exact fields; original controls, local depth and preparation pass |
| Central navigation | 263 targets reached and focused; earlier-section revisits and Learner View pass; no repeated panel controls |
| Responsive | 522 cases across 320/360/430/768/1280/1920 widths and 1/1.28/2 text scales |
| First-response persistence | 24 touched lessons, including all 20 additions: edit, clear, reload, direct cloud check and fresh password login |
| Table persistence | Nine exact source tables checked; eight editable tables pass edit, clear, reload and fresh login; original synthetic values restored |
| Integrated print | 29 complete private guides / 125 nonempty A4 pages |
| Standalone fallback print | 29 complete guides / 128 nonempty A4 pages |
| Physical PDF content | 2512 field occurrences; zero missing; exact DOM and A4 margins checked separately |
| Multiple periods | Lessons 38/53/54 retain 2/2/3 provisional contacts, opening/closing cues and central navigation |
| Auth/RLS/RPC | 37 genuine checks; active assigned educator, learner denial, revoked assignment, logout/session revocation and institution boundary |
| Educator review | Authorised evidence review passes; learner/revoked users denied; unrelated institution has zero learner rows and guidance 403 |

[Exact scope and results](g9-t3-35-54/RESULTS.json) distinguish current checks from historical evidence. Private captures and PDFs persist in a protected workspace directory outside Git; the [evidence inventory](g9-t3-35-54/authenticated-evidence-manifest.json) contains only paths, sizes and hashes. A restart removed temporary captures; the current full run and before-fix captures were repeated. A table-load timing error and deployment-protection interruption are retained separately, not reported as application authentication failures.

## Authored lessons and provisional contacts

| Grade | Term | Authored lessons | Recommended contacts | Raw guide allocations |
| --- | --- | ---: | ---: | ---: |
| 8 | 1 | 20 | 25 | 25 |
| 8 | 2 | 20 | 24 | 24 |
| 8 | 3 | 20 | 23 | 23 |
| 8 | 4 | 20 | 26 | 30 |
| 9 | 1 | 16 | 24 | 24 |
| 9 | 2 | 18 | 29 | 29 |
| 9 | 3 | 20 | 24 | 24 |

Grade 8 Term 4’s three alternative project plans share two contacts for the chosen project: six raw allocations count as two recommended contacts. Grade 9 Term 3 retains twenty authored lessons and recommends twenty-four provisional contacts. Lesson 38 returns after a real audit day; Lesson 53 allows substantive tracker/reflection and portfolio review; Lesson 54 separates reflection, portfolio and the existing pathways task. The real twenty-one-day habit project and ten-day midpoint are elapsed practice, not invented results or extra authored lessons. Educator trials and actual enrolment may change estimates.

## Connectivity, editorial review and delivery scale

Only staging Supabase `inxshlumnhcgiahxqewe` and Vercel `applied-commerce-sa-staging` are targeted. Genuine password login, supported Auth Admin and learner RPC/RLS operations demonstrate access separately. Earlier read-only managed SQL inspected 22 RLS-enabled public tables, 45 policies and seven institution/session helpers; direct PostgreSQL/TCP is not configured. See [capability report](g9-t1-remaining/connectivity-capabilities.json).

Current coding configuration exposes VERCEL_TOKEN and SUPABASE_SECRET_KEY. Guarded staging builds authenticate the original server-bound key without export. Inspection confirms the original key binding, unchanged default build command, zero temporary packaging inputs and deletion of the temporary sealer. All 137 plans were recovered after the restart through genuine authorised delivery and matched committed hashes. No classroom key was exported.

Authorised assigned educators and institution administrators can review saved evidence within their permissions. Personal answers need not be read to classmates; saved rows are not protected by a separate submission flag. Misleading source visibility statements remain separate editorial proposals, with relevant local guidance.

The rollout register contains 125 historical entries: 119 active separate proposals and six withdrawn table claims. Thirteen proposals concern the unreleased Grade 9 Term 4 candidate. The earlier staging register includes the explicitly corrected Grade 12 table entry. None is applied to learner source. Exact quoted passages and block identities are technical evidence, not approval of a proposed concern. Metaphors remain where legitimate.

The final sequential measurement made 105 authenticated requests, including 100 to additions: median 592.5ms, range 513–998ms; selected responses 8933–18586 decoded bytes through the coding proxy. Responses remain private/no-store. Every selected-plan request still opens/validates the entire release after fresh server authorisation. These samples do not establish a guaranteed cold process, cache hits, hosted memory or 395-plan suitability. See [delivery recommendations](CONTENT_DELIVERY_SCALE.md).

Natural original JWT expiry was genuinely demonstrated in [earlier expiry evidence](expiry-results.json). Configured maximum/inactivity limits, hosted cold-start/concurrency/server-memory measurements and educator timing trials remain pending. Continue the remaining 258 individual lessons in passing grade/term batches. Merging the follow-up and deploying to the separate live application require owner approval.

Ten Grade 9 Term 4 lessons (55–64) form a sealed 147-plan candidate preserving all 137 verified bindings; full hosted acceptance is pending. Five further lessons (65–69) remain private drafts. All fifteen remain within the uncompleted 258 until their own acceptance passes. See [private-draft status](g9-t4-private-drafts/review-status.json).
