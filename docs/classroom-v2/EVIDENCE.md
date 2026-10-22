# Private classroom review evidence

`review-evidence.v2.enc.json` is an encrypted review archive, not a public teacher-content download. It was sealed with the original existing classroom key and successfully opened and compared byte for byte. The key is not included. See `evidence-encryption.json` for the ciphertext checksum and `evidence-manifest.json` for 238 payload files; the archive also contains its manifest (239 entries total).

The archive contains:

- 96 contextual screenshots: collapsed/expanded guidance for all 24 lessons at 320 and 1280 pixels.
- 12 preparation screenshots at mobile/desktop widths and two new-plan standalone screenshots.
- 80 learner before/after screenshots covering every term lesson at mobile/desktop widths. All six widths' 120 comparisons are recorded separately in `learner-pixel-regression.json` and `learner-dom-regression.json`.
- All 24 final complete private guide PDFs, with 169 populated A4 pages and 1,867 preserved instructional fields.
- Twelve approved-benchmark local/dark/enlarged-text screenshots across all six widths.
- Scaffold and print before/after evidence, the reproduced Grade 12 accessibility error context, and raw initial/retest/desktop/benchmark browser reports. Initial failures remain identifiable.

All six viewport captures and full failure traces remain in ignored `work/classroom-v2/private/`. The durable archive selects mobile and desktop images; it does not include a large duplicated trace archive. Screenshot provenance spans the initial full matrix, final focused retests, all-plan desktop run and final six-width scaffold regression; the manifest distinguishes that from the final-code print exports. Nothing here claims a real authenticated educator review.

Only open this artifact in a private workspace with the existing key. These commands display no key or guide contents:

```sh
umask 077
mkdir -p work/classroom-v2/private/owner-review
node scripts/classroom-content.mjs open docs/classroom-v2/review-evidence.v2.enc.json work/classroom/private/content.classroom-key work/classroom-v2/private/owner-review/review.tar.gz
tar -xzf work/classroom-v2/private/owner-review/review.tar.gz -C work/classroom-v2/private/owner-review
```

Inspect the extracted files locally or through an approved private review channel. Keep plaintext images, PDFs, extracted reports and the key out of Git, public hosting, CI artifacts and conversation. Do not regenerate the original key if it is unavailable in another workspace; use an approved secure handoff.
