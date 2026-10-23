# Programme rollout from PR #48

The owner accepted the PR #48 brief contextual facilitation approach and authorised individual teaching support for all 395 lessons. This follow-up starts from PR #48 head `2d1937a3bf39c21f422e563ac2a548b36ae46799`, preserving PR #43/#44 as predecessors. The excluded milestone was not recovered or used. No classroom PR was merged and no separate live application or Zimbabwe application was changed.

## Shared refinements

Contextual panels no longer contain previous/next stage buttons or a repeated navigator button. One teaching-sequence selector at the beginning retains the period order and now also reaches contextual support and later work. Navigation opens collapsed ancestors and focuses the original stage anchor, including revisits to earlier material. Source placements and transition metadata remain intact.

Checkpoint numbers sit beside their questions in a grid, with hanging text alignment and quieter helper instructions beneath. Answer controls follow their questions with moderate spacing. Existing short controls remain; long controls start at six text lines of minimum space and remain vertically resizable. Placeholders and saved-response feedback remain. No prompt text, split, field count or saved answer key changed.

The 399-unit preservation test compares the approved renderer hashes after removing only the new checkpoint layout wrapper. This preserves the original wording, input markup and identities without accepting a wholesale new baseline.

## Coverage and sequence

[coverage.json](coverage.json) records every lesson's source review, instructional review, provisional contact periods, automated checks, genuine-role checks, print, responsive status and outstanding issues. [grade-term.csv](grade-term.csv) summarises those records. Existing 24 plans retain their accepted guidance. The other 371 are pending individual review; inventory generation is not educational review or completed authoring.

The shared refinements must pass before new content batches advance. Subsequent batches will read the actual source, author lesson-specific cues and optional support privately, validate exact source placement and stable identities, seal with the original classroom key, and verify authenticated staging delivery. Learner-source proposals remain in the separate [editorial register](../staging-classroom-validation/SOURCE_EDITORIAL_REGISTER.json); this change applies none.

## Secure authoring dependency

`SUPABASE_SECRET_KEY` is available to the coding environment; `AC_ROLE_FIXTURES` is a protected directory outside the checkout. Genuine staging access uses project `inxshlumnhcgiahxqewe`. The server's original classroom key remains bound in the isolated staging project. Neither `AC_CLASSROOM_CONTENT_KEY_FILE` nor `AC_CLASSROOM_CONTENT_KEY` is available to this coding process, and the documented private key file is absent. The owner has been asked for a private binding of the existing key or an approved secure sealing workflow. Do not paste the key into chat, replace it, commit plaintext guides or introduce a public sealing endpoint.

This prevents packaging new guides with the original key. Existing authenticated content can still be inspected and the shared interface fully tested. Expanded release performance cannot be claimed until an expanded encrypted batch exists and is measured.

## Verification

Verification is in progress; recorded outcomes will be added before owner handoff. Authenticated screenshots, PDFs, fixture credentials, sessions and raw API payloads remain under protected `AC_ROLE_FIXTURES`. Repository evidence contains counts, status and hashes only. The natural original JWT expiry check now passes against Auth and data endpoints, with an explicit expiry reason; configured maximum/inactivity lifetimes and hosted cold-process/server-memory measurements remain unproven. Contact timing remains provisional until educator trials.
