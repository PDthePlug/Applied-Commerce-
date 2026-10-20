import fs from 'node:fs';
import {typescriptModule} from './semantic-census.mjs';
const {sealContent,openContent}=await import(typescriptModule('lib/classroom/crypto.ts'));
export {sealContent,openContent};
if(process.argv[1]===new URL(import.meta.url).pathname){
 const [mode,input,keyFile,output]=process.argv.slice(2);
 if(!['seal','open'].includes(mode)||!input||!keyFile||!output)throw new Error('Usage: node scripts/classroom-content.mjs seal|open input key-file output');
 const key=Buffer.from(fs.readFileSync(keyFile,'utf8').trim(),'base64');
 const data=mode==='seal'?Buffer.from(JSON.stringify(sealContent(fs.readFileSync(input),key,'applied-commerce-classroom-v1'),null,2)+'\n'):openContent(JSON.parse(fs.readFileSync(input,'utf8')),key,'applied-commerce-classroom-v1');
 fs.writeFileSync(output,data,{mode:0o600});console.log(mode==='seal'?'Encrypted classroom artifact written.':'Private classroom artifact opened.');
}
