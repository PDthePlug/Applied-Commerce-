"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useAuth} from "@/lib/auth-context";
import {contextualAlignment,contextualLessonId,type ContextualMoment} from "@/lib/classroom/contextual";
import {instructionalFields,type ContextualEnrichment,type TeachingLocation} from "@/lib/classroom/contextual-fields";
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
 const [result,setResult]=useState<{account:typeof user;session:typeof session;unitId:string;revision:number;guide:TeacherGuide|null;contextual?:ContextualEnrichment|null;error?:string}|null>(null);
 const eligible=unitId===contextualLessonId&&!presentationOnly;
 useEffect(()=>{
  if(!eligible)return;
  const refresh=()=>setRevision(value=>value+1);
  const visible=()=>{if(document.visibilityState==="visible")refresh();};
  window.addEventListener("focus",refresh);window.addEventListener("online",refresh);document.addEventListener("visibilitychange",visible);
  return()=>{window.removeEventListener("focus",refresh);window.removeEventListener("online",refresh);document.removeEventListener("visibilitychange",visible);};
 },[eligible]);
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
   const guide=response.ok&&data.selected?.id===unitId&&data.guide?.lessonId===unitId&&data.contextual?.lessonId===unitId?data.guide:null;
   setResult({account:user,session,unitId,revision,guide,contextual:guide?data.contextual:null,error:response.ok?(guide?undefined:"Teacher guidance does not match this lesson."):data.error??"Teacher guidance is unavailable."});
  }).catch(()=>{if(!controller.signal.aborted)setResult({account:user,session,unitId,revision,guide:null,error:"Check your connection and try teacher guidance again."});}).finally(()=>clearTimeout(timer));
  return()=>{controller.abort();clearTimeout(timer);};
 },[eligible,user,session,loading,unitId,revision]);
 const current=eligible&&!loading&&result?.account===user&&result.session===session&&result.unitId===unitId&&result.revision===revision?result:null;
 const guide=current?.guide??null;
 return {guide,contextual:current?.contextual??null,teacherMode:requested&&Boolean(guide),pending:eligible&&Boolean(user)&&!current,error:current?.error,
  requested:requested&&eligible&&Boolean(user),toggle:()=>{if(requested)setIntent(null);else{setIntent({account:user,session,unitId});setRevision(value=>value+1);}},retry:()=>setRevision(value=>value+1)};
}

function jump(id:string){
 const target=document.getElementById(id);if(!target)return;
 let focus=target;
 if(target instanceof HTMLDetailsElement)focus=target.querySelector<HTMLElement>(":scope > summary")??target;
 if(target.matches(".learning-section")){
  target.querySelectorAll<HTMLDetailsElement>("details.deepening-insight").forEach(details=>details.open=true);
  focus=target.querySelector<HTMLElement>("h2,h3,summary")??target;
 }
 if(!focus.matches("summary,button,a,input,select,textarea")){
  focus.tabIndex=-1;focus.addEventListener("blur",()=>focus.removeAttribute("tabindex"),{once:true});
 }
 (target instanceof HTMLDetailsElement?focus:target).scrollIntoView({block:"start",behavior:"instant"});focus.focus({preventScroll:true});
}
function Text({guide,path,label}:{guide:TeacherGuide;path:string;label?:string}){
 const field=instructionalFields(guide).find(item=>item.path===path);
 if(!field)return null;
 return <p data-instructional-field={path}>{label&&<strong>{label}: </strong>}{field.value}</p>;
}
function List({guide,prefix}:{guide:TeacherGuide;prefix:string}){
 return <ul>{instructionalFields(guide).filter(item=>item.path.startsWith(prefix+".")).map(item=><li key={item.path} data-instructional-field={item.path}>{item.value}</li>)}</ul>;
}
function Vocabulary({guide}:{guide:TeacherGuide}){
 return <dl>{guide.preparation.vocabulary.map((item,i)=><div key={i}><dt data-instructional-field={`preparation.vocabulary.${i}.term`}>{item.term}</dt><dd data-instructional-field={`preparation.vocabulary.${i}.explanation`}>{item.explanation}</dd></div>)}</dl>;
}
function Misconception({guide,index}:{guide:TeacherGuide;index:number}){
 return <><Text guide={guide} path={`preparation.misconceptions.${index}.belief`} label="Common misconception"/><Text guide={guide} path={`preparation.misconceptions.${index}.response`} label="Response"/></>;
}
function Discussion({guide,index}:{guide:TeacherGuide;index:number}){
 const prefix=`discussion.${index}`;
 return <><Text guide={guide} path={`${prefix}.question`} label="Discuss"/><Text guide={guide} path={`${prefix}.followUp`} label="Probe"/><Text guide={guide} path={`${prefix}.indicativeReasoning`} label="Indicative reasoning"/><Text guide={guide} path={`${prefix}.partialUnderstanding`} label="Partial understanding"/></>;
}
function Understanding({guide,index}:{guide:TeacherGuide;index:number}){
 const prefix=`understandingChecks.${index}`;
 return <><Text guide={guide} path={`${prefix}.prompt`} label="Check"/><Text guide={guide} path={`${prefix}.secureReasoning`} label="Secure reasoning"/><Text guide={guide} path={`${prefix}.partialUnderstanding`} label="Partial understanding"/><Text guide={guide} path={`${prefix}.notYetEvidenced`} label="Not yet evidenced"/><Text guide={guide} path={`${prefix}.nextTeachingMove`} label="Next teaching move"/></>;
}
function Distinction({content}:{content:ContextualEnrichment}){
 return <div className="contextual-distinction"><h4>Survival needs and functional needs</h4>{Object.entries(content.distinction).map(([key,text])=><p key={key} data-contextual-addition={`distinction.${key}`}>{text}</p>)}</div>;
}
function ActivityText({content,activity}:{content:ContextualEnrichment;activity:keyof ContextualEnrichment["activities"]}){
 return <div className="contextual-activity-scope"><h4>{content.activities[activity].title}</h4><p data-contextual-addition={`activities.${activity}.text`}>{content.activities[activity].text}</p></div>;
}

