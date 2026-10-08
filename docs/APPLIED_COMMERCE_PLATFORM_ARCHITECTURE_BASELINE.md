# Applied Commerce Platform Architecture Baseline

**Status:** Architecture baseline for Milestone 2
**Date:** 8 October 2026
**Reference:** BIS Behaviour Intelligence System

## Purpose
This is the authoritative AC architecture baseline. It records current architecture, locks reusable BIS engineering principles, preserves AC-specific learning semantics, and defines the target platform before implementation.

## Architectural principles
1. Source is authoritative: authored learner books remain the canonical curriculum record.
2. Compiled runtime is deterministic; presentation inference never mutates source meaning.
3. Learner evidence uses stable unit/block/prompt identities, never document position.
4. Presentation is an interpretation layer; it does not rewrite curriculum meaning.
5. The page is the canvas; meaningful cards/surfaces remain where they communicate a real change of learner mode.
6. Semantic interaction is preferred over generic inputs.
7. Responsive presentation cannot change evidence meaning or identity.
8. Evidence capture and correctness are separate concerns.
9. Learner-private data is private by default.
10. Database changes are migrations and dependent application/schema changes must be release-compatible.
11. A green build is insufficient; release acceptance includes source integrity, structural tests, build and browser certification.
12. BIS is an engineering reference, not an AC product template.

## Current architecture
- Content: content/source-books → curriculum compiler → public/curriculum runtime bundles.
- Application: Next.js 16 / React 19 / strict TypeScript.
- Presentation: LessonReader owns product chrome; ContentBlocks interpret authored blocks; presentation-system.tsx owns reusable surfaces; semantic-learning.ts owns deterministic interpretation.
- Learning semantics: Read, Understand, Decide, Do, Reflect, Prove. These are interpretation modes, not a mandatory sequence.
- Learner state: device-local through lib/learning-store.ts and localStorage; versioned and validated before writes.
- Evidence identity: lib/response-identity.ts uses unitId::prompt-blockId::slot. Position is rendering-only.
- Verification: Python identity tests, Node curriculum tests, typecheck, lint, production build, Chromium acceptance and CI evidence.

## Target architecture
Canonical source → source manifest/fingerprint → curriculum compiler → versioned runtime release → semantic learning model → reader/presentation → learner identity → durable learner state → portfolio/evidence → role-scoped views.

Backend boundary:
- Supabase Auth for identity.
- Postgres for durable AC domain state.
- RLS for learner/institution boundaries.
- Server-side/API operations for privileged mutations.
- Versioned repository-managed migrations.
- Release metadata linking application release, curriculum release and schema version.

## Target domain model
Initial logical entities:
- users / authenticated identity
- learner_profiles
- institutions
- cohorts
- enrolments
- curriculum_releases
- lesson_progress
- responses
- portfolio_evidence
- assessment_attempts
- audit_events

Future entities require an AC product justification; BIS tables are not imported.

## Identity and migration rules
- Existing response keys must remain readable after backend migration.
- No positional key becomes the permanent identity of learner evidence.
- Existing local state requires an explicit migration/compatibility strategy before cloud persistence is enabled.
- No destructive migration may silently clear learner state.
- Schema changes require migrations and compatibility verification.
- Application releases identify the schema version they require.

## Source integrity contract
Every production curriculum release should be traceable through:
source file → SHA-256 → source manifest → compiler version → compiled release → application release → browser evidence.

The compiler must reject unexpected source changes, duplicate response identities, malformed unit structures, broken required metadata and ambiguous identity collisions.

## Presentation contract
Presentation may change typography, spacing and layout; transform simple tables into labelled mobile rows; preserve wide table geometry with scrolling; select appropriate controls; group related fields; and collapse optional deepening material.

Presentation may not rewrite curriculum wording, manufacture lessons, reorder authored tasks, convert examples into questions, expose marking memoranda, import BIS-specific stages/metrics/terminology, or alter stable evidence identity.

## Engineering standard
Current baseline: Node >=22.13, strict TypeScript, ESLint, deterministic compiler/census checks, source identity tests, curriculum tests, production build and browser acceptance.

Milestone 2 additions:
- runtime preflight
- canonical source fingerprint audit
- runtime artifact verification
- unified verify command
- repository-managed Supabase migrations
- database/security tests
- persistence/recovery browser journeys

## Release contract
Production eligibility requires:
1. runtime preflight
2. source integrity
3. task/block identity tests
4. curriculum/semantic/persistence tests
5. typecheck
6. lint
7. production build
8. runtime artifact verification
9. browser certification at 1280/430/360
10. deployment commit verification
11. production smoke test
12. rollback target identification

## Observability and recovery
Production failures must expose safe user-facing errors while retaining useful operational evidence. Every major release records application commit, curriculum release, schema migration level, acceptance evidence and previous known-good release.

## Architecture decisions
- AD-001: Keep the AC semantic learning model; do not copy BIS laboratory stages.
- AD-002: Keep stable response identity and extend it to durable storage.
- AD-003: Keep local persistence temporarily as a compatibility layer while durable state is introduced.
- AD-004: Introduce Supabase through an AC-specific domain model, not BIS schema.
- AD-005: Treat source manuscripts and compiled runtime as governed release artifacts.
- AD-006: Make browser acceptance a release gate.
- AD-007: Keep presentation semantics separate from evidence persistence.
- AD-008: Adopt BIS engineering discipline: source integrity, environment checks, migrations, runtime verification, security boundaries and release evidence.

## Non-goals
This baseline does not authorize a visual redesign, wholesale component replacement, BIS terminology adoption, BIS database cloning, replacement of the AC curriculum compiler, production Supabase activation without migration design, or changing learner evidence identities.

## Milestone 2 entry criteria
- Baseline committed.
- Implementation plan committed.
- Current production AC release identified.
- Supabase target environment confirmed.
- Migration strategy documented.
- Local-state compatibility approach documented.
- Verification commands defined.

## Milestone 2 definition of done
Governed source fingerprinting; runtime preflight; unified verification; repository-managed AC migrations; authenticated learner identity; RLS-backed learner state; stable response persistence; local-state migration/compatibility handling; persistence recovery acceptance; and production-safe release evidence.
