import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("shared learner presentation system is wired into lessons",()=>{
  const blocks=read("components/content-blocks.tsx");
  const system=read("components/presentation-system.tsx");
  assert.match(blocks,/DeepeningInsightPanel/);
  assert.match(blocks,/LearningNotice/);
  assert.match(blocks,/PortfolioCaptureNotice/);
  assert.match(blocks,/ResponseSurface/);
  assert.match(system,/This work is added to your portfolio automatically/);
});

test("profile is part of the learner shell",()=>{
  const shell=read("components/app-shell.tsx");
  const profile=read("components/profile-dashboard.tsx");
  assert.match(shell,/href:"\/profile"/);
  assert.match(profile,/Your Applied Commerce learning record/);
  assert.ok(fs.existsSync("app/profile/page.tsx"));
});

test("book-era platform language does not leak into product chrome",()=>{
  const files=[
    "components/home-dashboard.tsx",
    "components/learn-library.tsx",
    "components/grade-map.tsx",
    "components/grade-card.tsx",
    "components/portfolio-dashboard.tsx",
    "components/progress-dashboard.tsx",
    "components/lesson-reader.tsx",
  ].map(read).join("\n");
  assert.doesNotMatch(files,/learner books become/i);
  assert.doesNotMatch(files,/supplied learner books/i);
  assert.doesNotMatch(files,/lesson pages/i);
  assert.doesNotMatch(files,/detected in source/i);
  assert.doesNotMatch(files,/handbook marks work/i);
});

test("known screenshot regressions remain covered by interaction rules",()=>{
  const blocks=read("components/content-blocks.tsx");
  assert.match(blocks,/INTERROGATIVE_RE/);
  assert.match(blocks,/PART_HEADING_RE/);
  assert.match(blocks,/headerOnly/);
  assert.match(blocks,/Add another row/);
  assert.match(blocks,/block\.text\.includes\("☐"\)/);
  assert.match(blocks,/Captured/);
});

test("center menu keeps five learner destinations and accessible dialog behavior",()=>{
  const shell=read("components/app-shell.tsx");
  for(const href of ["/","/learn","/portfolio","/progress","/profile"]){
    assert.match(shell,new RegExp(`href:"${href.replaceAll("/","\\/")}"`));
  }
  assert.match(shell,/aria-haspopup="dialog"/);
  assert.match(shell,/event\.key!=="Tab"/);
});

test("home is a learner welcome dashboard, not a duplicated curriculum index",()=>{
  const home=read("components/home-dashboard.tsx");
  assert.match(home,/Good to see you/);
  assert.match(home,/Welcome to Applied Commerce/);
  assert.match(home,/Pick up where you left off/);
  assert.match(home,/View the full curriculum/);
  assert.doesNotMatch(home,/Choose where you are learning/);
  assert.doesNotMatch(home,/grade-section/);
  assert.doesNotMatch(home,/GradeCard/);
});

