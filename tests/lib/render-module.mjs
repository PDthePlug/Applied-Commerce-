import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const require=createRequire(import.meta.url);
export function renderModule(entry,overrides={}){
 const cache=new Map();
 function url(file){
  file=path.resolve(file);if(cache.has(file))return cache.get(file);
  if(file.endsWith('.json')){
   const result='data:text/javascript;base64,'+Buffer.from('export default '+fs.readFileSync(file,'utf8')+';').toString('base64');cache.set(file,result);return result;
  }
  let code=ts.transpileModule(overrides[file]??fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  code=code.replace(/from "([^"]+)"/g,(_,ref)=>{
   if(ref.startsWith('@/')||ref.startsWith('.')){
    const base=ref.startsWith('@/')?path.resolve(ref.slice(2)):path.resolve(path.dirname(file),ref);
    const target=['.ts','.tsx',''].map(suffix=>base+suffix).find(candidate=>fs.existsSync(candidate));
    return `from "${url(target)}"`;
   }
   return `from "${pathToFileURL(require.resolve(ref))}"`;
  });
  const result='data:text/javascript;base64,'+Buffer.from(code).toString('base64');cache.set(file,result);return result;
 }
 return url(entry);
}
