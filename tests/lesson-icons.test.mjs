import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { typescriptModule } from "../scripts/semantic-census.mjs";

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
