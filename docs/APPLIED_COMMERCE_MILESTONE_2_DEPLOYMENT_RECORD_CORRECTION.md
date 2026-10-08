# Applied Commerce — Milestone 2 Deployment Record Correction

**Date:** 8 October 2026

The Milestone 2 certification record correctly captures the learner acceptance evidence, but its deployment wording needs one clarification.

The controlled learner acceptance was performed against the READY production deployment associated with application commit `5507e24d7b265d3ccfab284781b1db33d72176ed`.

After that acceptance, a documentation-only commit `f5ba26aaa35124a32fe0a8d37bc8f0603310b332` was deployed to production as a new READY deployment.

Therefore:

- **Live-tested application deployment:** `dpl_FPXZhwsG9eGPfyPyRMdrvUxZNSMz`
- **Live-tested application commit:** `5507e24d7b265d3ccfab284781b1db33d72176ed`
- **Later documentation deployment:** `dpl_3PcjHGdbqeSjhmkZxo6dZmVMYrEC`
- **Later documentation commit:** `f5ba26aaa35124a32fe0a8d37bc8f0603310b332`
- Both deployments were reported READY and targeted at production when inspected for Milestone 3.

The distinction matters: the learner acceptance evidence belongs to the first deployment. The later documentation deployment should not be described as independently browser-tested unless that test is performed.

This correction does not invalidate the Milestone 2 learner acceptance. It makes the release record precise before Milestone 3 work proceeds.
