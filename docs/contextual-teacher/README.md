# Contextual Teacher View — Grade 8, Term 1, Lesson 8

**Current review:** [PR #43 owner corrections](owner-review/REPORT.md) supersede the initial verification below. Owner acceptance is pending.

This milestone changes only the teaching presentation of `g8-t1-l08-008`.
The existing learner content remains the canvas. The encrypted Grade 8 benchmark
is reused without rewriting it; the other four benchmark payloads are unchanged.

See the [verification and release report](VERIFICATION_REPORT.md) for actual test
results, the staging link, instructional preservation, encrypted screenshots/PDFs
and authenticated-role limitations. [Draft PR #43](https://github.com/PDthePlug/Applied-Commerce-/pull/43).

Open `/learn/8/term/1/g8-t1-l08-008`. After the existing server identity,
active-session and staff/admin checks succeed, the reader offers Learner View and
Teacher View. Teacher View adds five initially collapsed guidance disclosures,
preparation, a delivery navigator and access to the complete instructional detail.
The normal learner route never treats a URL parameter or browser flag as a role.

## Source and teaching alignment

The complete machine-readable map is [alignment.json](alignment.json). It records
source IDs for governance, renderer section boundaries, before/after placement,
timing, supporting sections and the deliberate delivery order.

| Delivery | Minutes | Placement in the existing learner lesson |
| --- | --- | --- |
| One phone, two purposes | 0–5 | Before the complete cellphone/data example section |
| Teach the distinction and its limits | 5–14 | Before The Difference; vocabulary is immediately above |
| Data under different constraints | 14–24 | After the complete cellphone/data example section; link to the grouped Deepening Insight |
| Practical application | 24–40 | Before the intact Activity 12 section |
| Reflection and understanding check | 40–45 | Before the original checkpoint; later observation remains follow-up |

The opening and discussion share source examples. Delivery starts there, returns
to definitions, then revisits those examples. Source order is preserved. Stage
navigation changes only delivery focus; it does not complete learner tasks.

No source list, responsive table, structured response group or Deepening Insight
disclosure is split to accommodate teaching notes. Section-level placements are
explicit implementation/source reviews, pending owner/educator approval. No
claim is made that each source ID has a separate visible DOM node.

The 24-hour experiment is planned for later. Activity Part B and the later
checkpoint about an actual experiment remain untouched in the learner lesson;
the teacher sequence does not manufacture an observation during this period.

## Preparation, detail and projection

The initially closed preparation at the top now contains complete educator
preparation. All 100 original instructional text fields have explicit live
locations in preparation, the five contextual stages or the local independent
work panel. See the [field-by-field map](owner-review/instructional-field-map.csv).
The full bottom document has been removed from the live lesson. A print request
mounts the complete original guide and contextual clarification for print only.
The standalone guide remains a working fallback.

Panels use ordinary document scrolling and local expandable detail, without a
constrained vertical scroll region. A compact accessible stage selector and
previous/next controls expose the deliberate teaching order. Additional local
annotations distinguish current practical/reflection work, later Part B/home
observations and optional Deepening Insight. Learner notes and completion
controls return unchanged in Learner View and are absent during Teacher View.

A separate encrypted Grade 8-only enrichment supplies reviewed-for-implementation
transitions, activity scheduling and the survival/functional distinction, pending
owner and educator review. It is linked to the existing guide version and source
fingerprint; the original five-guide release is unchanged.

The learner presentation link opens `?presentation=1` in a separate window with
no opener relationship. That window requests no classroom payload, renders no
private guidance or saved answers/notes, and disables response entry. The teacher
keeps guidance in the original window. Share only the learner window; sharing
the entire teacher screen would disclose its displayed notes. No automatic
coordination with learner devices is implemented or claimed.

The standalone Grade 8 guide remains at
`/facilitator/classroom?lesson=g8-t1-l08-008`. Both Grade 8 teaching surfaces hide
raw source references, source excerpts, self-review checklists, internal review
provenance and audit metadata. Those fields remain unchanged in the encrypted
release for governance. The other four standalone guide presentations are unchanged.

## Access and learner-work boundaries

`app/api/classroom/route.ts` and `lib/classroom/access.ts` retain their existing
verified-user, active-session, current-assignment/admin checks and private,
no-store headers. No migration, RLS change, production database write or fixture
flag is added. Guide and contextual-enrichment data are loaded through the protected API, never imported
into client code as plaintext.

The contextual client binds results to the current user object, session object,
lesson and request revision. It aborts stale requests and clears private state
on those changes, hides stale content synchronously, and refreshes checks on
Teacher View entry, window focus, online and visibility return. Role revocation
is detected at the next such check; instant push revocation is not claimed.
No private guide is stored in localStorage or sessionStorage.

Learner blocks, stable identities, response key generation, completion, marking
and portfolio code are unchanged. Presentation mode is confined to this lesson;
the default Learner View retains the original controls and persistence.

## Repeatable verification

Public engineering and learner gates:

```sh
npm run verify:runtime
npm test
npm run typecheck
npm run lint
npm run build
python3 scripts/test_block_identity.py
npx playwright test --config=playwright.config.mjs --workers=1
```

Private synthetic UI review, using the original private key file and no Supabase
credentials (fixture replacement occurs in an ignored copy only):

```sh
node scripts/prepare-classroom-fixture.mjs
NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE=local NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= npm --prefix work/classroom/fixture-app run build -- --webpack
npx playwright test --config=playwright.contextual.config.mjs
```

This runs four cases at each of 320, 360, 430, 768, 1280 and 1920 pixels. It does
not certify real educator/learner roles, cloud persistence or RLS. Real-role
checks require private isolated `AC_ROLE_FIXTURES`, the existing target validator
and an explicitly verified hosted commit. Without those fixtures they are
**NOT TESTED**.

The renderer regression fixture records SHA-256 of the exact empty-answer markup
for all 399 main-branch units, generated from commit
`3933c2d90519e7aa53984405693da9526c12a588`, rather than from the modified renderer.
The original Node tests check default learner parity, real renderer boundaries,
timings and failure on ambiguous or changed placements; owner-review checks add explicit field ownership and safe Part-heading annotations.

For this staging review deployment only, the deployment build command can append
`node scripts/verify-classroom-hosted.mjs` after `npm run build`. This passes the
existing server-bound Secret to the existing release validator through standard
input (`--key-file -`). It checks all five encrypted guides, timing, source
fingerprints and excerpts, plus Grade 8 contextual enrichment and 100-field ownership without logging key/guide text, writing a key file or
adding a test endpoint. A separate Node regression rejects missing/invalid
Secrets without disclosing their values. A PASS is server-build decryption
evidence, not runtime educator or learner authorisation evidence.

Screenshot/PDF evidence containing private teaching text must remain private or
be recipient-encrypted. Never add plaintext teacher screenshots, PDFs, browser
traces, guide JSON or key files to this public repository. The final verification
report records actual results, evidence references, staging deployment and limits.
