# Private owner-review evidence

The encrypted package contains 93 files for application commit
`50c2dc53f93e84f8657c80f871d386a28fe433ed`. The
[evidence manifest](evidence-manifest.json) lists exact names, byte sizes and
SHA-256 values. Its matching before/after pair uses a 360×800 viewport and
full-page screenshots. The rejected implementation is commit `29c496c`; the
original learner baseline comes from main commit `3933c2d`.

Teaching notes in screenshots/PDFs are private. The package uses the existing
classroom encryption key, which is preserved unchanged in the private workspace.
It contains no key file, fixture credentials or original guide JSON. The ZIP CRC
and authenticated encryption round-trip were verified.

An authorised owner with the original private key file can open a local copy:

```sh
node scripts/classroom-content.mjs open \
  docs/contextual-teacher/owner-review/owner-review-evidence.v1.enc.json \
  work/classroom/private/content.classroom-key \
  work/contextual-owner/private/review-opened.zip
```

Keep the opened ZIP and extracted files private under ignored `work/`. Never
commit, log or publish the key, decrypted package or private teaching images.
No new key is needed or generated.

Useful files inside the package:

- `before/reproduction.json`: the observed bottom document, learner controls and constrained internal scrolling.
- `before/reproduced-360.png` and `evidence/reproduced-after-360.png`: matching full-page before/after views.
- `evidence/collapsed-contextual-*.png` / `expanded-contextual-*.png`: actual six-width classroom panels at normal text scale.
- `evidence/preparation-collapsed-*.png` / `preparation-expanded-*.png`: normal-scale 320/1280 preparation.
- `evidence/local-g8-explore-*.png` / `local-g8-do-*.png`: deeper local support at 320/1280.
- `evidence/dark-large-contextual-*.png`: dark mode with the configured teacher text doubled from 15px to 30px.
- `evidence/teacher-preparation-contextual-{320,1280}.pdf`: complete nine-page teacher preparation, with rendered first/fourth/last-page PNGs.
- `learner-original-main-*.png` / `learner-after-*.png`: six pixel-identical learner comparisons at the historical 900px height.
- Browser JSON, per-viewport 100-field hashes, PDF review and retained initial/final test logs.

These are synthetic local UI fixtures, not authenticated staging accounts.
Existing account-sync warnings can appear because the synthetic educator has no
Supabase connection. They do not demonstrate a hosted sync defect or successful
cloud persistence. Classroom viewports are 320×740, 360×800, 430×932, 768×1024,
1280×900 and 1920×1080. Historical before panels at the other widths used 900px
height; they are diagnostic comparisons, not new pixel baselines.
