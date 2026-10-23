# Grade 8 Term 2 Lessons 21–25: packaging preparation

This follow-up starts from PR #49 head `ffc60d742e46bd290dcce6c11e34964823c9b7bf`. PR #49 remains open and unmerged. Its deployed shared interface and existing 24 guides are unchanged by this preparation. No new guide is counted as completed or available on staging.

The five individual drafts remain in the protected `AC_ROLE_FIXTURES/rollout/authoring` directory, outside Git. Their actual source was read in the prior work; the current assembly check additionally validates all original source hashes, every activity disposition, all field coverage and **55 actual renderer insertions**. It preserves the accepted **24 plans exactly** and prepares **29 total plans / seven additional provisional contact periods** in memory. This is not a hosted teaching or classroom trial result.

The append tool accepts the original key from `AC_CLASSROOM_CONTENT_KEY`, a private `AC_CLASSROOM_CONTENT_KEY_FILE`, or a private `--key-file` path/stdin. It authenticates the key by opening the existing ciphertext, validates all drafts before writing, seals with the existing AES-GCM context and key identity, and verifies an authenticated round trip. It writes ciphertext and public hash/placement metadata only. An append cannot replace an existing lesson, duplicate identities, omit an existing release identity or hide a missing activity/renderer placement. File replacement attempts restore the previous files if a rename fails.

Release validation now compares the payload with the actual manifest rather than freezing the total at 24. A separate accepted-baseline fixture fixes all original 24 plan hashes, periods and field counts; append support does not weaken their preservation test. The original 20 Grade 8 Term 1 plans and the five original benchmark-guide checks remain required. No runtime authorisation, content caching, database schema or delivery architecture changed.

The isolated local teaching harness can inherit a privately bound key variable or key-file variable, while retaining the documented private-file fallback. It remains an isolated synthetic UI harness and cannot prove staging authentication. The client-asset scan can consume a key through stdin, avoiding a temporary key file. No actual key is embedded in a command or fixture.

Local verification: **199 Node tests passed**, typecheck, lint, runtime census and local production build passed. The local build does not establish that the real key can decrypt the release. New regression cases reject replacements, repeated drafts, changed accepted-plan text, source drift, missing activity coverage, inconsistent availability, missing keys and a synthetic wrong key. Missing/wrong key attempts leave all three release files unchanged. These tests do not authenticate the real classroom key.

## Observed binding mismatch

The owner reports that `AC_CLASSROOM_CONTENT_KEY` is bound in the coding environment and the configuration is applied. The active task runtime nevertheless reports **desired revision 15 / observed revision 15**, `observations_current: true`, and only `VERCEL_TOKEN` and `SUPABASE_SECRET_KEY` as ready secrets. Fresh login and non-login shell commands both report no classroom-key or classroom-key-file variable. This is an observation of the active worker, not a claim about the owner's saved configuration.

The real key has therefore not yet been authenticated locally. No key value was read from chat, printed, committed, replaced or exported from staging. The active environment needs its new binding made available to this worker, with refresh/restart if necessary. Before any restart, the six-role fixture set, authenticated evidence and five private drafts were backed up to mode-protected, Git-ignored `work/programme-rollout/private/role-fixtures/`; the backup’s staging target and role identities were verified without printing credentials. This protects the work if `/tmp` is replaced. Subsequent commands can use that directory through `AC_ROLE_FIXTURES` if needed. Once it is visible, run the append command below, perform private release/client checks, deploy only to the isolated staging project and verify the new five lessons with genuine roles, printing, responsive layout and persisted learner evidence before advancing the next batch.

```sh
node scripts/append-teaching-batch.mjs \
  --draft-dir "$AC_ROLE_FIXTURES/rollout/authoring" \
  --version classroom-v2.g8-t2-first-five.2026-10-23
```

This command contains no key value. It must not be reported as successful until the original-key authentication and subsequent hosted checks actually pass. There remain 371 incomplete lessons, including these five drafts. No production release or classroom-stack merge is authorised.

The rebuilt public assets also passed a private-prose scan covering both the accepted guides and the five drafts; see [batch-21-25-asset-check.json](batch-21-25-asset-check.json). No protected fixture/authoring backup path was found in output-file traces. The key itself could not be scanned because it is absent from this worker.

## Staging build sealing alternative

The existing isolated staging project has the original classroom key as a protected Vercel Secret. The new `seal-staging-teaching-batch.mjs` build job can accept the reviewed draft batch through temporary private Secret inputs, validate the original release/source hashes and seal it inside that trusted build. It guards the exact staging project ID and staging Supabase URL before reading the input. No HTTP sealing endpoint, new application permission or exported key is introduced.

Only ciphertext and public hash/placement metadata are returned from the protected temporary deployment. Private input is held in memory, removed from the child build environment, and never written as source or public material. The build runs private release verification and scans public assets for private content and the key. Temporary input variables and the temporary deployment must be removed after the ciphertext is committed and the normal final staging deployment is verified. This workflow is not successful until its original-key round trip and subsequent genuine-role checks pass.

New drafts use an explicit brief-cue group so the visible cue retains its field identity and a deeper disclosure appears only when additional support exists. Authored period conclusions/reintroductions replace redundant generic continuation paragraphs for those explicit cues. Existing 24 plans retain their current rendering and exact content hashes.

The staging build alternative has now succeeded: the original key authenticated, all 29 plans and 2,066 fields validated, and the public asset/key scan passed. Ciphertext and metadata were retrieved with matching hashes; the accepted 24 rows and original key identity are unchanged. All five temporary private input Secrets were removed. The local binding mismatch no longer blocks this batch. Final normal-deployment classroom/print/responsive/persistence tests remain pending. Two failed builds identified a canonical `originalTitle` false positive in the scan, corrected with an exact same-lesson catalogue-title exception and regression tests; no private prose or key was released.
