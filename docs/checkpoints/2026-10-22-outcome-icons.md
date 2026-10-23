# Learning outcome icon omission

The earlier icon restoration omitted the symbols before the learning-outcomes introduction. The shared text renderer now displays each verified source combination immediately before “By the end of this lesson, you will be able to:”. Grade 8 Lessons 1 and 2 regain 🔍💡🛠️. The Learning Outcomes heading itself stays unchanged.

## Source mapping

`lib/lesson-outcome-icons.json` is presentation metadata extracted from the five original icon-bearing manuscripts supplied by the owner. `scripts/restore-outcome-icon-metadata.py` reproduces it given a directory containing those books. Source SHA-256 digests are retained. The checked-in source books from the later source rebuild have already lost these glyphs and are not overwritten.

367 introductions have directly recoverable symbols, including all 80 Grade 8 lessons and all 20 Grade 8 Term 1 lessons. Twelve Grade 9 introductions (Lessons 23–34, restored separately in the runtime curriculum) have no matching original introduction in these supplied manuscripts. Their symbols are not inferred. Sixteen workshop/clinic units have no matching introduction at all and are not assigned a new one.

Symbols already present in text take precedence and are not duplicated. The compact inline group stays together on narrow screens and is decorative for assistive technology; the existing readable learning-level key remains available.

Curriculum bundles, source books, block and response identities, saved-work handling, private teaching content and database contracts are unchanged.

## Verification

- `npm run verify` passed: 395 lessons/four assessments/20,766 stable blocks, 180 Node tests, TypeScript, ESLint and local-mode production build.
- The first new metadata assertion expected the wrong combination for Lesson 8. It was corrected against the supplied manuscript; the final full verification above passed.
- Lesson icon browser suite: 18 passed at 360px, 430px and 1280px. Representative first lessons in all five grades retained answer entry/reload; Lesson 2 explicitly checks its three outcome symbols and horizontal overflow.
- Visual recheck: three Lesson 2 cases passed after configuring the temporary browser's emoji fonts. The desktop and mobile evidence images were inspected; missing-font boxes are not accepted as visual proof.
- `git diff --check` passed.

Evidence: `lesson-icons/outcome-icons-mobile-360.png`, `lesson-icons/outcome-icons-mobile-430.png`, `lesson-icons/outcome-icons-desktop-1280.png`.

Validation used local learner mode. Real staging roles, live production and real-device font variations were not tested in this focused change. No production deployment or merge is included.
