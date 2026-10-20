import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {runtimeUnits}from '../scripts/semantic-census.mjs';import {digest,inspectLesson}from '../scripts/classroom-inventory.mjs';
const inventory=JSON.parse(fs.readFileSync('docs/classroom/educational-inventory.json'));const catalog=JSON.parse(fs.readFileSync('content/instructional/catalog.v1.json'));const lock=JSON.parse(fs.readFileSync('content/instructional/source-lock.v1.json'));const manifest=JSON.parse(fs.readFileSync('content/instructional/benchmark-manifest.v1.json'));const units=await runtimeUnits();
test('reference screening distinguishes legal/financial terms from ordinary future tense and interpersonal trust',()=>{
 const unit={id:'synthetic',grade:8,term:1,startLesson:1,title:'Synthetic',blocks:[{kind:'text',type:'paragraph',id:'a',text:'We will discuss trust between friends.'}]};
 assert.ok(!inspectLesson(unit,null,null).educationalFindings.some(f=>f.code==='CURRENT_REFERENCE_REVIEW'));
 unit.blocks[0].text='The fictional character will ask someone this week.';assert.equal(inspectLesson(unit,null,null).educationalFindings.find(f=>f.code==='OUTSIDE_PERIOD_ACTION').classification,'review-candidate');
 unit.blocks[0].text='Check the current SARS tax threshold before using the figure.';assert.ok(inspectLesson(unit,null,null).educationalFindings.some(f=>f.code==='CURRENT_REFERENCE_REVIEW'));
});
test('educational inventory covers all 395 existing lesson identities and four assessments exactly once',()=>{
 const lessons=units.filter(u=>u.type==='lesson');assert.equal(inventory.lessons.length,395);assert.equal(new Set(inventory.lessons.map(l=>l.lessonId)).size,395);assert.deepEqual(inventory.lessons.map(l=>l.lessonId),lessons.map(l=>l.id));assert.deepEqual(inventory.assessments.map(a=>a.id),units.filter(u=>u.type==='assessment').map(u=>u.id));assert.deepEqual([8,9,10,11,12].map(g=>lessons.filter(l=>l.grade===g).length),[80,75,80,80,80]);
});
test('all inventory concepts and objectives cite actual authored blocks rather than inferred titles',()=>{
 for(const row of inventory.lessons){const unit=units.find(u=>u.id===row.lessonId);assert.equal(row.sourceUnitSHA256,digest(unit));assert.equal(row.originalTitle,unit.title);assert.ok(unit.blocks.some(b=>b.id===row.mainConcept.blockId&&b.kind==='text'&&b.text===row.mainConcept.text));for(const goal of row.learningObjectives)assert.ok(unit.blocks.some(b=>b.id===goal.blockId&&b.kind==='text'&&b.text===goal.text));assert.ok(row.classroomRequirements.length>=2);assert.ok(row.prerequisiteReview.status.includes('diagnostic'));}
 assert.deepEqual(inventory.lessons.filter(l=>!l.learningObjectives.length).map(l=>l.lessonId),['g10-t4-l78-074','g10-t4-l79-075','g10-t4-l80-076']);
});
test('source books, runtime content and stable unit/block identities remain unchanged from the milestone baseline',()=>{
 for(const file of [...lock.sourceBooks,...lock.runtimeFiles])assert.equal(digest(fs.readFileSync(file.path)),file.sha256,file.path);
 for(const row of lock.unitFingerprints)assert.equal(digest(units.find(u=>u.id===row.id)),row.sha256,row.id);
 // The reader resolver normalizes 24 raw source blocks; raw bundle count is
 // independently checked by verify:runtime. Both representations are locked.
 assert.equal(units.reduce((n,u)=>n+u.blocks.length,0),20742);
});
test('all duration estimates are explicit provisional periods and continuity follows the actual programme sequence',()=>{
 inventory.lessons.forEach((row,index)=>{assert.ok([1,2].includes(row.anticipatedClassroomDuration.periods));assert.equal(row.anticipatedClassroomDuration.minutes,row.anticipatedClassroomDuration.periods*45);assert.ok(/pilot|review/.test(row.anticipatedClassroomDuration.status));assert.equal(row.continuity.previous?.id??null,inventory.lessons[index-1]?.lessonId??null);assert.equal(row.continuity.next?.id??null,inventory.lessons[index+1]?.lessonId??null);});
});
test('five private benchmark manifests link to existing lessons, validated source references and seven 45-minute periods',()=>{
 assert.equal(manifest.guides.length,5);assert.equal(new Set(manifest.guides.map(g=>g.grade)).size,5);assert.equal(manifest.guides.reduce((n,g)=>n+g.periods.length,0),7);
 for(const guide of manifest.guides){const unit=units.find(u=>u.id===guide.lessonId);const entry=catalog.find(c=>c.id===guide.lessonId);assert.equal(guide.sourceUnitSHA256,digest(unit));assert.ok(entry.benchmark);assert.equal(guide.originalTitle,unit.title);for(const ref of guide.sourceReferences)assert.ok(unit.blocks.some(b=>b.id===ref.blockId));for(const period of guide.periods){assert.equal(period.minutes,45);assert.equal(period.stageMinutes.reduce((a,b)=>a+b,0),45);}assert.ok(guide.objectiveCount>=3);assert.ok(guide.discussionCount>=2);assert.ok(guide.understandingCheckCount>=2);assert.equal(guide.qualityCheckCount,10);assert.equal(guide.humanReviewStatus,'human-educator-review-required');}
});
