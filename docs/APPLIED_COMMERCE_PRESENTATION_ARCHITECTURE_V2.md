# Applied Commerce Presentation Architecture 2.0

## Purpose

Applied Commerce is a digital learning platform, not a Word viewer and not a PDF replica.

The authored DOCX books remain the canonical curriculum record. The learner interface interprets that record into consistent learning objects while preserving the authored wording, order, evidence prompts and developmental progression.

This milestone adopts the strongest presentation lessons from the Behaviour Intelligence System without importing BIS laboratory stages, metrics, terminology, evidence namespaces or database objects.

## Presentation ownership

The learner experience has one presentation grammar.

- `LessonReader` owns product chrome: grade/term identity, lesson progress, term navigation, previous/next movement and lesson notes.
- `ContentBlocks` interprets authored source blocks into semantic learning objects.
- `presentation-system.tsx` owns reusable learner surfaces and their hierarchy.
- `presentation.css` and `responsive.css` own responsive behaviour.
- Source DOCX files own curriculum meaning. Presentation code must not rewrite curriculum meaning.

Individual lessons must not introduce one-off navigation, bespoke card systems or route-specific visual grammar.

## Hierarchy contract

### Quiet reading

Narrative paragraphs, lists and explanation remain editorial and low-noise. The interface should feel like a carefully typeset learning experience rather than a dashboard made of cards.

### Visible transitions

The following authored transitions receive distinct visual treatment:

- Story
- Activity
- Reflect
- Checkpoint
- Try This at Home
- Portfolio evidence
- Thinking Equation
- Deepening Insight

These surfaces identify a change in learner mode. They are not decorative banners.

### Strong interaction

A learner response is visually stronger than surrounding reading content. Response surfaces inherit the current task tone so that a checkpoint response, reflection response and real-world task remain recognisable without changing their underlying evidence identity.

The renderer should prefer the interaction implied by the source:

- choice -> selectable control;
- short factual answer -> compact field;
- extended reasoning -> textarea;
- structured multi-part prompt -> grouped responses;
- source blank -> inline answer field;
- workbook table -> editable table cells;
- formal multiple choice -> radio-style choice control.

The platform must not flatten every authored task into the same textarea.

## Story treatment

Stories are part of the learning architecture, not sidebars. Story headings receive a quiet editorial marker and serif heading treatment. Narrative paragraphs remain in the normal reading flow so that story sections feel immersive rather than boxed in.

## Table contract

Tables carry meaning and must remain understandable on every screen.

1. The first authored row is rendered semantically as the table header.
2. Header cells use `<th scope="col">`.
3. Body cells retain their source column label through `data-label`.
4. Tables with four or fewer complete labelled columns can become labelled row cards on compact screens.
5. Wider or structurally irregular tables retain table geometry and horizontal scrolling.
6. Workbook cells remain independently answerable and preserve their stable response IDs.
7. Responsive transformation must never merge answers or invent labels.

This mirrors the proven BIS principle: transform presentation for the device without changing the evidence model.

## Navigation contract

The reader owns navigation.

- The current lesson is exposed with `aria-current="page"`.
- The term rail is labelled as lesson navigation.
- Lesson position is exposed as a real progressbar.
- Previous and next controls move through the authored term sequence.
- Mobile menu behaviour must not replace browser history or trap the learner.

## Evidence boundary

Presentation and evidence storage remain separate concerns.

Changing a visual component must not:

- change stable response IDs;
- clear existing responses;
- turn private lesson notes into evidence;
- fabricate correctness;
- alter portfolio eligibility;
- alter assessment answer rules.

## Responsive acceptance set

Every release that changes presentation should be checked against representative source patterns at approximately 360 px, 430 px and desktop widths:

- long story plus reflection;
- vocabulary/data table;
- editable workbook table;
- multi-part checkpoint;
- Thinking Equation;
- behavioural/home experiment;
- formal multiple-choice assessment;
- portfolio evidence;
- long lesson title;
- previous/next lesson transition.

## Source-preservation rules

Presentation may:

- change spacing, typography and layout;
- transform simple tables into labelled mobile rows;
- choose an appropriate control for an authored response;
- group related response fields visually;
- collapse optional deepening content.

Presentation may not:

- rewrite authored curriculum text;
- manufacture missing lessons;
- reorder authored tasks;
- convert examples into learner questions;
- expose marking memoranda to learners;
- import BIS-specific stages or measurements into Applied Commerce.

## Current implementation checkpoint

Presentation Architecture 2.0 introduces:

- a versioned learner presentation contract on the reader shell;
- semantic story headings;
- tone-aware response surfaces;
- semantic table headers;
- labelled compact-screen row cards for simple tables;
- preserved horizontal geometry for tables that should not collapse;
- accessible lesson navigation and progress semantics;
- regression tests that guard the contract.

The next presentation checkpoint should add browser visual regression fixtures for the representative acceptance set rather than relying only on structural tests.


## Browser certification checkpoint

The presentation contract is now exercised in Chromium at 1280×900, 430×932 and 360×800 against five deliberately difficult source-backed learner journeys:

- Grade 8 Lesson 2 — dense hierarchy: Thinking Equation, activity/reflection/checkpoint transitions and response surfaces.
- Grade 10 Lesson 26 — mixed simple, editable and wide tables.
- Grade 11 Lesson 42 — authored choice interaction and selected-state clarity.
- Grade 12 Lesson 5 — long title wrapping and dense decision content.
- Grade 9 Term 1 Mock Exam — formal assessment response surfaces and real radio controls.

The browser suite fails on page-level horizontal overflow, reader-chrome collisions, broken mobile table labelling, loss of wide-table scrolling, unusable compact tap targets or assessment controls that do not retain selected state.

Every browser run also records full-page screenshots as CI evidence. These screenshots are review artifacts; the automated gate remains semantic and geometric so legitimate text reflow does not create meaningless pixel-diff failures.
