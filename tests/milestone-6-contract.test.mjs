import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const persistence=fs.readFileSync("lib/supabase/persistence.ts","utf8");
const facilitator=fs.readFileSync("lib/facilitator/supabase-data-source.ts","utf8");
const component=fs.readFileSync("components/facilitator-workspace.tsx","utf8");

test("learner persistence is bound to the governed runtime release",()=>{
  assert.match(persistence,/CURRICULUM_RUNTIME_RELEASE = "ac-runtime-3"/);
  assert.match(persistence,/curriculum_release_id/);
  assert.match(persistence,/onConflict:"learner_id,curriculum_release_id,unit_id"/);
  assert.match(persistence,/onConflict:"learner_id,curriculum_release_id,unit_id,prompt_key"/);
});

test("facilitator data source uses authenticated cohort scope",()=>{
  assert.match(facilitator,/cohort_staff/);
  assert.match(facilitator,/cohort_enrolments/);
  assert.match(facilitator,/curriculum_releases/);
  assert.match(facilitator,/buildEvidenceRecords/);
});

test("facilitator presentation activates the existing Supabase data source",()=>{
  assert.match(component,/useSupabaseFacilitatorWorkspace/);
  assert.match(component,/saveSupabaseFacilitatorReview/);
  assert.match(component,/Shared Supabase cohort/);
  assert.match(component,/LearnersView/);
});
