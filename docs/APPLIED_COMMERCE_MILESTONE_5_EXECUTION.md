# Applied Commerce — Milestone 5: Presentation Census

**Status:** implementation
**Date:** 8 October 2026

## Objective

Turn Presentation Architecture 2.0 into a measurable release contract. The curriculum census inspects every compiled Grade 8–12 unit and block, records presentation families, and fails on missing or duplicate stable block identities or grade/unit-count drift.

## Contract

- Every compiled block has a stable identity.
- Stable identity is globally unique within the runtime.
- Grade metadata matches decoded runtime unit counts.
- Presentation-family counts are emitted as CI evidence.
- The census is verification-only: it does not rewrite authored curriculum.

## Scope boundary

This milestone does not alter curriculum wording, reorder authored tasks, change response identities, or introduce BIS-specific learning stages. It does not replace the existing semantic renderer.
