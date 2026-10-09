"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Archive, NotebookPen } from "lucide-react";
import { curriculum } from "@/lib/curriculum";
import type { GradeIndex, UnitContent, UnitSummary } from "@/lib/types";
import { buildPortfolioDefinitions, responsesForPortfolio } from "@/lib/portfolio-model";
import { buildEvidenceRecords } from "@/lib/evidence/engine";
import { useEvidenceReviewStore } from "@/lib/evidence/review-store";
import { PortfolioSynthesis } from "@/components/portfolio-synthesis";
import { useLearningStore } from "@/lib/learning-store";

type Meta = UnitSummary & {grade:number;term:number};

export function PortfolioDashboard(){
 const {state}=useLearningStore();
 const {reviews}=useEvidenceReviewStore();
 const [meta,setMeta]=useState<Record<string,Meta>>({});
 const [units,setUnits]=useState<Record<string,UnitContent>>({});

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
    domain:record.definition.domains,
    response:record.responseValue,
    reviewedStatus:reviews[record.responseKey]?.status,
   }));
  });
  const covered=new Set(items.map(item=>item.id));
  const portfolioItems=artifacts.flatMap(entry=>entry.responses.map(response=>({
   id:response.key,
   title:entry.meta.title,
   href:`/learn/${entry.meta.grade}/term/${entry.meta.term}/${entry.meta.id}`,
   unitId:entry.meta.id,
   domain:[] as string[],
   response:response.value,
   reviewedStatus:reviews[response.key]?.status,
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
   : <div className="portfolio-artifacts">
      {artifacts.map(entry=><article className="portfolio-artifact" key={entry.definition.id}>
       <header>
        <div>
         <p>Grade {entry.meta.grade} · Term {entry.meta.term} · {entry.meta.label}</p>
         <h2>{entry.definition.title}</h2>
         <span>{entry.definition.instruction}</span>
        </div>
        <Link href={`/learn/${entry.meta.grade}/term/${entry.meta.term}/${entry.meta.id}`}>Open lesson <ArrowRight/></Link>
       </header>
       <div className="portfolio-evidence">
        {entry.responses.map(response=><div key={response.key}><small>{response.label}</small><p>{response.value}</p></div>)}
       </div>
      </article>)}
     </div>}

  {previous.length>0&&<section className="portfolio-notes-section">
   <h2>Earlier answers kept for review</h2>
   <p>These answers belong to an earlier layout or a task that has changed. They are kept separately because their match to the current question cannot be verified. You can copy an answer into the matching activity after reviewing it.</p>
   <div className="portfolio-list">{previous.map(([key,value])=>{
    const lesson=meta[key.split("::")[0]];
    return <article key={key}><h3>{lesson?`${lesson.label} · ${lesson.title}`:"Earlier learning record"}</h3><p>{value}</p>{lesson&&<Link href={`/learn/${lesson.grade}/term/${lesson.term}/${lesson.id}`}>Review lesson <ArrowRight/></Link>}</article>;
   })}</div>
  </section>}

  {notes.length>0 && <section className="portfolio-notes-section">
   <div className="portfolio-section-heading"><NotebookPen/><div><p className="eyebrow">Personal notes</p><h2>Notes you chose to keep</h2></div></div>
   <div className="portfolio-list">
    {notes.map(entry=><article key={entry.id}>
     <header><div><p>Grade {entry.meta.grade} · Term {entry.meta.term} · {entry.meta.label}</p><h2>{entry.meta.title}</h2></div><Link href={`/learn/${entry.meta.grade}/term/${entry.meta.term}/${entry.id}`}>Open <ArrowRight/></Link></header>
     <p>{entry.value}</p>
    </article>)}
   </div>
  </section>}
 </div>;
}
