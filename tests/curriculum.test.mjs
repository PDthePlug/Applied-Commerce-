import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root=path.resolve("public/curriculum");
const read=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const index=read("index.json");
const meta=(grade)=>index.grades.find(x=>x.grade===grade);
const bundle=(grade)=>{
  const g=meta(grade);
  const encoded=Array.from({length:g.bundleParts},(_,i)=>
    fs.readFileSync(path.join(root,`grade-${grade}.part-${i+1}.b64`),"utf8").trim()
  ).join("");
  return JSON.parse(zlib.gunzipSync(Buffer.from(encoded,"base64")).toString("utf8"));
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

test("source lesson structure is preserved instead of normalized",()=>{
  const g9=meta(9),g12=meta(12);
  assert.equal(g9.terms[1].unitCount,6);
  assert.equal(g12.terms[2].unitCount,12);
});

test("representative lesson content retains authored learning blocks",()=>{
  const g8=bundle(8);
  const l1=g8.terms[0].units.find(u=>u.startLesson===1);
  assert.equal(l1.title,"WHO AM I?");
  assert.ok(l1.blocks.some(b=>b.kind==="text"&&b.type==="activity"));
  assert.ok(l1.blocks.some(b=>b.kind==="text"&&b.type==="portfolio"));
});
