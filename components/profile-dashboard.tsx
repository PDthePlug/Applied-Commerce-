"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Database } from "lucide-react";
import { curriculum } from "@/lib/curriculum";
import type { CurriculumIndex } from "@/lib/types";
import { useLearningStore } from "@/lib/learning-store";
import { completedCountForGrade } from "@/lib/learner-record";
import { AuthPanel } from "@/components/auth-panel";
import { useAuth } from "@/lib/auth-context";

export function ProfileDashboard(){
 const [index,setIndex]=useState<CurriculumIndex|null>(null);
 const {state,setProfile,syncError}=useLearningStore();
 const {user}=useAuth();

 useEffect(()=>{curriculum.index().then(setIndex)},[]);

 const grade=state.profile?.grade??state.activeGrade??8;
 const gradeMeta=index?.grades.find(item=>item.grade===grade);
 const completed=completedCountForGrade(state,grade);
 const pct=gradeMeta?.unitCount?Math.round(completed/gradeMeta.unitCount*100):0;
 const continueHref=state.lastOpened?"/learn/"+state.lastOpened.grade+"/term/"+state.lastOpened.term+"/"+state.lastOpened.unitId:"/learn/"+grade;
 const name=state.profile?.displayName?.trim()||"Learner";
 const gradeOptions=useMemo(()=>index?.grades.map(item=>item.grade)??[8,9,10,11,12],[index]);

 return <div className="profile-page">
  <section className="profile-hero">
   <div><p className="eyebrow">Profile</p><h1>{name}</h1><p>Your learning record at a glance.</p></div>
   <div className="profile-identity">
    <label>Name<input value={state.profile?.displayName??""} onChange={event=>setProfile({displayName:event.target.value})} placeholder="Add your name"/></label>
    <label>Current grade<select value={grade} onChange={event=>setProfile({grade:Number(event.target.value)})}>{gradeOptions.map(value=><option key={value} value={value}>Grade {value}</option>)}</select></label>
   </div>
  </section>

  <section className="profile-grid">
   <article className="profile-card"><div className="profile-card-icon"><BookOpenCheck aria-hidden="true"/></div><div><p className="eyebrow">Learning progress</p><h2>Grade {grade}</h2></div><strong className="metric">{pct}%</strong><p>{completed} of {gradeMeta?.unitCount??0} lessons complete.</p><Link href={continueHref}>Continue learning <ArrowRight/></Link></article>
   {syncError&&<p role="alert" className="auth-error">{syncError}</p>}
   <AuthPanel compact />
   <aside className="profile-record-note"><Database aria-hidden="true"/><div><strong>{user?"Your learning record is linked to this account.":"Your learning record currently stays on this device."}</strong><p>{user?"Changes save on this device and sync to your account.":"Sign in to sync your learning across devices."}</p></div></aside>
  </section>
 </div>;
}
