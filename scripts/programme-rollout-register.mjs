// Summarise recorded individual review evidence. This does not author guides or
// confer educational approval from a schema check.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {runtimeUnits} from './semantic-census.mjs';
import {provisionalContactPeriods} from './lib/programme-contact-periods.mjs';
const path='docs/programme-rollout/coverage.json',register=JSON.parse(fs.readFileSync(path));
const lessons=(await runtimeUnits()).filter(unit=>unit.type==='lesson');
assert.equal(lessons.length,395);assert.equal(register.lessons.length,395);
assert.equal(new Set(register.lessons.map(row=>row.lessonId)).size,395);
for(const lesson of lessons){const row=register.lessons.find(row=>row.lessonId===lesson.id);assert.ok(row);assert.equal(row.grade,lesson.grade);assert.equal(row.term,lesson.term);}
const groups=new Map();
for(const row of register.lessons){
 const key=`${row.grade},${row.term}`;
 if(!groups.has(key))groups.set(key,{grade:row.grade,term:row.term,total:0,existing:0,new:0,pending:0,drafts:0,staged:0,completedRows:[],draftRows:[],stagedRows:[]});
 const group=groups.get(key);group.total++;
 if(row.status==='OWNER_ACCEPTED_PR48_EXISTING'){group.existing++;group.completedRows.push(row);}
 else if(row.status==='COMPLETED_INDIVIDUAL_REVIEW'){group.new++;group.completedRows.push(row);}
 else{group.pending++;if(row.status==='DRAFTED_PRIVATE_UNSEALED'){group.drafts++;group.draftRows.push(row);}else if(row.status==='STAGED_PENDING_VERIFICATION'){group.staged++;group.stagedRows.push(row);}}
}
for(const group of groups.values()){
 group.periods=provisionalContactPeriods(group.completedRows);group.draftPeriods=provisionalContactPeriods(group.draftRows);group.stagedPeriods=provisionalContactPeriods(group.stagedRows);
 group.rawPeriods=group.completedRows.reduce((n,r)=>n+(r.contactPeriods??0),0);group.rawDraftPeriods=group.draftRows.reduce((n,r)=>n+(r.contactPeriods??0),0);group.rawStagedPeriods=group.stagedRows.reduce((n,r)=>n+(r.contactPeriods??0),0);
}
const rows=[...groups.values()].sort((a,b)=>a.grade-b.grade||a.term-b.term);
fs.writeFileSync('docs/programme-rollout/grade-term.csv','grade,term,authored_lessons,existing_accepted_plans,new_completed_plans,pending_lessons,private_unsealed_drafts,staged_pending_verification,provisional_periods_for_completed_plans,provisional_periods_for_unsealed_drafts,provisional_periods_for_staged_plans,raw_period_allocations_completed,raw_period_allocations_unsealed,raw_period_allocations_staged\n'+rows.map(row=>[row.grade,row.term,row.total,row.existing,row.new,row.pending,row.drafts,row.staged,row.periods,row.draftPeriods,row.stagedPeriods,row.rawPeriods,row.rawDraftPeriods,row.rawStagedPeriods].join(',')).join('\n')+'\n');
console.log(JSON.stringify({authoredLessons:lessons.length,existing:rows.reduce((n,r)=>n+r.existing,0),newCompleted:rows.reduce((n,r)=>n+r.new,0),pending:rows.reduce((n,r)=>n+r.pending,0),privateDrafts:rows.reduce((n,r)=>n+r.drafts,0),staged:rows.reduce((n,r)=>n+r.staged,0),gradeTerms:rows.length}));
