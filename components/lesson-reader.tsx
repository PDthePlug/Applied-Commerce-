"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Menu, NotebookPen, X } from "lucide-react";
import { curriculum } from "@/lib/curriculum";
import type { TermIndex, UnitContent, UnitSummary } from "@/lib/types";
import { ContentBlocks } from "./content-blocks";
import { useLearningStore } from "@/lib/learning-store";

export function LessonReader({grade,term,unitId}:{grade:number;term:number;unitId:string}){
 const [termData,setTermData]=useState<TermIndex|null>(null); const [unit,setUnit]=useState<UnitContent|null>(null); const [menu,setMenu]=useState(false);
 const {state,saveError,completedIds,markComplete,saveResponse,savePromptResponse,setLastOpened}=useLearningStore();
 useEffect(()=>{Promise.all([curriculum.term(grade,term),curriculum.unit(grade,term,unitId)]).then(([t,u])=>{setTermData(t);setUnit(u);setLastOpened(grade,term,unitId);window.scrollTo(0,0);});},[grade,term,unitId,setLastOpened]);
 const sequence=useMemo<UnitSummary[]>(()=>termData?[...termData.units,...termData.assessments]:[],[termData]);
 const pos=sequence.findIndex(x=>x.id===unitId); const prev=pos>0?sequence[pos-1]:null; const next=pos>=0&&pos<sequence.length-1?sequence[pos+1]:null;
 const response=state.responses[unitId]??""; const complete=completedIds.has(unitId); const pct=sequence.length?Math.round((Math.max(pos,0)+1)/sequence.length*100):0;
 if(!unit||!termData) return <div className="reader-loading">Opening lesson…</div>;
 const unitHref=(u:UnitSummary)=>`/learn/${grade}/term/${term}/${u.id}`;
 return <div className="reader-shell" data-presentation-contract="applied-commerce-v2">
  <header className="reader-topbar">
   <Link href={`/learn/${grade}`} className="reader-brand"><span>AC</span><div><strong>Grade {grade}</strong><small>Term {term}</small></div></Link>
   <div className="reader-progress" aria-label={`Lesson ${pos+1} of ${sequence.length}`}><span>{unit.label}</span><div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><i style={{width:`${pct}%`}}/></div><strong>{pos+1}/{sequence.length}</strong></div>
   <button className="reader-menu-button" onClick={()=>setMenu(true)} aria-label="Open term map"><Menu/></button>
  </header>
  <aside className={`reader-rail ${menu?"open":""}`}>
   <div className="rail-head"><div><p>Grade {grade}</p><strong>Term {term}</strong></div><button onClick={()=>setMenu(false)} aria-label="Close"><X/></button></div>
   <Link className="rail-back" href={`/learn/${grade}`}><ArrowLeft/> Grade map</Link>
   <nav aria-label="Term lessons">{sequence.map((u,i)=><Link aria-current={u.id===unitId?"page":undefined} onClick={()=>setMenu(false)} className={`${u.id===unitId?"current":""} ${completedIds.has(u.id)?"complete":""}`} href={unitHref(u)} key={u.id}><span>{completedIds.has(u.id)?<Check/>:i+1}</span><div><small>{u.label}</small><strong>{u.title}</strong></div></Link>)}</nav>
  </aside>
  {menu&&<button className="reader-scrim" onClick={()=>setMenu(false)} aria-label="Close menu"/>}
  <main className="reader-stage">
    {saveError&&<p role="alert" className="save-error">{saveError}</p>}
    <article className="lesson-document">
      <header className="lesson-heading"><p className="eyebrow">Grade {grade} · Term {term} · {unit.label}</p><h1>{unit.title}</h1></header>
      <ContentBlocks
        blocks={unit.blocks}
        unitId={unitId}
        unitType={unit.type}
        promptResponses={state.promptResponses}
        onSavePromptResponse={savePromptResponse}
      />
    </article>
    <section className="workbook-panel">
      <div className="workbook-title"><NotebookPen/><div><p className="eyebrow">Lesson notes</p><h2>Anything you want to remember</h2></div></div>
      <p>Your responses are captured beside each activity, reflection, table and workbook field. Use this separate space only for extra notes you want to keep about the lesson.</p>
      <textarea value={response} onChange={e=>saveResponse(unitId,e.target.value)} placeholder="Add a note about this lesson…" rows={6}/>
      <div className="workbook-actions"><span>{response?"Note kept on this device":"No lesson note yet"}</span><button className={complete?"completed":""} onClick={()=>markComplete(unitId,!complete)}>{complete?<><CheckCircle2/>Completed</>:<><Check/>Mark lesson complete</>}</button></div>
    </section>
    <footer className="reader-footer">
      {prev?<Link href={unitHref(prev)}><ArrowLeft/><span><small>Previous</small><strong>{prev.title}</strong></span></Link>:<span/>}
      {next?<Link className="next" href={unitHref(next)}><span><small>Next</small><strong>{next.title}</strong></span><ArrowRight/></Link>:<Link className="next" href={`/learn/${grade}`}><span><small>Term complete</small><strong>Return to Grade {grade}</strong></span><ArrowRight/></Link>}
    </footer>
  </main>
 </div>
}
