# Applied Commerce lesson icon restoration

The learner reader restores the visual cues from the five supplied Grade 8–12 books. This is a presentation change on top of main commit `3933c2d90519e7aa53984405693da9526c12a588`.

## Restored meanings

| Symbol | Meaning | Placement |
| --- | --- | --- |
| 📘 | Read Carefully | Story and concept headings |
| 💭 | Pause and Reflect | Reflection notices and Deepening Insight |
| ✍️ | Activity | Activity notices |
| ✅ | Checkpoint | Checkpoint notices |
| 🏠 | Try This at Home | Home task notices |
| 📂 | Portfolio evidence | Existing portfolio disclosures |
| ⬜ | Thinking Equation | Existing equation notices |

The collapsible Lesson icons key explains these seven cues and the original six learning levels: 🔍 Remember, 💡 Understand, 🛠️ Apply, 🔬 Analyze, ⚖️ Evaluate and 🌟 Create. Checkpoints regain a level symbol only when their heading explicitly names that level. No missing outcome levels are guessed.

Some current runtime story/concept headings are classified as ordinary sections because their original emoji was removed in later manuscripts. The shared section renderer supplies the reading cue, except on the Learning Outcomes heading. Existing story blocks also receive it. Leading source symbols are removed only from the displayed title to prevent duplication.

The key uses native details/summary controls and remains collapsed initially. Symbols sit beside readable text and are hidden from assistive technology to avoid repeated emoji announcements. System emoji fonts provide the familiar device rendering.

## Preserved boundaries

Source books, runtime bundles, source wording and sequence, unit/block/prompt IDs, answers, progress, account boundaries and database contracts are unchanged. The previously approved removal of Tension/Experiment Log sections remains in effect; this change does not reintroduce that workflow. Existing portfolio and Deepening Insight disclosures remain collapsible.

## Verification

| Check | Result |
| --- | --- |
| Pre-change targeted Node checks | Passed |
| Pre-change presentation browser suite at 430px | 6 passed |
| `npm run verify` | Passed: runtime verification, 178 Node tests, TypeScript, ESLint and local-mode production build |
| Presentation and icon browser suites | 33 passed across 1280, 430 and 360px |
| Grade 8–12 Lesson 1, guest/local mode | Original cues, keyboard-operated key, answer entry and reload verified at all three browser project widths |
| Existing representative lessons and assessment | Reading hierarchy, tables, choices, long titles and assessment controls passed |
| Source/data diff | No source books, curriculum bundles, persistence modules or database files changed |

Browser page errors were checked in the five-grade icon tests. Separate visual checks cover the open icon key at 320, 360, 430, 768, 1280 and 1920px in light, dark and system appearances. Navigation-cancelled prefetch requests are excluded from network-failure diagnostics.

The environment setup installed pinned dependencies, but its optional apt browser dependency installation failed because the container cannot change ownership/user IDs. Browser tests instead used an isolated Chromium executable obtained from an npm package; no application dependencies or lockfiles changed. Emoji fonts were installed in the temporary browser environment for visual inspection.

## Review evidence

The accompanying `lesson-icons/` directory contains the previous mobile lesson screenshot, the restored icon key and representative activity, checkpoint and home notices, plus the viewport/appearance matrix. The key and notice images were visually inspected for glyph rendering, clipping and readable labels.

The original presentation suite and new icon suite provide local guest coverage. Authenticated staff/learner sessions, cloud synchronization, real-device emoji variations, every individual lesson, and the live deployment are **NOT TESTED** in this focused change.

## Release status

Prepared on `fix/restore-lesson-icons`. The user explicitly approved pushing this reviewed change to `PDthePlug/Applied-Commerce-` and opening its pull request after the initial automatic approval review required destination approval. Production release is separate from this branch publication and remains unchanged.
