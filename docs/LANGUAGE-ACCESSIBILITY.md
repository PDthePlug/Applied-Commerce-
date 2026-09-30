# Applied Commerce Language Accessibility Standard

## Purpose

Applied Commerce is written for learners aged roughly 14–18. The digital curriculum must remain intellectually serious without making learners decode unnecessary academic or authorial jargon before they can understand the idea being taught.

The editorial rule is:

> If a simpler word communicates the same idea, use the simpler word. If the difficult word is genuine subject vocabulary, keep it and teach it clearly.

## What the compiler now does

The curriculum compiler applies a deterministic learner-language layer while preserving the authored sequence, lesson structure, activities, learning outcomes, tables, stories and assessment content.

### Simplifies non-essential recurring labels

Examples:

- `The Affirmation` → `Key idea`
- `The Paradoxical Reversal` → `Here’s the tension`
- `The Personal Pivot` → `Your Next Step`
- `Cognitive Squeeze` → removed from checkpoint labels
- `Anti-Delusion` → `Reality Check`
- `Launch Clause` → `Launch Commitment`
- `Shadow Management` → `Managing the Downside`
- `meta-habit` → `review habit`
- `capstone` → `final project`
- `reconnaissance` → `fact-finding`

### Simplifies general vocabulary where the concept does not depend on the harder word

Examples include:

- `comprehensive` → `complete`
- `approximately` → `about`
- `foundational` → `basic`
- `higher-order` → `advanced`
- `distinction` → `difference`
- `constraints` → `limits`
- `preliminary` → `first`
- `significant` → `important`

Grades 8–9 receive a slightly stronger plain-language pass for general words such as `competencies` → `skills` and `circumstances` → `situation`. The formal title `DBE Basic Education Competency Framework` is preserved.

### Preserves genuine subject vocabulary

Terms learners need for commerce, work and adult life are not removed simply because they are difficult. Examples include assets, liabilities, compounding, beneficiary, estate planning, diversification, market penetration, facilitation, entrepreneurship, insurance, two-factor authentication and coachability. Their teaching context and vocabulary definitions remain part of the curriculum.

### Removes internal production language

Production notes such as `Production Protocol`, `Pride 2.0`, `Ultimate Architectural Map`, `I have internalized...`, `original draft` references and build-status notes are filtered from the learner experience.

### Updates paper-book framing for the digital platform

Examples:

- `How to Use This Book` → `How to Use Applied Commerce`
- `opened this book` → `started Applied Commerce`
- paper-only save instructions are replaced by the platform’s automatic portfolio behaviour

## Guardrails

The language layer must not:

- change lesson order or grade/term structure;
- remove essential commerce vocabulary;
- weaken learning outcomes;
- simplify legal or financial concepts into inaccurate statements;
- alter numeric examples, formulas or assessment requirements;
- replace South African context or multilingual vocabulary.

## Current implementation result

The first implementation performs more than 1,800 deterministic learner-language edits across Grades 8–12 while retaining the existing lesson counts and term structure. Automated tests prevent the recurring jargon and internal-production phrases from re-entering generated curriculum bundles.