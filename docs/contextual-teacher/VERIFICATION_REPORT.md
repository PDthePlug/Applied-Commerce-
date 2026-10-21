# Integrated contextual Teacher View — verification and release report

Date: 21 October 2026. Scope: Grade 8, Term 1, Lesson 8 (`g8-t1-l08-008`).
Base: `3933c2d90519e7aa53984405693da9526c12a588` (current main when work began).
Final application code: `c68efc48bf5a27fb58225388e6bc0606f83bf5ad`.
Branch: `codex/contextual-teacher-g8-l8-2026-10-21`.
[Draft PR #43](https://github.com/PDthePlug/Applied-Commerce-/pull/43).

## Result and acceptance boundary

The original learner lesson is the teaching canvas. A server-authorised educator
can select Teacher View, navigate five delivery stages, and expand the existing
guide's support at reviewed semantic section boundaries. Preparation, the entire
instructional detail and complete printing remain available. A separate learner
presentation displays the original material with blank, disabled answer controls
and no teacher payload. The standalone Grade 8 guide remains a working fallback.

The implementation and synthetic UI verification pass. Staging is READY, its
server build successfully decrypted and validated the five-guide release with
the bound Secret, and CI passed on the exact application commit. **Real hosted
educator/learner access, tenant boundaries and cloud persistence are NOT TESTED**:
`AC_ROLE_FIXTURES` remains unset. Those runtime checks and owner/educator acceptance
are still required before final acceptance or any production release.

## Deliverables

| Required deliverable | Delivered evidence |
| --- | --- |
| Working integrated Teacher View | `components/contextual-teacher.tsx`, reader integration and staging link below |
| Complete source-to-stage alignment | [alignment.json](alignment.json): five section placements and all 27 original source references |
| Instructional preservation | [preservation.json](evidence/preservation.json): all 100 non-empty instructional text fields accessible at every width |
| Mobile/desktop collapsed and expanded screenshots | 12 panel captures across all six widths, plus dark/enlarged captures, in the encrypted review archive |
| Learner regression report | [learner-regression.json](evidence/learner-regression.json), 399-unit markup fingerprints and existing acceptance |
| Security/role verification | Access boundaries and limitations below, [CI evidence](evidence/ci.json), [coverage matrix](evidence/coverage.csv) |
| Staging owner review | Exact-code deployment and healthy dependency probe below |
| Draft pull request | PR #43, open as draft; no merge |

## Source and instructional alignment

| Stage | Time | Reviewed visible placement |
| --- | --- | --- |
| One phone, two purposes | 0–5 | Before “Needs and Wants Are Not Always Clear”, beside the complete cellphone/data examples |
| Teach the distinction and its limits | 5–14 | Before “The Difference”; links to the preceding vocabulary and the later ambiguous examples |
| Data under different constraints | 14–24 | After the complete cellphone/data example group, with a link that opens the grouped Deepening Insight |
| Practical application | 24–40 | Before the intact Activity 12 section, preserving its original table and response flow |
| Reflection and understanding check | 40–45 | Before the original checkpoint; links to Activity 12 and home follow-up |

The opening and discussion use the same source examples. The navigator deliberately
starts there, returns to definitions and revisits the examples. No learner blocks
are reordered. Source IDs were checked against actual renderer boundaries and
all five parent placements were asserted in the browser at every width. Lists,
tables, structured questions and grouped disclosures were not split. Placements
were reviewed against source and renderer by the implementing agent; independent
owner/educator approval is pending.

Activity Part A and one Part C explanation are the in-class scope. The original
24-hour experiment remains later follow-up. No experiment result is manufactured
or represented as completed during the period.

The complete guide retains its original concept, objectives, observable outcome,
prerequisites, educator knowledge, materials, vocabulary, misconceptions, South
African context, privacy guidance, every timed teacher/learner action, questions,
discussion reasoning, practical scaffold, understanding indicators, adaptations,
continuity and independent learning. All 100 instructional strings are checked
against the rendered full preparation at each width. Timing remains 5/9/10/16/5.
Governance-only IDs, excerpts, self-review and provenance are deliberately hidden
in ordinary Grade 8 teaching views; their original encrypted records are unchanged.

## Actual test results

| Gate | Actual outcome |
| --- | --- |
| Runtime integrity | PASS: 395 lessons, four assessments, 20,766 stable raw blocks |
| Baseline Node suite | 174 passed, zero failed; 45.0 seconds |
| Final Node suite | 178 passed, zero failed; 57.9 seconds locally; also passed in CI |
| All-unit default renderer preservation | PASS: exact main-branch static markup hashes for all 399 units |
| TypeScript / lint / build | PASS locally; also PASS in exact-code CI and staging build |
| Python block identity checks | Two passed locally and in CI |
| Complete public browser acceptance | 222 passed, zero failed locally (15.5 minutes); final-code CI: 222 passed (2.6 minutes) |
| Contextual synthetic six-width suite | 24 passed, zero failed; 325.2 seconds |
| Post-print-fix synthetic follow-up | Six passed, zero failed; 104.1 seconds; repeats preservation, printing, answer recovery and fallback at every width |
| Private release validation | Five guides, seven 45-minute periods, source fingerprints and excerpts validated |
| Public-asset privacy scan | 77 assets checked against 25 private/key sentinels; zero matches |
| CI synthetic database drill | Seven passed; 500 synthetic learners, 10,000 answers and 26 restored table digests; no production database |
| Encrypted review archive | 50 private artifacts; ZIP CRC and encrypt/decrypt byte-for-byte round trip passed |

The complete 24-case contextual suite ran on `40a56cf`. The final change is scoped
to preparation print styling and a server-build verification helper; all six
affected print journeys were repeated on `c68efc4`. The full public acceptance
also ran locally on `40a56cf` and then in CI on final application code `c68efc4`.
Later commits contain only documentation/evidence. No unrun suite is counted as
passed. [Machine-readable results](evidence/test-results.json).

## Learner-mode regression

Before editing, a fresh build of main supplied six screenshot/DOM baselines.
At 320, 360, 430, 768, 1280 and 1920 pixels the new default learner route has:

- Byte-identical semantic DOM and lesson heading under the same capture protocol.
- Identical full-page screenshot pixels and dimensions.
- The same 37 original lesson response controls, IDs, labels and types.
- No Teacher View control or private panel for the unauthenticated learner.

The original notes field and representative answers save and recover after reload.
The synthetic-account case checks both original response and note persistence at
all six widths; public local-mode acceptance checks response, explicit completion
and portfolio capture at 1280/430/360. Delivery navigation leaves answers and
completion unchanged. These local/synthetic checks do not establish cloud sync.

The books, runtime bundles, encrypted guide payloads and manifests, response-key
implementation, learning store, assessment/marking behaviour and Supabase schema
are unchanged. Existing source-lock tests verify the source/runtime fingerprints.

## Defects reproduced and corrected

| ID | Severity | Reproduction and correction | Retest |
| --- | --- | --- | --- |
| CT-01 | P2 | At 320px an expanded teaching moment displaced the adjacent learner material below the screen. A named keyboard-focusable body now scrolls within 40% of screen height while its summary stays outside the region. All teaching text remains accessible. | Before/after captures, region height assertion and ArrowDown scrolling; all 24 contextual cases passed |
| CT-02 | P2 | A learner sync warning appeared at the top of the teacher preparation PDF. The preparation-only print layout now excludes learner status alerts along with learner work. | Six repeated print journeys; both seven-page A4 samples contain no sync warning, blank pages or out-of-page text |

The initial eight-case browser run had four passes and four harness failures:
two asserted the `disabled` property instead of inherited fieldset disabling;
two attempted a cloud-review lookup using a synthetic account with no configured
Supabase client. The disabling assertion now uses `:disabled`; projection tabs
receive the same local preference/network fixture; portfolio verification runs
in the real local learner acceptance flow. The later 24-case run passed.

Other verification setup corrections: the copied fixture requires the documented
Webpack build because its node_modules symlink lies outside its Turbopack root;
the server checker reads descriptor 0 with `--key-file -` instead of reopening a
spawned socket as `/dev/stdin`. Both were corrected before successful final checks.
An apparent DOM mismatch was only 37 empty `style` attributes added by screenshot
instrumentation; matching capture order produced exact DOM and pixel equality.

## Security verification and limits

The protected API and role checker are unchanged. They validate identity, active
session and current platform-admin, assigned cohort-staff or institution
owner/admin access before importing/decrypting notes. User-editable metadata,
URL flags, viewing-mode buttons and `classroomContext` do not grant access.

Existing Node API contracts verify denial without loading notes for guests,
learners, unassigned staff, revoked sessions and forged role metadata; changed
accounts and role lookup failures fail closed. The real local-mode app returns
401/no guide, including with contextual URL flags. Private responses retain
private/no-store headers and Vary Cookie/Authorization.

The new client binds results to user object, session object, lesson and request
revision, aborts stale requests and clears private state at those boundaries.
Browser fixtures verify sign-out, same-account re-entry with a held/denied
request, another account, role revocation, retry and lesson change. Refetch occurs
on Teacher View entry, focus, online and visibility return. Instant push
revocation is not claimed. Private guide reasoning is absent from learner
localStorage, learner projection DOM and public assets. Projection requests no
classroom payload and exposes no saved answer/note values.

These are implementation and synthetic contract checks. **Real hosted educator
grant, learner denial, tenant isolation and cloud persistence are NOT TESTED**
because `AC_ROLE_FIXTURES` is unset. The connected hosted classroom probe reported
Vercel deployment authentication required; that is not proof of application-level
learner denial. No production credentials, users, Supabase writes, schema/RLS
changes, public decrypt endpoint or runtime fixture bypass were used.

Automated axe, native keyboard focus/toggling, scroll regions, dark appearance
and doubled text passed across all six widths. Human screen-reader sessions and
physical classroom/device pilots are NOT TESTED; no complete WCAG certification
or independent educational moderation is claimed.

## Print and visual evidence

Collapsed, expanded and dark/enlarged captures exist at all six widths. The 320px
and 1280px panel views and representative print pages were visually inspected.
Both mobile-origin and desktop-origin A4 exports contain seven pages, no blank
pages and no text blocks outside page bounds. Original learner print remains
covered by the full browser acceptance suite.

Private images/PDFs/raw synthetic browser results are encrypted in
[contextual-review.v1.enc.json](evidence/contextual-review.v1.enc.json).
[review-manifest.json](evidence/review-manifest.json) indexes all 50 artifacts by
name, byte length and SHA-256. Neither plaintext screenshots nor private guide
text nor the key is committed. On an authorised private machine, open the archive
using the existing tool and an existing private key file:

```sh
node scripts/classroom-content.mjs open docs/contextual-teacher/evidence/contextual-review.v1.enc.json /private/path/content.classroom-key /private/path/contextual-review.zip
```

The key is unchanged. No replacement key or private plaintext teaching release was
generated. Private source/QA evidence remains under ignored `work/contextual/`.

## Staging release and unresolved dependencies

[Open Grade 8 Lesson 8 on staging](https://applied-commerce-sa-staging-73nabhs5f.vercel.app/learn/8/term/1/g8-t1-l08-008).

- Project: `applied-commerce-sa-staging`, `prj_9MXnYeh3mxtFzcS1xzEDrTjOW2nP`.
- Target: this isolated project's production environment; separate `applied-commerce` is unchanged.
- Deployment: `dpl_8YXra7Zy6QB77bDrhkEAFgNUN3CH`, READY, exact code `c68efc4`.
- Deployment-specific build: `npm run build && node scripts/verify-classroom-hosted.mjs`.
- Build log: `classroomServerBuildVerification: PASS`, five guides/seven periods, key not exported.
- Runtime health: HTTP 200, exact commit, isolated Supabase `inxshlumnhcgiahxqewe`, Auth and Data API healthy.
- CI: [39629359362](https://github.com/PDthePlug/Applied-Commerce-/actions/runs/39629359362), all steps passed on the exact application commit.

[Staging proof](evidence/staging.json) separates successful **server-build**
decryption from untested authenticated runtime API access. The checker consumes
the existing Secret through a pipe and emits counts only. It adds no public
endpoint and makes no Supabase writes. No Secret value was retrieved from Vercel.

Owner review requires Vercel access and an assigned educator account in the
isolated backend. Complete real-role checks with private fixtures and the existing
target validator; review the intentional non-linear stage delivery/section
placements and classroom usability. Do not infer final acceptance from READY or
from synthetic accounts. The pull request remains draft; no merge or separate
production deployment is authorised or performed.
