# Staging capability report — 1 November 2026

| Boundary | Verified capability |
| --- | --- |
| Website backend | Normal deployment health identifies `inxshlumnhcgiahxqewe` and application/content `3c34b06`; genuine browser login and private delivery work |
| Coding environment | Public staging config/ref, privately injected `SUPABASE_SECRET_KEY`, `AC_ROLE_FIXTURES`, Chromium and Vercel API credentials are available. Local backend mode remains separate from hosted Supabase mode |
| Network | Current managed-runtime policy reports enforced/unrestricted HTTPS, with no VPN/TCP grants. Node 24 requests use `NODE_USE_ENV_PROXY=1`; real API requests succeed with TLS verification |
| Database administration | Supabase Primary connector read schema/RLS/session-validation definitions: 22 public tables, all with RLS and restrictive active-session policies. No direct PostgreSQL/TCP connection is established |
| Supported Auth administration | Auth settings and Admin listing returned 200; six isolated synthetic identities and a separate boundary account were created through supported Auth Admin APIs. No Auth-table insert or password-hash manipulation |
| Genuine application authority | Password sessions, platform registry, active cohort assignments, institution owner role and real disabled assignment are verified separately. Supabase administration is not treated as an educator login |
| Institutional evidence | Actual educator review succeeds for the enrolled synthetic learner; unrelated institution staff read zero learner evidence rows and cannot open private guidance without an active AC assignment |
| Protected website access | Vercel protection remains enabled. Private short-lived access links are followed before genuine application password login. A protection redirect is recorded separately from application 401/403 |
| Hosted observability | Schema discovery works, but the platform memory query returns HTTP 402 `plan_upgrade_required`. This is a service-entitlement limitation. Temporary, exact-staging/platform-admin-only instrumentation measured actual runtime memory instead; no billing change |
| Server classroom key | Original sensitive server binding authenticates the encrypted release and seals the two-field amendment. The coding proxy-bound value is not a usable local decryption key. No export, replacement or public endpoint |

The fixture path is configured and resolves to a protected directory outside the checkout. Credentials/session/config files and authenticated working evidence are 0600; directories and their private parent are 0700. The existing [repeatable fixture specification](../FIXTURES.md) and `prepare-role-fixtures.mjs` preserve generated credentials on repeat runs. Provisioning uses supported Auth Admin; school/cohort operations and synthetic learning writes use genuine application roles and supported RPCs. The disabled educator retains ordinary educator membership and a genuinely inactive cohort assignment.

All Vercel writes target only `prj_9MXnYeh3mxtFzcS1xzEDrTjOW2nP` (`applied-commerce-sa-staging`, its normal environment). The temporary sealer input, sealer deployment, diagnostic flag and enabled diagnostic deployment were removed. The original key binding and project build default remain unchanged. Final health and five genuine role checks pass after cleanup.

Current network requests succeed. The invalid protected link, paid-observability 402, input/schema errors and expected role denials are separately identified; none is reported as a network outage. Configured maximum/inactivity Auth lifetime is not established by public settings, SQL access or the supported user-administration credential.
