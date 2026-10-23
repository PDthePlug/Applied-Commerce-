# Staging connectivity and capabilities — 23 October 2026

Target: **inxshlumnhcgiahxqewe**, Applied Commerce Staging, eu-west-1. No production data or credentials were used.

| Boundary | Observed capability |
| --- | --- |
| Published implementation | PR #43 and #44 remain open drafts. PR #44 head was `3cee79c1fbc9e755b5715ef8da2e1a67deafda19`, application `bdf4322`. Follow-up branch starts there and merges current main `c8704e3` to preserve accepted icons/outcome symbols and checkpoint numbering. No abandoned milestone was recovered or consulted. |
| Website backend | Vercel project **applied-commerce-sa-staging**, `prj_9MXnYeh3mxtFzcS1xzEDrTjOW2nP`, team `team_0F7XVax56npxBWgjVdXMJj3V`. Configured Supabase mode, staging URL and publishable key. Existing sensitive classroom key remains bound server-side; it was neither retrieved nor changed. |
| Alias state on arrival | Latest alias served main `c8704e3`, which predates unmerged classroom work. Genuine initial checks instead used PR #44 deployment `applied-commerce-sa-staging-iki6enora.vercel.app` at application `bdf4322`. |
| Coding environment | Public URL/key, target ref, private SUPABASE_SECRET_KEY and AC_ROLE_FIXTURES path are present. Backend mode initially **local**, deliberately different from hosted staging. Chromium is installed at the configured executable path. |
| Credential readiness report | Managed-runtime status reports connected/running but individual variables/secrets and network enforcement remain **unknown**, not ready. Successful real requests below independently establish the capabilities actually exercised. |
| HTTPS network | Runtime policy snapshot is unrestricted, VPN false; no TCP domain/IP grants. Initial Node requests failed ECONNREFUSED because they did not use the inherited proxy. With **NODE_USE_ENV_PROXY=1** on Node 24, Auth settings returned 200 and Auth Admin listing returned 200. TLS verification was retained. |
| Public API | Auth settings 200. Anonymous has_active_session RPC returned 401 / 42501 (permission denied), an application/database permission boundary, not bad-key or network failure. Authenticated Data API and RPC requests subsequently succeed under genuine sessions. |
| Database administration | Supabase connector Primary reaches the staging database. Read schema/policies/functions and one scoped insert into the private platform-admin registry for the synthetic account. No direct database URL is configured; no raw TCP/psql connectivity is claimed. |
| Supported Auth administration | Privately injected SUPABASE_SECRET_KEY successfully created six confirmed synthetic users through POST /auth/v1/admin/users. No password hashes or Auth-table inserts were used. |
| Application identity and permissions | Real password sessions, server active-session validation, registry/admin authority, cohort assignments and institution permissions were exercised separately. Supabase administration alone was never treated as an educator login. |
| Deployment protection | Vercel SSO remains enabled. Temporary authenticated share links are stored only in the protected fixture directory and used before browser password login. Passing deployment protection does not establish an application role. |

Read-only inspection found all **22 public tables have RLS enabled**. Private has_active_session joins the actual JWT session ID to Auth sessions/users and an active profile, checks not_after/deletion/bans, and is used by restrictive policies. Learner visibility/review functions check current assignments or institution owner/admin membership; user-editable metadata is not used for teacher authorisation. The API checks getUser, active session and current role before importing private content, and returns private/no-store with Cookie/Authorization variation.

Supported synthetic writes: Auth Admin user creation; one private registry row; dedicated institution/cohort/membership/enrolment provisioning through real administrator sessions; synthetic answers, notes, completion, reviews and preferences; controlled assignment revocation/restoration. No schema, RLS, migration, production architecture or production learner-record changes.

Security advisor returned one existing warning: leaked-password protection disabled ([Supabase guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)). It was not changed as part of classroom implementation. No missing-RLS advisor finding was returned.

Local setup: the prescribed setup script installed dependencies but could not escalate to install OS browser packages (`su: Authentication failure`). The configured system Chromium successfully ran browser tests. No TLS bypass was used. A Python invocation through unittest initially lacked the scripts import path; direct `python scripts/test_block_identity.py` passed both identity tests.
