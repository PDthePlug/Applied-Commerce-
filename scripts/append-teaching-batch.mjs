// Append individually reviewed private drafts using the ORIGINAL key. Validate
// everything and perform an authenticated round trip before writing ciphertext.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {openContent,sealContent}from './classroom-content.mjs';
import {runtimeUnits}from './semantic-census.mjs';import {assembleTeachingBatch}from './lib/teaching-batch.mjs';
import {digest}from './classroom-inventory.mjs';
process.umask(0o077);
const arg=name=>{const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1];};
let phase='arguments';
const files={encrypted:'content/instructional/teaching-plans.v2.enc.json',manifest:'content/instructional/teaching-manifest.v2.json',availability:'content/instructional/teaching-availability.v2.json'};
try{
 const privateDir=arg('--draft-dir'),version=arg('--version');assert.ok(privateDir&&version,'Private draft directory and new version required');
 const privateRoot=fs.realpathSync(privateDir),checkout=fs.realpathSync(process.cwd());assert.ok(!privateRoot.startsWith(checkout+path.sep)||privateRoot.startsWith(path.join(checkout,'work')+path.sep),'Authoring must remain outside tracked source');assert.equal(fs.statSync(privateRoot).mode&0o077,0,'Authoring directory must be protected');
 phase='key-availability';const keyFile=arg('--key-file')??process.env.AC_CLASSROOM_CONTENT_KEY_FILE;
 const keyText=keyFile?fs.readFileSync(keyFile==='-'?0:keyFile,'utf8'):process.env.AC_CLASSROOM_CONTENT_KEY;
 assert.ok(keyText,'Original classroom key is not available to this process');const key=Buffer.from(keyText.trim(),'base64');assert.equal(key.length,32,'Original classroom key is not usable for local cryptography');
 const context='applied-commerce-classroom-v1',envelope=JSON.parse(fs.readFileSync(files.encrypted));
 // Successful authenticated decryption proves it is the existing release key.
 phase='original-key-authentication';const payload=JSON.parse(openContent(envelope,key,context));
 const manifest=JSON.parse(fs.readFileSync(files.manifest)),availability=JSON.parse(fs.readFileSync(files.availability));
 const drafts=fs.readdirSync(privateDir).filter(name=>/^g\d+-t\d+-.*\.json$/.test(name)).sort().map(name=>JSON.parse(fs.readFileSync(path.join(privateDir,name))));
 phase='source-and-draft-validation';const assembled=assembleTeachingBatch({payload,manifest,availability,drafts,units:await runtimeUnits(),version});
 phase='authenticated-round-trip';const sealed=sealContent(Buffer.from(JSON.stringify(assembled.payload)),key,context);assert.equal(sealed.keyId,envelope.keyId,'Original classroom key identity differs');assert.equal(digest(JSON.parse(openContent(sealed,key,context))),digest(assembled.payload),'Authenticated release round trip failed');
 // Prepare every file before replacing any; no plaintext is written to disk.
 const writes=[[files.encrypted,sealed],[files.manifest,assembled.manifest],[files.availability,assembled.availability]];
 phase='release-files';const originals=new Map(writes.map(([file])=>[file,fs.readFileSync(file)]));
 for(const [file,data]of writes)fs.writeFileSync(file+'.pending',JSON.stringify(data,null,2)+'\n',{mode:0o600});
 try{for(const [file]of writes)fs.renameSync(file+'.pending',file);}catch(error){for(const [file,data]of originals)fs.writeFileSync(file,data,{mode:0o600});throw error;}
 console.log(JSON.stringify({...assembled.summary,originalKeyAuthenticated:true,plaintextWritten:false,educationalApproval:'Individual drafts; hosted and educator review still required'}));
}catch{for(const file of Object.values(files))fs.rmSync(file+'.pending',{force:true});console.error(JSON.stringify({status:'FAIL',stage:phase,message:'Private batch packaging did not complete. No key or teaching prose was logged.'}));process.exitCode=1;}