test("thinking equation notices do not promote ordinary narrative into banners",()=>{
  const blocks=read("components/content-blocks.tsx");
  const presentation=read("components/presentation-system.tsx");
  const compiler=read("scripts/compile_curriculum.py");
  assert.match(blocks,/isEquationMarker/);
  assert.match(blocks,/equation-reference/);
  assert.match(blocks,/ThinkingEquationNotice/);
  assert.match(presentation,/thinking-equation-notice/);
  assert.doesNotMatch(compiler,/'THINKING EQUATION' in u/);
  assert.match(compiler,/re\.fullmatch\(r'THINKING EQUATION'/);
});

test("home adopts BIS Today hierarchy without a giant enclosing hero card",()=>{
  const home=read("components/home-dashboard.tsx");
  assert.match(home,/home-today-hero/);
  assert.match(home,/Good to see you/);
  assert.match(home,/home-today-status/);
  assert.match(home,/home-dashboard-grid/);
  assert.match(home,/Continue your learning/);
  assert.doesNotMatch(home,/className="hero home-dashboard-hero"/);
  assert.doesNotMatch(home,/hero-metrics/);
});


test("formal assessment units render real response controls",()=>{
  const blocks=read("components/content-blocks.tsx");
  const reader=read("components/lesson-reader.tsx");
  assert.match(reader,/unitType=\{unit\.type\}/);
  assert.match(blocks,/unitType==="assessment"/);
  assert.match(blocks,/parseAssessmentChoices/);
  assert.match(blocks,/assessmentSubparts/);
  assert.match(blocks,/AssessmentMultipleChoice/);
  assert.match(blocks,/assessment-response-/);
  assert.match(blocks,/type="radio"/);
});

test("compact facilitator navigation uses the centered menu instead of a horizontal rail",()=>{
  const workspace=read("components/facilitator-workspace.tsx");
  const styles=read("app/evidence.css");
  assert.match(workspace,/fac-menu-trigger/);
  assert.match(workspace,/fac-menu-sheet/);
  assert.match(workspace,/aria-haspopup="dialog"/);
  assert.match(styles,/\.fac-menu-trigger/);
  assert.match(styles,/@media\(max-width:860px\)/);
  assert.match(styles,/\.fac-sidebar\{display:none!important\}/);
});


test("presentation architecture v2 preserves semantic hierarchy and mobile table meaning",()=>{
  const blocks=read("components/content-blocks.tsx");
  const system=read("components/presentation-system.tsx");
  const reader=read("components/lesson-reader.tsx");
  const styles=read("app/presentation.css");
  assert.match(system,/StoryHeading/);
  assert.match(system,/ResponseTone/);
  assert.match(system,/response-surface-\$\{tone\}/);
  assert.match(blocks,/responsive-row-table/);
  assert.match(blocks,/<thead>/);
  assert.match(blocks,/scope="col"/);
  assert.match(blocks,/data-label=\{dataLabel\}/);
  assert.match(reader,/data-presentation-contract="applied-commerce-v2"/);
  assert.match(reader,/aria-current=\{u\.id===unitId\?"page":undefined\}/);
  assert.match(reader,/role="progressbar"/);
  assert.match(styles,/\.responsive-row-table tbody td::before/);
  assert.ok(fs.existsSync("docs/APPLIED_COMMERCE_PRESENTATION_ARCHITECTURE_V2.md"));
});


test("account creation confirms both email and password and keeps role assignment separate",()=>{
  const auth=read("components/auth-panel.tsx");
  assert.match(auth,/Confirm email address/);
  assert.match(auth,/Confirm password/);
  assert.match(auth,/email\.trim\(\)\.toLowerCase\(\) !== confirmEmail\.trim\(\)\.toLowerCase\(\)/);
  assert.match(auth,/password !== confirmPassword/);
  assert.match(auth,/creating an account does not grant staff permissions/i);
});

test("account access has Applied Commerce identity and explains role-specific workspaces",()=>{
  const page=read("app/auth/page.tsx");
  const styles=read("app/auth.css");
  assert.match(page,/Learning & evidence platform/);
  assert.match(page,/Learner workspace/);
  assert.match(page,/Facilitator workspace/);
  assert.match(page,/Workspace administration/);
  assert.match(page,/Explore Workspace/);
  assert.match(styles,/\.auth-story/);
  assert.match(styles,/@media\(max-width:560px\)/);
});

test("primary navigation labels the institutional destination Workspace",()=>{
  const shell=read("components/app-shell.tsx");
  assert.match(shell,/<Link className="topbar-institution-link" href="\/institutions">Workspace<\/Link>/);
  assert.doesNotMatch(shell,/<Link className="topbar-institution-link" href="\/institutions">For institutions<\/Link>/);
});

test("legacy auth profile repair is additive and does not assign application roles",()=>{
  const migration=read("supabase/migrations/20261009190500_backfill_missing_auth_profiles.sql");
  assert.match(migration,/from auth\.users u/);
  assert.match(migration,/where coalesce\(u\.is_anonymous, false\) = false/);
  assert.match(migration,/on conflict \(id\) do nothing/);
  assert.match(migration,/does not grant any learner, facilitator, institution or admin role/i);
});


test("platform-admin learning evidence sync respects exclusive operating roles",()=>{
  const persistence=read("lib/supabase/persistence.ts");
  assert.match(persistence,/supabase\.rpc\("is_platform_admin"\)/);
  assert.match(persistence,/if\(!adminResult\.data\)/);
  assert.match(persistence,/Platform administrators are intentionally excluded from the learner role/);
  assert.match(persistence,/from\("prompt_responses"\)\.upsert\(promptRows/);
  assert.match(persistence,/from\("lesson_progress"\)\.upsert\(progressRows/);\n  assert.match(persistence,/from\("lesson_notes"\)\.upsert\(noteRows,\{onConflict:"learner_id,curriculum_version,unit_id"\}\)/);
});
