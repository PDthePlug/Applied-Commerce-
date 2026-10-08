# Applied Commerce Milestone 2 — Production Certification Record

**Status:** certified for production learner authentication and durable persistence  
**Date:** 8 October 2026  
**Production deployment:** `dpl_FPXZhwsG9eGPfyPyRMdrvUxZNSMz`  
**Application commit:** `5507e24d7b265d3ccfab284781b1db33d72176ed`

## Certification result

Milestone 2 authenticated learner persistence has passed the controlled production acceptance gate.

The live product was tested after production Supabase Auth configuration was enabled. A controlled learner account was created through the real product and used to verify authentication and recovery behaviour.

### Live acceptance evidence

The following behaviours were observed in the production learner journey:

- account creation succeeds;
- valid sign-in succeeds;
- invalid credentials are rejected and do not enter the learner account;
- authenticated learner answers remain available after moving to a different device;
- the same learner record is recovered on the second device after sign-in;
- an isolated/incognito browser starts without the authenticated session and requires sign-in;
- the recovered answers remain linked to the authenticated learner rather than the original browser/device.

This is the required end-to-end proof that learner state can travel beyond one browser while unauthenticated sessions remain separated from the account.

## Database/security evidence

The production AC Supabase schema was reconciled before application rollout. Repository-managed migrations are applied, RLS is enabled on the private learner/evidence/assessment/audit surfaces, and the foundation smoke suite passed the required policy/constraint assertions.

Supabase security advisors reported no security lints during the Milestone 2 database certification.

The live product test above validates application-level authentication and recovery. It does **not** constitute a fabricated claim of a separate two-account adversarial RLS test; RLS certification remains grounded in the actual schema/policy smoke tests recorded in the reconciliation document.

## Production deployment

The certified Vercel production deployment is:

- Deployment: `dpl_FPXZhwsG9eGPfyPyRMdrvUxZNSMz`
- Commit: `5507e24d7b265d3ccfab284781b1db33d72176ed`
- Branch: `main`
- State: READY
- Target: production

The production aliases resolve to this deployment.

## Production Auth configuration

The following public Supabase client configuration is enabled for:

- production;
- preview;
- development.

Secrets are not documented in source control.

The production configuration is therefore no longer in the temporary certification-disabled state.

## Rollout decision

Production learner persistence is enabled.

The local-first learning-store behaviour remains intentionally retained as a compatibility and resilience layer. Remote reconciliation is authenticated and durable; local state is not removed merely because cloud persistence is available.

No destructive migration, content identity rewrite, or curriculum-source provenance claim was introduced as part of this rollout.

## Rollback target

The immediately preceding known-good production deployment remains the rollback reference documented during Milestone 2 execution. Application rollback should use the prior known-good Vercel deployment/commit rather than attempting a destructive database rollback.

## Remaining work after Milestone 2

Milestone 2's durable learner foundation is now considered complete. Subsequent work may address institution/educator dashboards, advanced reporting, analytics, or other product capabilities, subject to a new milestone plan.

Do not treat this certification as evidence that canonical curriculum manuscripts are now repository-governed; that source-governance boundary remains unchanged.
