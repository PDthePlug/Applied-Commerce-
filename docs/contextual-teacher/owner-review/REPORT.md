# PR #43 owner-review corrections

This report supersedes the initial contextual milestone report. The original
milestone was technically verified but **not accepted by the owner**. Final owner
and independent educator acceptance remain pending.

## Classroom structure

Teacher View starts with a closed **Prepare to teach** disclosure. It contains
purpose, objectives, observable outcome, prerequisite knowledge, continuity,
educator knowledge, materials, vocabulary, misconceptions, local context,
participation/privacy and the five-stage timing. Presentation/print/fallback
controls have a separate compact disclosure. A labelled stage selector and Go to
stage button replace the tall mobile list.

The original learner lesson stays in its original order. Each stage has a closed
contextual panel with immediate teaching actions, questions, participation and
observable understanding. A local secondary disclosure holds the relevant
reasoning, scaffold, checks and adaptations. Navigation explicitly returns to
The Difference after the opening, then revisits phone/data examples with new
constraints. Previous/next controls update the delivery navigator and focus the
correct stage. Direct local links revisit Pause and Reflect and return to practical work, open
Part C, and plan Part B from the exit stage. They focus the relevant native
disclosure control. Delivery navigation does not save answers or change completion.

The full bottom document has been removed from the live interface. It mounts
only on a print request and remains hidden on screen. The complete original
printable guide and standalone fallback are retained. The fallback is not used
to satisfy live instructional coverage.

Learner notes and both completion controls are absent in Teacher View. Switching
back restores Learner View with the same saved notes, responses and completion
state. Original authored response controls and their identities remain intact.

## Every original instructional field

[The 100-row field map](instructional-field-map.csv) gives an access path and
original-value SHA-256 for every instructional text field. The
[machine-readable map](instructional-field-map.json) adds the exact live field
selector, disclosures to open and corresponding original learner section.
It excludes source references, provenance and governance self-review fields;
those remain in the original encrypted release.

| Primary live location | Original text fields |
| --- | ---: |
| Preparation at the beginning | 17 |
| Stage 1: opening at phone/data | 7 |
| Stage 2: distinction and limits | 15 |
| Stage 3: data under constraints | 18 |
| Stage 4: practical application | 26 |
| Stage 5: reflection/check | 13 |
| Local later/independent-work panel | 4 |
| **Total** | **100** |

Vocabulary and misconceptions are also available in preparation. Quiet
participation and the practical understanding check recur where pedagogically
relevant. Each field has one designated primary location for the preservation
check; intentional reuse does not inflate the count. No field requires the
print tree, standalone guide or a bottom document for access.

The browser preservation test independently enumerates strings from the actual
decrypted API guide, opens the mapped local disclosures and verifies exact
text and visibility for all 100 fields. It does not merely compare a copied
manifest with itself. Unknown instructional fields or a changed original field
count fail closed and require placement review.

## Teaching time and authored activities

[activity-routing.json](activity-routing.json) accounts for every authored
activity and the renderer boundary used for its guidance. The original source
and response flow are not reordered.

| Authored work | Treatment |
| --- | --- |
| Phone/data examples | 0–5 opening; revisit at 14–24 with contrasting constraints |
| Vocabulary and comparison | 5–14; explain survival and contextual functional meanings |
| Pause and Reflect | Reuse within the practical reflection minute, not another full discussion |
| Activity 12 Part A and pattern | Current practical work; original five rows remain |
| Activity 12 Part B | Plan only; later 24-hour observation or labelled simulation |
| Activity 12 Part C | One connected ambiguous-case explanation now; fuller private writing independently |
| Portfolio save instruction | Existing work remains portfolio material; no teacher-navigation completion |
| Deepening Insight and private writing | Optional independent extension; dignity informs the scheduled discussion |
| Checkpoint Question 1 | Current 40–45 minute exit explanation |
| Checkpoint Question 2 | Part C supplies reasoning now; fuller written response independently if needed |
| Checkpoint Question 3 | After an actual later pause or explicitly labelled simulation |
| Try This at Home and alternative | Later voluntary observation or independent alternative; privacy respected |

The practical 16 minutes are explicitly allocated: modelling 2, five-row work 8,
pattern/reflection 1, Part C 3, pair-check 2. Total teaching time remains
5 + 9 + 10 + 16 + 5 = 45. This is a proposed delivery allocation pending a real
classroom pilot; it is not evidence that every class can complete it at that pace.

A separately versioned, encrypted Grade 8 enrichment clarifies the source's
narrow survival definition and its wider functional examples, realistic
alternatives, preference versus function, transitions and current/later work.
It is linked to the original guide version and source fingerprint. These are
new reviewable teacher additions, not changes to the canonical book or claims
of independent educational approval. The original five-guide ciphertext,
manifest and all four other benchmark guides are unchanged.

## Security and source protection

The existing server verified-identity, active-session, current educator/admin
assignment and expected-account checks still precede private imports and
loading. The new enrichment is decrypted only within that boundary, with the
same private/no-store response headers. A damaged enrichment returns a safe 503
without a partial guide. No URL flag or client role grants access.

Guide and enrichment state share identity/session/lesson/revision binding,
request cancellation and clearing. Entry, focus/visibility return and online
refresh recheck access; immediate push revocation is not claimed. Projection
requests no classroom payload and contains no private notes, saved answers or
editable responses. Neither private package is stored in learner local storage.

No canonical books, compiled curriculum, response identities, assessment
behaviour, Supabase policies or schema were changed. Tests use local mode and an
ignored synthetic UI copy. No production Supabase writes or real production
accounts are used. The original key remains in its private location, unchanged,
with mode 600. It has not been regenerated or committed.

## Verification and evidence

Actual final results, commit references, staging verification and encrypted
before/after evidence are recorded in the adjacent evidence files after the
verification run. Synthetic UI results do not establish real educator or learner
role access. `AC_ROLE_FIXTURES` is unset: **real authenticated roles, hosted
teacher review and cloud response persistence are NOT TESTED**.

The separate live project `applied-commerce` must not be deployed or merged as
part of this review. Only the isolated `applied-commerce-sa-staging` project is
eligible for an owner-review deployment. No owner acceptance is inferred from
technical test success.
