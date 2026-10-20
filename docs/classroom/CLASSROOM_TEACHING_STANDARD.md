# Applied Commerce classroom teaching standard · draft v1

This is an instructional enrichment standard for the existing South African Grade 8–12 programme. It supplements the authored books; it does not replace CAPS, establish formal assessment approval or rewrite the learner curriculum. Versioned guides must link to existing unit and block identities. They remain draft material until independent educator review and a classroom pilot.

## Source and evidence rules

The five DOCX books in `content/source-books/` are canonical. Current source compilation and application resolution produce 399 matching runtime units: 395 lessons and four existing assessments. `source-audit.json` records the comparison; the enrichment's `source-lock.v1.json` records observed hashes without changing the platform's release/governance fields. The October assessment companion is an existing proposed assessment resource, not a complete teacher guide or official DBE instrument.

Use the actual objectives, vocabulary, explanations, tasks and checkpoints. Cite stable block IDs and a source excerpt. Never infer lesson purpose from its title alone. An enrichment explanation must be marked as added guidance. Source changes and assessment corrections require a separate editorial review, not a silent compiler or runtime edit.

The 395-row inventory is a complete source-content screen with extracted evidence. It is not a claim that 395 classroom plans have been written, externally moderated or piloted. Workload, prerequisites and duration are provisional planning judgments. Three Grade 10 closing lessons do not have explicit learning-outcomes sections; absence is recorded rather than filled with invented objectives. Remaining lessons need educator moderation before guide publication.

## Reference period

| Stage | Reference minutes | Teacher and learner purpose |
| --- | --- | --- |
| Real-life introduction | 5 | Present a familiar dilemma; collect initial reasoning without demanding private disclosure. |
| Concept exploration | 10 | Teach vocabulary and model the key reasoning or calculation. Learners explain a step back. |
| Guided discussion | 10 | Compare explanations, surface assumptions and test an alternative. |
| Practical application | 15 | Learners produce a response, decision, calculation or plan using the existing authored task where suitable. |
| Reflection and understanding check | 5 | Collect an observable explanation and use it to decide the next teaching move. |

The sequence is flexible. Each planned period must total 45 minutes; each stage states teacher actions, learner actions and observable successful participation. Do not force full-text read-aloud, multiple extended tasks and a real-world experiment into one period. Mark selected in-class work and later follow-up explicitly. Use two periods when understanding or revision needs more time. A simulation shows reasoning, not evidence that a real-world action occurred. Combining short lessons requires a named outcome-to-task mapping and educator approval; the inventory does not automatically combine them.

The five benchmarks comprise seven periods: Grade 8 needs/wants (one), Grade 9 values (one), Grade 10 compounding (two), Grade 11 leverage integration (one), Grade 12 decision matrix (two). The first period of a two-period guide has its own observable learning outcome. No guide automatically marks the learner lesson complete.

## Required guide contract

Every guide contains identity, source fingerprint, central concept, diagnostic prerequisites, learner-facing objectives and an observable outcome. Preparation covers required teacher knowledge, minimal materials, vocabulary, misconceptions, a specific South African context and privacy boundaries. Timed teaching stages describe active participation. Discussion prompts include anticipated reasoning and a follow-up question, rather than a repeated generic question list. Practical work identifies the source task, exact in-class scope, expected output and follow-up. Understanding checks describe secure, partial and not-yet-evidenced reasoning and a next teaching action.

Differentiation must cover additional support, extension, quiet participation, large classes, limited technology and reading support. Continuity links the previous and next source lessons and explains how work will be used again. Independent-learning guidance explains how the original learner material remains usable without the teacher. Each guide has ten documented quality checks and explicit review limits.

## Assessment and learner dignity

Completion, capture, understanding, verified action and long-term behaviour are different claims. Never automatically mark open-ended work correct because text is present. Do not add answer rules or official marks through the enrichment layer. Teacher checks are formative: observe the explanation, identify a gap, give one next step, then check again. Existing evidence rubrics and authored assessment rules remain unchanged. Personal values and household wealth are not mastery criteria.

Offer fictional or redacted scenarios. Do not request household income, passwords, account numbers, traumatic disclosures, purchases, loans or contracts. Learners may pass on public sharing and explain reasoning privately or through a fictional case. Do not treat constrained circumstances as a character flaw. Do not promise that every platform response is private: explain what will be submitted or shared, and use lesson notes appropriately.

## Classroom adaptations

- Large classes: pair reasoning first, group roles that rotate, one written output per learner, and a sample of explanations rather than 40 consecutive presentations.
- Limited technology: board, paper and ordinary calculators where needed. A projector, individual phone, account or live internet connection is never a required classroom material.
- Low bandwidth: read the source in advance where possible; print an authorised guide; keep the digital plan textual. Teacher-only content is not stored in browser local storage or a public offline cache.
- Mixed attainment: diagnose the specific missing skill, model one step, provide a partially structured grid and allow an oral explanation. Extend by changing assumptions or testing limits rather than adding repetitive pages.
- Reading support: chunk source excerpts; teach subject terms explicitly; permit home-language pair discussion while preserving the supplied multilingual vocabulary. New translations require language review.
- Quiet participation: individual thinking time, written/anonymous examples, paired rehearsal or a nominated spokesperson. Public confidence is not a proxy for understanding.

## Protected teacher experience

Teacher guidance and indicative reasoning are private application data. The public repository versions an encrypted artifact; its content key is stored separately in a private server file. No plaintext teacher package, key, guide PDF or teacher-answer screenshot is committed to public Git or placed in `public/`. API requests require server-verified identity, an active session and existing active cohort-staff, institution owner/admin or platform-admin authority. Client flags and editable profile metadata grant no authority. Errors fail closed. Responses use private/no-store headers and are bound to the current account.

The workspace offers a grade/term/lesson catalogue, guide, learner-material link, teacher preparation, timed teaching sequence, discussion, practical scaffold, formative checks, differentiation and print. Presentation mode displays learner-facing prompts, not indicative answers. A learner-link context is navigation only; it never authorises the teacher API. No database migration or RLS change is required for this milestone.

## Review gate before expansion

For each benchmark ask: can an ordinary teacher prepare it reasonably; is the language accessible; are learners active; is the concept accurate; does the task support the objective; are questions worth discussing; is timing realistic; can understanding be observed; is continuity clear; can independent learners still use the source? Agent self-review and automated validation are recorded separately from independent educator moderation. Pilot evidence must decide whether a draft becomes an approved guide. Do not generate or publish the remaining 390 plans before that gate.