export function TeacherModeControl({teacher}:{teacher:ReturnType<typeof useContextualTeacher>}){
 if(!teacher.guide&&!teacher.requested)return null;
 return <div className="contextual-mode contextual-private contextual-no-print" role="group" aria-label="Lesson viewing mode">
  {teacher.guide&&<><button type="button" aria-pressed={!teacher.teacherMode} onClick={()=>{if(teacher.requested)teacher.toggle();}}>Learner View</button><button type="button" aria-pressed={teacher.teacherMode} onClick={()=>{if(!teacher.requested)teacher.toggle();}}>Teacher View</button></>}
  {teacher.pending&&teacher.requested&&<p role="status">Confirming educator access…</p>}
  {teacher.error&&teacher.requested&&<p role="alert">{teacher.error} <button type="button" onClick={teacher.retry}>Retry teacher access</button></p>}
 </div>;
}

export function TeacherPreparation({guide,moments,content,onPrint,active,onStage}:{guide:TeacherGuide;moments:ContextualMoment[];content:ContextualEnrichment;onPrint:()=>void;active:string;onStage:(id:string)=>void}){
 return <aside className="contextual-preparation contextual-private contextual-no-print" aria-label="Teacher preparation and delivery">
  <details data-instructional-location="preparation"><summary>Prepare to teach · 45 minutes</summary><div className="contextual-body">
   <Text guide={guide} path="originalTitle"/><Text guide={guide} path="periods.0.title"/>
   <h2>Purpose and classroom objectives</h2><Text guide={guide} path="centralConcept"/><List guide={guide} prefix="objectives"/>
   <h3>Expected learning outcome</h3><Text guide={guide} path="observableOutcome"/>
   <h3>Prerequisite knowledge and continuity</h3><List guide={guide} prefix="prerequisites"/><Text guide={guide} path="continuity.connection"/>
   <h3>Educator preparation</h3><List guide={guide} prefix="preparation.knowledge"/>
   <h3>Materials</h3><List guide={guide} prefix="preparation.materials"/>
   <h3>Vocabulary and important distinctions</h3><Vocabulary guide={guide}/><Distinction content={content}/>
   <h3>Important misconceptions</h3>{guide.preparation.misconceptions.map((_,index)=><Misconception key={index} guide={guide} index={index}/>)}
   <h3>South African classroom context</h3><Text guide={guide} path="preparation.southAfricanContext"/>
   <h3>Participation and privacy</h3><List guide={guide} prefix="preparation.privacy"/>
   <h3>Teaching stages and timing</h3><ol>{moments.map(moment=><li key={moment.stageId}>{moment.start}–{moment.end} minutes · {moment.title}</li>)}</ol>
   <p>Start at the phone/data examples, return to the earlier definitions, then revisit the examples with new constraints. Stage buttons follow teaching order; the original learner reading order stays intact.</p>
   <h3>Workload and participation</h3><p>Use the activity timing and adaptations at each teaching moment. The 24-hour experiment, home observation and optional deepening remain later work. Learner notes and completion controls are available in Learner View.</p>
  </div></details>
  <nav aria-label="Classroom teaching stages"><label htmlFor="classroom-stage">Teaching sequence · 45 minutes</label>
   <div className="contextual-stage-picker"><select id="classroom-stage" value={active} onChange={event=>onStage(event.target.value)}>{moments.map((moment,i)=><option key={moment.stageId} value={moment.stageId}>{i+1}. {moment.start}–{moment.end} min · {moment.title}</option>)}</select><button type="button" onClick={()=>jump(`teacher-moment-${active}`)}>Go to stage</button></div>
  </nav>
  <details className="contextual-tools"><summary>Presentation, print and fallback</summary><div className="contextual-body"><div className="contextual-actions"><a href="/learn/8/term/1/g8-t1-l08-008?presentation=1" target="_blank" rel="noopener noreferrer">Open learner presentation in a new window</a><button type="button" onClick={onPrint}>Print complete teacher preparation</button><Link href="/facilitator/classroom?lesson=g8-t1-l08-008">Standalone guide</Link></div>
  <p className="contextual-note">Keep this window on your own screen. Share only the learner presentation window. Learners use their own lesson; device synchronisation is not provided.</p></div></details>
 </aside>;
}

