import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root=path.resolve("public/curriculum");
const index=JSON.parse(fs.readFileSync(path.join(root,"index.json"),"utf8"));
const ids=new Set();
const report={ok:true,grades:[],outliers:[],totals:{units:0,blocks:0,stableBlockIdentities:0,families:{}}};

function fail(message){throw new Error(message)}
function addFamily(key){report.totals.families[key]=(report.totals.families[key]||0)+1}
function family(block){return block.kind==="table"?"table":block.type||"unknown"}
function textLength(block){return block.kind==="text"?block.text.replace(/<[^>]+>/g,"").trim().length:0}

for(const meta of index.grades){
 const files=Array.from({length:meta.bundleParts},(_,i)=>path.join(root,"grade-"+meta.grade+".part-"+(i+1)+".b64"));
 const encoded=files.map(file=>fs.readFileSync(file,"utf8").trim()).join("");
 let bundle=JSON.parse(zlib.gunzipSync(Buffer.from(encoded,"base64")).toString("utf8"));
 for(const patchMeta of meta.patches??[]){
  const patchEncoded=patchMeta.parts.map(part=>fs.readFileSync(path.join(root,part),"utf8").trim()).join("");
  const patch=JSON.parse(zlib.gunzipSync(Buffer.from(patchEncoded,"base64")).toString("utf8"));
  if(patch.grade!==meta.grade||patch.term!==patchMeta.term)fail("Invalid patch metadata for Grade "+meta.grade+" Term "+patchMeta.term);
  const term=bundle.terms.find(item=>item.term===patch.term);
  if(!term)fail("Missing patched term "+meta.grade+"-"+patch.term);
  const patchedLessonNumbers=new Set(patch.units.filter(u=>u.type==="lesson"&&typeof u.startLesson==="number").map(u=>u.startLesson));
  term.units=[...term.units.filter(u=>!(u.type==="lesson"&&typeof u.startLesson==="number"&&patchedLessonNumbers.has(u.startLesson))),...patch.units]
    .sort((a,b)=>((a.type==="lesson"?0:1)-(b.type==="lesson"?0:1))||((a.startLesson??Number.MAX_SAFE_INTEGER)-(b.startLesson??Number.MAX_SAFE_INTEGER))||a.position-b.position);
  term.units.forEach((unit,index)=>{unit.position=index});
 }
 let units=0;
 const grade={grade:meta.grade,units:0,blocks:0,stableBlockIdentities:0,families:{}};

 for(const term of bundle.terms){
  for(const unit of term.units){
   units++; grade.units++; report.totals.units++;
   const unitFamilies={}; let maxColumns=0; let longTextBlocks=0; let responseBlocks=0;
   for(const block of unit.blocks){
    grade.blocks++; report.totals.blocks++;
    if(!block.id)fail("Missing stable block identity in "+unit.id);
    const key=unit.id+"::"+block.id;
    if(ids.has(key))fail("Duplicate stable block identity: "+key);
    ids.add(key); grade.stableBlockIdentities++; report.totals.stableBlockIdentities++;
    const f=family(block); unitFamilies[f]=(unitFamilies[f]||0)+1; grade.families[f]=(grade.families[f]||0)+1; addFamily(f);
    if(block.kind==="table")maxColumns=Math.max(maxColumns,block.rows.reduce((n,row)=>Math.max(n,row.length),0));
    if(textLength(block)>900){longTextBlocks++;}
    if(block.kind==="text"&&["activity","reflection","checkpoint","portfolio"].includes(block.type))responseBlocks++;
   }
   const reasons=[];
   if(unit.blocks.length>=45) reasons.push("large-unit");
   if(maxColumns>=7) reasons.push("wide-table");
   if(longTextBlocks>=2) reasons.push("multiple-long-text-blocks");
   if(responseBlocks>=10) reasons.push("response-dense");
   if(Object.keys(unitFamilies).some(k=>k==="unknown")) reasons.push("unknown-presentation-family");
   if(reasons.length) report.outliers.push({grade:meta.grade,term:term.term,unitId:unit.id,title:unit.title,blockCount:unit.blocks.length,maxColumns,longTextBlocks,responseBlocks,families:unitFamilies,reasons});
  }
 }
 if(units!==meta.unitCount)fail("Grade "+meta.grade+" unit census mismatch: expected "+meta.unitCount+" got "+units);
 report.grades.push(grade);
}

fs.mkdirSync(path.resolve("test-results"),{recursive:true});
fs.writeFileSync(path.resolve("test-results/presentation-census.json"),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
