"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Layers3, NotebookPen } from "lucide-react";
import { curriculum } from "@/lib/curriculum";
import type { CurriculumIndex } from "@/lib/types";
import { useLearningStore } from "@/lib/learning-store";
import { GradeCard } from "./grade-card";

export function HomeDashboard(){
  const [index,setIndex]=useState<CurriculumIndex|null>(null);
  const {state,hydrated}=useLearningStore();
  useEffect(()=>{curriculum.index().then(setIndex).catch(()=>setIndex(null));},[]);
  const completedFor=(grade:number)=>Object.keys(state.completed).filter(id=>id.startsWith(`g${grade}-`)).length;
  return <div className="page home-page">
    <section className="hero">
      <p className="eyebrow">Applied Commerce® · Grades 8–12</p>
      <h1>Commerce is not something you memorise.<br/><em>It is something you learn to use.</em></h1>
      <p className="hero-copy">The learner books become a focused digital journey: lessons, stories, activities, reflections, checkpoints, portfolios and projects — in the sequence they were authored.</p>
      <div className="hero-actions">
        <Link className="primary-button" href={state.lastOpened?`/learn/${state.lastOpened.grade}/term/${state.lastOpened.term}/${state.lastOpened.unitId}`:"/learn/8"}>{state.lastOpened?"Continue learning":"Start with Grade 8"}<ArrowRight/></Link>
        <Link className="text-link" href="/learn">View the full curriculum <ArrowRight/></Link>
      </div>
      <div className="hero-metrics">
        <div><BookOpenCheck/><strong>5 grades</strong><span>Grade 8 through Grade 12</span></div>
        <div><Layers3/><strong>20 terms</strong><span>Four terms per grade</span></div>
        <div><NotebookPen/><strong>Evidence-led</strong><span>Responses saved into a learner portfolio</span></div>
      </div>
    </section>

    <section className="grade-section">
      <div className="section-heading"><div><p className="eyebrow">Your curriculum</p><h2>Choose where you are learning.</h2></div><p>Each grade keeps its own authored sequence. Nothing is flattened into generic modules.</p></div>
      <div className="grade-grid">
        {index?.grades.map(g=><GradeCard key={g.grade} grade={g} completed={hydrated?completedFor(g.grade):0}/>) ?? Array.from({length:5},(_,i)=><div className="grade-card skeleton" key={i}/>) }
      </div>
    </section>
  </div>
}
