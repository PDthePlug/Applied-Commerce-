"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { curriculum } from "@/lib/curriculum";
import type { CurriculumIndex } from "@/lib/types";
import { useLearningStore } from "@/lib/learning-store";

type ActiveLesson = {
  grade:number;
  term:number;
  label:string;
  title:string;
};

export function HomeDashboard(){
  const [index,setIndex]=useState<CurriculumIndex|null>(null);
  const [activeLesson,setActiveLesson]=useState<ActiveLesson|null>(null);
  const {state,hydrated}=useLearningStore();

  useEffect(()=>{
    curriculum.index().then(setIndex).catch(()=>setIndex(null));
  },[]);

  useEffect(()=>{
    const last=state.lastOpened;
    if(!last) return;
    let cancelled=false;
    curriculum.unit(last.grade,last.term,last.unitId)
      .then(unit=>{
        if(!cancelled) setActiveLesson({
          grade:last.grade,
          term:last.term,
          label:unit.label,
          title:unit.title,
        });
      })
      .catch(()=>{ if(!cancelled) setActiveLesson(null); });
    return ()=>{ cancelled=true; };
  },[state.lastOpened]);

  const currentGrade=state.profile?.grade ?? state.activeGrade ?? 8;
  const gradeMeta=index?.grades.find(item=>item.grade===currentGrade);
  const completed=Object.keys(state.completed).filter(id=>id.startsWith(`g${currentGrade}-`)).length;
  const progress=gradeMeta?.unitCount?Math.round(completed/gradeMeta.unitCount*100):0;
  const captured=Object.values(state.promptResponses).filter(value=>value.trim()).length;
  const displayName=state.profile?.displayName?.trim();
  const firstName=displayName?.split(/\s+/)[0];

  const lesson=state.lastOpened?activeLesson:null;
  const continueHref=state.lastOpened
    ? `/learn/${state.lastOpened.grade}/term/${state.lastOpened.term}/${state.lastOpened.unitId}`
    : `/learn/${currentGrade}`;

  const greeting=state.lastOpened
    ? `Good to see you${firstName?`, ${firstName}`:""}.`
    : firstName
      ? `Welcome, ${firstName}.`
      : "Welcome to Applied Commerce.";

  return <div className="page home-page bis-home">
    <section className="home-today-hero">
      <div className="home-welcome-copy">
        <p className="eyebrow">{state.lastOpened?"Today · Applied Commerce":"Applied Commerce · Your learning starts here"}</p>
        <h1>{greeting}</h1>
        <p className="home-principle">Commerce is not something you memorise. It is something you learn to use.</p>
        <p className="home-lede">
          {state.lastOpened
            ? "Pick up where you left off. Your learning, responses and portfolio evidence are ready when you are."
            : "Learn how money, work, value and opportunity connect to everyday life — then put what you learn into practice."}
        </p>
      </div>

      <aside className="home-today-status" aria-label="Current grade progress">
        <span>Grade {currentGrade}</span>
        <strong>{hydrated?`${progress}% complete`:"Loading progress"}</strong>
        <div className="home-progress-track" aria-hidden="true"><i style={{width:`${progress}%`}}/></div>
        <small>{hydrated?`${completed} of ${gradeMeta?.unitCount ?? 0} lessons complete`:"Preparing your learning record"}</small>
      </aside>
    </section>

    <section className="home-dashboard-grid" aria-label="Your learning today">
      <article className="home-dashboard-card home-continue-card">
        <p className="eyebrow">{state.lastOpened?"Continue your learning":"Start your learning"}</p>
        <h2>{lesson?lesson.title:`Grade ${currentGrade}`}</h2>
        <p>
          {lesson
            ? `Grade ${lesson.grade} · Term ${lesson.term} · ${lesson.label}. Pick up exactly where you left off.`
            : `Your Grade ${currentGrade} Applied Commerce journey is ready.`}
        </p>
        <small><BookOpenCheck/> {captured} responses captured so far</small>
        <Link className="home-primary-action" href={continueHref}>
          {state.lastOpened?"Continue learning":`Start Grade ${currentGrade}`} <ArrowRight/>
        </Link>
      </article>
    </section>

    <Link className="home-curriculum-link" href="/learn">View the full curriculum <ArrowRight/></Link>
  </div>;
}
