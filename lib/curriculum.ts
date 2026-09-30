import type { CurriculumIndex, GradeIndex, TermIndex, UnitContent, UnitSummary } from "./types";

type GradeBundle = {
  grade:number;
  title:string;
  bookTitle:string;
  sourceFile:string;
  preface:GradeIndex["preface"];
  terms:Array<{term:number;intro:GradeIndex["preface"];units:UnitContent[]}>;
};

async function getJson<T>(url:string):Promise<T>{
  const response=await fetch(url,{cache:"force-cache"});
  if(!response.ok) throw new Error(`Could not load curriculum content (${response.status}).`);
  return response.json() as Promise<T>;
}

let indexPromise: Promise<CurriculumIndex> | null = null;
const loadIndex=()=>indexPromise ??= getJson<CurriculumIndex>("/curriculum/index.json");
const bundleCache=new Map<number,Promise<GradeBundle>>();

async function loadBundle(grade:number):Promise<GradeBundle>{
  const cached=bundleCache.get(grade); if(cached) return cached;
  const promise=(async()=>{
    const index=await loadIndex();
    const meta=index.grades.find(item=>item.grade===grade);
    if(!meta) throw new Error(`Grade ${grade} is not in this curriculum.`);
    const partResponses=await Promise.all(Array.from({length:meta.bundleParts},(_,i)=>
      fetch(`/curriculum/grade-${grade}.part-${i+1}.b64`,{cache:"force-cache"})
    ));
    if(partResponses.some(response=>!response.ok)) throw new Error(`Could not load Grade ${grade}.`);
    if(!(globalThis as typeof globalThis & {DecompressionStream?:typeof DecompressionStream}).DecompressionStream) throw new Error("This browser cannot open compressed curriculum content.");
    const encoded=(await Promise.all(partResponses.map(response=>response.text()))).join("").replace(/\s+/g,"");
    const binary=atob(encoded); const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return JSON.parse(await new Response(stream).text()) as GradeBundle;
  })();
  bundleCache.set(grade,promise); return promise;
}

function summary(u:UnitContent):UnitSummary{
  return {id:u.id,type:u.type,label:u.label,title:u.title,startLesson:u.startLesson,endLesson:u.endLesson};
}

export const curriculum={
  index:()=>loadIndex(),
  grade:async(grade:number):Promise<GradeIndex>=>{
    const b=await loadBundle(grade);
    const terms=b.terms.map(t=>{
      const lessons=t.units.filter(u=>u.type==="lesson").map(summary);
      const assessments=t.units.filter(u=>u.type==="assessment").map(summary);
      return {term:t.term,unitCount:lessons.length,assessmentCount:assessments.length,units:lessons,assessments};
    });
    return {grade:b.grade,title:b.title,bookTitle:b.bookTitle,sourceFile:b.sourceFile,preface:b.preface,unitCount:terms.reduce((n,t)=>n+t.unitCount,0),terms};
  },
  term:async(grade:number,term:number):Promise<TermIndex>=>{
    const b=await loadBundle(grade); const t=b.terms.find(x=>x.term===term); if(!t) throw new Error("Term not found.");
    return {term,intro:t.intro,units:t.units.filter(u=>u.type==="lesson").map(summary),assessments:t.units.filter(u=>u.type==="assessment").map(summary)};
  },
  unit:async(grade:number,term:number,unitId:string):Promise<UnitContent>=>{
    const b=await loadBundle(grade); const t=b.terms.find(x=>x.term===term); const u=t?.units.find(x=>x.id===unitId); if(!u) throw new Error("Lesson not found."); return u;
  }
};

export const gradeThemes:Record<number,string>={8:"Mindset & Financial Philosophy",9:"Work, Value & Enterprise",10:"Building Lasting Value",11:"The Leverage Year",12:"The Launch Year"};
