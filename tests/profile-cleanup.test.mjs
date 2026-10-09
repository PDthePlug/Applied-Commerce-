import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("profile omits evidence, notes and recent activity sections",()=>{
  const profile=read("components/profile-dashboard.tsx");
  assert.match(profile,/Learning progress/);
  assert.doesNotMatch(profile,/Learning evidence|Responses captured|Personal notes|Lesson notes|Learning history|Recent activity|profile-history/);
  assert.match(profile,/profile-identity/);
});

test("learner home keeps the learning action without a duplicate portfolio card",()=>{
  const home=read("components/home-dashboard.tsx");
  assert.match(home,/home-continue-card/);
  assert.match(home,/home-today-status/);
  assert.doesNotMatch(home,/home-portfolio-card|Your portfolio|Open portfolio/);
  assert.match(home,/View the full curriculum/);
});
