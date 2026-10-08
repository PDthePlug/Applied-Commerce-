# Applied Commerce — Milestone 4: Curriculum Release Governance

**Status:** implementation candidate pending CI and production acceptance  
**Date:** 8 October 2026

## Objective

Close the remaining source-governance gap in the AC platform without inventing provenance. The runtime must identify exactly what compiled curriculum it serves, while canonical manuscript provenance remains explicitly gated until the source is repository-governed.

## Scope

1. **Runtime release manifest**
   - Establish a machine-readable runtime release descriptor.
   - Bind the descriptor to the checked-in curriculum runtime index and format.
   - Record compiler/runtime schema compatibility without pretending that `runtime-3` is a curriculum-source fingerprint.

2. **Structural release verification**
   - Extend runtime verification to validate the release descriptor.
   - Confirm every grade's declared counts against decoded bundles.
   - Confirm stable unit and block identity across the complete runtime.
   - Detect duplicate identities globally.

3. **Release-aware learner persistence**
   - Stop treating the generic runtime compatibility label as if it were canonical source provenance.
   - Make the application/runtime release identifier explicit and separately named.
   - Preserve existing learner records and stable evidence keys.

4. **Source-governance boundary**
   - Do not generate fake SHA-256 values.
   - Do not invent manuscript paths or source release keys.
   - Do not declare the current public runtime source-verified merely because its compiled artifacts are valid.

5. **Release evidence**
   - Record the exact Git commit, runtime release descriptor and verification output for the milestone.

## Deferred

Canonical manuscript hashing and compiler-to-source fingerprinting remain blocked until the authoritative learner-book source is placed under an explicitly governed repository location.

Institution/school dashboards, advanced reporting and assessment intelligence remain outside this milestone.

## Definition of done

- Release descriptor exists and is checked by CI.
- Runtime verification is release-aware.
- Learner persistence distinguishes application/runtime compatibility from curriculum provenance.
- Existing evidence identities remain readable.
- Full CI passes.
- Production deployment is READY.
- Production runtime smoke test passes.
- Milestone 4 release evidence records exact commit/deployment.
