# Evidence & Assessment Engine

## Product rule

Every curriculum response must have provenance. Applied Commerce distinguishes:

1. **Response** — anything the learner records in an authored prompt.
2. **Evidence** — a response that can demonstrate observable learning, reasoning, action or production.
3. **Portfolio evidence** — selected evidence that the authored curriculum marks as part of the learner's longitudinal record.

Lesson notes remain private learning notes. They are not automatically treated as evidence.

## Developmental spine

| Grade | Stage |
| --- | --- |
| 8 | Self-awareness |
| 9 | Agency |
| 10 | Strategy |
| 11 | Architecture |
| 12 | Adult execution |

The mapper adds one or more evidence domains from the actual prompt: self-awareness, agency, economic reasoning, systems thinking, value creation, financial capability, decision-making, research/observation, communication, planning, execution and reflection.

## Assessment boundary

The engine never fabricates a correctness judgement.

- Existing open-ended curriculum work maps to facilitator rubrics or verification.
- Current deterministic checks confirm capture/completion only.
- Exact, numeric and range auto-marking are implemented as rule types and can be enabled only where an authored answer rule is supplied.
- Interviews, observations and real-world actions require verification rather than an invented automatic mark.

## Rubrics

Four v1 rubric families are implemented:

- Analysis and reasoning
- Reflection and learning
- Action and real-world evidence
- Project evidence

Each criterion uses a four-level progression: Beginning, Developing, Secure, Strong.

## Facilitator workspace

`/facilitator` reads the learner's real local response record, maps responses into evidence, provides a review queue, rubric scoring, feedback, acceptance/revision/verification states and a printable evidence report.

This route is intentionally not linked from the learner menu while authentication is disabled.

## Reporting

Reports aggregate real evidence records by:

- developmental domain;
- evidence type;
- term;
- portfolio eligibility;
- review status;
- average facilitator rubric level.

Reports describe **observable curriculum evidence**. They do not claim to measure internal identity, personality or character.

## Backend migration

The repository contains `supabase/migrations/20261004193000_evidence_assessment_engine.sql`.

The dedicated **Applied Commerce Production** Supabase project exists, but on 4 October 2026 it could not be restored because the Supabase account already had its maximum two active free projects (BIS Production and BIS Staging). No BIS project was paused or reused.

Until the dedicated project is active, the facilitator workspace uses a separate local review store and therefore only reviews evidence stored in the same browser.

When the Applied Commerce backend is reactivated:

1. re-inspect the existing core tables and RLS;
2. apply the evidence migration;
3. connect stable learner response IDs to evidence definitions/records;
4. provision authenticated educator access through the existing school/cohort authorization layer;
5. migrate local learner responses without changing their stable prompt identities;
6. switch reports from one-browser records to learner/cohort/school aggregates.
