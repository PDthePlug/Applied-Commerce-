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
