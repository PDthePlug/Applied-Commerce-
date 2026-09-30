"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, NotebookPen } from "lucide-react";
import { curriculum } from "@/lib/curriculum";
import type { GradeIndex, UnitSummary } from "@/lib/types";
import { useLearningStore } from "@/lib/learning-store";

type Meta = UnitSummary & {grade:number;term:number};
export function PortfolioDashboard(){
 const {state}=useLearningStore(); const [meta,setMeta]=useState<Record<string,Meta>>({});
 useEffect(()=>{(async()=>{const idx=await curriculum.index();const grades=await Promise.all(idx.grades.map(g=>curriculum.grade(g.grade)));const m:Record<string,Meta>={};grades.forEach((g:GradeIndex)=>g.terms.forEach(t=>[...t.units,...t.assessments].forEach(u=>m[u.id]={...u,grade:g.grade,term:t.term})));setMeta(m);})();},[]);
 const entries=useMemo(()=>Object.entries(state.responses).filter(([,v])=>v.trim()).map(([id,value])=>({id,value,meta:meta[id]})).filter(x=>x.meta),[state.responses,meta]);
 return <div className="page portfolio-page"><section className="page-intro"><p className="eyebrow">Learner portfolio</p><h1>Your thinking, in your own words.</h1><p>Responses you save while learning appear here as a growing evidence trail.</p></section>{entries.length===0?<section className="empty-state"><NotebookPen/><h2>Your portfolio is ready.</h2><p>Open a lesson, work through its prompts, and save your notes or responses. They will collect here.</p><Link className="primary-button" href="/learn">Open curriculum <ArrowRight/></Link></section>:<div className="portfolio-list">{entries.map(e=><article key={e.id}><header><div><p>Grade {e.meta.grade} · Term {e.meta.term} · {e.meta.label}</p><h2>{e.meta.title}</h2></div><Link href={`/learn/${e.meta.grade}/term/${e.meta.term}/${e.id}`}>Open <ArrowRight/></Link></header><p>{e.value}</p></article>)}</div>}</div>
}
