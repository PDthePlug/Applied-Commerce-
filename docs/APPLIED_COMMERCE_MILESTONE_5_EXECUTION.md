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

## Outlier review — October 2026

The first release census exposed a threshold problem rather than 314 presentation defects: 313 of 314 flags were caused solely by a low large-unit threshold of 45 blocks. Review of the full release evidence showed that the recurring lesson structure commonly sits above that threshold. The census threshold was therefore tightened to 75 blocks so it identifies genuinely unusual page density rather than normal lesson composition.

The resulting review queue is small and actionable: 16 very-large lessons, two response-dense term-review/reflection lessons, and one seven-column table outlier. Large lessons are not being split or flattened because their density reflects authored lesson structure. The seven-column table is intentionally retained as a table and receives explicit mobile horizontal-scroll ergonomics. A Grade 12 long-title/mobile evidence case also exposed an irregular small table that was not being converted to labelled mobile rows; the responsive-row detection was hardened to tolerate short/incomplete rows without changing their content or response identity.

Targeted browser acceptance now covers the Grade 12 long-title lesson at compact widths and the Grade 10 seven-column table outlier. The contract remains: page-level overflow must stay at zero, wide tables retain their geometry, and compact tables must become readable row structures where the authored table permits it.
