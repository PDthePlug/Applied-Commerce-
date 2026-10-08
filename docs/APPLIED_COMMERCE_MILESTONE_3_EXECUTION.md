# Applied Commerce Milestone 3 — Learner Record & Evidence Experience

**Status:** implementation candidate pending CI and production acceptance  
**Scope:** learner history, evidence continuity, persistence quality, recovery UX

## Objective

Turn the durable learner foundation into a useful learner record without opening institution dashboards, advanced reporting, new assessment intelligence, or a major visual redesign.

## Implemented in this milestone branch

1. **Timestamp-aware learner state**
   - Learner notes and stable prompt responses now carry local update timestamps.
   - Remote records hydrate those timestamps from durable `updated_at` values.
   - Known newer records win during reconciliation.
   - Legacy local records without timestamps remain available rather than being discarded.

2. **Deterministic learner merge**
   - Merge logic is isolated in a pure module so it can be tested independently of Supabase.
   - Completion metadata is retained.
   - Last-opened state uses the newest known activity timestamp.
   - Stable prompt identities remain the persisted keys.

3. **Learner history**
   - Profile now exposes recent completed lessons, saved activity responses and saved lesson notes.
   - Recent entries link back to their originating lesson when curriculum metadata is available.
   - Existing profile progress/evidence/notes cards remain intact.

4. **Portfolio continuity**
   - Existing portfolio reconstruction continues to derive evidence from stable response identity.
   - No positional identity is introduced.
   - Earlier/unmatched answers remain separated from current evidence.

5. **Browser acceptance**
   - Existing local recovery acceptance now also checks that learner history renders from persisted local state.

## Important release boundary

The persistence adapter still uses the legacy `curriculum_version` field with the explicit runtime compatibility label `runtime-3`. This is **not** a claim of canonical curriculum-source provenance and must not be treated as a governed curriculum release fingerprint.

The repository still does not falsely declare a canonical manuscript hash or source release key.

## Verification gate

Milestone 3 is not complete until:

- Node identity/learner-record tests pass;
- runtime verification passes;
- typecheck passes;
- lint passes;
- production build passes;
- browser acceptance passes at the existing representative widths;
- the resulting main commit deploys successfully;
- production learner history and persistence are manually re-checked;
- no save/reconciliation regression is observed.

## Deferred

- educator dashboards;
- school/institution dashboards;
- advanced reporting and analytics;
- new assessment intelligence;
- canonical-source fingerprinting until the source is repository-governed;
- destructive migration or removal of local-first recovery.

The merge tests explicitly cover both timestamped cross-device conflicts and the first reconciliation of legacy local records without timestamps.
