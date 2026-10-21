"use client";

import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {useAuth} from "@/lib/auth-context";
import {contextualAlignment,contextualLessonId,type ContextualMoment} from "@/lib/classroom/contextual";
import type {ClassroomPayload,TeacherGuide} from "@/lib/classroom/model";
import type {UnitContent} from "@/lib/types";
import {TeacherGuideView} from "./classroom-workspace";

// Identity/session objects and request generation bind every private response.
// No URL, mode flag or client-side role claim grants access to the API.
export function useContextualTeacher(unitId:string,presentationOnly:boolean){
 const {user,session,loading}=useAuth();
 const [revision,setRevision]=useState(0);
 const [intent,setIntent]=useState<{account:typeof user;session:typeof session;unitId:string}|null>(null);
 const requested=intent?.account===user&&intent?.session===session&&intent?.unitId===unitId;
 const [result,setResult]=useState<{account:typeof user;session:typeof session;unitId:string;revision:number;guide:TeacherGuide|null;error?:string}|null>(null);
 const eligible=unitId===contextualLessonId&&!presentationOnly;
 useEffect(()=>{
  const refresh=()=>setRevision(value=>value+1);
  const visible=()=>{if(document.visibilityState==="visible")refresh();};
  window.addEventListener("focus",refresh);window.addEventListener("online",refresh);document.addEventListener("visibilitychange",visible);
  return()=>{window.removeEventListener("focus",refresh);window.removeEventListener("online",refresh);document.removeEventListener("visibilitychange",visible);};
 },[]);
 useEffect(()=>{
  // Clear the actual private state as well as gating it during render. This is a
  // deliberate security boundary on identity/session/lesson/request changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setResult(null);
  if(!eligible||!user||loading)return;
  const controller=new AbortController();
  const timer=setTimeout(()=>{controller.abort();setResult({account:user,session,unitId,revision,guide:null,error:"Teacher guidance took too long to load. Try again."});},25_000);
  void fetch(`/api/classroom?${new URLSearchParams({lesson:unitId})}`,{credentials:"same-origin",cache:"no-store",signal:controller.signal,headers:{"x-ac-expected-user-id":user.id}}).then(async response=>{
   const data=await response.json() as ClassroomPayload&{error?:string};
   if(controller.signal.aborted)return;
   const guide=response.ok&&data.selected?.id===unitId&&data.guide?.lessonId===unitId?data.guide:null;
   setResult({account:user,session,unitId,revision,guide,error:response.ok?(guide?undefined:"Teacher guidance does not match this lesson."):data.error??"Teacher guidance is unavailable."});
  }).catch(()=>{if(!controller.signal.aborted)setResult({account:user,session,unitId,revision,guide:null,error:"Check your connection and try teacher guidance again."});}).finally(()=>clearTimeout(timer));
  return()=>{controller.abort();clearTimeout(timer);};
 },[eligible,user,session,loading,unitId,revision]);
 const current=eligible&&!loading&&result?.account===user&&result.session===session&&result.unitId===unitId&&result.revision===revision?result:null;
 const guide=current?.guide??null;
 return {guide,teacherMode:requested&&Boolean(guide),pending:eligible&&Boolean(user)&&!current,error:current?.error,
  requested:requested&&eligible&&Boolean(user),toggle:()=>{if(requested)setIntent(null);else{setIntent({account:user,session,unitId});setRevision(value=>value+1);}},retry:()=>setRevision(value=>value+1)};
}

function Bullets({items}:{items:string[]}){return <ul>{items.map((item,index)=><li key={index}>{item}</li>)}</ul>;}
function jump(id:string){const target=document.getElementById(id);if(!target)return;let focus=target;if(target.matches(".learning-section")){target.querySelectorAll<HTMLDetailsElement>("details.deepening-insight").forEach(details=>details.open=true);focus=target.querySelector<HTMLElement>("h2,h3,summary")??target;if(!focus.matches("summary")){focus.tabIndex=-1;focus.addEventListener("blur",()=>focus.removeAttribute("tabindex"),{once:true});}}target.scrollIntoView({block:"start",behavior:"instant"});focus.focus({preventScroll:true});}

export function TeacherModeControl({teacher}:{teacher:ReturnType<typeof useContextualTeacher>}){
 if(!teacher.guide&&!teacher.requested)return null;
 return <div className="contextual-mode contextual-private contextual-no-print" role="group" aria-label="Lesson viewing mode">
  {teacher.guide&&<><button type="button" aria-pressed={!teacher.teacherMode} onClick={()=>{if(teacher.requested)teacher.toggle();}}>Learner View</button><button type="button" aria-pressed={teacher.teacherMode} onClick={()=>{if(!teacher.requested)teacher.toggle();}}>Teacher View</button></>}
  {teacher.pending&&teacher.requested&&<p role="status">Confirming educator access…</p>}
  {teacher.error&&teacher.requested&&<p role="alert">{teacher.error} <button type="button" onClick={teacher.retry}>Retry teacher access</button></p>}
 </div>;
}

