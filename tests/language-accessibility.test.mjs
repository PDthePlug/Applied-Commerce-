import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root=path.resolve("public/curriculum");
const index=JSON.parse(fs.readFileSync(path.join(root,"index.json"),"utf8"));

function bundle(grade){
  const meta=index.grades.find(item=>item.grade===grade);
  const encoded=Array.from({length:meta.bundleParts},(_,i)=>
    fs.readFileSync(path.join(root,`grade-${grade}.part-${i+1}.b64`),"utf8").trim()
  ).join("");
  return JSON.parse(zlib.gunzipSync(Buffer.from(encoded,"base64")).toString("utf8"));
}

function allText(){
  const values=[];
  for(const grade of [8,9,10,11,12]){
    const data=bundle(grade);
    for(const term of data.terms){
      for(const unit of term.units){
        values.push(unit.title);
        for(const block of unit.blocks){
          if(block.kind==="text") values.push(block.text);
          else for(const row of block.rows) values.push(...row);
        }
      }
    }
  }
  return values.join("\n");
}

const text=allText();

test("plain-language layer removes recurring authorial jargon",()=>{
  for(const phrase of [
    "The Affirmation",
    "The Paradoxical Reversal",
    "Cognitive Squeeze",
    "Anti-Delusion",
    "The Personal Pivot",
    "Launch Clause",
    "Shadow Management",
    "meta-habit",
    "reconnaissance",
  ]) assert.doesNotMatch(text,new RegExp(phrase,"i"));
});

test("internal production notes never reach learners",()=>{
  for(const phrase of [
    "Production Protocol",
    "Ultimate Architectural Map",
    "I have internalized",
    "I am continuing the build",
    "Pride 2.0",
    "original draft",
    "System Architect standard",
  ]) assert.doesNotMatch(text,new RegExp(phrase,"i"));
});

test("digital learner language replaces paper-only framing",()=>{
  assert.match(text,/Key idea:/);
  assert.match(text,/Here’s the tension:/);
  assert.match(text,/Your Next Step:/);
  assert.match(text,/Reality Check/);
  assert.match(text,/Launch Commitment/);
  assert.match(text,/fact-finding/);
  assert.doesNotMatch(text,/HOW TO USE THIS BOOK/i);
  assert.doesNotMatch(text,/an Reality Check/i);
  assert.doesNotMatch(text,/Here’s the tension:\s*here is/i);
});

test("lesson structure remains unchanged after the language pass",()=>{
  const expected={
    8:[20,20,20,20],
    9:[16,18,20,21],
    10:[16,20,22,22],
    11:[20,20,20,20],
    12:[20,20,20,20],
  };
  for(const grade of index.grades){
    assert.deepEqual(grade.terms.map(term=>term.unitCount),expected[grade.grade]);
  }
});