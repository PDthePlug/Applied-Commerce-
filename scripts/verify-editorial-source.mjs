// Source-reference evidence only: this does not approve editorial judgement.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseArgs} from 'node:util';
import {runtimeUnits} from './semantic-census.mjs';
const {values}=parseArgs({options:{report:{type:'string',default:'docs/programme-rollout/editorial-source-verification.json'}}});
const units=await runtimeUnits(),register=JSON.parse(fs.readFileSync('docs/programme-rollout/SOURCE_EDITORIAL_REGISTER.json'));
assert.equal(register.sourceChangesApplied,false);
const results=register.entries.map((entry,index)=>{
 const unit=units.find(unit=>unit.id===entry.lessonId),block=unit?.blocks.find(block=>block.id===entry.blockId);
 assert.ok(block,'Missing source identity at proposal '+(index+1));
 const candidates=block.kind==='table'?[JSON.stringify(block.rows),block.rows.map(row=>row.join(' | ')).join('\n')]:[block.text];
 return{proposal:index+1,lessonId:entry.lessonId,blockId:entry.blockId,quotedPassageMatches:candidates.some(text=>text?.includes(entry.exactPassage)),proposedSourceChangeApplied:false};
});
const matched=results.filter(row=>row.quotedPassageMatches).length;
fs.writeFileSync(values.report,JSON.stringify({check:'Exact quoted source text/table cells and stable references; not approval of the concern or proposed wording',proposals:results.length,matched,sourceChangesApplied:false,results},null,2)+'\n');
console.log(JSON.stringify({proposals:results.length,matched,sourceChangesApplied:false}));assert.equal(matched,results.length,'Editorial quotation/source identity mismatch');