export function TeacherPreparation({guide,moments,onPrint}:{guide:TeacherGuide;moments:ContextualMoment[];onPrint:()=>void}){
 const [active,setActive]=useState<string|null>(null);
 return <aside className="contextual-preparation contextual-private contextual-no-print" aria-label="Teacher preparation and delivery">
  <details><summary>Prepare to teach · 45 minutes</summary><div className="contextual-body">
   <h2>Classroom objectives</h2><Bullets items={guide.objectives}/><h3>Expected learning outcome</h3><p>{guide.observableOutcome}</p>
   <h3>Materials</h3><Bullets items={guide.preparation.materials}/><h3>Prerequisite knowledge</h3><Bullets items={guide.prerequisites}/>
   <h3>Important misconceptions</h3><dl>{guide.preparation.misconceptions.map(item=><div key={item.belief}><dt>{item.belief}</dt><dd>{item.response}</dd></div>)}</dl>
   <h3>South African classroom context</h3><p>{guide.preparation.southAfricanContext}</p><h3>Participation and privacy</h3><Bullets items={guide.preparation.privacy}/>
  </div></details>
  <nav aria-label="Classroom teaching stages"><p>Teaching sequence · 45 minutes</p><ol>{moments.map(moment=><li key={moment.stageId}><button type="button" aria-current={active===moment.stageId?"step":undefined} onClick={()=>{setActive(moment.stageId);jump(`teacher-moment-${moment.stageId}`);}}><span>{moment.start}–{moment.end} min</span> {moment.title}</button></li>)}</ol></nav>
  <div className="contextual-actions"><a href="/learn/8/term/1/g8-t1-l08-008?presentation=1" target="_blank" rel="noopener noreferrer">Open learner presentation in a new window</a><button type="button" onClick={onPrint}>Print complete teacher preparation</button><Link href="/facilitator/classroom?lesson=g8-t1-l08-008">Standalone guide</Link></div>
  <p className="contextual-note">Keep this window on your own screen. Share only the learner presentation window. Learners use their own lesson; device synchronisation is not provided.</p>
 </aside>;
}

export function ContextualGuidance({moment,guide,moments}:{moment:ContextualMoment;guide:TeacherGuide;moments:ContextualMoment[]}){
 const stage=moment.stage;
 const index=moments.findIndex(item=>item.stageId===moment.stageId);
 const next=moments[index+1];
 const practical=stage.id==="g8-do";
 const discussions=stage.id==="g8-discuss"?guide.discussion:[];
 const checks=stage.id==="g8-discuss"?guide.understandingChecks.slice(0,1):stage.id==="g8-check"?guide.understandingChecks:[];
 const misconceptions=stage.id==="g8-explore"?guide.preparation.misconceptions:[];
 return <details className="contextual-guidance contextual-private contextual-no-print" data-teaching-stage={stage.id}>
  <summary id={`teacher-moment-${stage.id}`}><span className="contextual-summary"><strong>Teacher guidance</strong><span>{moment.title}</span><small>{stage.minutes} minutes · {moment.start}–{moment.end} min</small></span><span className="contextual-expand" aria-hidden="true">+</span></summary>
  <div className="contextual-body" role="region" aria-label={`Teaching support: ${moment.title}`} tabIndex={0}>
   <h3>{practical?"Facilitate the activity":"Explain"}</h3><Bullets items={stage.teacher}/>
   <h3>Ask learners</h3><p>{stage.presentation.question}</p><p>{stage.presentation.task}</p>
   {discussions.map(item=><div key={item.question}><h4>{item.question}</h4><p>{item.followUp}</p><p><strong>Indicative reasoning:</strong> {item.indicativeReasoning}</p><p><strong>Partial understanding:</strong> {item.partialUnderstanding}</p></div>)}
   <h3>{practical?"Learner participation":"Facilitate the activity"}</h3><Bullets items={stage.learners}/>
   {practical&&<><Bullets items={guide.practical.instructions}/><p><strong>In-class scope:</strong> {guide.practical.inClassScope}</p><p><strong>Expected output:</strong> {guide.practical.expectedOutput}</p><p><strong>Later follow-up:</strong> {guide.practical.followUp}</p></>}
   <h3>Look for understanding</h3><p>{stage.successfulParticipation}</p>
   {checks.map(item=><div key={item.prompt}><h4>{item.prompt}</h4><dl><div><dt>Secure reasoning</dt><dd>{item.secureReasoning}</dd></div><div><dt>Partial understanding</dt><dd>{item.partialUnderstanding}</dd></div><div><dt>Not yet evidenced</dt><dd>{item.notYetEvidenced}</dd></div></dl><p><strong>Next teaching move:</strong> {item.nextTeachingMove}</p></div>)}
   {misconceptions.length>0&&<><h3>Common misconception and response</h3><dl>{misconceptions.map(item=><div key={item.belief}><dt>{item.belief}</dt><dd>{item.response}</dd></div>)}</dl></>}
   {moment.supportingSections.length>0&&<nav className="contextual-actions" aria-label="Supporting learner material">{moment.supportingSections.map(section=><button key={section.anchor} type="button" onClick={()=>jump(section.anchor)}>Show {section.title}</button>)}</nav>}
   {next&&<><h3>Next teaching move</h3><button type="button" onClick={()=>jump(`teacher-moment-${next.stageId}`)}>Continue to {next.title}</button></>}
  </div>
 </details>;
}

export function FullTeacherPreparation({guide,printing}:{guide:TeacherGuide;printing:boolean}){
 const trigger=useRef<HTMLDetailsElement|null>(null);
 return <details ref={trigger} className={`contextual-full contextual-private ${printing?"contextual-print-guide":""}`} open={printing||undefined}>
  <summary>Full instructional details and preparation</summary>
  <div className="classroom-workspace"><header><p>Grade {guide.grade} · Term {guide.term} · Teacher preparation</p><h2>{guide.originalTitle}</h2></header><TeacherGuideView guide={guide} teachingOnly/></div>
 </details>;
}

export function teacherMoments(unit:UnitContent,guide:TeacherGuide){
 try{return contextualAlignment(unit,guide);}catch{return null;}
}
