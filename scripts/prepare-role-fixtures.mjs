// Generates dedicated, confirmed test identities for an isolated stage.
// Does not contact a remote project. Apply the private SQL only to the approved
// test database. Confirmation here bootstraps role tests, not mail tests.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {validateTarget} from './lib/validation-target.mjs';
const directory=process.env.AC_ROLE_FIXTURES;
assert.ok(directory,'Set a private AC_ROLE_FIXTURES directory');
const config=validateTarget(JSON.parse(fs.readFileSync(directory+'/public-config.json')));
assert.ok(!fs.existsSync(directory+'/fixtures.json'),'Preserve existing fixture credentials; do not overwrite them');
fs.chmodSync(directory,0o700);
const run='audit-stage-'+Date.now();
const append=process.env.AC_APPEND_AUDIT_FIXTURES==='1';
if(append)assert.equal(config.projectRef,'inxshlumnhcgiahxqewe','Appending is limited to the approved synthetic South African stage');
const users={},values=[],identities=[];
const reportingLearners=[];
const quoted=value=>"'"+value.replaceAll("'","''")+"'";
const cryptoDB=new PGlite({extensions:{pgcrypto}});
try {
  await cryptoDB.exec('create extension if not exists pgcrypto;');
  for(const role of ['learner','other','facilitator','unassigned','schoolAdmin','platformAdmin',...(append?Array.from({length:5},(_,i)=>'reportLearner'+i):[])]){
    const id=randomUUID(),email=run+'-'+role.toLowerCase()+'@example.invalid',password=randomBytes(32).toString('base64url');
    const hash=(await cryptoDB.query("select crypt($1,gen_salt('bf',10)) as hash",[password])).rows[0].hash;
    if(role.startsWith('reportLearner'))reportingLearners.push({id,email,password});
    else users[role]={id,email,password};
    const metadata=JSON.stringify({display_name:run+' '+role});
    values.push(`(${quoted(id)},'00000000-0000-0000-0000-000000000000','authenticated','authenticated',${quoted(email)},${quoted(hash)},now(),'{"provider":"email","providers":["email"]}'::jsonb,${quoted(metadata)}::jsonb,now(),now(),'','','','',false)`);
    identities.push(`(${quoted(id)},${quoted(id)},${quoted(JSON.stringify({sub:id,email,email_verified:true,phone_verified:false}))}::jsonb,'email',now(),now(),now())`);
  }
  const sql=`begin;
do $fixtures$ begin ${append?"if exists(select 1 from auth.users where email is null or email !~ '^audit-stage-[0-9]+-[a-z0-9]+@example[.]invalid$') then raise exception 'Append refused: existing users are not dedicated audit fixtures'; end if;":"if exists(select 1 from auth.users) then raise exception 'Dedicated fixtures require an empty isolated project'; end if;"} end $fixtures$;
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change,is_super_admin) values ${values.join(',\n')};
insert into auth.identities(provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at) values ${identities.join(',\n')};
insert into private.platform_admins(user_id) values (${quoted(users.platformAdmin.id)});
commit;`;
  fs.writeFileSync(directory+'/fixtures.json',JSON.stringify({projectRef:config.projectRef,run,users,...(append?{reportingLearners}:{})},null,2),{mode:0o600});
  fs.writeFileSync(directory+'/bootstrap.sql',sql,{mode:0o600});
  console.log(JSON.stringify({prepared:true,projectRef:config.projectRef,accounts:Object.keys(users).length+reportingLearners.length,append}));
} finally { await cryptoDB.close(); }
