# Applied Commerce Learning Platform

A standalone digital learning system for the Applied Commerce® Grade 8–12 learner books.

This repository is intentionally separate from Behaviour Intelligence. It reuses the **product principles** that worked in BIS — focused reading, visible progression, learner evidence, strong mobile ergonomics and a calm editorial interface — without carrying BIS labs, BEI metrics, investigations, terminology or database objects into this product.

## Current milestone

The first production-shaped milestone includes:

- Grade 8, 9, 10, 11 and 12 curriculum library;
- four-term grade maps driven by the supplied learner books;
- focused lesson reader with previous/next navigation and a term map;
- source-faithful rendering of paragraphs, lists, tables, activities, reflections, checkpoints, stories, equations and portfolio cues;
- learner notes/responses attached to each lesson;
- completion tracking and a learner portfolio with account-scoped local recovery and Supabase persistence;
- responsive desktop/mobile shell;
- curriculum compiler that converts the five DOCX learner books into structured runtime JSON.

### Presentation Architecture 2.0

The learner reader now uses a shared semantic presentation contract: source-authored stories, activities, reflections, checkpoints, Thinking Equations, portfolio evidence, response surfaces and tables render through one consistent hierarchy. Simple source tables become labelled row cards on compact screens while wider or structurally irregular tables keep their table geometry. See `docs/APPLIED_COMMERCE_PRESENTATION_ARCHITECTURE_V2.md`.

### Semantic Learning Renderer 3.0

Lessons now follow six source-derived presentation modes: Read, Understand, Decide, Do, Reflect and Prove. Explicit rankings, table rating scales and the Grade 9 values sort use native controls; list choices are interactive, equations retain their meaning and percentage blanks retain their units. Lesson outlines link to authored tasks, product navigation stays in reserved reader chrome, and Complete and continue saves before advancing. Source wording, sequence and answer identities remain intact.

See `docs/APPLIED_COMMERCE_SEMANTIC_LEARNING_V3.md` for the interpretation and persistence contract. The repeatable census covers all 395 lessons and four assessments. Browser acceptance samples every grade and term at desktop, 430px and 360px and exercises the new control/persistence/error states.

## Important source-preservation rule

The compiler does **not** renumber or manufacture lessons to make the books look uniform. If a supplied book jumps between lesson numbers or contains a different number of lesson headings in a term, the platform preserves that source structure. Editorial `SITUATION REPORT` markers and `END OF ...` production markers are treated as source metadata rather than learner-facing lessons.

## Curriculum build

The generated runtime content is committed under `public/curriculum/`. To rebuild it from the source DOCX files:

```bash
python scripts/compile_curriculum.py content/source-books public/curriculum
```

Expected source filenames:

- `APPLIED COMMERCE Grade 8.docx`
- `APPLIED COMMERCE Grade 9.docx` (the revised Grade 9 learner book, stored under the compiler filename)
- `APPLIED COMMERCE Grade 10.docx`
- `APPLIED COMMERCE Grade 11.docx`
- `APPLIED COMMERCE Grade 12.docx`

## Development

```bash
npm install
npm run dev
```

Checks:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Backend and hardening status

The platform uses Next.js 16, React 19, and a dedicated Supabase backend for account-owned responses, notes, progress, preferences, institution/cohort management, and facilitator review. The South African production project is `upvbxplswxhoqzbvgdxv`; setup instructions for the inactive predecessor are obsolete.

The 2026-10-12 audit changes are a release candidate for further validation, not a production certification. The security migration must be validated remotely and applied before releasing the updated review client. Use [supabase/ACTIVATION.md](supabase/ACTIVATION.md). Local tests never write to production.

## October 2026 manuscript checkpoint

The edited source books are versioned in `content/source-books/`. Grade 9 uses the revised learner edition, not the older reference manuscript. The assessment companion and change/verification record are in `docs/checkpoints/`.

The runtime is rebuilt from these committed sources. It now contains 80 lessons each for Grades 8, 10, 11 and 12, and 75 for Grade 9. Grade 10 Lessons 70–74 are standalone workshops; Grade 12 Lessons 53–60 are new protection practice clinics. Grade 9's examination blocks remain assessments, including lesson-labelled memorandum references.

`scripts/curriculum-unit-ids.json` preserves the prior runtime IDs for existing lessons and assessments so lesson-level saved responses and completion records remain attached to the same lesson. New lessons have checkpoint-specific IDs. Prompt-level keys depend on content positions, so this preservation does not guarantee that every previous activity answer maps to a revised prompt. Existing responses remain in local storage; no learner state is cleared.

These additions require teacher review. Curriculum mapping, current legal/financial reference verification and full exam moderation remain release work.

## Stable learner responses

The response persistence milestone uses compiled block identities rather than document positions. Legacy positional answers appear in Portfolio under **Earlier answers kept for review**; they are preserved without guessing which revised question they answered. Before the first migration write, the previous record is backed up on the same device. New task answers and portfolio evidence share the same stable identities. See `docs/checkpoints/2026-10-04-response-persistence.md` for validation and limitations.

## Classroom teaching drafts

The integrated `/facilitator/classroom` workspace adds five source-linked benchmark guides, presentation prompts and printing. Teacher guidance requires verified staff/admin access and a private content release; it is not included in public learner bundles. The other 390 guides await educational development. See the [classroom milestone deliverables](docs/classroom/README.md) for the complete 395-lesson inventory, teaching standard, review limits and safe local review procedure. Draft enrichment is separate from the canonical learner books and requires human educator approval before publication as approved teaching material.
