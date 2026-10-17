"use client";
import { useEffect, useState } from "react";
import { curriculum } from "@/lib/curriculum";
import type { CurriculumIndex } from "@/lib/types";
import { GradeCard } from "./grade-card";
import { useLearningStore } from "@/lib/learning-store";
import { lessonProgress } from "@/lib/learning-progress";

export function LearnLibrary(){
 const [index,setIndex]=useState<CurriculumIndex|null>(null); const {state,hydrated}=useLearningStore();
 const [error,setError]=useState(false);const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let cancelled=false;
  void curriculum.index().then(value=>{
   if(value.grades.some(grade=>!Array.isArray(grade.lessonIds)))throw new Error('Lesson catalogue unavailable');
   if(!cancelled)setIndex(value);
  }).catch(()=>{if(!cancelled)setError(true);});
  return ()=>{cancelled=true;};
 },[attempt]);
 const progress=index?lessonProgress(index,state.completed):null;
 return <div className="page library-page"><section className="page-intro"><p className="eyebrow">Curriculum library</p><h1>Five grades. One learning journey.</h1><p>Select a grade to open its four-term map. Lesson numbering, projects and assessments follow the authored curriculum.</p></section>
  {error?<p role="alert">Your saved work is preserved, but the lesson catalogue could not be loaded. <button type="button" className="text-link" onClick={()=>{setError(false);setAttempt(value=>value+1);}}>Try again</button></p>:!index||!hydrated?<p role="status">Preparing the curriculum library…</p>:<div className="grade-grid compact">{index.grades.map(g=><GradeCard key={g.grade} grade={g} completed={progress?.grades.find(item=>item.grade===g.grade)?.done??0}/>)}</div>}
 </div>;
}
