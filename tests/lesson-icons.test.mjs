import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { typescriptModule, runtimeUnits } from "../scripts/semantic-census.mjs";

const iconsUrl=typescriptModule("lib/lesson-icons.ts");
const {lessonHeadingText}=await import(iconsUrl);
const source=ts.transpileModule(fs.readFileSync("components/presentation-system.tsx","utf8"),{
  compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},
}).outputText.replaceAll('"@/lib/lesson-icons"',JSON.stringify(iconsUrl))
  .replaceAll('"react/jsx-runtime"',JSON.stringify(import.meta.resolve("react/jsx-runtime")))
  .replaceAll('"lucide-react"',JSON.stringify(import.meta.resolve("lucide-react")));
const presentation=await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const render=(component,props)=>renderToStaticMarkup(React.createElement(presentation[component],props));

test("book symbols return to each lesson transition beside readable text",()=>{
  for(const [tone,symbol] of [["activity","✍️"],["reflection","💭"],["checkpoint","✅"],["home","🏠"]]){
    const html=render("LearningNotice",{tone,title:"A task"});
    assert.ok(html.includes(symbol),tone);
    assert.match(html,/aria-hidden="true"/);
    assert.match(html,/<h2>A task<\/h2>/);
  }
  assert.match(render("ThinkingEquationNotice",{equation:"Identity = Beliefs + Habits"}),/⬜/);
  assert.match(render("PortfolioCaptureNotice",{}),/📂/);
  assert.match(render("DeepeningInsightPanel",{children:"Deeper idea"}),/💭/);
  assert.match(render("LessonSectionHeading",{title:"A concept"}),/📘/);
});

test("original heading symbols are not doubled and variation selectors are removed together",()=>{
  for(const text of ["✍️ Activity", "✍ Activity", "📘 Activity", "💭 Activity"]){
    assert.equal(lessonHeadingText(text),"Activity");
  }
  const html=render("StoryHeading",{title:"📘 Myah's Morning"});
  assert.equal(html.split("📘").length-1,1);
  assert.match(html,/Myah&#x27;s Morning/);
});

test("checkpoint levels restore the authored meaning without inventing a level",()=>{
  for(const [level,symbol] of [["Remember","🔍"],["Understand","💡"],["Apply","🛠️"],["Analyze","🔬"],["Evaluate","⚖️"],["Create","🌟"],["Analyse","🔬"]]){
    const html=render("LearningNotice",{tone:"checkpoint",title:`Checkpoint (${level})`});
    assert.ok(html.includes(symbol),level);
    assert.ok(html.includes(level));
  }
  const existing=render("LearningNotice",{tone:"checkpoint",title:"✅ Checkpoint (🔬 Analyze)"});
  assert.equal(existing.split("🔬").length-1,1);
  const unlabelled=render("LearningNotice",{tone:"checkpoint",title:"Checkpoint"});
  assert.doesNotMatch(unlabelled,/lesson-level-symbol/);
});

test("icon key explains the seven active learning cues and six learning levels",()=>{
  const html=render("LessonIconKey",{});
  assert.equal((html.match(/<dt>/g)||[]).length,7);
  assert.equal((html.match(/<li>/g)||[]).length,6);
  assert.match(html,/<summary>Lesson icons/);
  assert.doesNotMatch(html,/Tension|Experiment Log/);
});

test("outcome introductions restore the original symbols once beside unchanged text",()=>{
  const text="By the end of this lesson, you will be able to:";
  for(const authored of [false,true]){
    const html=render("LearningOutcomesIntro",{text:authored?`🔍💡🛠️ ${text}`:text,symbols:"🔍💡🛠️"});
    for(const symbol of ["🔍","💡","🛠️"]) assert.equal(html.split(symbol).length-1,1);
    assert.ok(html.includes(text));
    assert.match(html,/aria-hidden="true" data-outcome-icons="true"/);
  }
  assert.doesNotMatch(render("LearningOutcomesIntro",{text}),/data-outcome-icons/);
});

test("source-mapped outcome symbols cover the full Grade 8 term without guessing missing levels",async()=>{
  const metadata=JSON.parse(fs.readFileSync("lib/lesson-outcome-icons.json","utf8"));
  const units=await runtimeUnits();
  const byId=new Map(units.map(unit=>[unit.id,unit]));
  for(const [id,symbols] of Object.entries(metadata.symbolsByUnit)){
    assert.ok(byId.has(id),id);
    assert.match(symbols,/^(?:🔍|💡|🛠️|🔬|⚖️|🌟)+$/u,id);
  }
  for(const unit of units.filter(unit=>unit.grade===8&&unit.term===1)){
    assert.ok(metadata.symbolsByUnit[unit.id],unit.id);
  }
  assert.equal(metadata.symbolsByUnit["g8-t1-l01-001"],"🔍💡🛠️");
  assert.equal(metadata.symbolsByUnit["g8-t1-l02-002"],"🔍💡🛠️");
  assert.equal(metadata.symbolsByUnit["g8-t1-l20-020"],"⚖️🌟");
  for(const id of metadata.unmatchedIntroductions) assert.equal(metadata.symbolsByUnit[id],undefined);
});
