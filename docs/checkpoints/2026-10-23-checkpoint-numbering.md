# Checkpoint numbering and response captions

Checkpoint response prompts now use one continuous 1, 2, 3 sequence within each checkpoint. The old source group headings and generated “Part N of M” labels no longer compete with that sequence. Descriptive group text and supporting instructions remain. Other multi-response practice uses plain numbers; formal assessments retain their authored subpart labels.

Empty response fields keep the placeholder inside the control without repeating “Type your response” underneath. A non-empty saved response still displays “Captured”. Clearing the field removes that indicator. Number markers use 14px text.

This is a presentation change. Source blocks, prompt splitting, response slots, canonical books, curriculum bundles, and database/security contracts are unchanged. Existing split answers and previous combined answers remain available under their original keys. The icon restoration merged in PR #46 is retained.

## Verification

- Relevant pre-change semantic and UI-quality Node tests passed.
- `npm run verify` passed: 180 Node tests, 395 lessons/four assessments/20,766 stable blocks, TypeScript, ESLint and local-mode production build. The final number-size adjustment also passed a fresh production build.
- Final browser execution: 27 passed at 360px, 430px and 1280px, comprising nine new numbering/caption checks and eighteen existing presentation checks.
- Numbering checks cover all five grades' first lessons, continuous numbering across Grade 8 Lesson 8's old source groups, minimum marker size and absence of duplicate headings/empty-field captions.
- Persistence checks seed existing stable split-response keys and an older combined response, verify reopening, update one response, reload and confirm the sibling and combined responses remain intact. Clear-and-reload behaviour is also verified.
- Existing browser checks cover reading hierarchy, responsive tables, authored choices, long titles, wide tables and formal assessment controls.
- The initial browser run could not launch because its previous temporary binary had been removed. The direct Playwright browser download was unusable. Tests subsequently used the pinned temporary `@sparticuz/chromium@153.0.0` binary and `@fontsource/noto-color-emoji@5.3.2` fonts. No application dependency or lockfile changed.
- The first screenshot capture occurred before smooth scrolling completed. Evidence capture was corrected to scroll instantly and assert that the target is in the viewport. Final mobile screenshots were visually inspected.

Evidence in `checkpoint-numbering/` uses synthetic responses in local learner mode. Real staging roles/cloud persistence, every individual lesson, and real-device rendering are not claimed by this focused change. No production release or merge is included.
