# Classroom evidence

`evidence-manifest.json` indexes 52 private teacher artifacts with hashes, source-file hashes, print metadata and the three reproduced before/after probes. The core matrix passed 42 cases at 320/360/430/768/1280/1920; the subsequent global sync-warning contrast fix passed six focused cases. Core screenshots precede that scoped global correction; `after/` captures show the corrected state. These are synthetic educator UI tests, not live Supabase role validation.

`benchmark-review.v1.enc.json` contains a privately encrypted ZIP of 28 review files: the five complete structured guides, all five A4 PDFs, representative viewport screenshots and defect before/after captures. It uses the separately retained classroom release key. No plaintext teacher notes, indicative answers or key are published in this directory. The complete raw matrix and diagnostic traces remain under ignored `work/classroom/private/` and must be retained through an approved private handoff before the workspace is discarded.

An authorised reviewer with the separately held private key file can open the archive locally:

```sh
node scripts/classroom-content.mjs open docs/classroom/evidence/benchmark-review.v1.enc.json work/classroom/private/content.classroom-key work/classroom/private/benchmark-review.zip
```

Open the ZIP privately; do not attach its decrypted contents or the key to this public PR. The same key can validate the instructional release with `scripts/classroom-release.mjs`. Key custody/provisioning and independent educator approval remain release dependencies. The archive provides review evidence, not permission to publish the guides as approved material.

`ci-ee1aa09.json` records actual totals from the completed GitHub CI job and links the durable run. Final local acceptance/discovery summaries are added to this directory when those runs finish. Public local-mode screenshots from discovery contain no teacher guidance; teacher review screenshots/PDFs remain encrypted.
