import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import {typescriptModule}from '../scripts/semantic-census.mjs';
const {checkClassroomAccess}=await import(typescriptModule('lib/classroom/access.ts'));
const state={mode:'supabase',user:{id:'fixture-user'},active:true,platform:false,staff:false,schoolRole:null,fail:false,authError:false,loads:0,contextualLoads:0,planLoads:0,created:0};
const client={auth:{getUser:async()=>({data:{user:state.user},error:state.authError?new Error('auth'):null})},rpc:async name=>({data:name==='has_active_session'?state.active:state.platform,error:null}),from:table=>{const filters={};return{select(){return this;},eq(key,value){filters[key]=value;return this;},in(key,value){filters[key]=value;return this;},limit:async()=>({data:filters.user_id===state.user?.id&&filters.status==='active'&&(table==='cohort_staff'?state.staff:filters.role.includes(state.schoolRole))?[{id:'fixture-assignment'}]:[],error:state.fail?new Error('lookup'):null})};}};
globalThis.__classroomAPI={createClient:async()=>{state.created++;return client;},appliedCommerceBackendMode:()=>state.mode,checkClassroomAccess,library:{classroomCatalog:[{id:'g8-t1-l08-008',benchmark:true}],loadClassroomGuides:async()=>{state.loads++;return[{lessonId:'g8-t1-l08-008',indicativeReasoning:'PRIVATE_FIXTURE_REASONING'}];},loadContextualEnrichment:async()=>{state.contextualLoads++;return{lessonId:'g8-t1-l08-008',privateText:'PRIVATE_CONTEXTUAL_FIXTURE'};},loadTeachingPlan:async()=>{state.planLoads++;return{lessonId:'g8-t1-l08-008',privateText:'PRIVATE_PLAN_FIXTURE'};}}};
const raw=fs.readFileSync('app/api/classroom/route.ts','utf8').replace(/^import .*;\n/gm,'').replace('await import("@/lib/classroom/private-library")','globalThis.__classroomAPI.library');
const code='const {createClient,appliedCommerceBackendMode,checkClassroomAccess}=globalThis.__classroomAPI;\n'+ts.transpileModule(raw,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {GET}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));const request=id=>new Request('https://fixture.invalid/api/classroom?lesson=g8-t1-l08-008',{headers:id?{'x-ac-expected-user-id':id}:{}});
function reset(){Object.assign(state,{mode:'supabase',user:{id:'fixture-user'},active:true,platform:false,staff:false,schoolRole:null,fail:false,authError:false,loads:0,contextualLoads:0,planLoads:0,created:0});}
test('teacher API denies guests, ordinary learners, revoked sessions and unassigned educators without loading private guidance',async()=>{
 for(const change of [()=>state.user=null,()=>{},()=>state.active=false,()=>state.schoolRole='educator',()=>state.user={id:'fixture-user',user_metadata:{role:'platform_admin'}}]){reset();change();const r=await GET(request());assert.ok([401,403].includes(r.status));assert.equal(state.loads,0);assert.equal(state.contextualLoads,0);assert.equal(state.planLoads,0);assert.ok(!JSON.stringify(await r.json()).includes('PRIVATE_FIXTURE_REASONING'));assert.match(r.headers.get('cache-control'),/private.*no-store/);}
});
test('existing assigned staff, institution owners/admins and platform admins may read the protected guide',async()=>{
 for(const change of [()=>state.staff=true,()=>state.schoolRole='owner',()=>state.schoolRole='admin',()=>state.platform=true]){reset();change();const r=await GET(request('fixture-user'));assert.equal(r.status,200);const payload=await r.json();assert.equal(payload.guide.indicativeReasoning,'PRIVATE_FIXTURE_REASONING');assert.equal(payload.contextual.privateText,'PRIVATE_CONTEXTUAL_FIXTURE');assert.equal(payload.plan.privateText,'PRIVATE_PLAN_FIXTURE');assert.equal(state.planLoads,1);assert.equal(state.contextualLoads,1);assert.equal(state.loads,1);assert.equal(r.headers.get('vary'),'Cookie, Authorization');}
});
test('role lookup failure and changed accounts fail closed before private content loading',async()=>{
 reset();state.platform=true;state.fail=true;assert.equal((await GET(request())).status,503);assert.equal(state.loads,0);assert.equal(state.contextualLoads,0);assert.equal(state.planLoads,0);reset();state.staff=true;assert.equal((await GET(request('another-user'))).status,409);assert.equal(state.loads,0);assert.equal(state.contextualLoads,0);assert.equal(state.planLoads,0);
});
test('local-only mode never opens an auth client or private teacher payload',async()=>{
 reset();state.mode='local';state.platform=true;assert.equal((await GET(request())).status,401);assert.equal(state.created,0);assert.equal(state.loads,0);assert.equal(state.contextualLoads,0);assert.equal(state.planLoads,0);
});
test('a missing or damaged private release returns a safe unavailable response',async()=>{
 reset();state.staff=true;const load=globalThis.__classroomAPI.library.loadClassroomGuides;globalThis.__classroomAPI.library.loadClassroomGuides=async()=>{throw new Error('PRIVATE_CONFIGURATION_SENTINEL');};
 try{const response=await GET(request());assert.equal(response.status,503);assert.ok(!JSON.stringify(await response.json()).includes('PRIVATE_CONFIGURATION_SENTINEL'));}finally{globalThis.__classroomAPI.library.loadClassroomGuides=load;}
});

test('damaged contextual enrichment returns no partial private guide or configuration details',async()=>{
 reset();state.staff=true;const load=globalThis.__classroomAPI.library.loadContextualEnrichment;globalThis.__classroomAPI.library.loadContextualEnrichment=async()=>{throw new Error('PRIVATE_CONTEXTUAL_FAILURE');};
 try{const response=await GET(request());assert.equal(response.status,503);const payload=await response.json();assert.equal(payload.guide,undefined);assert.ok(!JSON.stringify(payload).includes('PRIVATE_CONTEXTUAL_FAILURE'));}finally{globalThis.__classroomAPI.library.loadContextualEnrichment=load;}
});

test('damaged V2 plan returns no partial guide, enrichment or private failure detail',async()=>{
 reset();state.staff=true;const load=globalThis.__classroomAPI.library.loadTeachingPlan;globalThis.__classroomAPI.library.loadTeachingPlan=async()=>{throw new Error('PRIVATE_V2_CONFIGURATION');};
 try{const response=await GET(request());assert.equal(response.status,503);const payload=await response.json();assert.equal(payload.guide,undefined);assert.equal(payload.contextual,undefined);assert.equal(payload.plan,undefined);assert.ok(!JSON.stringify(payload).includes('PRIVATE_V2_CONFIGURATION'));}finally{globalThis.__classroomAPI.library.loadTeachingPlan=load;}
});
