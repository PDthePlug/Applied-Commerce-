import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root=path.resolve("public/curriculum");
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const index=read("index.json");
const meta=(grade)=>index.grades.find(x=>x.grade===grade);
const inflate=(encoded)=>JSON.parse(zlib.gunzipSync(Buffer.from(encoded,"base64")).toString("utf8"));
const bundle=(grade)=>{
  const g=meta(grade);
  const encoded=Array.from({length:g.bundleParts},(_,i)=>
    fs.readFileSync(path.join(root,`grade-${grade}.part-${i+1}.b64`),"utf8").trim()
  ).join("");
  const result=inflate(encoded);

  for(const patchMeta of g.patches??[]){
    const patchEncoded=patchMeta.parts.map(part=>
      fs.readFileSync(path.join(root,part),"utf8").trim()
    ).join("");
    const patch=inflate(patchEncoded);
    assert.equal(patch.grade,grade);
    assert.equal(patch.term,patchMeta.term);

    const term=result.terms.find(x=>x.term===patch.term);
    assert.ok(term);
    const patchedLessonNumbers=new Set(
      patch.units.filter(u=>u.type==="lesson"&&typeof u.startLesson==="number").map(u=>u.startLesson)
    );
    term.units=[
      ...term.units.filter(u=>!(
        u.type==="lesson" &&
        typeof u.startLesson==="number" &&
        patchedLessonNumbers.has(u.startLesson)
      )),
      ...patch.units,
    ].sort((a,b)=>{
      const typeOrder=(a.type==="lesson"?0:1)-(b.type==="lesson"?0:1);
      if(typeOrder) return typeOrder;
      const lessonOrder=(a.startLesson??Number.MAX_SAFE_INTEGER)-(b.startLesson??Number.MAX_SAFE_INTEGER);
      if(lessonOrder) return lessonOrder;
      return a.position-b.position;
    });
    term.units.forEach((unit,index)=>{ unit.position=index; });
  }

  return result;
};

test("curriculum contains Grades 8 through 12",()=>{
  assert.deepEqual(index.grades.map(x=>x.grade),[8,9,10,11,12]);
});

test("every grade has four source-driven terms",()=>{
  for(const g of [8,9,10,11,12]){
    const x=bundle(g);
    assert.equal(x.terms.length,4);
    assert.deepEqual(x.terms.map(t=>t.term),[1,2,3,4]);
  }
});

test("index counts match generated grade bundles",()=>{
  for(const g of index.grades){
    const b=bundle(g.grade);
    const lessonCounts=b.terms.map(t=>t.units.filter(u=>u.type==="lesson").length);
    const assessmentCounts=b.terms.map(t=>t.units.filter(u=>u.type==="assessment").length);
    assert.equal(lessonCounts.reduce((a,n)=>a+n,0),g.unitCount);
    assert.deepEqual(lessonCounts,g.terms.map(t=>t.unitCount));
    assert.deepEqual(assessmentCounts,g.terms.map(t=>t.assessmentCount));
  }
});

test("source lesson structure is preserved with the Grade 9 Term 2 correction",()=>{
  const g9=meta(9),g12=meta(12);
  assert.equal(g9.terms[1].unitCount,18);
  assert.equal(g12.terms[2].unitCount,20);

  const term2=bundle(9).terms.find(t=>t.term===2);
  const lessonNumbers=term2.units.filter(u=>u.type==="lesson").map(u=>u.startLesson);
  assert.deepEqual(lessonNumbers,Array.from({length:18},(_,i)=>17+i));
});

test("Grade 9 Term 2 restored lessons retain the supplied source content",()=>{
  const term2=bundle(9).terms.find(t=>t.term===2);
  const lesson23=term2.units.find(u=>u.type==="lesson"&&u.startLesson===23);
  const lesson34=term2.units.find(u=>u.type==="lesson"&&u.startLesson===34);
  assert.equal(lesson23.title,"MAPPING MY COMMUNITY'S MONEY — PROJECT LAUNCH");
  assert.equal(lesson34.title,"LETTER TO MY FUTURE SELF — TERM 2");
  assert.ok(lesson23.blocks.length>0);
  assert.ok(lesson34.blocks.length>0);
});

test("representative lesson content retains authored learning blocks",()=>{
  const g8=bundle(8);
  const l1=g8.terms[0].units.find(u=>u.startLesson===1);
  assert.equal(l1.title,"WHO AM I?");
  assert.ok(l1.blocks.some(b=>b.kind==="text"&&b.type==="activity"));
  assert.ok(l1.blocks.some(b=>b.kind==="text"&&b.type==="portfolio"));
});


test("checkpoint books have continuous unique lessons and all Grade 9 exams",()=>{
  for(const grade of [8,9,10,11,12]){
    const data=bundle(grade);
    const units=data.terms.flatMap(term=>term.units);
    const lessons=units.filter(unit=>unit.type==="lesson");
    assert.deepEqual(lessons.map(unit=>unit.startLesson),Array.from({length:grade===9?75:80},(_,i)=>i+1));
    assert.equal(new Set(units.map(unit=>unit.id)).size,units.length);
    for(const unit of lessons) assert.ok(unit.blocks.length>0,unit.id);
  }
  assert.deepEqual(bundle(9).terms.map(t=>t.units.filter(u=>u.type==="assessment").length),[1,1,1,1]);
});

test("existing lesson and assessment identities survive the source rebuild",()=>{
  const ids=JSON.parse(fs.readFileSync("scripts/curriculum-unit-ids.json","utf8"));
  for(const grade of [8,9,10,11,12]){
    for(const term of bundle(grade).terms){
      for(const unit of term.units){
        const key=unit.type==="lesson"?`${grade}:lesson:${unit.startLesson}`:`${grade}:assessment:${term.term}`;
        if(ids[key]) assert.equal(unit.id,ids[key],key);
      }
    }
  }
});

test("new workshops and clinics contain practical evidence and checkpoint prompts",()=>{
  for(const [grade,start,end] of [[10,70,74],[12,53,60]]){
    const lessons=bundle(grade).terms.flatMap(t=>t.units).filter(u=>u.type==="lesson"&&u.startLesson>=start&&u.startLesson<=end);
    assert.equal(lessons.length,end-start+1);
    for(const lesson of lessons){
      assert.ok(lesson.blocks.some(b=>b.kind==="text"&&b.type==="activity"),lesson.id);
      assert.ok(lesson.blocks.some(b=>b.kind==="text"&&b.type==="checkpoint"),lesson.id);
      assert.ok(lesson.blocks.some(b=>b.kind==="text"&&/evidence/i.test(b.text)),lesson.id);
    }
  }
});
