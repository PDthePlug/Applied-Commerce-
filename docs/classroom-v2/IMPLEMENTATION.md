# Contextual teaching V2 implementation

`lib/classroom/teaching-plan.ts` defines a versioned field dictionary, preparation groups, variable teaching moments, one/two 45-minute periods, local deep guidance, explicit transition links, source placements and activity dispositions. It has no Grade 8 stage names, five-stage limit or fixed lesson references. `components/teaching-plan-view.tsx` implements authorised modes, native disclosures, compact period/stage navigation, local scaffolds, complete private printing and standalone rendering. The former single-lesson component is replaced.

`components/lesson-reader.tsx` integrates the plan around the existing `ContentBlocks`. Learner response callbacks, original indices and the learning store are unchanged. `ContentBlocks` gains only an optional annotation before verified plain Part/Step paragraphs; no annotation callback changes the default learner markup. Section annotations reuse the existing semantic renderer. The 399-unit main-branch markup fixture is retained unchanged.

The public availability list contains only lesson identities. The public source/coverage manifest contains hashes, field paths, locations, boundary references and review metadata, without teacher prose. It supports audit and CI, not authorisation. The server-only private library decrypts `teaching-plans.v2.enc.json` using the existing classroom key, validates the entire release against its manifest and original catalogue, and returns only the selected plan. No new key, database table, RLS policy or migration is introduced. The original five-guide ciphertext, manifest and approved Grade 8 clarification ciphertext remain intact.

The 19 new plans were authored individually after reading complete runtime lessons against the authoritative compiled source. Their stage questions, tasks, reasoning, misconceptions, timing and later work differ with the actual material. A private authoring helper compiled their layouts and field paths; it did not infer teaching content from titles or automatically grant educational approval. All 24 plans remain marked `educator-review-required`.

## Private authoring and review

The private source and authoring workspace is `work/classroom-v2/private/` (ignored by Git). Preserve the original `work/classroom/private/content.classroom-key`. Never place a key, decrypted guide, screenshot containing indicative answers or guide PDF in Git or `public/`.

Validate privately:

```sh
node scripts/classroom-release.mjs --key-file work/classroom/private/content.classroom-key
node scripts/teaching-release.mjs --key-file work/classroom/private/content.classroom-key
node scripts/check-classroom-client.mjs --key-file work/classroom/private/content.classroom-key
```

The V2 validator recomputes runtime bindings, checks every live field location and preserves original benchmark/clarification fields by exact path and value. The hosted staging build passes the already-bound server Secret over stdin to both release validators and prints only counts. No key value is accepted as a command-line argument.

The isolated UI harness is a generated copy under ignored `work/classroom/fixture-app/`, never a flag or bypass in the real application. Prepare it with `node scripts/prepare-classroom-fixture.mjs`, build using `--webpack` because the copy symlinks the workspace dependencies, then run `playwright.teaching.config.mjs`. Its synthetic identity verifies interface behaviour and private decryption only. It cannot prove a real Supabase educator assignment or learner denial. Real-role tests continue to require `AC_ROLE_FIXTURES` and verified isolated targets.

## Review artefacts

- `coverage/`: 24 individual field-by-field access maps, reviewed placements and authored activity dispositions. Every field has a selector and an expansion route.
- `educational-quality-register.json`: source gaps and proposed corrections, separate from engineering defects. Priority P1 highlights safety, privacy or significant accuracy qualifications.
- `learner-pixel-regression.json`: 120 six-viewport comparisons against the pre-rollout approved application build; no learner prose or answers are included.
- `TEACHING_STANDARD_V2.md`: instructional and batch-review contract.
- `REPORT.md`: actual verification results, remaining limitations and exact PR/staging references when recorded.

Review preparation first, then navigate through the original lesson in teaching order. Inspect local deeper support, source alignment, age-appropriate reasoning, later-work labels and complete printing. Use two-period lessons to test revisits. The next term requires explicit review of this delivery; a passing schema is never that approval.

## Field-map reading example

A coverage row contains an instructional field path, its SHA-256 digest and each live location. `preparation` means the collapsed preparation at the beginning; other names identify the local moment's disclosure. A preparation period-title location is in its displayed teaching sequence. The `access` list provides the exact selector and expansion route. The map does not contain the text or a key. Verify the selected guide through an authorised session, then compare each displayed field with the privately decrypted release. `scripts/teaching-release.mjs` performs exact field preservation, while the private browser suite checks that every actual text field is present and visible after native disclosures open.

A supporting disclosure may be scheduled inside an existing stage without becoming another timed stage. Such a moment uses `support` with an explicit `withinStage` link and zero additional minutes. This preserves the approved Grade 8 pause/Part C support as current classroom work, while the 24-hour Part B experiment remains later and deepening remains optional. Supporting moments do not alter period totals.

Lesson 20 has a reviewed placement exception. The existing learner renderer suppresses Activity 27's log-review heading/prompts while leaving a portfolio notice in that semantic container. V2 does not accept that as a visible heading. Its review moment is placed at the next intact Activity 28 portfolio section, retains both source references, and uses available prior activity responses or paper evidence. The source renderer and all saved-work identities remain unchanged. This ambiguity is recorded for separate source/presentation review.

For an independent fixture copy, use `node scripts/prepare-classroom-fixture.mjs --target work/classroom-v2/fixture-app`. Targets are constrained to ignored `work/`; the real application never receives its synthetic auth implementation.

## Print regression

The teacher print page is named A4 with 12 mm margins. The non-print route announcer is hidden only while a private teacher guide is printed; otherwise Chromium can append an empty final page. The browser regression checks its print visibility. After the desktop export, Poppler can check all release PDFs without logging teaching text:

```sh
python3 scripts/verify-classroom-print.py --pdf-dir work/classroom-v2/private/evidence --suffix=-complete --report work/classroom-v2/private/print-check.json
```

The delivered final exports were checked separately under `print-final-evidence/`; all 24 guides and all 1,867 private instructional fields survived PDF export. Geometry and field-preservation reports contain counts, bounds and paths only. See `REPORT.md`, `SECURITY_AND_ROLES.md` and `EVIDENCE.md` for exact commits, test provenance and review limits.
