"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { curriculum, gradeThemes } from "@/lib/curriculum";
import type { CurriculumIndex } from "@/lib/types";
import { useLearningStore } from "@/lib/learning-store";
import { lessonProgress } from "@/lib/learning-progress";

export function ProgressDashboard(){
 const [index,setIndex]=useState<CurriculumIndex|null>(null);
 const [error,setError]=useState(false);
 const {state}=useLearningStore();
 useEffect(()=>{
  let cancelled=false;
  void curriculum.index().then(value=>{
   if(value.grades.some(grade=>!Array.isArray(grade.lessonIds)))throw new Error('Lesson catalogue unavailable');
   if(!cancelled)setIndex(value);
  }).catch(()=>{if(!cancelled)setError(true);});
  return ()=>{cancelled=true;};
 },[]);
 const progress=index?lessonProgress(index,state.completed):null;
 return <div className="page progress-page">
  <section className="page-intro"><p className="eyebrow">Progress</p><h1>See the work accumulating.</h1><p>Saved completion across the current Grade 8–12 lesson map.</p></section>
  {error?<p role="alert">Your saved completion is preserved, but the lesson map could not be loaded. <button type="button" className="text-link" onClick={()=>window.location.reload()}>Try again</button></p>:!progress?<p role="status">Preparing your lesson progress…</p>:<>
   <section className="progress-overview"><div><strong>{progress.percent}%</strong><span>of the complete Grade 8–12 lesson map</span></div><div className="progress-track"><i style={{width:`${progress.percent}%`}}/></div><p>{progress.done} of {progress.total} lessons complete</p></section>
   <div className="progress-grade-list">{progress.grades.map(grade=><Link href={`/learn/${grade.grade}`} key={grade.grade}><span className="progress-grade-number">{grade.grade}</span><div><p>{gradeThemes[grade.grade]}</p><strong>Grade {grade.grade}</strong><small>{grade.done} of {grade.total} completed</small></div><div className="progress-track"><i style={{width:`${grade.percent}%`}}/></div>{grade.percent===100?<CheckCircle2/>:<ArrowRight/>}</Link>)}</div>
  </>}
 </div>;
}
