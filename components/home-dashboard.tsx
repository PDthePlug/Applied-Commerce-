"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Archive, BookOpenCheck, Sparkles } from "lucide-react";
import { curriculum } from "@/lib/curriculum";
import type { CurriculumIndex } from "@/lib/types";
import { useLearningStore } from "@/lib/learning-store";

export function HomeDashboard(){
  const [index,setIndex]=useState<CurriculumIndex|null>(null);
  const {state,hydrated}=useLearningStore();

  useEffect(()=>{
    curriculum.index().then(setIndex).catch(()=>setIndex(null));
  },[]);

  const currentGrade=state.profile?.grade ?? state.activeGrade ?? 8;
  const gradeMeta=index?.grades.find(item=>item.grade===currentGrade);
  const completed=Object.keys(state.completed).filter(id=>id.startsWith(`g${currentGrade}-`)).length;
  const progress=gradeMeta?.unitCount?Math.round(completed/gradeMeta.unitCount*100):0;
  const captured=Object.values(state.promptResponses).filter(value=>value.trim()).length;
  const displayName=state.profile?.displayName?.trim();
  const firstName=displayName?.split(/\s+/)[0];

  const continueHref=state.lastOpened
    ? `/learn/${state.lastOpened.grade}/term/${state.lastOpened.term}/${state.lastOpened.unitId}`
    : `/learn/${currentGrade}`;

  const eyebrow=state.lastOpened
    ? `Welcome back${firstName?`, ${firstName}`:""}`
    : `Welcome to Applied Commerce${firstName?`, ${firstName}`:""}`;

  const supportingCopy=state.lastOpened
    ? "Pick up where you left off. Your learning, responses and portfolio evidence are ready when you are."
    : "Learn how money, work, value and opportunity connect to everyday life — then put what you learn into practice.";

  const metricLabel=!hydrated
    ? "Loading progress"
    : progress===0
      ? "Ready to begin"
      : progress===100
        ? "Grade complete"
        : "Grade progress";

  return <div className="page home-page">
    <section className="hero home-dashboard-hero">
      <p className="eyebrow">{eyebrow}</p>
      <h1>Commerce is not something you memorise.<br/><em>It is something you learn to use.</em></h1>
      <p className="hero-copy">{supportingCopy}</p>

      <div className="hero-actions">
        <Link className="primary-button" href={continueHref}>
          {state.lastOpened?"Continue learning":`Start Grade ${currentGrade}`}<ArrowRight/>
        </Link>
        <Link className="text-link" href="/learn">View the full curriculum <ArrowRight/></Link>
      </div>

      <div className="hero-metrics learner-metrics" aria-label="Your learning overview">
        <div>
          <BookOpenCheck/>
          <strong>Grade {currentGrade}</strong>
          <span>Your current grade</span>
        </div>
        <div>
          <Sparkles/>
          <strong>{hydrated?`${progress}%`:"—"}</strong>
          <span>{metricLabel}</span>
        </div>
        <div>
          <Archive/>
          <strong>{hydrated?captured:"—"}</strong>
          <span>responses captured</span>
        </div>
      </div>
    </section>
  </div>;
}
