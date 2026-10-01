import type { CurriculumIndex, GradeIndex, TermIndex, UnitContent, UnitSummary } from "./types";

type GradeBundle = {
  grade:number;
  title:string;
  bookTitle:string;
  sourceFile:string;
  preface:GradeIndex["preface"];
  terms:Array<{term:number;intro:GradeIndex["preface"];units:UnitContent[]}>;
};

type GradePatch = {
  grade:number;
  term:number;
  intro?:GradeIndex["preface"];
  units:UnitContent[];
};

async function getJson<T>(url:string):Promise<T>{
  const response=await fetch(url,{cache:"force-cache"});
  if(!response.ok) throw new Error(`Could not load curriculum content (${response.status}).`);
  return response.json() as Promise<T>;
}

async function decodeCompressedJson<T>(encoded:string):Promise<T>{
  if(!(globalThis as typeof globalThis & {DecompressionStream?:typeof DecompressionStream}).DecompressionStream){
    throw new Error("This browser cannot open compressed curriculum content.");
  }
  const binary=atob(encoded.replace(/\s+/g,""));
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text()) as T;
}

async function loadCompressedParts(paths:string[],label:string){
  const responses=await Promise.all(paths.map(path=>
    fetch(path.startsWith("/")?path:`/curriculum/${path}`,{cache:"force-cache"})
  ));
  if(responses.some(response=>!response.ok)) throw new Error(`Could not load ${label}.`);
  return (await Promise.all(responses.map(response=>response.text()))).join("");
}

function normalizeRestoredGrade9Term2Unit(unit:UnitContent):UnitContent{
  const lesson=unit.startLesson;
  if(
    unit.grade!==9 ||
    unit.term!==2 ||
    unit.type!=="lesson" ||
    typeof lesson!=="number" ||
    lesson<23 ||
    lesson>34
  ) return unit;

  let removeCapsTable=false;
  const blocks=unit.blocks.flatMap<ContentBlock>(block=>{
    if(block.kind==="text"){
      const text=block.text.trim();

      if(/^CAPS Integration$/i.test(text)){
        removeCapsTable=true;
        return [];
      }

      if(
        /^Pride 2\.0 executing\.?$/i.test(text) ||
        /^I will now complete Lessons 24[–-]34\b/i.test(text)
      ){
        return [];
      }

      if(/^💭\s*Truth\s*\/\s*Danger\s*\/\s*Your Move\s*$/i.test(text)){
        removeCapsTable=false;
        return [{...block,text:"💭 Deepening Insight"}];
      }

      if(removeCapsTable) removeCapsTable=false;
      return [block];
    }

    if(removeCapsTable&&block.kind==="table"){
      removeCapsTable=false;
      return [];
    }

    removeCapsTable=false;
    return [block];
  });

  return {...unit,blocks};
}

function applyPatch(bundle:GradeBundle,patch:GradePatch){
  if(patch.grade!==bundle.grade) throw new Error(`Curriculum patch does not belong to Grade ${bundle.grade}.`);
  const target=bundle.terms.find(term=>term.term===patch.term);
  if(!target) throw new Error(`Curriculum patch targets missing Term ${patch.term}.`);

  if(patch.intro) target.intro=patch.intro;

  const patchedLessonNumbers=new Set(
    patch.units
      .filter(unit=>unit.type==="lesson"&&typeof unit.startLesson==="number")
      .map(unit=>unit.startLesson as number)
  );

  target.units=[
    ...target.units.filter(unit=>!(
      unit.type==="lesson" &&
      typeof unit.startLesson==="number" &&
      patchedLessonNumbers.has(unit.startLesson)
    )),
    ...patch.units,
  ].sort((a,b)=>{
    const typeOrder=(a.type==="lesson"?0:1)-(b.type==="lesson"?0:1);
    if(typeOrder) return typeOrder;
    const lessonOrder=(a.startLesson??Number.MAX_SAFE_INTEGER)-(b.startLesson??Number.MAX_SAFE_INTEGER);
    if(lessonOrder) return lessonOrder;
    return a.position-b.position;
  });

  target.units=target.units.map(normalizeRestoredGrade9Term2Unit);
  target.units.forEach((unit,index)=>{ unit.position=index; });
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

    const basePaths=Array.from({length:meta.bundleParts},(_,i)=>`grade-${grade}.part-${i+1}.b64`);
    const bundle=await decodeCompressedJson<GradeBundle>(
      await loadCompressedParts(basePaths,`Grade ${grade}`)
    );

    for(const patchMeta of meta.patches??[]){
      const patch=await decodeCompressedJson<GradePatch>(
        await loadCompressedParts(patchMeta.parts,`Grade ${grade} Term ${patchMeta.term} correction`)
      );
      if(patch.term!==patchMeta.term) throw new Error(`Grade ${grade} curriculum patch metadata does not match its content.`);
      applyPatch(bundle,patch);
    }

    return bundle;
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
