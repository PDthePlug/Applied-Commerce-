import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root=path.resolve("public/curriculum");
const index=JSON.parse(fs.readFileSync(path.join(root,"index.json"),"utf8"));
const ids=new Set();
const counts={units:0,blocks:0,stableBlockIdentities:0,families:{}};
function fail(message){throw new Error(message)}
function add(key){counts.families[key]=(counts.families[key]||0)+1}
function family(block){
 if(block.kind==="table")return "table";
 return block.type||"unknown";
}
for(const meta of index.grades){
 const files=Array.from({length:meta.bundleParts},(_,i)=>path.join(root,"grade-"+meta.grade+".part-"+(i+1)+".b64"));
 const encoded=files.map(file=>fs.readFileSync(file,"utf8").trim()).join("");
 const bundle=JSON.parse(zlib.gunzipSync(Buffer.from(encoded,"base64")).toString("utf8"));
 let units=0;
 for(const term of bundle.terms){
  for(const unit of term.units){
   units++; counts.units++;
   for(const block of unit.blocks){
    counts.blocks++;
    if(!block.id)fail("Missing stable block identity in "+unit.id);
    const key=unit.id+"::"+block.id;
    if(ids.has(key))fail("Duplicate stable block identity: "+key);
    ids.add(key); counts.stableBlockIdentities++; add(family(block));
   }
  }
 }
 if(units!==meta.unitCount)fail("Grade "+meta.grade+" unit census mismatch: expected "+meta.unitCount+" got "+units);
}
console.log(JSON.stringify({ok:true,census:counts},null,2));
