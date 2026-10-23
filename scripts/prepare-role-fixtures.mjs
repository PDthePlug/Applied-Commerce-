// Staging-only supported Auth Admin provisioning. Private files stay outside git.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {validateTarget} from './lib/validation-target.mjs';
const directory=process.env.AC_ROLE_FIXTURES;
assert.ok(directory&&path.isAbsolute(directory),'Set an absolute private AC_ROLE_FIXTURES directory');
assert.ok(!path.resolve(directory).startsWith(process.cwd()+path.sep),'Fixtures must be outside the repository');
assert.equal(process.env.SUPABASE_PROJECT_REF,'inxshlumnhcgiahxqewe','Only the approved South African stage is supported');
const config=validateTarget({projectRef:process.env.SUPABASE_PROJECT_REF,url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY});
const secret=process.env.SUPABASE_SECRET_KEY;
assert.ok(secret,'Privately configure SUPABASE_SECRET_KEY');
fs.mkdirSync(directory,{recursive:true,mode:0o700});fs.chmodSync(directory,0o700);
const file=path.join(directory,'fixtures.json');
const fixtures=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)): {projectRef:config.projectRef,run:'audit-stage-'+Date.now(),users:{}};
assert.equal(fixtures.projectRef,config.projectRef);
const persist=()=>fs.writeFileSync(file,JSON.stringify(fixtures,null,2),{mode:0o600});
fs.writeFileSync(path.join(directory,'public-config.json'),JSON.stringify(config,null,2),{mode:0o600});
for(const role of ['learner','other','facilitator','unassigned','schoolAdmin','platformAdmin']){
 if(fixtures.users[role])continue;
 const email=fixtures.run+'-'+role.toLowerCase()+'@example.invalid',password=randomBytes(32).toString('base64url');
 const response=await fetch(config.url+'/auth/v1/admin/users',{method:'POST',signal:AbortSignal.timeout(30000),headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify({email,password,email_confirm:true,user_metadata:{full_name:'Synthetic classroom '+role}})});
 const result=await response.json();
 assert.equal(response.status,200,'Auth Admin provisioning failed (HTTP '+response.status+'); no credential response logged');
 assert.ok(result.id,'Auth Admin did not return an identity');
 fixtures.users[role]={id:result.id,email,password};persist();
}
// Apply this scoped synthetic registry row using SQL administration; never Auth SQL.
fs.writeFileSync(path.join(directory,'bootstrap.sql'),"insert into private.platform_admins(user_id) values ('"+fixtures.users.platformAdmin.id+"') on conflict (user_id) do nothing;\n",{mode:0o600});
console.log(JSON.stringify({prepared:true,projectRef:config.projectRef,accounts:Object.keys(fixtures.users).length,platformAdminId:fixtures.users.platformAdmin.id,authMethod:'supported Auth Admin API',bootstrapRegistryRequired:true}));
