# Applied Commerce Semantic Learning Renderer 3.0

This milestone interprets the existing digital curriculum into learning sections and task controls. It builds on Presentation Architecture 2.0 and the existing learner evidence system. The deployed application remains the Applied Commerce platform in `PDthePlug/Applied-Commerce-`.

## Source and persistence contract

The versioned, edited books in `content/source-books` and their compiled runtime release remain authoritative. The six supplied DOCX attachments were inspected for their learning markers, values task, rankings, scales, tables and developmental progression. They are reference material for this presentation change; they do not replace later accepted manuscript edits in the repository. Grade 9 uses the revised learner edition already compiled into the platform.

No source book, runtime bundle, unit ID or block ID changes in this release. Presentation inference is deterministic and does not mutate source content. The existing approved removal of Tension/Experiment Log sections remains in place.

Answers retain the same `unitId::prompt-blockId::slot` keys. Ranking uses the existing newline-separated `choice` slot, ratings use their existing `table-row-column` slot, and values selection uses its existing `blank-0` slot. Older combined answers and selections are retained for review. No learner data is cleared or automatically overwritten when a control changes presentation.

Saving remains on the learner's device. This release does not activate the paused backend or claim cloud synchronization. Evidence capture is not a correctness judgment; the authored marking-rule registry remains the authority for automatic marking.

## Interpretation contract

| Mode | Source evidence | Presentation |
| --- | --- | --- |
| Read | Story or ordinary explanatory section | Editorial typography, open space, no enclosing story card |
| Understand | Vocabulary, learning outcomes, concept section or Thinking Equation | Instructional structure, reference tables and separate equations |
| Decide | Activity with authored choices or a values sort | Selectable options, ordered rankings or constrained values selection |
| Do | Activity, workbook table, plan or home experiment | Structured work surface and original response fields |
| Reflect | Authored reflection | Quiet, focused response surface |
| Prove | Checkpoint, assessment or portfolio capture | Evidence hierarchy and explicit capture status |

These modes do not impose a six-step sequence. They follow the authored order. An activity may contain both decision and work controls. `OR` and `Part A`–style subheadings do not end their parent task. Source-backed activity, checkpoint and home headings provide the lesson outline; no duration, mission, output chips or stage names are invented.

Ordinary narrative is never converted into an interaction simply because it mentions a decision. Explicit checkbox choices, rating ranges in table headers and the authored Grade 9 five → three → one values instructions provide the evidence needed for native controls. Ambiguous decisions, open reasoning, unsupported calculations and complex matrices keep their authored written/workbook controls.

## Traceability and acceptance

| ID | Requirement and authority | Category | Implementation | Acceptance evidence |
| --- | --- | --- | --- | --- |
| SL3-01 | Six presentation modes from the approved milestone | Frozen | `lib/semantic-learning.ts`, semantic section wrappers | Every block in all 395 lessons and four assessments belongs to exactly one section; input data remains immutable |
| SL3-02 | Quiet reading and strong task hierarchy from approved BIS adaptation | Frozen | `app/semantic-learning.css`, presentation components | Screenshot evidence and original browser hierarchy suite at 1280, 430 and 360px |
| SL3-03 | Rank authored options rather than checking them | Derived from Grade 10 Lessons 46, 64, 66 | `RankingControl`, explicit rank interpreter | Eight-option ranking, reordering, stable persistence, reload and portfolio journey |
| SL3-04 | Rating controls use the authored range | Derived from explicit table headers | `RatingControl`, `authoredScale` | Grade 11 Lesson 22 ratings and written action remain usable after reload |
| SL3-05 | Values sort supports five, three and one values, including additions | Derived from Grade 9 Lesson 2 | `valueSelection`, `ValuesControl` | Source options, custom value, limits, narrowing and reload |
| SL3-06 | Choices inside lists must be usable | Derived from Grade 8 Lesson 72 | List-choice rendering and decision interpretation | Yes/no selection and reload at all three widths |
| SL3-07 | Preserve source formulas and numerical units | Frozen source-fidelity constraint | Source markup cleanup, equation/portfolio disambiguation | Portfolio formula rendered as an equation; percentage blank accepts and restores input |
| SL3-08 | Responses remain attached to their source task and evidence | Frozen | Existing identity adapter and portfolio model | Key preservation after insertion, ranking in portfolio, older answers retained |
| SL3-09 | Navigation cannot obscure learning or response controls | Frozen from approved adaptation | Reader menu reserved in header; stable outline anchors | Menu stays within header; section anchors land below fixed chrome |
| SL3-10 | Lesson has a definite completion action | Implementation | Complete and continue; synchronous save result | Completion persists before navigation; device-save failure blocks completion |
| SL3-11 | Systematically inspect every grade and term | Implementation | Census script and browser matrix | All 20 grade-term combinations sampled at three viewports; all 399 units checked structurally |

The repeatable census is committed in `docs/SEMANTIC_LEARNING_CENSUS_V3.json`. Reproduce it with:

```sh
node scripts/semantic-census.mjs docs/SEMANTIC_LEARNING_CENSUS_V3.json
```

## Verification boundaries

The full curriculum receives structural coverage. Browser acceptance samples every grade and term plus difficult ranking, rating, values, list-choice, percentage, equation, assessment, error and completion states. This is not an individual visual certification of all 395 lessons. Source tables with unsupported/ambiguous structure keep their existing geometry, and calculations are not fabricated from contextual guesses.

Screenshots are archived by GitHub CI. Release checks include task identity tests, curriculum/semantic/persistence tests, typecheck, lint, production build and the Chromium matrix. Production acceptance must verify the released commit and a direct reader refresh on the live alias.

Local release acceptance on 5 October 2026: two Python task-identity tests, all 42 Node tests, typecheck, lint and production build passed. All 96 Chromium journeys passed in approximately 1.3 minutes. Desktop and mobile screenshots were visually reviewed, including the lesson header, values narrowing, ranking rows, rating/action tables, equations and navigation chrome. The original 15 Presentation Architecture 2.0 journeys remain included.

## Recovery

The previous production revision is `e2d501444e3b787fd788b0694239264bfa8fdff5`. This release needs no database migration. Reverting the presentation commit restores the previous reader. Saved rankings, values and ratings remain ordinary strings under the same keys and are readable by the previous controls.
