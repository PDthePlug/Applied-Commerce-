// Explicitly provisioned, dedicated accounts only. Credentials stay in a private
// file outside the repository; this runner never logs tokens or passwords.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { loadRoleFixtures, verifyHostedTarget } from './lib/validation-target.mjs';
const directory=process.env.AC_ROLE_FIXTURES;
const {config,fixtures}=loadRoleFixtures(directory);
if(process.env.AC_ROLE_BASE_URL)await verifyHostedTarget(process.env.AC_ROLE_BASE_URL,config,process.env.AC_EXPECTED_COMMIT);
const sessions={},checks=[];
async function request(actor,path,method='GET',body){
 const result=await fetch(config.url+path,{signal:AbortSignal.timeout(30000),method,headers:{apikey:config.key,'Content-Type':'application/json',...(actor?{Authorization:'Bearer '+sessions[actor].access_token}:{}),Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});
 const text=await result.text();let data;try{data=JSON.parse(text);}catch{data=text;}
 return {status:result.status,data};
}
function check(name,fn){fn();checks.push({name,status:'PASS'});console.log('PASS '+name);}
async function rpc(actor,name,args={}){const r=await request(actor,'/rest/v1/rpc/'+name,'POST',args);assert.equal(r.status,200,`${name}: HTTP ${r.status} ${r.data?.message??''}`);return r.data;}
for(const [name,user] of Object.entries(fixtures.users)){
 const r=await request(null,'/auth/v1/token?grant_type=password','POST',{email:user.email,password:user.password});assert.equal(r.status,200,'Dedicated account sign-in failed: '+name);sessions[name]=r.data;
 check(name+' real password session',()=>assert.ok(r.data.access_token&&r.data.refresh_token&&r.data.user.id===user.id));
}
if(!fixtures.schoolId){
 const school=await rpc('platformAdmin','create_school',{p_name:fixtures.run+' dedicated test school',p_slug:fixtures.run});fixtures.schoolId=school.id;
 await rpc('platformAdmin','add_school_member_by_email',{p_school_id:school.id,p_email:fixtures.users.schoolAdmin.email,p_role:'owner'});
 const cohort=await request('schoolAdmin','/rest/v1/cohorts','POST',{school_id:school.id,name:fixtures.run+' cohort',grade:8,academic_year:2026});assert.equal(cohort.status,201);fixtures.cohortId=cohort.data[0].id;
 for(const name of ['facilitator','unassigned'])await rpc('schoolAdmin','add_school_member_by_email',{p_school_id:school.id,p_email:fixtures.users[name].email,p_role:'educator'});
 await rpc('schoolAdmin','add_cohort_staff_by_email',{p_cohort_id:fixtures.cohortId,p_email:fixtures.users.facilitator.email,p_role:'educator'});
 await rpc('schoolAdmin','enrol_learner_by_email',{p_cohort_id:fixtures.cohortId,p_email:fixtures.users.learner.email});
 fs.writeFileSync(directory+'/fixtures.json',JSON.stringify(fixtures,null,2),{mode:0o600});
}
check('administrator provisioning through real sessions',()=>assert.ok(fixtures.schoolId&&fixtures.cohortId));
const learner=fixtures.users.learner.id;
const unit='g8-t1-l01-001',key=unit+'::prompt-audit-session::response';
const save=(actor,items,opened)=>rpc(actor,'save_learning_changes_for_account',{p_account_id:fixtures.users[actor].id,p_changes:items,...(opened?{p_opened_unit:opened}:{})});
const change=(kind,key,value,expected=0)=>({kind,key,value,expected});
const prior=await request('learner','/rest/v1/prompt_responses?select=sync_revision,response&learner_id=eq.'+learner+'&prompt_key=eq.'+key);
const expected=prior.data[0]?.sync_revision??0;
const value='Dedicated session validation '+Date.now();
let saved=await save('learner',[change('prompt',key,value,expected)]);
check('learner persists answer through revision-checked RPC',()=>assert.equal(saved[0].conflict,false));
const revision=saved[0].revision;
const competing=await Promise.all([save('learner',[change('prompt',key,value+' device A',revision)]),save('learner',[change('prompt',key,value+' device B',revision)])]);
check('two device requests have exactly one winner',()=>assert.equal(competing.flat().filter(x=>!x.conflict).length,1));
const winner=competing.flat().find(x=>!x.conflict);
const retry=await save('learner',[change('prompt',key,winner.value,revision)]);
check('lost response retry does not duplicate or advance revision',()=>assert.equal(retry[0].revision,winner.revision));
for(const [actor,count] of [['other',0],['unassigned',0],['facilitator',1],['schoolAdmin',1],['platformAdmin',1]]){
 const r=await request(actor,'/rest/v1/prompt_responses?select=id&learner_id=eq.'+learner+'&prompt_key=eq.'+key);
 check(actor+' learner visibility boundary',()=>{assert.equal(r.status,200);assert.equal(r.data.length,count);});
}
const escalation=await request('learner','/rest/v1/rpc/add_school_member_by_email','POST',{p_school_id:fixtures.schoolId,p_email:fixtures.users.learner.email,p_role:'owner'});
check('learner cannot escalate institution privileges',()=>assert.ok(escalation.status>=400));
const unauthorized=await request('unassigned','/rest/v1/rpc/save_facilitator_review','POST',{p_learner_id:learner,p_response_key:key,p_response_value:winner.value,p_auto_result:{},p_review:{status:'accepted',criteria:{},feedback:'unauthorized'}});
check('unassigned facilitator cannot review',()=>assert.ok(unauthorized.status>=400));
await rpc('facilitator','save_facilitator_review',{p_learner_id:learner,p_response_key:key,p_response_value:winner.value,p_auto_result:{},p_review:{status:'needs-revision',criteria:{},feedback:'Dedicated test: explain the example'}});
let review=await request('learner','/rest/v1/evidence_records?select=id,status,evidence_reviews(status,feedback,response_value_at_review)&learner_id=eq.'+learner+'&response_key=eq.'+key);
check('revision feedback is visible to the learner',()=>{assert.equal(review.data[0].status,'needs-revision');assert.equal(review.data[0].evidence_reviews[0].feedback,'Dedicated test: explain the example');});
const revised=winner.value+' revised';const resubmitted=await save('learner',[change('prompt',key,revised,winner.revision)]);
check('learner revision persists',()=>assert.equal(resubmitted[0].conflict,false));
const stale=await request('facilitator','/rest/v1/rpc/save_facilitator_review','POST',{p_learner_id:learner,p_response_key:key,p_response_value:winner.value,p_auto_result:{},p_review:{status:'accepted',criteria:{},feedback:'stale'}});
check('stale review cannot approve a revised answer',()=>assert.ok(stale.status>=400));
await rpc('facilitator','save_facilitator_review',{p_learner_id:learner,p_response_key:key,p_response_value:revised,p_auto_result:{},p_review:{status:'accepted',criteria:{},feedback:'Dedicated test: revised example accepted'}});
review=await request('learner','/rest/v1/evidence_records?select=status,evidence_reviews(status,response_value_at_review)&learner_id=eq.'+learner+'&response_key=eq.'+key);
check('approval follows the revised answer and reaches learner',()=>{assert.equal(review.data[0].status,'accepted');assert.equal(review.data[0].evidence_reviews[0].response_value_at_review,revised);});
const visible=await request('schoolAdmin','/rest/v1/evidence_records?select=status&learner_id=eq.'+learner+'&response_key=eq.'+key);
check('authorized administrator observes approved evidence',()=>assert.equal(visible.data[0].status,'accepted'));
const revoked=await request('schoolAdmin','/rest/v1/cohort_staff?cohort_id=eq.'+fixtures.cohortId+'&user_id=eq.'+fixtures.users.facilitator.id,'PATCH',{status:'disabled'});assert.equal(revoked.status,200);
const revokedReview=await request('facilitator','/rest/v1/rpc/save_facilitator_review','POST',{p_learner_id:learner,p_response_key:key,p_response_value:revised,p_auto_result:{},p_review:{status:'accepted',criteria:{},feedback:'after revocation'}});
check('role revocation blocks existing facilitator session',()=>assert.ok(revokedReview.status>=400));
await rpc('schoolAdmin','add_cohort_staff_by_email',{p_cohort_id:fixtures.cohortId,p_email:fixtures.users.facilitator.email,p_role:'educator'});
await rpc('learner','save_account_preferences',{p_patch:{appearance:'dark'}});await rpc('learner','save_account_preferences',{p_patch:{accent:'sage'}});
const preferences=await request('learner','/rest/v1/account_preferences?select=appearance,accent&user_id=eq.'+learner);
check('settings patches retain independent changes',()=>assert.deepEqual(preferences.data[0],{appearance:'dark',accent:'sage'}));
const invalid=await request('learner','/rest/v1/rpc/save_learning_changes_for_account','POST',{p_account_id:learner,p_changes:[change('note','invalid','bad')]});
check('invalid identities are rejected through HTTP',()=>assert.ok(invalid.status>=400));
const anonymous=await request(null,'/rest/v1/rpc/save_learning_changes_for_account','POST',{p_account_id:learner,p_changes:[]});check('anonymous mutation is denied',()=>assert.ok(anonymous.status>=400));
const release=await request('learner','/rest/v1/curriculum_releases?select=id&release_key=eq.ac-runtime-3');
const selfGrade=await request('learner','/rest/v1/assessment_attempts','POST',{learner_id:learner,curriculum_release_id:release.data[0].id,unit_id:'audit-assessment',attempt_number:1,status:'reviewed',score:100,result:{passed:true}});
check('learner cannot self-grade through the Data API',()=>assert.ok(selfGrade.status>=400));
const selfApproval=await request('learner','/rest/v1/evidence_records','POST',{learner_id:learner,response_key:'g8-t1-l01-001::prompt-audit-approval::response',response_value:'cannot certify this',status:'accepted'});
check('learner cannot self-approve through the Data API',()=>assert.ok(selfApproval.status>=400));
const accountMismatch=await request('other','/rest/v1/rpc/save_learning_changes_for_account','POST',{p_account_id:learner,p_changes:[change('note','g8-t1-l01-008','wrong originating account')]});
check('account switch during dispatch cannot save into the new account',()=>assert.ok(accountMismatch.status>=400));
const crossed=await request('other','/rest/v1/rpc/save_learning_changes_for_account','POST',{p_account_id:fixtures.users.other.id,p_changes:[{...change('note','g8-t1-l01-009','ownership probe'),learner_id:learner}]});
check('supplied learner identifier cannot change RPC ownership',()=>assert.equal(crossed.status,200));
const ownerRead=await request('learner','/rest/v1/lesson_notes?select=id&learner_id=eq.'+learner+'&unit_id=eq.g8-t1-l01-009');
check('ownership probe did not write the targeted learner account',()=>assert.equal(ownerRead.data.length,0));
const crossArtifact=await request('other','/rest/v1/portfolio_artifacts','POST',{learner_id:learner,grade:8,term:1,unit_id:'g8-t1-l01-001',marker_key:'audit-marker',title:'Unauthorized portfolio'});
check('learner cannot create another learner portfolio artifact',()=>assert.ok(crossArtifact.status>=400));
await save('unassigned',[change('note','g8-t1-l01-002','private logout fixture')]);
const oldToken=sessions.unassigned.access_token;const logout=await request('unassigned','/auth/v1/logout','POST');assert.equal(logout.status,204);
const ended=await rpc('unassigned','has_active_session');check('logged-out JWT fails active-session check',()=>assert.equal(ended,false));
const after=await request('unassigned','/rest/v1/lesson_notes?select=id&learner_id=eq.'+fixtures.users.unassigned.id);check('logged-out JWT cannot read its own private data',()=>assert.equal(after.data.length,0));
const rejected=await request('unassigned','/rest/v1/rpc/save_learning_changes_for_account','POST',{p_account_id:fixtures.users.unassigned.id,p_changes:[change('note','g8-t1-l01-003','cannot write')]});check('logged-out JWT cannot persist new data',()=>assert.ok(rejected.status>=400));
const refresh=await request(null,'/auth/v1/token?grant_type=refresh_token','POST',{refresh_token:sessions.unassigned.refresh_token});check('revoked refresh token cannot restore the session',()=>assert.ok(refresh.status>=400));
// JWT signature tampering cannot impersonate another role or fake expiry.
const parts=sessions.learner.access_token.split('.');const claims=JSON.parse(Buffer.from(parts[1],'base64url'));claims.sub=fixtures.users.platformAdmin.id;parts[1]=Buffer.from(JSON.stringify(claims)).toString('base64url');
const impersonation=await fetch(config.url+'/rest/v1/rpc/is_platform_admin',{method:'POST',headers:{apikey:config.key,Authorization:'Bearer '+parts.join('.'),'Content-Type':'application/json'},body:'{}'});
check('tampered role token fails signature verification',()=>assert.equal(impersonation.status,401));
fs.writeFileSync(directory+'/sessions.json',JSON.stringify({...sessions,revoked:{access_token:oldToken}}),{mode:0o600});
fs.writeFileSync(directory+'/http-results.json',JSON.stringify({run:fixtures.run,at:new Date().toISOString(),checks},null,2),{mode:0o600});
console.log(JSON.stringify({passed:checks.length,failed:0}));
