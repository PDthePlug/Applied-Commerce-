# Security and authenticated-role verification

The final application commit is `bdf432246cd73be42908724bed728a2f6f4dc4d2`. The original classroom key is preserved byte for byte, remains in its ignored private location and is not included in this report or the evidence archive. The existing staging Secret is used without retrieving, replacing or exporting its value.

| Boundary | Evidence | Result and limit |
| --- | --- | --- |
| Server identity, active session and current role before private import | Actual route executed against synthetic auth/database adapters in `tests/classroom-api.test.mjs` | PASS for guests, ordinary learners, inactive sessions, unassigned educators, forged metadata, assigned staff, owners/admins and platform admins. Synthetic tests do not prove deployed assignments or RLS. |
| Account mismatch, failed lookup, damaged encrypted releases | Same route tests | PASS: fail closed; no partial guide or private configuration error returned. |
| Real local-mode application | Existing browser acceptance, CI run 39709085888 | PASS: anonymous API 401, no guide, protected workspace gate and unavailable plaintext URL. A classroom URL context grants no access. |
| Private state lifecycle | Six-width isolated UI-copy retests | PASS: sign-out, account change, lesson change and revoked revalidation clear private guidance. Fixtures simulate those events. |
| Public bundles | Final built app scanned against private raw/escaped sentinels | PASS: 77 assets, 2,421 sentinels, zero disclosures. |
| Learner storage and shared presentation | Isolated UI tests and code review | PASS: guidance is not written to learner storage; separate presentation has original blank disabled fields and no teacher panels. No device synchronisation is claimed. |
| Staging server decryption | Verified Vercel server build log, exact project and commit | PASS: all 24 plans, 31 periods and 1,867 fields validated using the existing Secret. |
| Hosted anonymous request | Final staging `/api/classroom` request | 401, no private guide returned. Deployment protection may intercept; this is not proof of application-level learner denial. |
| Real staging educator, learner, administrator and institutional roles | `AC_ROLE_FIXTURES` unavailable | **NOT TESTED**. No production accounts or synthetic identity were substituted for real-role evidence. |
| Real revoked role/session and cloud response/portfolio persistence | Requires isolated authenticated fixtures | **NOT TESTED**. Synthetic route/UI checks are recorded separately above. |

The exact target is `applied-commerce-sa-staging`, project `prj_9MXnYeh3mxtFzcS1xzEDrTjOW2nP`, using that staging project's production environment. `/api/health` identifies isolated Supabase project `inxshlumnhcgiahxqewe`. The separate live `applied-commerce` project and production Supabase `upvbxplswxhoqzbvgdxv` were not modified. There were no migrations, security-policy changes or production data writes.

Private source, browser traces, screenshots, PDFs and raw results remain in ignored private storage. The committed review archive is encrypted; its public manifest contains filenames, sizes and checksums only. Server-side decryption and an operational health endpoint do not establish hosted educator acceptance. Deployment protection remains enabled.
