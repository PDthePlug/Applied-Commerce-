# Repository and educational content audit

## Authoritative content and compilation

The five `content/source-books/APPLIED COMMERCE Grade N.docx` manuscripts are present. Some older governance documents say they are absent; that statement is superseded by the checked-in books. Their SHA-256 values are recorded in the inventory and `content/instructional/source-lock.v1.json`. Grade 9 is the revised 75-lesson source, not an assumed 80-lesson book.

| Grade | Term 1 | Term 2 | Term 3 | Term 4 | Lessons | Provisional two-period estimates |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 8 | 20 | 20 | 20 | 20 | 80 | 8 |
| 9 | 16 | 18 | 20 | 21 | 75 | 9 |
| 10 | 16 | 20 | 22 | 22 | 80 | 5 |
| 11 | 20 | 20 | 20 | 20 | 80 | 9 |
| 12 | 20 | 20 | 20 | 20 | 80 | 10 |
| Total | 96 | 98 | 102 | 103 | 395 | 41 |

The four assessment units are Grade 9 term mock exams, separately listed in the JSON inventory. They are not counted as lessons and have not been replaced or re-marked. Assessment unit IDs preserve their existing suffixes, including the two distinct term units ending `assessment-2`.

`scripts/compile_curriculum.py` compiles the DOCX manuscripts to compressed versioned runtime bundles in `public/curriculum`. `lib/curriculum.ts` resolves bundles, Grade 9 patches and normalization. A scratch compilation followed by the same resolver matched **399 of 399 units**, including block text, tables, metadata and identities; see `source-audit.json`. Raw bundles contain 20,766 stable blocks; the resolved reader representation has 20,742 after existing normalization. These are different representations, not a content deletion in this branch. Hash checks protect both books and committed runtime files. The existing `release.json` remains `not-source-fingerprinted` with a null source release key: this observational audit does not activate an unapproved governance release.

## Inventory method and practical limits

`node scripts/classroom-inventory.mjs` reads every resolved block in all 395 lessons, extracts actual Learning Outcomes list items, vocabulary tables, key ideas, activity/checkpoint markers and stable references. It never invents a purpose from a title. The main-concept field quotes the first authored objective, or explicitly marks an authored key idea/prose fallback for review. This source anchor is an index into the concept, not a claim to exhaust every concept in a complex lesson.

Each row records source grade/term/ID/title, exact objective and vocabulary evidence, source fingerprint, complexity indicators, provisional classroom requirements, diagnostic prerequisite skills, source-order continuity, anticipated contact time and classified findings. Quantitative rules are visible in the script: reading volume, table cells, response workload and reasoning verbs identify lessons needing closer review. Financial/legal keywords and long sentences are deliberately broad screening flags; they do not establish an inaccurate claim or a reading age. Source-order neighbours are not asserted to be mastered prerequisites. Real-world follow-up is flagged separately from contact time.

The all-programme pass is an evidence-linked screen; detailed instructional design and qualitative self-review were completed for the five benchmarks. No claim is made that the remaining 390 lessons have had independent educator moderation, legal/financial verification, multilingual review or classroom timing trials. Before publishing their guides, an educator must read each full lesson, validate its concept and prerequisite needs, and accept or revise the estimates. The three objective omissions and benchmark-specific issues are confirmed from full source inspection rather than keyword counts.

## Existing teaching and learning architecture

`docs/checkpoints/Applied-Commerce-Assessment-Checkpoint-Guide.docx` is an existing working assessment companion. Its proposed five-criterion, 0–4 rubric supports reasoning and evidence rather than household wealth; it is not an official DBE instrument or a complete set of teacher plans. The architecture, semantic V3, language/accessibility, evidence engine and source-governance documents inform this milestone, but older local-only persistence descriptions are not treated as current implementation truth.

The source progression moves from Grade 8 self-awareness, through Grade 9 agency, Grade 10 strategy and Grade 11 architecture, to Grade 12 adult execution. Narrative characters and South African circumstances recur. Lessons already combine multilingual subject vocabulary, narrative dilemmas, thinking equations, reflection, practical activities, commitments and checkpoints. Existing `LessonReader`, `ContentBlocks`, semantic learning interpretation and presentation components remain the learner experience.

Learner responses use stable `unitId::prompt-blockId::slot` identities. `lib/response-identity.ts`, `learning-store.ts`, sync reconciliation and Supabase persistence preserve device/account state, conflict handling, progress, notes, evidence and portfolio projections. Capture/completion are not equivalent to mastery. The enrichment does not write learner responses, mark completion or add automatic correctness rules. Its learner-material link returns to the original lesson; a navigation-only query adds a return link.

Facilitator cohorts, learner evidence review and reporting use existing role/data-source contracts. Institution owner/admin and platform-admin roles already exist. This branch adds no membership role, schema or RLS policy. Existing browser role gates alone would not protect bundled notes, so the new endpoint verifies identity, active session and trusted active role records on the server before decrypting guidance. User-editable metadata and URL parameters do not grant access.

## Accessibility and language

The application uses English UI, source isiZulu/Afrikaans vocabulary, semantic headings, labelled controls, reading preferences, keyboard navigation and print support. The classroom layer preserves source terminology and adds short teacher explanations, structured teacher/learner actions and non-speaking participation alternatives. New translations are not invented. Automated axe checks, keyboard focus, six widths and print inspection provide evidence within their stated limits; they do not certify WCAG compliance, translation quality or actual assistive-technology use.

## Scope protection

No canonical book, compiled curriculum file, assessment, response-identity contract, learner portfolio model, database migration or Zimbabwe application has been edited. Production Supabase was not contacted for tests. Authenticated live-role validation remains NOT TESTED while `AC_ROLE_FIXTURES` is absent; isolated synthetic contracts are reported separately.
