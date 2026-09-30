"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { curriculum, gradeThemes } from "@/lib/curriculum";
import type { CurriculumIndex } from "@/lib/types";
import { useLearningStore } from "@/lib/learning-store";

export function ProgressDashboard(){
 const [index,setIndex]=useState<CurriculumIndex|null>(null); const {state}=useLearningStore(); useEffect(()=>{curriculum.index().then(setIndex)},[]);
 const total=index?.grades.reduce((n,g)=>n+g.unitCount,0)??0; const done=Object.keys(state.completed).length; const pct=total?Math.round(done/total*100):0;
 return <div className="page progress-page"><section className="page-intro"><p className="eyebrow">Progress</p><h1>See the work accumulating.</h1><p>Completion is tracked lesson by lesson on this device.</p></section><section className="progress-overview"><div><strong>{pct}%</strong><span>of the complete Grade 8–12 lesson map</span></div><div className="progress-track"><i style={{width:`${pct}%`}}/></div><p>{done} of {total} lessons complete</p></section><div className="progress-grade-list">{index?.grades.map(g=>{const c=Object.keys(state.completed).filter(id=>id.startsWith(`g${g.grade}-`)).length;const p=g.unitCount?Math.round(c/g.unitCount*100):0;return <Link href={`/learn/${g.grade}`} key={g.grade}><span className="progress-grade-number">{g.grade}</span><div><p>{gradeThemes[g.grade]}</p><strong>Grade {g.grade}</strong><small>{c} of {g.unitCount} completed</small></div><div className="progress-track"><i style={{width:`${p}%`}}/></div>{p===100?<CheckCircle2/>:<ArrowRight/>}</Link>})}</div></div>
}
