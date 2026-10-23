// Run explicitly in the staging server build after `npm run build`.
// The existing validator receives the bound Secret through a pipe, never argv,
// a temporary key file, client output or a publicly callable test endpoint.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
const expectedPlans=JSON.parse(fs.readFileSync('content/instructional/teaching-manifest.v2.json')).plans.length;
const key=process.env.AC_CLASSROOM_CONTENT_KEY;
if(!key){console.error('Private classroom release verification: server Secret is missing.');process.exit(1);}
const result=spawnSync(process.execPath,['scripts/classroom-release.mjs','--key-file','-'],{input:key,encoding:'utf8',timeout:60_000});
if(result.status!==0){console.error('Private classroom release verification failed.');process.exit(1);}
try{
 const summary=JSON.parse(result.stdout);
 if(summary.ok!==true||summary.guides!==5||summary.periods!==7||summary.contextualEnrichment!=="PASS"||summary.contextualInstructionalFields!==100||summary.privateKeyExported!==false)throw new Error();
 const teachingResult=spawnSync(process.execPath,['scripts/teaching-release.mjs','--key-file','-'],{input:key,encoding:'utf8',timeout:60_000});
 if(teachingResult.status!==0)throw new Error();
 const teaching=JSON.parse(teachingResult.stdout);if(teaching.ok!==true||teaching.grade8Term1!==20||teaching.teachingPlans!==expectedPlans||teaching.privateKeyExported!==false)throw new Error();
 console.log(JSON.stringify({teachingPlans:teaching.teachingPlans,termLessons:teaching.grade8Term1,teachingPeriods:teaching.periods,instructionalFields:teaching.instructionalFields,classroomServerBuildVerification:'PASS',guides:summary.guides,periods:summary.periods,contextualEnrichment:summary.contextualEnrichment,contextualInstructionalFields:summary.contextualInstructionalFields,privateKeyExported:false,runtimeEducatorLearnerAccess:'NOT TESTED'}));
}catch{console.error('Private classroom release verification returned an invalid summary.');process.exit(1);}
