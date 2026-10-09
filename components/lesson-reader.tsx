"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Menu, NotebookPen, X } from "lucide-react";
import { curriculum } from "@/lib/curriculum";
import { learningSections } from "@/lib/semantic-learning";
import type { TermIndex, UnitContent, UnitSummary } from "@/lib/types";
import { ContentBlocks } from "./content-blocks";
import { useLearningStore } from "@/lib/learning-store";

export function LessonReader({grade,term,unitId}:{grade:number;term:number;unitId:string}){
 const router=useRouter();
 const [termData,setTermData]=useState<TermIndex|null>(null); const [unit,setUnit]=useState<UnitContent|null>(null); const [loadError,setLoadError]=useState<string|null>(null); const [menu,setMenu]=useState(false);
 const {state,saveError,completedIds,markComplete,saveResponse,savePromptResponse,setLastOpened}=useLearningStore();
 useEffect(()=>{
  let cancelled=false;
  const unitContext=unitId.match(/^g(\d+)-t(\d+)-/);
  const inferredGrade=unitContext?Number(unitContext[1]):grade;
  const inferredTerm=unitContext?Number(unitContext[2]):term;
  const candidates=inferredGrade===grade&&inferredTerm===term ? [{grade,term}] : [{grade,term},{grade:inferredGrade,term:inferredTerm}];
  (async()=>{
    setTermData(null);setUnit(null);setLoadError(null);
    let lastError:unknown;
    for(const context of candidates){
      try{
        const [t,u]=await Promise.all([curriculum.term(context.grade,context.term),curriculum.unit(context.grade,context.term,unitId)]);
        if(cancelled)return;
        setTermData(t);setUnit(u);setLastOpened(context.grade,context.term,unitId);window.scrollTo(0,0);
        if(context.grade!==grade||context.term!==term) router.replace("/learn/"+context.grade+"/term/"+context.term+"/"+unitId);
        return;
      }catch(error){lastError=error;}
    }
    if(!cancelled)setLoadError(lastError instanceof Error?lastError.message:"Lesson could not be opened.");
  })();
  return ()=>{cancelled=true;};
 },[grade,term,unitId,setLastOpened,router]);
 const sequence=useMemo<UnitSummary[]>(()=>termData?[...termData.units,...termData.assessments]:[],[termData]);
 const pos=sequence.findIndex(x=>x.id===unitId); const prev=pos>0?sequence[pos-1]:null; const next=pos>=0&&pos<sequence.length-1?sequence[pos+1]:null;
 const response=state.responses[unitId]??""; const complete=completedIds.has(unitId); const pct=sequence.length?Math.round((Math.max(pos,0)+1)/sequence.length*100):0;
 if(!unit||!termData) return loadError
  ? <div className="reader-loading"><strong>Lesson unavailable</strong><p>{loadError}</p><button type="button" onClick={()=>router.push("/learn/"+(state.profile?.grade??state.activeGrade??8))}>Return to grade map</button></div>
  : <div className="reader-loading">Opening lesson…</div>;
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
      <header className="lesson-heading"><p className="eyebrow">Grade {grade} · Term {term} · {unit.label}</p><h1>{unit.title}</h1>
        <nav className="lesson-outline" aria-label="In this lesson"><p className="eyebrow">In this lesson</p>
          <ul>{learningSections(unit.blocks,unit.type).filter(section=>section.context&&section.context!=="reflection").map(section=><li key={section.anchor}><a href={`#${section.anchor}`}>{section.title}</a></li>)}</ul>
        </nav>
      </header>
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
      <div className="workbook-actions"><span>{response?"Note kept on this device":"No lesson note yet"}</span><button className={complete?"completed":""} onClick={()=>markComplete(unitId,!complete,{grade,term})}>{complete?<><CheckCircle2/>Completed</>:<><Check/>Mark lesson complete</>}</button></div>
      <button className="lesson-complete-continue" type="button" disabled={Boolean(saveError)} onClick={()=>{
        if(markComplete(unitId,true,{grade,term})) router.push(next?unitHref(next):`/learn/${grade}`);
      }}>Complete and continue<ArrowRight aria-hidden="true"/></button>
    </section>
    <footer className="reader-footer">
      {prev?<Link href={unitHref(prev)}><ArrowLeft/><span><small>Previous</small><strong>{prev.title}</strong></span></Link>:<span/>}
      {next?<Link className="next" href={unitHref(next)}><span><small>Next</small><strong>{next.title}</strong></span><ArrowRight/></Link>:<Link className="next" href={`/learn/${grade}`}><span><small>Term complete</small><strong>Return to Grade {grade}</strong></span><ArrowRight/></Link>}
    </footer>
  </main>
 </div>
}
