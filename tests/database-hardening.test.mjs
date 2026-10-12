import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

// Real PostgreSQL engine with RLS roles, using a minimal Auth fixture.
// This does not test Supabase Auth HTTP sessions, email delivery, or storage.
const AUTH_FIXTURE_SQL = `create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; grant usage on schema auth,public to anon,authenticated,service_role;
 create table auth.users(id uuid primary key,email text,is_anonymous boolean default false,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz,deleted_at timestamptz,banned_until timestamptz);
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),not_after timestamptz);
 create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
 grant execute on function auth.jwt() to authenticated;
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant execute on function auth.uid() to anon,authenticated,service_role;`;
const db = new PGlite({ extensions: { pgcrypto } });
const uid = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const learner=uid(1), other=uid(2), staff=uid(3), unassigned=uid(4), admin=uid(5);
const school=uid(10), cohort=uid(11);
const key='g8-t1-l01-001::prompt-test::response';
let release;
let baselineExploitsReproduced=false;
async function asUser(id,sql,params=[]){
 await db.exec('begin; set local role authenticated;');
 try{await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',json_build_object('session_id',$1)::text,true)",[id]);const result=await db.query(sql,params);await db.exec('commit');return result;}
 catch(e){await db.exec('rollback');throw e;}
}
const review=(status,feedback='',criteria={})=>({status,feedback,criteria});
async function save(actor,answer,decision){return asUser(actor,'select public.save_facilitator_review($1,$2,$3,$4,$5) as id',[learner,key,answer,{},decision]);}

before(async()=>{
 await db.exec(AUTH_FIXTURE_SQL);
 for(const file of fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')&&!f.includes('protect_assessment_decisions')&&!f.includes('learning_revision_sync')&&!f.includes('active_role_sessions')&&!f.includes('require_revision_checked_writes')&&!f.includes('account_bound_learning_saves')).sort()) await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
 release=(await db.query("select id from public.curriculum_releases where release_key='ac-runtime-3'")).rows[0].id;
 for(const [id,name] of [[learner,'learner'],[other,'other'],[staff,'staff'],[unassigned,'unassigned'],[admin,'admin']]) await db.query('insert into auth.users(id,email) values($1,$2)',[id,name+'@audit.invalid']);
 for(const id of [learner,other,staff,unassigned,admin])await db.query('insert into auth.sessions(id,user_id) values($1,$1)',[id]);
 await db.query('insert into private.platform_admins(user_id) values($1)',[admin]);
 await db.query('insert into public.schools(id,name,slug) values($1,$2,$3)',[school,'Audit school','audit-school']);
 await db.query('insert into public.cohorts(id,school_id,name,grade,academic_year) values($1,$2,$3,8,2026)',[cohort,school,'Audit cohort']);
 for(const id of [learner,other]){await db.query('insert into public.learner_profiles(user_id) values($1)',[id]);await db.query('insert into public.cohort_enrolments(cohort_id,learner_id) values($1,$2)',[cohort,id]);}
 await db.query("insert into public.school_memberships(school_id,user_id,role) values($1,$2,'educator')",[school,staff]);
 await db.query('insert into public.cohort_staff(cohort_id,user_id) values($1,$2)',[cohort,staff]);
 await asUser(learner,'insert into public.prompt_responses(learner_id,curriculum_release_id,curriculum_version,grade,term,unit_id,prompt_key,response) values($1,$2,$3,8,1,$4,$5,$6)',[learner,release,'ac-runtime-3',key.split('::')[0],key,JSON.stringify('original answer')]);
 // Reproduce the field-authorization defects against the unmodified baseline,
 // only in this disposable database; then clear these exploit fixtures.
 await asUser(learner,"insert into public.evidence_records(learner_id,response_key,response_value,status) values($1,$2,'original answer','accepted')",[learner,key]);
 await asUser(learner,"insert into public.assessment_attempts(learner_id,curriculum_release_id,unit_id,attempt_number,status,score,result) values($1,$2,'exploit-fixture',1,'reviewed',100,'{\"passed\":true}')",[learner,release]);
 baselineExploitsReproduced=true;
 await db.exec('delete from public.evidence_records; delete from public.assessment_attempts;');
 await db.exec(fs.readFileSync('supabase/migrations/20261012091449_protect_assessment_decisions.sql','utf8'));
 await db.exec(fs.readFileSync('supabase/migrations/20261012095153_learning_revision_sync.sql','utf8'));
 await db.exec(fs.readFileSync('supabase/migrations/20261012095157_active_role_sessions.sql','utf8'));
 await db.exec(fs.readFileSync('supabase/migrations/20261012102159_account_bound_learning_saves.sql','utf8'));
 await db.exec(fs.readFileSync('supabase/migrations/20261012101914_require_revision_checked_writes.sql','utf8'));
});
after(async()=>{await db.close();});

test('baseline learner self-approval and self-grading defects are reproduced safely',()=>{assert.equal(baselineExploitsReproduced,true);});

test('all migrations replay and every application table has RLS',async()=>{
 const {rows}=await db.query("select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind='r' and not c.relrowsecurity");assert.deepEqual(rows,[]);
});
test('learners cannot read another learner answer or escalate platform roles',async()=>{
 assert.equal((await asUser(other,'select * from public.prompt_responses where learner_id=$1',[learner])).rows.length,0);
 await assert.rejects(asUser(learner,'insert into private.platform_admins(user_id) values($1)',[learner]),/permission denied/);
});
test('assigned staff can read answers; unassigned staff cannot',async()=>{
 assert.equal((await asUser(staff,'select * from public.prompt_responses where learner_id=$1',[learner])).rows.length,1);
 assert.equal((await asUser(unassigned,'select * from public.prompt_responses where learner_id=$1',[learner])).rows.length,0);
});
test('learner cannot self-approve or self-verify evidence',async()=>{
 for(const status of ['accepted','verified','needs-revision'])await assert.rejects(asUser(learner,'insert into public.evidence_records(learner_id,response_key,response_value,status) values($1,$2,$3,$4)',[learner,key,'original answer',status]),/facilitator/);
});
test('learner cannot self-grade or create reviewed assessment attempts',async()=>{
 for(const [status,score,result] of [['reviewed',null,{}],['submitted',100,{}],['submitted',null,{passed:true}]]) await assert.rejects(asUser(learner,'insert into public.assessment_attempts(learner_id,curriculum_release_id,unit_id,attempt_number,status,score,result) values($1,$2,$3,1,$4,$5,$6)',[learner,release,'assessment-a',status,score,result]),/facilitator/);
 await asUser(learner,"insert into public.assessment_attempts(learner_id,curriculum_release_id,unit_id,attempt_number,status) values($1,$2,'assessment-a',1,'submitted')",[learner,release]);
});
test('unauthorized reviewer cannot invoke the atomic review operation',async()=>{
 await assert.rejects(save(unassigned,'original answer',review('accepted')),/Authorized facilitator/);
 await assert.rejects(save(learner,'original answer',review('accepted')),/Authorized facilitator/);
});
test('invalid review fails atomically without creating evidence',async()=>{
 await assert.rejects(save(staff,'original answer',review('needs-revision')),/Revision feedback/);
 assert.equal((await db.query('select * from public.evidence_records')).rows.length,0);
 assert.equal((await db.query('select * from public.evidence_reviews')).rows.length,0);
});
test('revision request reaches the owner, preserves a snapshot, and records history',async()=>{
 await save(staff,'original answer',review('needs-revision','Explain the example'));
 const rows=(await asUser(learner,'select status,feedback,response_value_at_review from public.evidence_reviews')).rows;
 assert.equal(rows.length,1);assert.equal(rows[0].feedback,'Explain the example');assert.equal(rows[0].response_value_at_review,'original answer');
 assert.equal((await db.query("select * from public.audit_events where event_type='evidence.review_saved'")).rows.length,1);
});
test('a stale review is rejected after learner revision',async()=>{
 await asUser(learner,'select public.save_learning_changes_for_account($1,$2)',[learner,JSON.stringify([{kind:'prompt',key,value:'revised answer',expected:1}])]);
 await assert.rejects(save(staff,'original answer',review('accepted')),/answer changed/);
 assert.equal((await db.query('select status from public.evidence_records')).rows[0].status,'needs-revision');
});
test('review retry is idempotent and approval follows the revised answer',async()=>{
 await save(staff,'revised answer',review('accepted','Good example'));
 await save(staff,'revised answer',review('accepted','Good example'));
 assert.equal((await db.query('select * from public.evidence_records')).rows.length,1);
 assert.equal((await db.query('select * from public.evidence_reviews')).rows.length,1);
 const row=(await asUser(learner,'select status,response_value_at_review from public.evidence_reviews')).rows[0];assert.equal(row.status,'accepted');assert.equal(row.response_value_at_review,'revised answer');
 const audit=(await db.query("select metadata from public.audit_events where event_type='evidence.review_saved' and metadata->'previous' <> 'null'::jsonb")).rows;assert.equal(audit.length,2);
});
test('review identity and evidence ownership are immutable',async()=>{
 await assert.rejects(asUser(staff,'update public.evidence_records set learner_id=$1 where learner_id=$2',[other,learner]),/identity/);
 await assert.rejects(asUser(staff,'update public.evidence_reviews set reviewer_id=$1',[unassigned]),/reviewer|identity/);
});
test('invalid rubric scores roll back review and evidence status',async()=>{
 await assert.rejects(save(staff,'revised answer',review('needs-revision','Try again',{reasoning:99})),/Rubric scores/);
 assert.equal((await db.query('select status from public.evidence_records')).rows[0].status,'accepted');
});
test('revoked cohort assignment denies subsequent review access',async()=>{
 await db.query("update public.cohort_staff set status='disabled' where user_id=$1",[staff]);
 await assert.rejects(save(staff,'revised answer',review('accepted')),/Authorized facilitator/);
});
test('account preferences are isolated and constrain supported values',async()=>{
 await asUser(learner,'select public.save_account_preferences($1)',[JSON.stringify({appearance:"dark"})]);
 assert.equal((await asUser(other,'select * from public.account_preferences')).rows.length,0);
 await assert.rejects(asUser(other,'select public.save_account_preferences($1)',[JSON.stringify({appearance:"invalid"})]),/Invalid preferences/);
});
test('seeded rubric criteria match the existing product contract',async()=>{
 const code=ts.transpileModule(fs.readFileSync('lib/evidence/taxonomy.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
 const {RUBRICS}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 for(const rubric of RUBRICS){const rows=(await db.query('select criterion_key,label,levels from public.rubric_criteria where rubric_key=$1 order by position',[rubric.key])).rows;assert.equal(rows.length,rubric.criteria.length);for(let i=0;i<rows.length;i++){assert.equal(rows[i].criterion_key,rubric.criteria[i].key);assert.deepEqual(rows[i].levels,rubric.criteria[i].levels);}}
});
test('anonymous clients cannot execute review RPC or read private learner data',async()=>{
 await db.exec('begin; set local role anon;');try{await assert.rejects(db.query('select * from public.prompt_responses'),/permission denied/);}finally{await db.exec('rollback');}
 await db.exec('begin; set local role anon;');try{await assert.rejects(db.query('select public.save_facilitator_review($1,$2,$3,$4,$5)',[learner,key,'revised answer',{},review('accepted')]),/permission denied/);}finally{await db.exec('rollback');}
});

test('platform administrator can provision a school while an ordinary learner cannot',async()=>{
 await assert.rejects(asUser(learner,"select public.create_school('Unauthorized','unauthorized')"),/administrators/);
 const result=await asUser(admin,"select (public.create_school('Provisioned school','provisioned-school')).id as id");
 assert.ok(result.rows[0].id);
 assert.equal((await db.query("select * from public.audit_events where event_type='school.created'")).rows.length,1);
});

async function changes(actor,items,opened=null){return (await asUser(actor,'select public.save_learning_changes_for_account($1,$2,$3) as result',[actor,JSON.stringify(items),opened])).rows[0].result;}
const change=(kind,key,value,expected=0)=>({kind,key,value,expected});
test('competing devices cannot overwrite a saved answer with an old revision',async()=>{const k='g8-t1-l01-002::prompt-conflict::response';const first=await changes(learner,[change('prompt',k,'device A')]);assert.equal(first[0].revision,1);const stale=await changes(learner,[change('prompt',k,'device B')]);assert.equal(stale[0].conflict,true);assert.equal(stale[0].value,'device A');const accepted=await changes(learner,[change('prompt',k,'device B',1)]);assert.equal(accepted[0].revision,2);});
test('equal value retry is idempotent even with a stale expected revision',async()=>{const k='g8-t1-l01-002::prompt-conflict::response';const result=await changes(learner,[change('prompt',k,'device B')]);assert.equal(result[0].conflict,false);assert.equal(result[0].revision,2);});
test('completion reversal and blank note persist with revision checks',async()=>{const unit='g8-t1-l01-003';await changes(learner,[change('note',unit,'note'),change('completion',unit,true)]);const result=await changes(learner,[change('note',unit,'',1),change('completion',unit,false,1)]);assert.ok(result.every(x=>!x.conflict&&x.revision===2));const row=(await asUser(learner,'select status,completed_at from public.lesson_progress where unit_id=$1',[unit])).rows[0];assert.equal(row.status,'in_progress');assert.equal(row.completed_at,null);});
test('navigation does not conflict with completion and returns its current baseline',async()=>{const unit='g8-t1-l01-003';const result=await changes(learner,[],unit);assert.equal(result[0].revision,2);await changes(learner,[change('completion',unit,true,2)],unit);assert.equal((await changes(learner,[],unit))[0].revision,3);});
test('malformed later changes roll back earlier writes in the same batch',async()=>{const unit='g8-t1-l01-004';await assert.rejects(changes(learner,[change('note',unit,'must roll back'),change('prompt','invalid','bad')]),/identity/);assert.equal((await db.query('select * from public.lesson_notes where unit_id=$1',[unit])).rows.length,0);});
test('unchanged conflicting fields do not block an unrelated authorized save',async()=>{const k='g8-t1-l01-002::prompt-conflict::response';const result=await changes(learner,[change('prompt',k,'stale',0),change('note','g8-t1-l01-005','independent')]);assert.equal(result.find(x=>x.kind==='prompt').conflict,true);assert.equal(result.find(x=>x.kind==='note').conflict,false);});
test('stale clients cannot bypass revision checks or delete saved work',async()=>{await assert.rejects(asUser(learner,"update public.prompt_responses set response='\"bypass\"'"),/permission denied/);await assert.rejects(asUser(learner,'delete from public.lesson_notes'),/permission denied/);});
test('invalid, duplicate and oversized batches are rejected',async()=>{await assert.rejects(changes(learner,[change('note','g8-t1-l01-006','x'),change('note','g8-t1-l01-006','y')]),/Duplicate/);await assert.rejects(changes(learner,[change('note','g8-t1-l01-006','x'.repeat(100001))]),/value/);await assert.rejects(changes(learner,Array(501).fill(change('note','g8-t1-l01-006','x'))),/batch/);});
test('profile updates participate in revision conflict detection',async()=>{const first=await changes(other,[change('profile','self',{displayName:'First',grade:8},1)]);assert.equal(first[0].revision,2);const stale=await changes(other,[change('profile','self',{displayName:'Second',grade:9},1)]);assert.equal(stale[0].conflict,true);});
test('save RPC derives ownership from the caller, ignoring supplied learner identifiers',async()=>{const k='g8-t1-l01-007::prompt-owner::response';await changes(other,[{...change('prompt',k,'other owns this'),learner_id:learner}]);assert.equal((await asUser(learner,'select * from public.prompt_responses where prompt_key=$1',[k])).rows.length,0);});

test('dispatch-time account changes cannot persist a different account snapshot',async()=>{await assert.rejects(asUser(other,'select public.save_learning_changes_for_account($1,$2)',[learner,JSON.stringify([change('note','g8-t1-l01-008','wrong account')])]),/active account changed/);assert.equal((await db.query('select * from public.lesson_notes where unit_id=$1',['g8-t1-l01-008'])).rows.length,0);});
test('settings patches preserve unrelated fields from another device',async()=>{await asUser(other,'select public.save_account_preferences($1)',[JSON.stringify({appearance:'dark'})]);await asUser(other,'select public.save_account_preferences($1)',[JSON.stringify({accent:'sage'})]);const row=(await asUser(other,'select appearance,accent from public.account_preferences')).rows[0];assert.deepEqual(row,{appearance:'dark',accent:'sage'});});
test('logged-out JWT claims cannot read private rows or save new work',async()=>{await db.query('delete from auth.sessions where user_id=$1',[other]);assert.equal((await asUser(other,'select * from public.prompt_responses')).rows.length,0);await assert.rejects(changes(other,[change('note','g8-t1-l01-008','revoked')]),/Sign in/);});
test('revoked administrator session cannot use privileged provisioning RPCs',async()=>{await db.query('delete from auth.sessions where user_id=$1',[admin]);assert.equal((await asUser(admin,'select public.is_platform_admin() as allowed')).rows[0].allowed,false);await assert.rejects(asUser(admin,"select public.create_school('Revoked','revoked')"),/administrators/);});
test('session belongs to its user, and expired sessions deny private access',async()=>{await db.query("update auth.sessions set not_after=now()-interval '1 second' where user_id=$1",[learner]);assert.equal((await asUser(learner,'select * from public.prompt_responses')).rows.length,0);await assert.rejects(changes(learner,[change('note','g8-t1-l01-009','expired')]),/Sign in/);});

test('fresh timestamp-ordered migrations support the account-bound save facade',async()=>{const fresh=new PGlite({extensions:{pgcrypto}});try{await fresh.exec(AUTH_FIXTURE_SQL);for(const file of fs.readdirSync('supabase/migrations').filter(x=>x.endsWith('.sql')).sort())await fresh.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));await fresh.query('insert into auth.users(id,email) values($1,$2)',[learner,'fresh@audit.invalid']);await fresh.query('insert into auth.sessions(id,user_id) values($1,$1)',[learner]);await fresh.exec('begin;set local role authenticated;');await fresh.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',json_build_object('session_id',$1)::text,true)",[learner]);const result=await fresh.query('select public.save_learning_changes_for_account($1,$2) as result',[learner,JSON.stringify([change('note','g8-t1-l01-001','fresh save')])]);assert.equal(result.rows[0].result[0].conflict,false);await fresh.exec('commit');}finally{await fresh.close();}});