export function ContextualGuidance({moment,guide,moments,content,onStage}:{moment:ContextualMoment;guide:TeacherGuide;moments:ContextualMoment[];content:ContextualEnrichment;onStage:(id:string)=>void}){
 const stage=moment.stage;
 const index=moments.findIndex(item=>item.stageId===moment.stageId);
 const next=moments[index+1];const previous=moments[index-1];
 const prefix=`periods.0.stages.${index}`;
 return <details className="contextual-guidance contextual-private contextual-no-print" data-teaching-stage={stage.id} data-instructional-location={stage.id} onToggle={event=>{if(event.target===event.currentTarget&&event.currentTarget.open)onStage(stage.id);}}>
  <summary id={`teacher-moment-${stage.id}`}><span className="contextual-summary"><strong>Teacher guidance · Stage {index+1} of 5</strong><span>{moment.title}</span><small>{stage.minutes} minutes · {moment.start}–{moment.end} min</small></span><span className="contextual-expand" aria-hidden="true">+</span></summary>
  <div className="contextual-body" role="region" aria-label={`Teaching support: ${moment.title}`}>
   <p className="contextual-transition" data-contextual-addition={`transitions.${stage.id}`}>{content.transitions[stage.id as keyof ContextualEnrichment["transitions"]]}</p>
   <h3>{stage.id==="g8-do"?"Facilitate the activity":"Explain"}</h3><List guide={guide} prefix={`${prefix}.teacher`}/>
   <h3>Ask learners</h3><Text guide={guide} path={`${prefix}.presentation.question`}/><Text guide={guide} path={`${prefix}.presentation.task`}/>
   <h3>Learner participation</h3><List guide={guide} prefix={`${prefix}.learners`}/>
   <h3>Look for understanding</h3><Text guide={guide} path={`${prefix}.successfulParticipation`}/>
   {stage.id==="g8-do"&&<nav className="contextual-actions" aria-label="Practical learner material"><button type="button" onClick={()=>jump("teacher-later-reflection")}>Revisit Pause and Reflect</button><button type="button" onClick={()=>jump("teacher-later-partC")}>Use Part C for one explanation</button></nav>}
   {stage.id==="g8-check"&&<nav className="contextual-actions" aria-label="Later learner material"><button type="button" onClick={()=>jump("teacher-later-partB")}>Plan Part B for later</button></nav>}
   <details className="contextual-depth"><summary>{stage.id==="g8-do"?"Scaffold, reasoning and adaptations":stage.id==="g8-check"?"Assess the explanation and plan later work":"Deeper teaching support and adaptations"}</summary><div className="contextual-body">
    <Text guide={guide} path={`${prefix}.title`} label="Teaching focus"/>
    {stage.id==="g8-open"&&<><h4>Quiet participation</h4><List guide={guide} prefix="differentiation.quietParticipation"/></>}
    {stage.id==="g8-explore"&&<><Distinction content={content}/><h4>Vocabulary</h4><Vocabulary guide={guide}/><Misconception guide={guide} index={0}/><h4>Reading support</h4><List guide={guide} prefix="differentiation.readingSupport"/></>}
    {stage.id==="g8-discuss"&&<><Discussion guide={guide} index={0}/><Understanding guide={guide} index={0}/><Misconception guide={guide} index={1}/><h4>Large class</h4><List guide={guide} prefix="differentiation.largeClass"/></>}
    {stage.id==="g8-do"&&<><ActivityText content={content} activity="partA"/><h4>Practical instructions</h4><List guide={guide} prefix="practical.instructions"/><Text guide={guide} path="practical.inClassScope" label="In-class scope"/><Text guide={guide} path="practical.expectedOutput" label="Expected output"/>
     <h4>Fictional scaffold</h4><p>Use these headings on paper alongside the original five-row task:</p><List guide={guide} prefix="practical.scaffold.columns"/><p>Fictional examples; learners supply the purpose, category and reason:</p><List guide={guide} prefix="practical.scaffold.rows"/>
     <Discussion guide={guide} index={1}/><Understanding guide={guide} index={1}/><h4>Additional support</h4><List guide={guide} prefix="differentiation.support"/><h4>Low technology</h4><List guide={guide} prefix="differentiation.lowTechnology"/><h4>Quiet participation</h4><List guide={guide} prefix="differentiation.quietParticipation"/>
    </>}
    {stage.id==="g8-check"&&<><ActivityText content={content} activity="checkpoint"/><Understanding guide={guide} index={1}/><h4>Alternative participation</h4><List guide={guide} prefix="differentiation.quietParticipation"/><Text guide={guide} path="practical.followUp" label="Later follow-up"/><Text guide={guide} path="continuity.nextUse" label="Next lesson"/></>}
   </div></details>
   {moment.supportingSections.length>0&&<details className="contextual-source-links"><summary>Related learner material</summary><nav className="contextual-actions" aria-label="Supporting learner material">{moment.supportingSections.map(section=><button key={section.anchor} type="button" onClick={()=>jump(section.anchor)}>Show {section.title}</button>)}</nav></details>}
   <nav className="contextual-actions contextual-next" aria-label={`Teaching sequence from stage ${index+1}`}>
    {previous&&<button type="button" onClick={()=>{onStage(previous.stageId);jump(`teacher-moment-${previous.stageId}`);}}>Previous stage · {previous.start}–{previous.end} min</button>}
    {next?<button type="button" onClick={()=>{onStage(next.stageId);jump(`teacher-moment-${next.stageId}`);}}>{index===0?"Return to":index===1?"Revisit":"Continue to"} {next.title}</button>:<button type="button" onClick={()=>jump("teacher-later-home")}>Review later work</button>}
    <button type="button" onClick={()=>jump("classroom-stage")}>Teaching navigator</button>
   </nav>
  </div>
 </details>;
}

