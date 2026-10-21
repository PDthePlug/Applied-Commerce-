// Run after the real application build, with private input paths only.
import fs from 'node:fs';import path from 'node:path';import {openContent}from './classroom-content.mjs';
const index=process.argv.indexOf('--key-file');if(index<0||!process.argv[index+1])throw new Error('Provide a private --key-file path.');
const keyText=fs.readFileSync(process.argv[index+1],'utf8').trim();const envelope=JSON.parse(fs.readFileSync('content/instructional/benchmark-guides.v1.enc.json','utf8'));
const payload=JSON.parse(openContent(envelope,Buffer.from(keyText,'base64'),'applied-commerce-classroom-v1').toString('utf8'));
const sentinels=[keyText,...payload.guides.flatMap(guide=>[...guide.understandingChecks.map(check=>check.secureReasoning),...guide.discussion.map(item=>item.indicativeReasoning)])];
const contextual=JSON.parse(openContent(JSON.parse(fs.readFileSync('content/instructional/g8-t1-l08-008.contextual.v1.enc.json','utf8')),Buffer.from(keyText,'base64'),'applied-commerce-classroom-v1').toString('utf8'));
sentinels.push(...Object.values(contextual.distinction),...Object.values(contextual.transitions),...Object.values(contextual.activities).flatMap(item=>[item.title,item.text]));
let checked=0;function walk(folder){for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,entry.name);if(entry.isDirectory())walk(file);else{const bytes=fs.readFileSync(file);checked++;if(sentinels.some(value=>bytes.includes(Buffer.from(value))))throw new Error('Private classroom material was found in a public asset.');}}}
if(!fs.existsSync('.next/static'))throw new Error('Build the real application first.');walk('.next/static');walk('public');console.log(JSON.stringify({ok:true,publicAssetsChecked:checked,privateSentinelsChecked:sentinels.length,keyExported:false}));
