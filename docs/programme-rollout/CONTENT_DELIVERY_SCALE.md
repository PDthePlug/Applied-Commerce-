# Private content delivery: measured growth

The original classroom key remains server-bound. Packaging and Supabase access are separate capabilities: genuine staging login demonstrates permissions, while guarded build-time sealing demonstrates that the original key opens and extends the existing encrypted release without export. Neither proves 395-plan performance. The 185-plan release passes its recorded hosted acceptance; that does not demonstrate the missing cold/server-memory measurements.

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
| 147 | 2,457,643 | 2,644,782 |
| 158 | 2,624,607 | 2,828,350 |
| 162 | 2,700,579 | 2,901,439 |
| 185 | 3,135,859 | 3,316,118 |
| 181 | 3,060,491 | 3,245,848 |
| 177 | 2,983,283 | 3,173,491 |
| 174 | 2,923,891 | 3,117,389 |
| 170 | 2,844,515 | 3,043,000 |

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

At 147 plans, 55 sequential authenticated requests include 50 to additions: median 756.5ms, range 546–1144ms, and 9211–13930 decoded bytes. The build scans 77 public assets against 7,695 private sentinels plus key. Different conditions across batches prevent a causal size/latency claim; guaranteed cold processes, hosted memory and concurrency remain unmeasured.

For the 147-plan run, the ten first-observed new-lesson requests had median 706.5ms; forty repeat requests had median 762.5ms. This compares request order, not proven cold/warm server states. Browser CDP heap ranged 7206412–53107384 bytes before and 20546632–53107384 after sequential lesson/PDF work. The trusted sealing process used 317,038,592 bytes RSS. Neither is hosted request-time memory. [Measurement details](g9-t4-55-64/content-delivery-observations.json).

At 158 plans, 60 genuine sequential authenticated requests include 55 to additions: median 669ms, range 549–995ms and 7,894–18,894 decoded bytes. The guarded normal build scans 77 assets against 8,137 private sentinels plus key. Build RSS 291,880,960 bytes is not hosted runtime memory. Cross-batch differences do not establish a release-size causal effect. Cold-process, concurrency and hosted memory evidence remain pending; current server-side authorisation is preserved.

At 162 plans, 25 genuine sequential requests include 20 to additions: median 800ms, range 593–1195ms, 13,500–16,547 decoded bytes. The build scans 77 assets against 8,341 private sentinels plus key; build RSS 307,154,944 bytes is not hosted runtime memory. Different batch contents/conditions do not establish a size/latency relationship. Fresh authorisation remains mandatory; cold-process, concurrency and hosted server-memory evidence remain pending.

At 170 plans, 45 genuine sequential requests include 40 to additions: median 756.5ms, range 552–1216ms, 12560–16632 decoded bytes. Build RSS 297095168 bytes is not hosted runtime memory; 77 assets pass 8739 private sentinels plus key. Different content/conditions prevent a causal size/latency conclusion. Fresh authorisation remains required; hosted cold, concurrency and server-memory evidence is pending.

At 174 plans, 25 genuine sequential requests include 20 to additions: median 777.5ms, range 581–1044ms, 13859–16831 decoded bytes. Build RSS 300613632 bytes is not hosted runtime memory; 77 assets pass 8951 private sentinels plus key. Different content/conditions prevent a causal size/latency conclusion. Fresh authorisation remains required; hosted cold, concurrency and server-memory evidence is pending.

At 177 plans, 20 genuine sequential requests include 15 to additions: median 746ms, range 599–953ms, 14014–16913 decoded bytes. Build RSS 293978112 bytes is not hosted runtime memory; 77 assets pass 9107 private sentinels plus key. Different content/conditions prevent a causal size/latency conclusion. Fresh authorisation remains required; hosted cold, concurrency and server-memory evidence is pending.

At 181 plans, 25 genuine sequential requests include 20 to additions: median 832ms, range 657–1010ms, 13257–18512 decoded bytes. Build RSS 335663104 bytes is not hosted runtime memory; 77 assets pass 9311 private sentinels plus key. Different content/conditions prevent a causal size/latency conclusion. Fresh authorisation remains required; hosted cold, concurrency and server-memory evidence is pending.

At 185 plans, 25 genuine sequential requests include 20 to additions: median 844ms, range 632–1080ms, 14102–14961 decoded bytes. Build RSS 292806656 bytes is not hosted runtime memory; 77 assets pass 9511 private sentinels plus key. Different content/conditions prevent a causal size/latency conclusion. Fresh authorisation remains required; hosted cold, concurrency and server-memory evidence is pending.
