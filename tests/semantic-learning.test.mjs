import test from "node:test";
import assert from "node:assert/strict";
import {runtimeUnits,typescriptModule} from "../scripts/semantic-census.mjs";

const {learningSections,choiceMeaning,authoredScale,valueSelection,sourceCopy}=await import(typescriptModule("lib/semantic-learning.ts"));
const {persistResponseKey,responseView}=await import(typescriptModule("lib/response-identity.ts"));
const units=await runtimeUnits();
const lesson=(grade,number)=>units.find(unit=>unit.grade===grade&&unit.startLesson===number&&unit.type==="lesson");

test("all 395 lessons and four assessments have complete, immutable semantic coverage",()=>{
  assert.equal(units.filter(unit=>unit.type==="lesson").length,395);
  assert.equal(units.filter(unit=>unit.type==="assessment").length,4);
  for(const unit of units){
    const before=JSON.stringify(unit);
    const sections=learningSections(unit.blocks,unit.type);
    assert.deepEqual(sections.flatMap(section=>Array.from({length:section.end-section.start},(_,i)=>section.start+i)),unit.blocks.map((_,index)=>index),unit.id);
    assert.equal(new Set(sections.map(section=>section.anchor)).size,sections.length,unit.id);
    assert.equal(JSON.stringify(unit),before,unit.id);
    assert.ok(unit.blocks.every(block=>block.id),unit.id);
    if(unit.type==="assessment") assert.ok(sections.every(section=>section.mode==="prove"));
  }
});

test("ranking needs an explicit instruction, and ordinary choices keep their meaning",()=>{
  assert.equal(choiceMeaning("☐ Life insurance ☐ Funeral cover","Rank these types of insurance (1 = most important)").kind,"ranking");
  assert.equal(choiceMeaning("Am I on track? ☐ Yes ☐ No ☐ Mostly").kind,"single");
  assert.equal(choiceMeaning("☐ I have my ID ☐ I have a plan").kind,"multiple");
  assert.equal(choiceMeaning("Which are useful? ☐ Savings ☐ Insurance").kind,"multiple","question mark alone cannot imply one choice");
  assert.equal(choiceMeaning("Rank is just a word in this story."),null);
});

test("source scales are bounded and numeric blanks retain their authored units",()=>{
  assert.deepEqual(authoredScale("Rating (1–5)"),{min:1,max:5});
  assert.deepEqual(authoredScale("Current Use (1-5)"),{min:1,max:5});
  assert.equal(authoredScale("Age"),null);
  assert.equal(authoredScale("Money (1–1000)"),null);
  assert.equal(sourceCopy("_______%"),"_______%");
});

test("Grade 9 values selection derives options and narrowing from the authored tasks",()=>{
  const blocks=lesson(9,2).blocks;
  const first=valueSelection(blocks,28),second=valueSelection(blocks,30),third=valueSelection(blocks,32);
  assert.equal(first.count,5);
  assert.equal(first.allowCustom,true);
  assert.deepEqual(first.options,["Family","Freedom","Security","Creativity","Community","Learning","Justice","Adventure","Stability","Connection"]);
  assert.equal(second.count,3);assert.equal(second.fromIndex,28);
  assert.equal(third.count,1);assert.equal(third.fromIndex,30);
  assert.equal(valueSelection(blocks,36),null,"sacrifice stays an authored written response");
});

test("OR does not drop checkpoint context and equations stay instructional",()=>{
  const blocks=lesson(8,2).blocks;
  const checkpoint=learningSections(blocks).find(section=>section.context==="checkpoint");
  assert.ok(checkpoint.start<54&&checkpoint.end>60);
  assert.equal(learningSections(blocks).find(section=>section.start===17).mode,"understand");
});

test("native controls reuse stable answer slots across reopening and source insertion",()=>{
  for(const [grade,number,index,slot,value] of [[9,2,28,"blank-0","Family\nSecurity\nJustice\nLearning\nFreedom"],[10,46,24,"choice","Funeral cover\nLife insurance"],[11,22,30,"table-1-1","4"]]){
    const unit=lesson(grade,number);
    const key=persistResponseKey(unit.id,unit.blocks,`${unit.id}::block-${index}::${slot}`);
    const reordered=[{id:"inserted-explanation",kind:"text",type:"paragraph",text:"Explanation"},...unit.blocks];
    const reopened=responseView(unit.id,reordered,{[key]:value});
    assert.equal(reopened[`${unit.id}::block-${index+1}::${slot}`],value);
    assert.equal(persistResponseKey(unit.id,reordered,`${unit.id}::block-${index+1}::${slot}`),key);
  }
});