export function ContextualActivity({guide,content,activity}:{guide:TeacherGuide;content:ContextualEnrichment;activity:keyof ContextualEnrichment["activities"]}){
 const location:TeachingLocation|undefined=activity==="home"?"independent":undefined;
 return <details id={`teacher-later-${activity}`} className="contextual-guidance contextual-activity contextual-private contextual-no-print" data-instructional-location={location} data-teaching-activity={activity}>
  <summary><span className="contextual-summary"><strong>Teacher guidance</strong><span>{content.activities[activity].title}</span></span><span className="contextual-expand" aria-hidden="true">+</span></summary>
  <div className="contextual-body"><ActivityText content={content} activity={activity}/>
   {activity==="home"&&<><h4>Independent learning</h4><List guide={guide} prefix="independentLearning"/><details className="contextual-depth"><summary>Optional extension</summary><div className="contextual-body"><List guide={guide} prefix="differentiation.extension"/></div></details></>}
   <button type="button" onClick={()=>jump(`teacher-moment-${activity==="partB"||activity==="home"?"g8-check":"g8-do"}`)}>Return to {activity==="partB"||activity==="home"?"reflection and understanding check":"practical application"}</button>
  </div>
 </details>;
}

// Mounted only for printing, hidden from the live screen even while the print
// dialog is open. All live teaching text has its own contextual placement.
export function TeacherPrintGuide({guide,content}:{guide:TeacherGuide;content:ContextualEnrichment}){
 return <div className="contextual-print-guide contextual-private"><div className="classroom-workspace"><header><p>Grade {guide.grade} · Term {guide.term} · Teacher preparation</p><h2>{guide.originalTitle}</h2></header><TeacherGuideView guide={guide} teachingOnly/>
  <section className="contextual-print-addendum"><h2>Contextual delivery clarification</h2><Distinction content={content}/><h3>Teaching order and transitions</h3>{Object.entries(content.transitions).map(([id,text],i)=><p key={id}><strong>Stage {i+1}: </strong>{text}</p>)}<h3>Current lesson, independent and later work</h3>{(Object.keys(content.activities) as Array<keyof ContextualEnrichment["activities"]>).map(activity=><ActivityText key={activity} content={content} activity={activity}/>)}</section>
 </div></div>;
}

export function teacherMoments(unit:UnitContent,guide:TeacherGuide){
 try{return contextualAlignment(unit,guide);}catch{return null;}
}
