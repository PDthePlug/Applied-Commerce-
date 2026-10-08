# Applied Commerce Milestone 2 Implementation Execution Plan

**Baseline commit:** 281b7440183c263fed2dfe0a24a6bc7da9e6d03c
**Date:** 8 October 2026

## Objective
Convert the architecture baseline into a governed, durable learning platform without disrupting the current learner experience or changing stable curriculum/evidence identities.

## Phase 0 — Safety baseline
- Record current production commit and deployment.
- Confirm main → Vercel deployment relationship.
- Confirm AC Supabase project and environment state.
- Capture current local-state schema/version and representative response records.
- Establish rollback target.
- Do not change production data.

**Exit gate:** current production can be identified and restored by commit.

## Phase 1 — Verification foundation
Implement:
- runtime preflight;
- canonical source manifest;
- SHA-256 source fingerprinting;
- compiler/source integrity audit;
- runtime artifact verification;
- unified npm verify command;
- CI integration.

Suggested command contract:
- npm run verify:source
- npm run verify:runtime
- npm run verify
- npm test
- npm run typecheck
- npm run lint
- npm run build

**Exit gate:** a clean checkout can prove that source → compiled runtime is intact without manual inspection.

## Phase 2 — AC database foundation
Before learner migration:
- create repository-managed Supabase migration structure;
- create initial schema;
- create explicit indexes and constraints;
- establish migration versioning;
- define RLS policies;
- create development/test environment path;
- add schema verification.

Initial tables:
1. learner_profiles
2. institutions
3. cohorts
4. enrolments
5. curriculum_releases
6. lesson_progress
7. responses
8. portfolio_evidence
9. assessment_attempts
10. audit_events

**Exit gate:** migrations apply cleanly to a fresh database and RLS tests prove isolation.

## Phase 3 — Identity
Implement:
- Supabase Auth integration;
- AC user identity adapter;
- learner profile creation;
- authenticated session boundary;
- role/scope primitives;
- safe unauthenticated state.

Do not expose staff/institution functionality yet.

**Exit gate:** authenticated learner can be identified consistently without changing reader behaviour.

## Phase 4 — Durable learner state
Create a persistence adapter behind the existing learning-store interface.

The UI should continue calling the same conceptual operations:
- saveResponse
- savePromptResponse
- markComplete
- setProfile
- setLastOpened

Replace direct localStorage writes internally with a dual-compatible adapter.

**Exit gate:** reader behaviour remains unchanged while state can be persisted durably.

## Phase 5 — Local-state migration
Define and implement:
- local v2 → cloud migration;
- stable-key reconciliation;
- conflict handling;
- retry/failure behaviour;
- no-destructive-overwrite rule;
- migration completion marker.

Rules:
- existing stable response keys are retained;
- cloud state never blindly overwrites newer local work;
- failed migration leaves local backup intact;
- learner can recover after reload.

**Exit gate:** representative old local states migrate successfully without lost answers.

## Phase 6 — Evidence and portfolio persistence
Persist:
- response;
- source/unit identity;
- prompt/block identity;
- slot;
- curriculum release;
- timestamps;
- evidence status;
- portfolio eligibility.

Do not infer correctness unless the authored marking registry explicitly permits it.

**Exit gate:** a response survives logout/login, reload, device/session transition and curriculum release changes.

## Phase 7 — Recovery and failure UX
Implement:
- save failure state;
- retry;
- offline/local fallback where appropriate;
- safe API errors;
- no raw database errors;
- recovery acceptance tests.

**Exit gate:** intentional persistence failures are recoverable and never silently reported as saved.

## Phase 8 — Security certification
Test:
- learner A cannot read learner B;
- learner cannot mutate institution/cohort records;
- educator scope is limited;
- institution scope is limited;
- unauthenticated requests cannot access private learner data;
- privileged operations occur server-side.

**Exit gate:** RLS/security tests pass against the actual schema.

## Phase 9 — Browser persistence certification
Extend Playwright with:
- sign-in;
- lesson open;
- answer;
- reload;
- completion;
- next lesson;
- portfolio;
- save failure;
- recovery;
- logout/login;
- 360/430/desktop.

**Exit gate:** persistence and recovery pass across all representative widths.

## Phase 10 — Release integration
Update CI to require:
source integrity → identity → curriculum → persistence → typecheck → lint → build → runtime verification → browser certification.

Every release records:
- app commit;
- curriculum release;
- schema migration;
- test evidence;
- deployment;
- rollback target.

**Exit gate:** main cannot be considered releasable without the full contract.

## Phase 11 — Production rollout
Use a staged rollout:
1. deploy backend schema;
2. verify schema/security;
3. deploy application compatibility layer;
4. enable authenticated learner persistence for controlled traffic;
5. monitor errors;
6. verify production journeys;
7. expand;
8. retain rollback path.

Do not remove local compatibility until cloud persistence has been proven stable.

## Rollback strategy
- Application rollback: previous known-good Vercel/Git commit.
- Schema rollback: forward-compatible migration strategy; avoid destructive down-migrations.
- Learner state: preserve existing stable keys and local backup.
- Feature rollback: configuration/feature flag where practical.
- Content rollback: previous compiled curriculum release.

## Milestone 2 implementation order
1. Safety baseline
2. Verification foundation
3. Database migrations/schema
4. Auth identity
5. Persistence adapter
6. Local-state migration
7. Evidence/portfolio persistence
8. Failure/recovery
9. Security certification
10. Browser certification
11. CI/release integration
12. Controlled production rollout

## Explicit stop gates
Stop before the next phase if:
- source integrity fails;
- stable response IDs change unexpectedly;
- migrations are not reproducible;
- RLS cannot prove isolation;
- local-state migration loses data;
- save failures can be reported as successful;
- production schema/application versions are incompatible;
- browser persistence fails;
- rollback cannot restore a known-good state.

## Definition of done
Milestone 2 is complete only when:
- source integrity is automated;
- runtime integrity is automated;
- AC has repository-managed Supabase migrations;
- authentication is integrated;
- learner state is durable;
- stable response IDs survive migration;
- local state has a safe migration path;
- RLS is tested;
- recovery is tested;
- browser persistence is certified;
- CI enforces the release contract;
- production rollout and rollback have both been exercised safely.

## Deferred after Milestone 2
Do not begin institution dashboards, advanced reporting, analytics, new assessment intelligence, or major visual redesign until the durable learner platform foundation is certified.
