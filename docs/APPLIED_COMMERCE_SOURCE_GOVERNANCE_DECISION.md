# Applied Commerce Source Governance Decision

**Status:** Milestone 2 architecture gate
**Date:** 8 October 2026

## Decision

The canonical Applied Commerce learner books remain the authoritative source, but their current storage location is **not repository-governed** in the AC GitHub main tree.

The repository contains the curriculum compiler/runtime path (lib/curriculum.ts and public/curriculum/*), while the expected content/source-books canonical source directory is absent from the repository.

Therefore:
- Do not fabricate or infer a source SHA-256 manifest.
- Do not treat compiled public/curriculum artifacts as the canonical manuscript.
- Do not make source-integrity hashing a production release gate yet.
- The source-fingerprint gate remains explicitly blocked until the canonical manuscripts are placed in a governed, versioned location with a defined release procedure.
- Runtime artifact verification remains active because the compiled runtime is repository-visible and can be structurally verified.

## Required future source-governance state

Before source fingerprinting is activated, AC must establish:
1. One authoritative manuscript location.
2. Version-controlled source files or an equally auditable release artifact with immutable version identity.
3. A manifest containing source path, source identifier, byte-level SHA-256 and release/version metadata.
4. Compiler input rules that consume only governed source.
5. A reproducible source → compiled-runtime relationship.
6. A release record linking source release, compiler version, runtime release and application commit.
7. CI failure when an expected source fingerprint changes without an explicit source release update.

## Why this is the correct gate

Hashing the wrong artifact would create false confidence. The purpose of source integrity is to prove that the learner-facing runtime derives from the intended authoritative curriculum, not merely that generated JSON files have stable hashes.

The current decision therefore preserves the architecture contract without pretending that source governance is already complete.

## Impact on Milestone 2

This decision does not block the AC database foundation.

The Supabase schema can be designed around stable curriculum release identities and learner evidence identities now, while source fingerprinting remains a separate gated release-control task.

Source fingerprinting becomes an explicit acceptance gate before a future production curriculum release, not a prerequisite for creating the empty database foundation.