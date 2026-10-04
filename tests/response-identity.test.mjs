import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const moduleUrl=(file,replacements={})=>{
 let code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 for(const [from,to] of Object.entries(replacements))code=code.replaceAll(`"${from}"`,`"${to}"`);
 return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
};
const identityUrl=moduleUrl('lib/response-identity.ts');
const {responseView,persistResponseKey,parseLearningState}=await import(identityUrl);
const {buildPortfolioDefinitions,responsesForPortfolio}=await import(moduleUrl('lib/portfolio-model.ts',{'./response-identity':identityUrl}));
const unit='g8-t1-l01-001';
const blocks=[{id:'activity',kind:'text',type:'activity',text:'Activity 1: One action'},{id:'answer',kind:'text',type:'paragraph',text:'My action: ______'},{id:'evidence',kind:'text',type:'portfolio',text:'Portfolio: Keep your action.'}];

test('saved answer survives insertion and reordering without populating a different task',()=>{
 const key=persistResponseKey(unit,blocks,`${unit}::block-1::blank-0`);
 const responses={[key]:'Ask my grandmother on Saturday'};
 const reordered=[{id:'new',kind:'text',type:'paragraph',text:'New explanation'},...blocks];
 const view=responseView(unit,reordered,responses);
 assert.equal(view[`${unit}::block-2::blank-0`],responses[key]);
 assert.equal(view[`${unit}::block-1::blank-0`],undefined);
 assert.equal(persistResponseKey(unit,reordered,`${unit}::block-2::blank-0`),key);
 const revised=reordered.map(b=>b.id==='answer'?{...b,id:'changed-question'}:b);
 assert.deepEqual(responseView(unit,revised,responses),{});
});

test('legacy migration preserves answers, notes, completion and profile without guessing questions',()=>{
 const legacy={version:1,profile:{displayName:'Test learner'},completed:{[unit]:'date'},responses:{[unit]:'my note'},promptResponses:{[`${unit}::block-1::blank-0`]:'old answer'}};
 const migrated=parseLearningState(JSON.stringify(legacy));
 assert.equal(migrated.version,2);
 assert.deepEqual(migrated.promptResponses,{});
 assert.deepEqual(migrated.previousResponses,legacy.promptResponses);
 assert.deepEqual(migrated.responses,legacy.responses);
 assert.deepEqual(migrated.completed,legacy.completed);
 assert.deepEqual(migrated.profile,legacy.profile);
 assert.deepEqual(parseLearningState(JSON.stringify(migrated)),migrated);
 assert.throws(()=>parseLearningState('{broken'));
 assert.throws(()=>parseLearningState('{"version":99}'));
});

test('answered activity reaches its portfolio with the same saved value after reopening',()=>{
 const key=persistResponseKey(unit,blocks,`${unit}::block-1::blank-0`);
 const state=parseLearningState(JSON.stringify({version:2,promptResponses:{[key]:'Run one savings experiment'},previousResponses:{}}));
 const content={id:unit,title:'Who am I?',blocks};
 const definition=buildPortfolioDefinitions(content)[0];
 const evidence=responsesForPortfolio(content,definition,state.promptResponses);
 assert.equal(evidence.length,1);
 assert.equal(evidence[0].value,'Run one savings experiment');
 assert.match(evidence[0].label,/My action/);
 assert.equal(responsesForPortfolio(content,definition,{[`${unit}::block-1::blank-0`]:'wrong legacy answer'}).length,0);
});

test('foreign lesson keys and missing task identities cannot be saved',()=>{
 assert.throws(()=>persistResponseKey(unit,blocks,'other::block-1::response'));
 assert.throws(()=>persistResponseKey(unit,[{kind:'text',type:'paragraph',text:'question'}],`${unit}::block-0::response`));
});
