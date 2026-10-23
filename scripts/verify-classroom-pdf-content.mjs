// Local text verification of genuine private PDF exports. Never emit prose.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {parseArgs} from 'node:util';
import {spawnSync} from 'node:child_process';
import {digest} from './classroom-inventory.mjs';
import {stagingLessonScope} from './lib/staging-lesson-scope.mjs';
process.umask(0o077);
const {values}=parseArgs({options:{'pdf-dir':{type:'string',multiple:true},'plans-dir':{type:'string',multiple:true},lessons:{type:'string'},report:{type:'string'}}});
assert.ok(values['pdf-dir']?.length&&values['plans-dir']?.length&&values.report);
const manifest=JSON.parse(fs.readFileSync('content/instructional/teaching-manifest.v2.json'));
const selected=stagingLessonScope(manifest.plans,values.lessons);
const normal=text=>text.normalize('NFKC').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[‐‑‒–—−]/g,'-').replace(/\s+/g,'');
const results=[];
for(const binding of selected.plans){
 let plan;
 for(const dir of values['plans-dir']){const file=path.join(dir,binding.lessonId+'.json');if(fs.existsSync(file)){const value=JSON.parse(fs.readFileSync(file));plan=value.plan??value;break;}}
 assert.ok(plan,'Missing protected plan: '+binding.lessonId);assert.equal(digest(plan),binding.planSHA256,'Protected plan differs from the released hash: '+binding.lessonId);
 for(const dir of values['pdf-dir']){
  const file=path.join(dir,binding.lessonId+'.pdf');assert.ok(fs.existsSync(file),'Missing private PDF: '+binding.lessonId);
  const extracted=spawnSync('pdftotext',['-layout',file,'-'],{encoding:'utf8',maxBuffer:8*1024*1024});assert.equal(extracted.status,0,'PDF text extraction failed');
  const text=normal(extracted.stdout),missing=Object.entries(plan.fields).filter(([,value])=>!text.includes(normal(value))).map(([field])=>field);
  results.push({scope:path.basename(dir),lessonId:binding.lessonId,fields:Object.keys(plan.fields).length,missing,preserved:missing.length===0});
 }
}
const summary={pdfs:results.length,fields:results.reduce((n,row)=>n+row.fields,0),missingFields:results.reduce((n,row)=>n+row.missing.length,0)};
fs.writeFileSync(values.report,JSON.stringify({verification:'local text comparison of genuine hosted PDF exports; private strings not published',scope:selected.scope,releasedPlans:selected.releasedPlans,normalisation:'Unicode compatibility, equivalent quote/dash forms and layout whitespace; exact DOM fields and PDF margins checked separately',summary,results},null,2)+'\n');
console.log(JSON.stringify(summary));assert.equal(summary.missingFields,0,'Private PDF instructional content is missing; see field identities in protected report');
