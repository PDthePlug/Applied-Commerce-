# Secure delivery measurements and recommendation

The original key and original encrypted artefacts remain unchanged. Reading the 24 original plans used authorised staging delivery; no server key was exported. The reader still requires fresh identity, active session and current educator/admin authority before private import. All private responses remain no-store. Learner assets, curriculum, saved-work models and identities are unchanged.

Encrypted artefacts measured from the actual checkout:

| Release | File bytes | AES ciphertext bytes |
| --- | ---: | ---: |
| Five original benchmarks | 233,203 | 174,676 |
| Lesson 8 contextual enrichment | 8,403 | 6,077 |
| Current 24-plan release | 873,263 | 654,723 |

Code inspection: loadTeachingPlan decrypts/parses the entire 24-plan release, validates all hashes/schema/source bindings, then selects one plan on **every request**. Benchmark requests also load the five original guides, and Lesson 8 adds its enrichment. There is no cross-request decrypted-plan cache. The 24-plan plaintext release is 654,723 bytes; the inspected plan-only JSON reconstruction is 450,243 bytes because it uses compact serialization rather than the encrypted release's formatting.

Initial real browser password login against PR #44: first observed platform-admin request 1,090 ms; five educator requests **910, 825, 959, 966, 713 ms**, each **101,791 decoded response bytes** for Lesson 1, Cache-Control private/no-store. These are end-to-end client measurements through the session proxy. They are not isolated CPU measurements or proof of a new server instance. First-observed versus repeated requests must not be labelled guaranteed cold/warm process starts.

The response includes the entire **395-entry catalogue** although the lesson reader already has its curriculum navigation. In the decoded working payload, catalogue serialization is approximately 87 KB while the plan is approximately 21 KB (formatting differs from HTTP compact serialization). This supports the implemented `catalog=omit` option for the reader. The default endpoint retains the complete catalogue for the standalone workspace. The option does not bypass authorisation, alter plan content, change encryption or enable caching.

Local parsing/hash/schema validation of all 24 **authorised retrieved** plans: first measured call **8.43 ms**, subsequent median **5.19 ms** across 20 calls; first heap delta about **3.55 MiB**, process RSS about **132.2 MiB**. This benchmark excludes AES, key loading, auth/network and hosted server RSS. Heap deltas fluctuate with garbage collection and cannot be extrapolated linearly. It is not a hosted decryption or cold-start result. The repeatable raw samples remain in protected evidence.

Final hosted results combine three five-request sequences per response shape: **15 full-catalogue requests**, median **781 ms** (538–1,006 ms), and **15 catalogue-omitted requests**, median **729 ms** (533–1,214 ms). The reader response is **20,092 bytes**, an **80.26% reduction** from 101,791 bytes. Latency ranges overlap substantially; no guaranteed speed-up is claimed. Chromium JS heap measured 6.49 MiB before the first sampled lesson to a maximum 56.23 MiB after a sampled lesson during repeated navigation and PDF generation. Raw repeated-request and heap measurements are in TEST_RESULTS.json and hosted-final-results.json. Browser heap is the browser process's JS heap, not server memory. Repeated full lesson navigation and PDF generation can change it; it does not alone prove a leak. True hosted cold-process duration and server RSS are NOT MEASURED because the hosted runtime was not instrumented and no instance identity was available. No artificial key or local-role mock was substituted.

Recommendation:

1. Keep the original encrypted releases for this 24-plan milestone. The measured overhead justifies the small per-reader response fix now; its final byte/latency result is reported separately.
2. Before 395-guide scale, trial encrypted **per-lesson or small term releases** with versioned manifests binding content hash, source hash, lesson and schema version. Do not simply multiply the current monolithic release by sixteen. A server build can validate the whole batch; requests can then authenticate and validate/decrypt the selected release. Preserve original keys and authenticated encryption context, with an explicit reviewed release process.
3. Measure hosted auth versus decryption/validation duration and RSS under concurrency before choosing a cache or batch size. Current latency includes remote authorisation calls and proxy/network overhead; a local 5 ms validation cost does not establish that caching will solve it.
4. If that measurement supports it, use a bounded process cache keyed by immutable release hash and lesson, retaining fresh access checks **before every response**. Never cache user authorisation, return public cache headers, persist plaintext to public storage or share private browser caches. Define invalidation on version change and bound memory/concurrent loads.

No database migration, production architecture change, key rotation or public plaintext package was introduced. Smaller encrypted packaging and server caching are recommendations for separate architecture review, not completed changes or a claim that Supabase connectivity solves packaging.
