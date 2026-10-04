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

test("deterministic auto-marking requires explicit rule types",()=>{
  const engine=read("lib/evidence/engine.ts");
  for(const rule of ["presence","exact","number","range"]){
    assert.match(engine,new RegExp('rule.kind==="'+rule+'"'+'|rule:"'+rule+'"|kind:"'+rule+'"'));
  }
  assert.match(engine,/does not|Correct|Check again|Captured/);
});

test("facilitator workspace uses real learner prompt responses",()=>{
  const workspace=read("components/facilitator-workspace.tsx");
  assert.match(workspace,/state\.promptResponses/);
  assert.match(workspace,/buildEvidenceRecords/);
  assert.match(workspace,/buildEvidenceReport/);
  assert.doesNotMatch(workspace,/illustrative demo data/i);
});

test("database migration separates definitions records reviews and reports",()=>{
  const sql=read("supabase/migrations/20261004193000_evidence_assessment_engine.sql");
  for(const table of ["evidence_definitions","rubric_templates","rubric_criteria","evidence_records","evidence_reviews","evidence_report_snapshots"]){
    assert.match(sql,new RegExp("create table if not exists public\\."+table));
  }
  assert.match(sql,/enable row level security/);
});
