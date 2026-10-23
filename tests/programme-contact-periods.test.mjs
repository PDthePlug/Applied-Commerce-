import test from 'node:test';
import assert from 'node:assert/strict';
import {provisionalContactPeriods} from '../scripts/lib/programme-contact-periods.mjs';

test('twenty authored Grade 8 Term 4 guides retain 30 allocations but recommend 26 contacts with one project choice',()=>{
 const periods=[1,1,1,1,1,1,2,2,2,1,1,1,2,1,3,3,1,2,1,2];
 const rows=periods.map((contactPeriods,index)=>({grade:8,term:4,lessonId:'lesson-'+(61+index),contactPeriods,...(index>=6&&index<=8?{sharedContactGroup:'g8-t4-option-planning'}:{})}));
 assert.equal(rows.length,20);assert.equal(periods.reduce((a,b)=>a+b),30);assert.equal(provisionalContactPeriods(rows),26);
});
test('shared names never combine contact periods across grades or terms',()=>{
 assert.equal(provisionalContactPeriods([{grade:8,term:4,sharedContactGroup:'options',contactPeriods:2},{grade:9,term:4,sharedContactGroup:'options',contactPeriods:2},{grade:8,term:3,sharedContactGroup:'options',contactPeriods:2}]),6);
});
test('inconsistent alternative estimates are rejected instead of choosing a silent minimum',()=>{
 assert.throws(()=>provisionalContactPeriods([{grade:8,term:4,sharedContactGroup:'options',contactPeriods:1},{grade:8,term:4,sharedContactGroup:'options',contactPeriods:2}]),/disagree/);
});
