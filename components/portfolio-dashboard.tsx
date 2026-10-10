"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Archive, NotebookPen, ChevronDown } from "lucide-react";
import { curriculum } from "@/lib/curriculum";
import type { GradeIndex, UnitContent, UnitSummary } from "@/lib/types";
import { buildPortfolioDefinitions, responsesForPortfolio } from "@/lib/portfolio-model";
import { buildEvidenceRecords } from "@/lib/evidence/engine";
import { useEvidenceReviewStore } from "@/lib/evidence/review-store";
import { PortfolioSynthesis } from "@/components/portfolio-synthesis";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { EvidenceReview } from "@/lib/evidence/types";
import { useLearningStore } from "@/lib/learning-store";

type Meta = UnitSummary & {grade:number;term:number};

export function PortfolioDashboard(){
 const {state}=useLearningStore();
 const {reviews:localReviews}=useEvidenceReviewStore();
 const {user}=useAuth();
 const [remoteReviews,setRemoteReviews]=useState<Record<string,EvidenceReview>>({});
 const [remoteReviewUserId,setRemoteReviewUserId]=useState<string|null>(null);
 const reviews=useMemo(()=>({...localReviews,...(remoteReviewUserId===user?.id?remoteReviews:{})}),[localReviews,remoteReviews,remoteReviewUserId,user?.id]);
 const [meta,setMeta]=useState<Record<string,Meta>>({});
 const [units,setUnits]=useState<Record<string,UnitContent>>({});

 useEffect(()=>{
  if(!user?.id)return;
  let cancelled=false;
  const userId=user.id;
  const supabase=createClient();
  void (async()=>{
   try{
    const result=await supabase.from("evidence_records").select("id,response_key").eq("learner_id",userId);
    if(result.error)throw result.error;
    const rows=result.data??[];
    if(!rows.length){
     if(!cancelled){setRemoteReviews({});setRemoteReviewUserId(userId);}
     return;
    }
    const reviewsResult=await supabase.from("evidence_reviews").select("evidence_record_id,status,criteria_scores,feedback,portfolio_interpretation,next_pathway,reviewed_at,rubric_key").in("evidence_record_id",rows.map(row=>row.id));
    if(reviewsResult.error)throw reviewsResult.error;
    const keyById=new Map(rows.map(row=>[row.id,row.response_key]));
    const next:Record<string,EvidenceReview>={};
    for(const review of reviewsResult.data??[]){
     const responseKey=keyById.get(review.evidence_record_id);
     if(!responseKey)continue;
     next[responseKey]={responseKey,rubricKey:review.rubric_key??undefined,status:review.status as EvidenceReview["status"],criteria:(review.criteria_scores??{}) as Record<string,1|2|3|4>,feedback:review.feedback,portfolioInterpretation:review.portfolio_interpretation??"",nextPathway:review.next_pathway??"",reviewedAt:review.reviewed_at};
    }
    if(!cancelled){setRemoteReviews(next);setRemoteReviewUserId(userId);}
   }catch{
    if(!cancelled){setRemoteReviews({});setRemoteReviewUserId(userId);}
   }
  })();
  return ()=>{cancelled=true;};
 },[user?.id]);

 useEffect(()=>{
  (async()=>{
   const idx=await curriculum.index();
   const grades=await Promise.all(idx.grades.map(g=>curriculum.grade(g.grade)));
   const m:Record<string,Meta>={};
   grades.forEach((g:GradeIndex)=>g.terms.forEach(t=>[...t.units,...t.assessments].forEach(u=>m[u.id]={...u,grade:g.grade,term:t.term})));
   setMeta(m);

   const ids=[...new Set(Object.keys(state.promptResponses).map(key=>key.split("::")[0]))].filter(id=>m[id]);
   const loaded=await Promise.all(ids.map(async id=>{
    const item=m[id];
    return [id,await curriculum.unit(item.grade,item.term,id)] as const;
   }));
   setUnits(Object.fromEntries(loaded));
  })();
 },[state.promptResponses]);

 const artifacts=useMemo(()=>{
  return Object.values(units).flatMap(unit=>{
   const item=meta[unit.id];
   if(!item) return [];
   return buildPortfolioDefinitions(unit).map(definition=>({
    definition,
    meta:item,
    responses:responsesForPortfolio(unit,definition,state.promptResponses),
   })).filter(entry=>entry.responses.length>0);
  });
 },[units,meta,state.promptResponses]);

 const synthesisEvidence=useMemo(()=>{
  const items=Object.values(units).flatMap(unit=>{
   const item=meta[unit.id];
   if(!item) return [];
   return buildEvidenceRecords(unit,state.promptResponses).map(record=>({
    id:record.responseKey,
    title:item.title,
    href:`/learn/${item.grade}/term/${item.term}/${unit.id}`,
    unitId:unit.id,
    createdAt:state.promptResponseUpdatedAt?.[record.responseKey],
    domain:record.definition.domains,
    response:record.responseValue,
    feedback:reviews[record.responseKey]?.feedback,
    reviewedStatus:reviews[record.responseKey]?.status,
    portfolioInterpretation:reviews[record.responseKey]?.portfolioInterpretation,
    nextPathway:reviews[record.responseKey]?.nextPathway,
   }));
  });
  const covered=new Set(items.map(item=>item.id));
  const portfolioItems=artifacts.flatMap(entry=>entry.responses.map(response=>({
   id:response.key,
   title:entry.meta.title,
   href:`/learn/${entry.meta.grade}/term/${entry.meta.term}/${entry.meta.id}`,
   unitId:entry.meta.id,
   createdAt:state.promptResponseUpdatedAt?.[response.key],
   domain:[] as string[],
   response:response.value,
   feedback:reviews[response.key]?.feedback,
   reviewedStatus:reviews[response.key]?.status,
   portfolioInterpretation:reviews[response.key]?.portfolioInterpretation,
   nextPathway:reviews[response.key]?.nextPathway,
  })).filter(item=>!covered.has(item.id)));
  return [...items,...portfolioItems].sort((a,b)=>a.id.localeCompare(b.id));
 },[units,meta,state.promptResponses,artifacts,reviews]);

 const orphaned=Object.fromEntries(Object.entries(state.promptResponses).filter(([key])=>{
  const unit=units[key.split("::")[0]];
  return unit&&!unit.blocks.some(block=>block.id&&key.startsWith(`${unit.id}::prompt-${block.id}::`));
 }));
 const previous=Object.entries({...state.previousResponses,...orphaned}).filter(([key,value])=>value.trim()&&!key.endsWith("::row-count"));
 const notes=useMemo(()=>Object.entries(state.responses)
  .filter(([,value])=>value.trim())
  .map(([id,value])=>({id,value,meta:meta[id]}))
  .filter(item=>item.meta),[state.responses,meta]);

 return <div className="page portfolio-page">
  <section className="page-intro">
   <p className="eyebrow">Learner portfolio</p>
   <h1>Your evidence builds itself as you learn.</h1>
   <p>When the curriculum marks work as portfolio evidence, Applied Commerce captures the relevant responses automatically. There is nothing extra to file or submit.</p>
  </section>

  <PortfolioSynthesis evidence={synthesisEvidence} />

  {artifacts.length===0
   ? <section className="empty-state"><Archive/><h2>Your portfolio is ready.</h2><p>Complete a portfolio-marked activity in the curriculum. The relevant evidence will appear here automatically.</p><Link className="primary-button" href="/learn">Open curriculum <ArrowRight/></Link></section>
   : <section className="portfolio-artifacts-section" aria-labelledby="portfolio-artifacts-title">
      <div className="portfolio-section-heading"><Archive/><div><p className="eyebrow">Captured evidence</p><h2 id="portfolio-artifacts-title">Your portfolio work</h2></div></div>
      <div className="portfolio-artifacts">
       {artifacts.map(entry=><article className="portfolio-artifact" key={entry.definition.id}>
        <header>
         <div>
          <p>Grade {entry.meta.grade} · Term {entry.meta.term} · {entry.meta.label}</p>
          <h3>{entry.definition.title}</h3>
          <span>{entry.definition.instruction}</span>
         </div>
         <Link href={`/learn/${entry.meta.grade}/term/${entry.meta.term}/${entry.meta.id}`}>Open lesson <ArrowRight/></Link>
        </header>
        <details className="portfolio-artifact-responses">
         <summary><span>View captured responses</span><span>{entry.responses.length} {entry.responses.length===1?"response":"responses"}</span><ChevronDown aria-hidden="true"/></summary>
         <div className="portfolio-evidence">
          {entry.responses.map(response=><div key={response.key}><small>{response.label}</small><p>{response.value}</p></div>)}
         </div>
        </details>
       </article>)}
      </div>
     </section>}

  {previous.length>0&&<section className="portfolio-notes-section">
   <details className="portfolio-secondary-details">
    <summary><div><p className="eyebrow">History</p><h2>Earlier answers kept for review</h2><span>{previous.length} saved {previous.length===1?"answer":"answers"}</span></div><ChevronDown aria-hidden="true"/></summary>
    <p>These answers belong to an earlier layout or a task that has changed. They are kept separately because their match to the current question cannot be verified. You can copy an answer into the matching activity after reviewing it.</p>
    <div className="portfolio-list">{previous.map(([key,value])=>{
     const lesson=meta[key.split("::")[0]];
     return <article key={key}><h3>{lesson?`${lesson.label} · ${lesson.title}`:"Earlier learning record"}</h3><p>{value}</p>{lesson&&<Link href={`/learn/${lesson.grade}/term/${lesson.term}/${lesson.id}`}>Review lesson <ArrowRight/></Link>}</article>;
    })}</div>
   </details>
  </section>}

  {notes.length>0 && <section className="portfolio-notes-section">
   <details className="portfolio-secondary-details">
    <summary><div className="portfolio-section-heading"><NotebookPen/><div><p className="eyebrow">Personal notes</p><h2>Notes you chose to keep</h2><span>{notes.length} saved {notes.length===1?"note":"notes"}</span></div></div><ChevronDown aria-hidden="true"/></summary>
    <div className="portfolio-list">
     {notes.map(entry=><article key={entry.id}>
      <header><div><p>Grade {entry.meta.grade} · Term {entry.meta.term} · {entry.meta.label}</p><h3>{entry.meta.title}</h3></div><Link href={`/learn/${entry.meta.grade}/term/${entry.meta.term}/${entry.id}`}>Open <ArrowRight/></Link></header>
      <p>{entry.value}</p>
     </article>)}
    </div>
   </details>
  </section>}
 </div>;
}
