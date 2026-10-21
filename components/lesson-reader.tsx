"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useModalFocus } from "@/lib/use-modal-focus";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Menu, NotebookPen, X } from "lucide-react";
import { curriculum } from "@/lib/curriculum";
import { learningSections } from "@/lib/semantic-learning";
import type { TermIndex, UnitContent, UnitSummary } from "@/lib/types";
import {contextualActivityPlacements} from "@/lib/classroom/contextual";
import { ContentBlocks } from "./content-blocks";
import { useLearningStore } from "@/lib/learning-store";
import {ContextualActivity,ContextualGuidance,TeacherPrintGuide,TeacherModeControl,TeacherPreparation,teacherMoments,useContextualTeacher} from "./contextual-teacher";

const compactQuery="(max-width: 820px)";
const subscribeCompact=(notify:()=>void)=>{
 const query=window.matchMedia(compactQuery);
 query.addEventListener("change",notify);
 return ()=>query.removeEventListener("change",notify);
};
const compactSnapshot=()=>window.matchMedia(compactQuery).matches;
const desktopSnapshot=()=>false;

export function LessonReader({grade,term,unitId,classroomContext=false,presentationOnly=false}:{grade:number;term:number;unitId:string;classroomContext?:boolean;presentationOnly?:boolean}){
 const router=useRouter();
 const [termData,setTermData]=useState<TermIndex|null>(null); const [unit,setUnit]=useState<UnitContent|null>(null); const [loadError,setLoadError]=useState<string|null>(null); const [menu,setMenu]=useState(false);
 const [loadRevision,retryLoad]=useState(0);
 const teacher=useContextualTeacher(unitId,presentationOnly);
 const [printing,setPrinting]=useState(false);
 const [activeTeachingStage,setActiveTeachingStage]=useState("g8-open");
 const moments=unit&&teacher.guide?teacherMoments(unit,teacher.guide):null;
 const teaching=teacher.teacherMode&&Boolean(moments)&&Boolean(teacher.contextual);
 useEffect(()=>{const done=()=>setPrinting(false);window.addEventListener("afterprint",done);return()=>window.removeEventListener("afterprint",done);},[]);
 const compact=useSyncExternalStore(subscribeCompact,compactSnapshot,desktopSnapshot);
 const railRef=useRef<HTMLElement|null>(null);
 const menuTrigger=useRef<HTMLButtonElement|null>(null);
 const closeMenu=useCallback(()=>setMenu(false),[]);
 useModalFocus(menu&&compact,railRef,menuTrigger,closeMenu);
 const {state,saveError,syncError,completedIds,markComplete,saveResponse,savePromptResponse,setLastOpened}=useLearningStore();
 useEffect(()=>{
  let cancelled=false;
  const unitContext=unitId.match(/^g(\d+)-t(\d+)-/);
  const inferredGrade=unitContext?Number(unitContext[1]):grade;
  const inferredTerm=unitContext?Number(unitContext[2]):term;
  const candidates=inferredGrade===grade&&inferredTerm===term ? [{grade,term}] : [{grade,term},{grade:inferredGrade,term:inferredTerm}];
  (async()=>{
    setTermData(null);setUnit(null);setLoadError(null);
    for(const context of candidates){
      try{
        const [t,u]=await Promise.all([curriculum.term(context.grade,context.term),curriculum.unit(context.grade,context.term,unitId)]);
        if(cancelled)return;
        setTermData(t);setUnit(u);setLastOpened(context.grade,context.term,unitId);window.scrollTo(0,0);
        if(context.grade!==grade||context.term!==term) router.replace("/learn/"+context.grade+"/term/"+context.term+"/"+unitId);
        return;
      }catch{}
    }
    if(!cancelled)setLoadError("We couldn’t open this lesson. Check your connection and try again.");
  })();
  return ()=>{cancelled=true;};
 },[grade,term,unitId,setLastOpened,router,loadRevision]);
 const sequence=useMemo<UnitSummary[]>(()=>termData?[...termData.units,...termData.assessments]:[],[termData]);
 const pos=sequence.findIndex(x=>x.id===unitId); const prev=pos>0?sequence[pos-1]:null; const next=pos>=0&&pos<sequence.length-1?sequence[pos+1]:null;
 const response=state.responses[unitId]??""; const complete=completedIds.has(unitId); const pct=sequence.length?Math.round((Math.max(pos,0)+1)/sequence.length*100):0;
 if(!unit||!termData) return <div className="reader-shell" data-presentation-contract="applied-commerce-v2">
  <div key="stage" className="reader-stage" id="lesson-content" tabIndex={-1}>
   {loadError
    ? <div className="reader-loading"><h1>Lesson unavailable</h1><p role="alert">{loadError} Your saved work is preserved.</p><button type="button" onClick={()=>retryLoad(value=>value+1)}>Try again</button><button type="button" onClick={()=>router.push("/learn/"+grade)}>Return to grade map</button></div>
    : <div className="reader-loading" role="status">Opening lesson…</div>}
  </div>
 </div>;
 const unitHref=(u:UnitSummary)=>`/learn/${grade}/term/${term}/${u.id}`;
 const lessonContent=<ContentBlocks
        blocks={unit.blocks}
        unitId={unitId}
        unitType={unit.type}
        promptResponses={presentationOnly?{}:state.promptResponses}
        onSavePromptResponse={presentationOnly?()=>{}:savePromptResponse}
        sectionGuidance={teaching&&teacher.guide&&teacher.contextual&&moments?(section,edge)=><>
         {moments.filter(moment=>moment.sectionAnchor===section.anchor&&moment.edge===edge).map(moment=><ContextualGuidance onStage={setActiveTeachingStage} key={moment.stageId} moment={moment} guide={teacher.guide!} content={teacher.contextual!} moments={moments}/>)}
         {edge==="before"&&contextualActivityPlacements.filter(item=>item.kind==="section"&&unit.blocks[section.start]?.id===item.blockId).map(item=><ContextualActivity key={item.activity} activity={item.activity} guide={teacher.guide!} content={teacher.contextual!}/>)}
        </>:undefined}
        partGuidance={teaching&&teacher.guide&&teacher.contextual?block=>{const placement=contextualActivityPlacements.find(item=>item.kind==="part"&&item.blockId===block.id);return placement?<ContextualActivity activity={placement.activity} guide={teacher.guide!} content={teacher.contextual!}/>:null;}:undefined}
      />;
 return <div className={`reader-shell${teaching&&printing?" contextual-printing":""}`} data-presentation-contract="applied-commerce-v2">
  <header className="reader-topbar">
   <Link href={`/learn/${grade}`} className="reader-brand"><span>AC</span><div><strong>Grade {grade}</strong><small>Term {term}</small></div></Link>
   <div className="reader-progress" role="group" aria-label={`Lesson ${pos+1} of ${sequence.length}`}><span>{unit.label}</span><div className="progress-track" role="progressbar" aria-label="Position in this term" aria-valuetext={`${pos+1} of ${sequence.length} units`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><i style={{width:`${pct}%`}}/></div><strong>{pos+1}/{sequence.length}</strong></div>
   <button ref={menuTrigger} className="reader-menu-button" onClick={()=>compact?setMenu(true):railRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.focus()} aria-label="Open term map" aria-haspopup={compact?"dialog":undefined} aria-expanded={compact?menu:undefined} aria-controls="term-map"><Menu/></button>
  </header>
  <aside ref={railRef} id="term-map" className={`reader-rail ${menu&&compact?"open":""}`} role={menu&&compact?"dialog":undefined} aria-modal={menu&&compact?true:undefined} aria-label="Term map" tabIndex={-1} inert={compact&&!menu} aria-hidden={compact&&!menu?true:undefined}>
   <div className="rail-head"><div><p>Grade {grade}</p><strong>Term {term}</strong></div><button onClick={closeMenu} aria-label="Close term map"><X/></button></div>
   <Link className="rail-back" href={`/learn/${grade}`}><ArrowLeft/> Grade map</Link>
   <nav aria-label="Term lessons">{sequence.map((u,i)=><Link aria-current={u.id===unitId?"page":undefined} onClick={()=>setMenu(false)} className={`${u.id===unitId?"current":""} ${completedIds.has(u.id)?"complete":""}`} href={unitHref(u)} key={u.id}><span>{completedIds.has(u.id)?<Check/>:i+1}</span><div><small>{u.label}</small><strong>{u.title}</strong></div></Link>)}</nav>
  </aside>
  {menu&&compact&&<button className="reader-scrim" data-modal-backdrop tabIndex={-1} onClick={closeMenu} aria-label="Close term map overlay"/>}
  <div key="stage" className="reader-stage" id="lesson-content" tabIndex={-1}>
    {saveError&&<p role="alert" className="save-error">{saveError}</p>}
    {syncError&&<p role="alert" className="save-error">{syncError}</p>}
    <article className="lesson-document">
      <header className="lesson-heading"><p className="eyebrow">Grade {grade} · Term {term} · {unit.label}</p><h1>{unit.title}</h1>
        <nav className="lesson-outline" aria-label="In this lesson"><p className="eyebrow">In this lesson</p>
          {classroomContext&&<Link className="teacher-context-link" href={`/facilitator/classroom?${new URLSearchParams({lesson:unitId})}`}>Back to teacher guidance</Link>}
          <ul>{learningSections(unit.blocks,unit.type).filter(section=>section.context&&section.context!=="reflection").map(section=><li key={section.anchor}><a href={`#${section.anchor}`}>{section.title}</a></li>)}</ul>
        </nav>
      </header>
      {!presentationOnly&&<TeacherModeControl teacher={teacher}/>}
      {teacher.teacherMode&&!moments&&<p role="alert">The teaching placement needs review. Use the standalone classroom guide.</p>}
      {teaching&&teacher.guide&&moments&&<TeacherPreparation active={activeTeachingStage} onStage={setActiveTeachingStage} guide={teacher.guide} content={teacher.contextual!} moments={moments} onPrint={()=>{setPrinting(true);requestAnimationFrame(()=>requestAnimationFrame(()=>window.print()));}}/>}
      {presentationOnly&&<p className="learner-presentation-notice">Learner presentation · Use your own copy of the lesson for answers.</p>}
      {presentationOnly?<fieldset className="learner-projection" disabled aria-label="Learner presentation material">{lessonContent}</fieldset>:lessonContent}
    </article>
    {teaching&&printing&&teacher.guide&&teacher.contextual&&<TeacherPrintGuide guide={teacher.guide} content={teacher.contextual}/>}
    {!presentationOnly&&!teaching&&<>
    <section className="workbook-panel">
      <div className="workbook-title"><NotebookPen/><div><p className="eyebrow">Lesson notes</p><h2>Anything you want to remember</h2></div></div>
      <p>Your responses are captured beside each activity, reflection, table and workbook field. Use this separate space only for extra notes you want to keep about the lesson.</p>
      <textarea aria-label="Lesson notes" value={response} onChange={e=>saveResponse(unitId,e.target.value)} placeholder="Add a note about this lesson…" rows={6}/>
      {response&&<p className="printed-lesson-notes">{response}</p>}
      <div className="workbook-actions"><span>{response?"Note kept on this device":"No lesson note yet"}</span><button className={complete?"completed":""} onClick={()=>markComplete(unitId,!complete,{grade,term})}>{complete?<><CheckCircle2/>Completed</>:<><Check/>Mark lesson complete</>}</button></div>
      <button className="lesson-complete-continue" type="button" disabled={Boolean(saveError)} onClick={()=>{
        if(markComplete(unitId,true,{grade,term})) router.push(next?unitHref(next):`/learn/${grade}`);
      }}>Complete and continue<ArrowRight aria-hidden="true"/></button>
    </section>
    </>}
    <footer className="reader-footer">
      {prev?<Link href={unitHref(prev)}><ArrowLeft/><span><small>Previous</small><strong>{prev.title}</strong></span></Link>:<span/>}
      {next?<Link className="next" href={unitHref(next)}><span><small>Next</small><strong>{next.title}</strong></span><ArrowRight/></Link>:<Link className="next" href={`/learn/${grade}`}><span><small>Term complete</small><strong>Return to Grade {grade}</strong></span><ArrowRight/></Link>}
    </footer>
  </div>
 </div>
}
