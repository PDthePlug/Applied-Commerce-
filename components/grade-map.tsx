"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, FileText, LockOpen } from "lucide-react";
import { curriculum, gradeThemes } from "@/lib/curriculum";
import type { GradeIndex } from "@/lib/types";
import { useLearningStore } from "@/lib/learning-store";

export function GradeMap({grade}:{grade:number}){
 const [data,setData]=useState<GradeIndex|null>(null); const {completedIds}=useLearningStore();
 useEffect(()=>{curriculum.grade(grade).then(setData)},[grade]);
 const completed=useMemo(()=>data?data.terms.flatMap(t=>t.units).filter(u=>completedIds.has(u.id)).length:0,[data,completedIds]);
 const pct=data?.unitCount?Math.round(completed/data.unitCount*100):0;
 if(!data) return <div className="page loading-page">Opening Grade {grade}…</div>;
 return <div className="page grade-map-page">
  <Link className="back-link" href="/learn"><ArrowLeft/> All grades</Link>
  <section className="grade-hero">
   <div><p className="eyebrow">Grade {grade} · {gradeThemes[grade]}</p><h1>{data.title.replace(/^APPLIED COMMERCE\s*[—-]\s*/i,"")}</h1><p>Four-term Applied Commerce learning journey</p></div>
   <div className="grade-progress"><strong>{pct}%</strong><span>{completed} of {data.unitCount} lessons complete</span><div className="progress-track"><i style={{width:`${pct}%`}}/></div></div>
  </section>
  <div className="term-grid">
   {data.terms.map(term=>{
    const tc=term.units.filter(u=>completedIds.has(u.id)).length; const tp=term.unitCount?Math.round(tc/term.unitCount*100):0; const first=term.units[0];
    return <section className="term-card" key={term.term}>
      <header><span>0{term.term}</span><div><p>Term {term.term}</p><h2>{first?.title ?? "Term material"}</h2></div></header>
      <div className="term-stats"><span>{term.unitCount} lessons</span>{term.assessmentCount>0&&<span>{term.assessmentCount} mock exam{term.assessmentCount>1?"s":""}</span>}</div>
      <div className="progress-track small"><i style={{width:`${tp}%`}}/></div>
      <div className="term-preview">
       {term.units.slice(0,4).map(u=><div key={u.id} className="term-preview-row">{completedIds.has(u.id)?<Check/>:<LockOpen/>}<span>{u.label}</span><strong>{u.title}</strong></div>)}
       {term.unitCount>4&&<small>+ {term.unitCount-4} more lessons</small>}
      </div>
      {first?<Link className="term-open" href={`/learn/${grade}/term/${term.term}/${first.id}`}>Open Term {term.term}<ArrowRight/></Link>:<span className="term-empty"><FileText/> No lessons available for this term</span>}
    </section>
   })}
  </div>
 </div>
}
