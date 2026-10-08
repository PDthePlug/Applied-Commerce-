"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Archive, BookOpenCheck, Database, NotebookPen } from "lucide-react";
import { curriculum } from "@/lib/curriculum";
import type { CurriculumIndex, GradeIndex } from "@/lib/types";
import { useLearningStore } from "@/lib/learning-store";
import { completedCountForGrade, evidenceResponseCount, noteCount, buildRecentActivity } from "@/lib/learner-record";
import { AuthPanel } from "@/components/auth-panel";
import { useAuth } from "@/lib/auth-context";

type UnitMeta={id:string;grade:number;term:number;label:string;title:string};

export function ProfileDashboard(){
 const [index,setIndex]=useState<CurriculumIndex|null>(null);
 const [meta,setMeta]=useState<Record<string,UnitMeta>>({});
 const {state,setProfile,syncError}=useLearningStore();
 const {user}=useAuth();

 useEffect(()=>{curriculum.index().then(setIndex)},[]);
 useEffect(()=>{
  if(!index)return;
  Promise.all(index.grades.map(g=>curriculum.grade(g.grade))).then(grades=>{
   const next:Record<string,UnitMeta>={};
   grades.forEach((g:GradeIndex)=>g.terms.forEach(t=>[...t.units,...t.assessments].forEach(u=>{next[u.id]={id:u.id,grade:g.grade,term:t.term,label:u.label,title:u.title};})));
   setMeta(next);
  });
 },[index]);

 const grade=state.profile?.grade??state.activeGrade??8;
 const gradeMeta=index?.grades.find(item=>item.grade===grade);
 const completed=completedCountForGrade(state,grade);
 const responseCount=evidenceResponseCount(state);
 const noteCountValue=noteCount(state);
 const pct=gradeMeta?.unitCount?Math.round(completed/gradeMeta.unitCount*100):0;
 const continueHref=state.lastOpened?"/learn/"+state.lastOpened.grade+"/term/"+state.lastOpened.term+"/"+state.lastOpened.unitId:"/learn/"+grade;
 const name=state.profile?.displayName?.trim()||"Learner";
 const gradeOptions=useMemo(()=>index?.grades.map(item=>item.grade)??[8,9,10,11,12],[index]);
 const recent=useMemo(()=>buildRecentActivity(state,6),[state]);

 return <div className="profile-page">
  <section className="profile-hero">
   <div><p className="eyebrow">Profile</p><h1>{name}</h1><p>Your Applied Commerce learning record, current grade and evidence at a glance.</p></div>
   <div className="profile-identity">
    <label>Name<input value={state.profile?.displayName??""} onChange={event=>setProfile({displayName:event.target.value})} placeholder="Add your name"/></label>
    <label>Current grade<select value={grade} onChange={event=>setProfile({grade:Number(event.target.value)})}>{gradeOptions.map(value=><option key={value} value={value}>Grade {value}</option>)}</select></label>
   </div>
  </section>

  <section className="profile-grid">
   <article className="profile-card"><div className="profile-card-icon"><BookOpenCheck aria-hidden="true"/></div><div><p className="eyebrow">Learning progress</p><h2>Grade {grade}</h2></div><strong className="metric">{pct}%</strong><p>{completed} of {gradeMeta?.unitCount??0} lessons complete.</p><Link href={continueHref}>Continue learning <ArrowRight/></Link></article>
   <article className="profile-card"><div className="profile-card-icon"><Archive aria-hidden="true"/></div><div><p className="eyebrow">Learning evidence</p><h2>Responses captured</h2></div><strong className="metric">{responseCount}</strong><p>Responses completed inside activities, reflections, tables, choices and portfolio work.</p><Link href="/portfolio">Open portfolio <ArrowRight/></Link></article>
   <article className="profile-card"><div className="profile-card-icon"><NotebookPen aria-hidden="true"/></div><div><p className="eyebrow">Personal notes</p><h2>Lesson notes</h2></div><strong className="metric">{noteCountValue}</strong><p>Extra notes you chose to keep while learning.</p><Link href="/portfolio">Review notes <ArrowRight/></Link></article>

   <section className="profile-history" aria-labelledby="learning-history-title">
    <div className="profile-history-heading"><div><p className="eyebrow">Learning history</p><h2 id="learning-history-title">Recent activity</h2></div><Link href="/portfolio">View evidence <ArrowRight/></Link></div>
    {recent.length===0?<p className="profile-history-empty">Activity will appear here as lessons are completed and learning evidence is captured.</p>:
     <div className="profile-history-list">{recent.map(item=>{const unit=meta[item.unitId];const href=unit?"/learn/"+unit.grade+"/term/"+unit.term+"/"+unit.id:continueHref;const label=item.kind==="completed"?"Lesson completed":item.kind==="response"?"Activity response saved":"Lesson note saved";return <Link className="profile-history-item" href={href} key={item.key}><span><strong>{label}</strong><small>{unit?unit.label+" · "+unit.title:"Learning record"}</small></span><time dateTime={item.at}>{new Date(item.at).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}</time><ArrowRight/></Link>})}</div>}
   </section>

   <AuthPanel compact />
   {syncError&&<p role="alert" className="auth-error">{syncError}</p>}
   <aside className="profile-record-note"><Database aria-hidden="true"/><div><strong>{user?"Your learning record is linked to this account.":"Your learning record currently stays on this device."}</strong><p>{user?"Changes continue to save locally first and sync to the account in the background.":"Create or sign in to an account to add cross-device recovery without losing the local record."}</p></div></aside>
  </section>
 </div>;
}
