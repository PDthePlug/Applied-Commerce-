import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup}from 'react-dom/server';
import {renderModule}from './lib/render-module.mjs';
const {ClassroomExperience}=await import(renderModule('components/classroom-workspace.tsx'));
function fixture(){
 const selected={id:'g8-t1-l08-008',grade:8,term:1,number:8,title:'SYNTHETIC_LESSON'};
 const guide={centralConcept:'SYNTHETIC_ORIGINAL_CONCEPT',objectives:['SYNTHETIC_OBJECTIVE'],observableOutcome:'SYNTHETIC_OUTCOME',prerequisites:[],preparation:{knowledge:[],materials:[],vocabulary:[],misconceptions:[],southAfricanContext:'SYNTHETIC_CONTEXT',privacy:[]},periods:[{title:'SYNTHETIC_PERIOD',minutes:45,stages:[]}],discussion:[],practical:{instructions:[],inClassScope:'SYNTHETIC_SCOPE',expectedOutput:'SYNTHETIC_OUTPUT',followUp:'SYNTHETIC_LATER',scaffold:{columns:['SYNTHETIC_COLUMN'],rows:[['SYNTHETIC_CELL']]}},understandingChecks:[],differentiation:{support:[],extension:[],quietParticipation:[],largeClass:[],lowTechnology:[],readingSupport:[]},continuity:{connection:'SYNTHETIC_CONNECTION',nextUse:'SYNTHETIC_NEXT'},independentLearning:[],grade:8,term:1,originalTitle:selected.title};
 const fields={concept:guide.centralConcept,enrichment:'SYNTHETIC_LOCAL_CLARIFICATION',period:'SYNTHETIC_CURRENT_PERIOD',title:'SYNTHETIC_CURRENT_STAGE',cue:'SYNTHETIC_CURRENT_CUE','practical.scaffold.columns.0':'SYNTHETIC_COLUMN','practical.scaffold.rows.0.0':'SYNTHETIC_CELL'};
 const plan={lessonId:selected.id,fields,preparation:[{heading:'Preparation',fields:['concept','enrichment']}],periods:[{title:'period',minutes:45,moments:['stage']}],moments:[{id:'stage',title:'title',period:0,schedule:'classroom',minutes:45,core:[{heading:'Facilitation cue',fields:['cue']},{heading:'Original scaffold',fields:['practical.scaffold.columns.0','practical.scaffold.rows.0.0']}],depth:[]}]};
 return {catalog:[selected],selected,guide,plan};
}
test('standalone benchmark delivery includes the complete current plan and retains the original scaffold and presentation control',()=>{
 const payload=fixture(),html=renderToStaticMarkup(React.createElement(ClassroomExperience,{payload,onSelect:()=>{}}));
 assert.ok(html.includes('class="standalone-teaching-plan"'));assert.ok(!html.includes('class="classroom-guide"'));
 for(const value of Object.values(payload.plan.fields))assert.ok(html.includes(value));
 assert.ok(html.includes('aria-label="Practical work scaffold"'));assert.ok(html.includes('<th scope="col"'));assert.ok(html.includes('Presentation prompts'));assert.ok(html.includes('Print teacher guide'));
});
test('legacy guide-only delivery remains available when no current contextual plan exists',()=>{
 const payload=fixture();delete payload.plan;
 const html=renderToStaticMarkup(React.createElement(ClassroomExperience,{payload,onSelect:()=>{}}));
 assert.ok(html.includes('class="classroom-guide"'));assert.ok(html.includes(payload.guide.centralConcept));assert.ok(html.includes('SYNTHETIC_COLUMN'));assert.ok(!html.includes('SYNTHETIC_LOCAL_CLARIFICATION'));
});
