import assert from 'node:assert/strict';

// Alternative project guides can share classroom contacts. Their authored
// lesson count and individual guide period allocations remain unchanged.
export function provisionalContactPeriods(rows) {
 const contacts=new Map();
 for(const row of rows){
  if(row.contactPeriods===null||row.contactPeriods===undefined)continue;
  assert.ok(Number.isInteger(row.contactPeriods)&&row.contactPeriods>0,'Invalid contact-period estimate');
  if(row.sharedContactGroup!==undefined)assert.ok(typeof row.sharedContactGroup==='string'&&row.sharedContactGroup.trim(),'Invalid shared contact group');
  const key=`${row.grade}/${row.term}/${row.sharedContactGroup?'group:'+row.sharedContactGroup:'lesson:'+row.lessonId}`;
  if(contacts.has(key))assert.equal(contacts.get(key),row.contactPeriods,'Alternative guides disagree on their shared contacts');
  else contacts.set(key,row.contactPeriods);
 }
 return [...contacts.values()].reduce((total,periods)=>total+periods,0);
}
