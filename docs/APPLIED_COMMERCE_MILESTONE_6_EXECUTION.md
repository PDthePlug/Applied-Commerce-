# Applied Commerce — Milestone 6: Operational Activation

## Purpose

Milestone 6 activates the operational architecture that already existed in AC rather than introducing a second dashboard or assessment system.

### Existing systems reused

- `/facilitator` and `FacilitatorWorkspace`
- `lib/facilitator/model.ts`
- `lib/evidence/engine.ts`
- `lib/evidence/reporting.ts`
- Supabase cohort, enrolment, learner-record and evidence tables
- existing RLS helpers and policies

### Release reconciliation

The live production database now contains the governed runtime release `ac-runtime-3`.

Learner progress, prompt responses and notes were reconciled from the legacy `runtime-3` label to `ac-runtime-3`. Duplicate legacy rows were removed only where a corresponding release-labelled row already existed and the learner content was identical; progress timestamp differences were stale duplicate metadata, with the existing release-labelled row retained.

All learner progress, prompt-response, lesson-note, portfolio-artifact and portfolio-evidence rows are now release-bound. The release remains explicitly not source-fingerprinted because canonical curriculum manuscripts are still not repository-governed.

### Facilitator activation

The existing facilitator workspace now has a Supabase data-source seam that:

1. resolves the authenticated facilitator's active cohort assignments;
2. resolves enrolled learners through existing RLS;
3. loads release-bound learner progress, responses and notes;
4. reconstructs evidence through the existing curriculum/evidence engine;
5. loads durable evidence reviews;
6. exposes the existing facilitator presentation to shared cohort data.

The presentation remains the existing facilitator console. No second dashboard was introduced.

### Evidence review persistence

Facilitator evidence writes use a narrowly scoped database function. The function:

- requires an authenticated caller;
- checks the existing learner-review authorization helper;
- runs as `SECURITY INVOKER`;
- relies on explicit evidence-record RLS for facilitator insert/update scope;
- upserts one evidence record per learner/response identity;
- is executable by authenticated users only;
- is not executable by anonymous users.

Reviews continue to use the existing `evidence_reviews` table and its learner/staff RLS boundary.

### Migration provenance

The live migration history records:

- `20261008174811 milestone_6_operational_activation`
- `20261008174922 milestone_6_security_and_migration_reconciliation`

The repository migration filenames now match those live versions. No second or parallel Milestone 6 schema was introduced.

### Known boundary

The live database currently contains no school/cohort enrolments, so production cohort rendering remains dependent on actual institution setup. The implementation is therefore a real operational data path, not a fabricated demo dataset.

School/cohort administration is intentionally not added here. It should be implemented only when the actual institutional provisioning workflow is defined.

## Verification

- release reconciliation verified directly against production Supabase;
- no remaining `runtime-3` learner rows;
- all learner progress/responses/notes are release-bound;
- portfolio records are release-bound;
- facilitator access is mediated by existing cohort RLS;
- facilitator evidence writes use invoker security plus RLS;
- anonymous execution of the facilitator write function is denied;
- repository contract tests cover release-aware persistence and facilitator activation.

The remaining Supabase security advisor warning is **Leaked Password Protection Disabled**, which is an Auth configuration item rather than a Milestone 6 data-access defect.

## Deferred

- canonical source fingerprinting;
- school/cohort administration UI;
- advanced analytics/BI;
- new assessment intelligence;
- replacement facilitator dashboard.