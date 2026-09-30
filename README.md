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
- completion tracking and a learner portfolio stored locally for the prototype milestone;
- responsive desktop/mobile shell;
- curriculum compiler that converts the five DOCX learner books into structured runtime JSON.

## Important source-preservation rule

The compiler does **not** renumber or manufacture lessons to make the books look uniform. If a supplied book jumps between lesson numbers or contains a different number of lesson headings in a term, the platform preserves that source structure. Editorial `SITUATION REPORT` markers and `END OF ...` production markers are treated as source metadata rather than learner-facing lessons.

## Curriculum build

The generated runtime content is committed under `public/curriculum/`. To rebuild it from the source DOCX files:

```bash
python scripts/compile_curriculum.py /path/to/books public/curriculum
```

Expected source filenames:

- `APPLIED COMMERCE Grade 8.docx`
- `APPLIED COMMERCE Grade 9.docx`
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

## Next system milestone

The current learner-state layer is deliberately isolated behind `lib/learning-store.ts`. It is ready to be replaced with a dedicated Applied Commerce Supabase schema for authentication, learner enrolment, school/cohort membership, educator visibility, durable responses, portfolio evidence and progress sync. No BIS database should be shared with this product.
