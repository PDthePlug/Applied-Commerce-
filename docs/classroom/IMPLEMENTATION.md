# Integrated classroom workspace and private content

## Application entry and role model

The existing facilitator navigation and institution workspace menu link to `/facilitator/classroom`. The workspace selects from the existing 395 lessons by grade and term. Five entries have draft benchmark guidance; the others explicitly say the guide is not developed. The guide can switch to learner-facing presentation prompts, print through the browser (including Save as PDF), or open the original learner lesson. `?classroom=1` adds a return link to the same guide; it grants no access and does not change response identities.

`GET /api/classroom?lesson=...` uses the existing server Supabase client. It requires `auth.getUser()`, `has_active_session`, then trusted `is_platform_admin`, active `cohort_staff` assignment or active `school_memberships` owner/admin authority. Any lookup error fails closed. Existing institution educator access is represented by cohort assignment; this branch does not invent a blanket teacher role or broaden learner-record access. An expected-account header prevents a response being applied to a changed account. The local backend always denies this real endpoint. Responses are private/no-store and never written to browser local storage.

`lib/classroom/private-library.ts` is server-only and dynamically imported after authorization. It validates the encrypted release, private key, guide structure, lesson fingerprint linkage and manifest identities. Missing or invalid configuration returns a safe 503 after authentication. No teacher notes are passed as public page props, statically generated into HTML or imported by client code. Guidance fetched during a session is hidden when the account/lesson changes and rechecked on focus, visibility return or online recovery. Previously read/printed material cannot be recalled from an authorised recipient; ordinary access controls do not constitute DRM.

## Versioned model and source protection

`lib/classroom/model.ts` defines the catalogue and private guide contract; the validator enforces complete identity, preparation, stages/actions, discussion, practical work, formative checks, six adaptations, continuity and ten review entries. Periods contain at least three stages and total exactly 45 minutes; the current release has five stages per period and seven periods. Validation checks completeness and identity, not pedagogical truth or human approval.

`content/instructional/catalog.v1.json` contains only public lesson metadata. `source-lock.v1.json` locks books/runtime files and all 399 resolved units. `benchmark-manifest.v1.json` publishes source links, excerpt hashes and structural validation metadata without indicative answers. The full five-guide JSON is stored in the AES-256-GCM `benchmark-guides.v1.enc.json`; authenticated encryption binds its context and detects alteration. Keys and plaintext are excluded from Git. No canonical book, response key, assessment or curriculum bundle is changed.

## Private review in this workspace

The private authoring/review package is under ignored `work/classroom/private/`. The separately held key file is `work/classroom/private/content.classroom-key`. **Do not print, commit, attach to a public PR or copy its value into a command/log.** It must be retained through an approved private secret handoff before this ephemeral workspace is discarded. Git alone cannot recover the encrypted guides if the key is lost. A hosted review needs an authorised operator to bind the private file path through `AC_CLASSROOM_CONTENT_KEY_FILE`, or bind the base64 value through server-only `AC_CLASSROOM_CONTENT_KEY` in its secret manager. The file setting takes precedence. Neither name may acquire a `NEXT_PUBLIC_` prefix. This branch neither changes deployment configuration nor deploys it.

Validate the private release without displaying content:

```sh
node scripts/classroom-release.mjs --key-file work/classroom/private/content.classroom-key
```

For an isolated UI review, the preparation command copies the application into ignored `work/classroom/fixture-app`, replaces the auth context and classroom API **in that copy only**, and leaves the real application's gate unchanged. The copy uses a synthetic teacher, the real guide decryption/validator and no Supabase credentials. Browser tests block external requests and stub presentation preferences. The learner sync warning in that copy is expected because it is not a real account. This fixture is a UI contract test, not authentication, persistence or RLS certification.

```sh
node scripts/prepare-classroom-fixture.mjs
NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE=local NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY= npm --prefix work/classroom/fixture-app run build -- --webpack
npx playwright test --config=playwright.classroom.config.mjs
```

To inspect interactively, run the fixture's `next start` on loopback port 3200 with `AC_CLASSROOM_CONTENT_KEY_FILE` set to the absolute private key-file path. Open `/facilitator/classroom`; select one of the five draft entries. Do not expose the synthetic fixture server publicly. For a real non-production session, use the existing isolated-role fixture procedure instead and keep the real endpoint/role checks intact.

Teacher screenshots, PDFs, traces and any failed-test diagnostics with indicative answers are private and ignored. A versioned encrypted evidence archive may be retained with the same private release key; public report summaries contain only outcomes and metadata. Browser-generated PDFs are functional exports, not an editorially approved publication.

## Required gates before hosted release

Independent educator moderation/pilots; private key custody/provisioning; isolated live role and institution-boundary testing; then an authorised non-production review. A real Supabase role test must use `scripts/lib/validation-target.mjs` and `playwright.roles.config.mjs`; production project `upvbxplswxhoqzbvgdxv` is prohibited. `AC_ROLE_FIXTURES` is unset here, so these live tests are NOT TESTED. Do not merge, publish guides as approved or deploy production from this milestone without authorisation.
