import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>fs.readFileSync(path,"utf8");

test("evidence engine defines the five-year developmental spine",()=>{
  const taxonomy=read("lib/evidence/taxonomy.ts");
  for(const stage of ["self-awareness","agency","strategy","architecture","adult-execution"]){
    assert.match(taxonomy,new RegExp(stage));
  }
});

test("automatic marking exists but requires an authored answer rule",()=>{
  const engine=read("lib/evidence/engine.ts");
  const rules=read("lib/evidence/answer-rules.ts");
  for(const rule of ["presence","exact","number","range"]){
    assert.match(engine,new RegExp('rule.kind==="'+rule+'"'+'|rule:"'+rule+'"|kind:"'+rule+'"'));
  }
  assert.match(engine,/authoredAnswerRule/);
  assert.match(engine,/hasAuthoredRule/);
  assert.match(engine,/slot==="choice".*unscored/);
  assert.match(rules,/AUTHORED_ANSWER_RULES/);
  assert.match(rules,/Deliberately empty until an answer rule is authored and verified/);
});

test("facilitator dashboard is operational and uses real learner records",()=>{
  const workspace=read("components/facilitator-workspace.tsx");
  for(const section of ["overview","learners","review","coverage","reports","rubrics"]){
    assert.match(workspace,new RegExp(section));
  }
  assert.match(workspace,/state\.promptResponses/);
  assert.match(workspace,/buildEvidenceRecords/);
  assert.match(workspace,/buildEvidenceReport/);
  assert.match(workspace,/buildReviewPriorities/);
  assert.match(workspace,/Needs revision/);
  assert.match(workspace,/Verify & next/);
  assert.doesNotMatch(workspace,/illustrative demo data/i);
  assert.doesNotMatch(workspace,/Leap9|Thabo|Naledi|Sipho/);
});

test("facilitator model supports class-scale aggregation without seeded learners",()=>{
  const model=read("lib/facilitator/model.ts");
  assert.match(model,/buildCohortSummary/);
  assert.match(model,/buildDomainCoverage/);
  assert.match(model,/buildTermCoverage/);
  assert.match(model,/buildKindCoverage/);
  assert.match(model,/reviewRate/);
});

test("paused backend is configured as an activation seam rather than a fake live connection",()=>{
  const config=read("lib/backend/config.ts");
  const env=read(".env.example");
  const activation=read("supabase/ACTIVATION.md");
  assert.match(config,/NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE/);
  assert.match(env,/NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE=local/);
  assert.match(activation,/cannot be queried or migrated/i);
  assert.match(activation,/learner → cohort → facilitator → evidence → report/);
});

test("database migration separates definitions records reviews and reports",()=>{
  const sql=read("supabase/migrations/20261008114756_evidence_assessment_engine.sql");
  for(const table of ["evidence_definitions","rubric_templates","rubric_criteria","evidence_records","evidence_reviews","evidence_report_snapshots"]){
    assert.match(sql,new RegExp("create table if not exists public\\."+table));
  }
  assert.match(sql,/enable row level security/);
});
