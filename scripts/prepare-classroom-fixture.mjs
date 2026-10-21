// This creates an isolated copy, never a runtime bypass in the real application.
// Private guidance and browser evidence stay under ignored work/.
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();const target=path.join(root,'work/classroom/fixture-app');
if(!fs.existsSync('work/classroom/private/content.classroom-key'))throw new Error('Private classroom release key is required; see docs/classroom/IMPLEMENTATION.md.');
fs.mkdirSync(target,{recursive:true});
for(const name of ['app','components','lib','content/instructional','public']){
 fs.rmSync(path.join(target,name),{recursive:true,force:true});fs.cpSync(name,path.join(target,name),{recursive:true});
}
for(const name of ['package.json','package-lock.json','tsconfig.json','next-env.d.ts','next.config.ts','postcss.config.mjs'])if(fs.existsSync(name))fs.copyFileSync(name,path.join(target,name));
const config=path.join(target,'next.config.ts');fs.writeFileSync(config,fs.readFileSync(config,'utf8').replace('reactStrictMode: true,',`reactStrictMode: true, outputFileTracingRoot: ${JSON.stringify(target)},`));
if(!fs.existsSync(path.join(target,'node_modules')))fs.symlinkSync(path.join(root,'node_modules'),path.join(target,'node_modules'),'dir');
fs.writeFileSync(path.join(target,'lib/auth-context.tsx'),`"use client";
import {createContext,useContext,useEffect,useState} from "react";
import type {User,Session} from "@supabase/supabase-js";
const teacher={id:"classroom-fixture-teacher",email:"teacher@example.invalid",aud:"authenticated",app_metadata:{},user_metadata:{},created_at:"2026-10-20T00:00:00Z"} as User;
const Context=createContext<{user:User|null;session:Session|null;loading:boolean}>({user:teacher,session:null,loading:false});
export function isSupabaseConfigured(){return false;}
export function AuthProvider({children}:{children:React.ReactNode}){const [user,setUser]=useState<User|null>(teacher);useEffect(()=>{const update=(event:Event)=>setUser((event as CustomEvent).detail==="guest"?null:{...teacher,id:(event as CustomEvent).detail});window.addEventListener("classroom-fixture-auth",update);return()=>window.removeEventListener("classroom-fixture-auth",update);},[]);return <Context.Provider value={{user,session:null,loading:false}}>{children}</Context.Provider>;}
export function useAuth(){return useContext(Context);}
`);
fs.writeFileSync(path.join(target,'app/api/classroom/route.ts'),`// ISOLATED GENERATED FIXTURE ONLY. Not copied into the production application.
import {classroomCatalog,loadClassroomGuides,loadContextualEnrichment,loadTeachingPlan} from "@/lib/classroom/private-library";
export const dynamic="force-dynamic";
export async function GET(request:Request){const id=new URL(request.url).searchParams.get("lesson")??"g8-t1-l08-008";const selected=classroomCatalog.find(item=>item.id===id);if(!selected)return Response.json({error:"Unknown fixture lesson"},{status:404});const guide=selected.benchmark?(await loadClassroomGuides()).find(item=>item.lessonId===id):null;const contextual=guide?await loadContextualEnrichment(guide):null;const plan=await loadTeachingPlan(id);return Response.json({catalog:classroomCatalog,selected,guide,contextual,plan},{headers:{"Cache-Control":"private, no-store","X-AC-Fixture":"synthetic-classroom-ui"}});}
`);
console.log('Prepared isolated classroom UI fixture copy. No real-role validation or database access.');
