# Private content delivery: measured growth

The original classroom key remains server-bound. Packaging and Supabase access are separate capabilities: genuine staging login demonstrates permissions, while guarded build-time sealing demonstrates that the original key opens and extends the existing encrypted release without export. Neither proves 395-plan performance. The 137-plan release passes its recorded hosted acceptance; that does not demonstrate the missing cold/server-memory measurements.

| Released/candidate plans | Ciphertext bytes | Hash/placement manifest bytes |
| --- | ---: | ---: |
| 29 | 691,991 | 737,807 |
| 44, initial append | 916,203 | 975,420 |
| 54 | 1,065,947 | 1,136,659 |
| 64 | 1,229,967 | 1,310,414 |
| 84 | 1,530,595 | 1,635,662 |
| 99 | 1,760,831 | 1,880,353 |
| 108 | 1,892,843 | 2,025,968 |
| 117 | 2,029,199 | 2,168,900 |
| 137, corrected | 2,323,527 | 2,491,774 |

Exact per-operation hashes and correction sizes remain in their batch summaries. The early reduction from the original pretty-printed 24-plan file reflected compact serialization, not content removal; preserved plan hashes establish that distinction. Do not extrapolate one fixed size per lesson across unreviewed higher-grade content.

Each selected-plan API request still opens and validates the entire release after current server-side authorisation. The reader requests `catalog=omit`, avoiding a redundant full catalogue. For the unchanged Lesson 1 shape, earlier measurements show 20,092 decoded bytes without the catalogue versus 101,791 with it. Responses remain private/no-store. The encrypted server release and the authenticated selected-response payload are different sizes.

At 64 plans, a sequential final run made five genuine requests per lesson across an unchanged baseline and ten additions. The 50 new-lesson requests had median 665.5 ms, range 475–1,047 ms, with 10,569–17,880 decoded bytes. The proxy, Auth checks and server work all contribute. Earlier 44-/54-plan measurements ran under different validation loads; their medians do not establish a causal performance trend. First observed requests are not guaranteed cold, and subsequent requests do not establish a server cache hit.

At 99 plans, 80 sequential authenticated requests include 75 requests to the fifteen additions: median 662 ms, range 493–4,223 ms, with 10,094–14,940 decoded bytes. The slowest sample was Lesson 10’s first observed request. It was not a demonstrated cold start, and no causal diagnosis is claimed. Conditions differ across batches, so these observations do not isolate release-size effects.

Current browser-heap observations describe browser navigation and PDF generation. Sealing summaries describe the trusted build process. Neither measures hosted function RSS, per-request server heap or a guaranteed cold process. Those tests remain explicitly pending, along with concurrency behaviour and separate decryption/validation timings.

Retain the current architecture while gathering those missing measurements. If release-wide work becomes material, compare a smaller authenticated lesson/term release bound to a versioned manifest and original source identity with a bounded server-side cache keyed by release digest. Preserve the original key and fresh educator/session authorisation before every response. A cached plan must not cache a permission decision, leak across roles or survive a release update under a stale identity.

No smaller-release or caching architecture is implemented here. Do not expose plaintext guides or keys in public assets, add a public sealing route or change a database schema as a shortcut. Any production architecture change or migration requires separate owner approval after a concrete measured proposal.

At 108 plans, the latest sequential run made 50 authenticated requests, including 45 to additions: median 595 ms, range 535–973 ms, 9541–14812 decoded bytes. These proxy-observed samples do not demonstrate guaranteed cold starts, per-request server memory or a causal release-size trend.

At 117 plans, 50 sequential authenticated requests include 45 to additions: median 670 ms, range 531–1040 ms, 9307–18404 decoded bytes. The normal build scanned 77 public assets against 6,517 private sentinels plus the original key. No plaintext guide or key was exposed by that scan. These samples still do not measure a guaranteed cold process, concurrency or hosted function memory.

At 137 plans, the final sequential run made 105 genuine authenticated requests, including 100 to additions: median 592.5ms, range 513–998ms and 8933–18586 decoded bytes. The original-key build and public asset scan pass. Cold-process, hosted function memory and concurrency remain unmeasured; no causal performance trend or full-programme capacity claim is made.
