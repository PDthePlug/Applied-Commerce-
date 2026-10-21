"use client";

import Link from "next/link";
import availability from "@/content/instructional/teaching-availability.v2.json";
import {StandaloneTeachingPlan} from "./teaching-plan-view";
import {useEffect,useRef,useState} from "react";
import {useAuth} from "@/lib/auth-context";
import type {ClassroomPayload,TeacherGuide} from "@/lib/classroom/model";

function Bullets({items}:{items:string[]}){return <ul>{items.map((item,index)=><li key={index}>{item}</li>)}</ul>;}

export function ClassroomWorkspace({initialLessonId}:{initialLessonId:string}){
 const {user,loading}=useAuth();
 const [selectedId,setSelectedId]=useState(initialLessonId);
 const [revision,setRevision]=useState(0);
 const [result,setResult]=useState<{key:string;account:typeof user;data?:ClassroomPayload;error?:string;status?:number}|null>(null);
 const userId=user?.id;const key=`${userId??""}:${selectedId}:${revision}`;
 useEffect(()=>{
  const refresh=()=>setRevision(value=>value+1);
  const visible=()=>{if(document.visibilityState==="visible")refresh();};
  const pop=()=>setSelectedId(new URL(location.href).searchParams.get("lesson")??"g8-t1-l08-008");
  window.addEventListener("focus",refresh);window.addEventListener("online",refresh);document.addEventListener("visibilitychange",visible);window.addEventListener("popstate",pop);
  return()=>{window.removeEventListener("focus",refresh);window.removeEventListener("online",refresh);document.removeEventListener("visibilitychange",visible);window.removeEventListener("popstate",pop);};
 },[]);
 useEffect(()=>{
  // Drop actual private state when account, lesson or access revision changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setResult(null);
  if(!userId)return;
  const controller=new AbortController();const timer=setTimeout(()=>{setResult({key,account:user,error:"Teacher guidance took too long to load. Try again."});controller.abort();},25_000);
  void fetch(`/api/classroom?${new URLSearchParams({lesson:selectedId})}`,{credentials:"same-origin",cache:"no-store",signal:controller.signal,headers:{"x-ac-expected-user-id":userId}}).then(async response=>{
   const body=await response.json();
   if(!controller.signal.aborted)setResult(response.ok?{key,account:user,data:body as ClassroomPayload}:{key,account:user,error:body.error??"Teacher guidance could not be loaded.",status:response.status});
  }).catch(()=>{if(!controller.signal.aborted)setResult({key,account:user,error:"Check your connection and try again."});}).finally(()=>clearTimeout(timer));
  return()=>{clearTimeout(timer);controller.abort();};
 },[user,userId,selectedId,key]);
 const current=result?.key===key&&result.account===user?result:null;
 const select=(id:string)=>{setSelectedId(id);window.history.pushState(null,"",`/facilitator/classroom?${new URLSearchParams({lesson:id})}`);};
 return <div className="classroom-workspace">
  <nav className="classroom-topnav classroom-controls" aria-label="Teaching workspace"><Link href="/facilitator">Facilitator workspace</Link><Link href="/learn">Learner library</Link></nav>
  <header className="classroom-heading"><p className="eyebrow">Applied Commerce · Grades 8–12</p><h1>Classroom teaching</h1><p>Prepare, teach and check understanding using the existing learner lessons.</p></header>
  {loading?<p role="status">Checking your account…</p>:!user?<section className="classroom-card"><h2>Sign in to open teacher guidance.</h2><p>Your institution grants educator access. Learner lessons remain available independently.</p><Link href="/auth">Staff sign in</Link></section>:!current?<p role="status">Loading authorised teaching guidance…</p>:current.error?<section className="classroom-card" role="alert"><h2>{current.status===403?"Teacher access is not assigned.":"Teacher guidance is unavailable."}</h2><p>{current.error}</p><button type="button" onClick={()=>setRevision(value=>value+1)}>Try again</button><Link href="/auth">Sign in</Link></section>:current.data?<ClassroomExperience key={current.data.selected.id} payload={current.data} onSelect={select}/>:null}
 </div>;
}

export function ClassroomExperience({payload,onSelect}:{payload:ClassroomPayload;onSelect:(id:string)=>void}){
 const {catalog,selected,guide,plan}=payload;
 const [presentation,setPresentation]=useState(false);const [periodIndex,setPeriodIndex]=useState(0);const [stageIndex,setStageIndex]=useState(0);
 const stageHeading=useRef<HTMLHeadingElement|null>(null);const presentationTrigger=useRef<HTMLButtonElement|null>(null);
 const chooseGrade=(grade:number)=>onSelect((catalog.find(entry=>entry.grade===grade&&entry.benchmark)??catalog.find(entry=>entry.grade===grade))!.id);
 const chooseTerm=(term:number)=>onSelect((catalog.find(entry=>entry.grade===selected.grade&&entry.term===term&&entry.benchmark)??catalog.find(entry=>entry.grade===selected.grade&&entry.term===term))!.id);
 const learnerHref=`/learn/${selected.grade}/term/${selected.term}/${selected.id}?classroom=1`;
 const move=(index:number)=>{setStageIndex(index);requestAnimationFrame(()=>stageHeading.current?.focus());};
 const closePresentation=()=>{setPresentation(false);requestAnimationFrame(()=>presentationTrigger.current?.focus());};
 return <>
  <div className="classroom-catalog classroom-controls">
   <label>Grade<select value={selected.grade} onChange={event=>chooseGrade(Number(event.target.value))}>{[8,9,10,11,12].map(grade=><option key={grade} value={grade}>Grade {grade}</option>)}</select></label>
   <label>Term<select value={selected.term} onChange={event=>chooseTerm(Number(event.target.value))}>{[1,2,3,4].map(term=><option key={term} value={term}>Term {term}</option>)}</select></label>
   <label>Lesson<select value={selected.id} onChange={event=>onSelect(event.target.value)}>{catalog.filter(entry=>entry.grade===selected.grade&&entry.term===selected.term).map(entry=><option key={entry.id} value={entry.id}>Lesson {entry.number} · {entry.title}{availability.lessonIds.includes(entry.id)?" · Classroom draft available":" · Guide not developed"}</option>)}</select></label>
  </div>
  <header className="classroom-lesson-heading"><p>Grade {selected.grade} · Term {selected.term} · Lesson {selected.number}</p><h2>{selected.title}</h2>
   <div className="classroom-actions classroom-controls"><Link href={learnerHref}>Open integrated lesson</Link>{plan&&!guide&&<button type="button" onClick={()=>window.print()}>Print teacher guide</button>}{guide&&<><button ref={presentationTrigger} type="button" aria-pressed={presentation} onClick={()=>setPresentation(value=>!value)}>Presentation prompts</button><button type="button" onClick={()=>window.print()}>Print {presentation?"current prompts":"teacher guide"}</button></>}</div>
  </header>
  {!guide&&plan?<StandaloneTeachingPlan plan={plan} title={selected.title}/>:!guide?<section className="classroom-card"><h3>This classroom guide has not been developed yet.</h3><p>Grade 8 Term 1 and the five original benchmarks have classroom drafts. Further grade-and-term batches await owner and educator review; no teaching plan is inferred from this title.</p><p>The authored learner lesson remains available.</p></section>:presentation?<section className="classroom-presentation" aria-label="Learner-facing classroom prompts">
   <p className="classroom-draft">Classroom prompts · Private indicative answers are not shown in this mode.</p>
   <label className="classroom-controls">Period<select value={periodIndex} onChange={event=>{setPeriodIndex(Number(event.target.value));setStageIndex(0);}}>{guide.periods.map((period,index)=><option key={period.title} value={index}>{period.title}</option>)}</select></label>
   <p>Stage {stageIndex+1} of {guide.periods[periodIndex].stages.length} · {guide.periods[periodIndex].stages[stageIndex].minutes} minutes</p>
   <h3 ref={stageHeading} tabIndex={-1}>{guide.periods[periodIndex].stages[stageIndex].title}</h3>
   <p className="classroom-presentation-question">{guide.periods[periodIndex].stages[stageIndex].presentation.question}</p><p>{guide.periods[periodIndex].stages[stageIndex].presentation.task}</p>
   <nav className="classroom-actions classroom-controls" aria-label="Teaching stages"><button type="button" disabled={stageIndex===0} onClick={()=>move(stageIndex-1)}>Previous stage</button><button type="button" disabled={stageIndex===guide.periods[periodIndex].stages.length-1} onClick={()=>move(stageIndex+1)}>Next stage</button><button type="button" onClick={closePresentation}>Return to teacher guide</button></nav>
  </section>:<TeacherGuideView guide={guide} teachingOnly/>}
 </>;
}

export function TeacherGuideView({guide,teachingOnly=false}:{guide:TeacherGuide;teachingOnly?:boolean}){
 return <article className="classroom-guide" aria-label="Draft teacher guide">
  <p className="classroom-draft"><strong>Draft instructional enrichment · Educational review required.</strong> {guide.periods.length} × 45-minute {guide.periods.length===1?"period":"periods"}. This guide supplements the original learner lesson.</p>
  <nav className="classroom-guide-outline classroom-controls" aria-label="In this guide">{[['purpose','Purpose'],['preparation','Preparation'],['sequence','Teaching sequence'],['discussion','Discussion'],['practical','Practical work'],['checks','Understanding checks'],['adaptations','Adaptations'],['continuity','Continuity']].map(([id,label])=><a key={id} href={`#teacher-${id}`}>{label}</a>)}</nav>
  <section id="teacher-purpose"><h3>Purpose and learning</h3><p>{guide.centralConcept}</p><h4>Classroom objectives</h4><Bullets items={guide.objectives}/><h4>Observable outcome</h4><p>{guide.observableOutcome}</p><h4>Check before teaching</h4><Bullets items={guide.prerequisites}/></section>
  <section id="teacher-preparation"><h3>Educator preparation</h3><Bullets items={guide.preparation.knowledge}/><h4>Materials</h4><Bullets items={guide.preparation.materials}/><h4>Vocabulary in plain language</h4><dl>{guide.preparation.vocabulary.map(item=><div key={item.term}><dt>{item.term}</dt><dd>{item.explanation}</dd></div>)}</dl><h4>Likely misconceptions</h4><dl>{guide.preparation.misconceptions.map(item=><div key={item.belief}><dt>{item.belief}</dt><dd>{item.response}</dd></div>)}</dl><h4>South African context</h4><p>{guide.preparation.southAfricanContext}</p><h4>Participation and privacy</h4><Bullets items={guide.preparation.privacy}/></section>
  <section id="teacher-sequence"><h3>Timed teaching sequence</h3>{guide.periods.map(period=><div className="classroom-period" key={period.title}><h4>{period.title} · 45 minutes</h4>{period.stages.map((stage,index)=>{const start=period.stages.slice(0,index).reduce((n,s)=>n+s.minutes,0);return <section className="classroom-stage" key={stage.id}><h5>{start}–{start+stage.minutes} min · {stage.title}</h5><div className="classroom-stage-grid"><div><h6>Teacher</h6><Bullets items={stage.teacher}/></div><div><h6>Learners</h6><Bullets items={stage.learners}/></div></div><p><strong>Successful participation:</strong> {stage.successfulParticipation}</p>{teachingOnly&&<><p><strong>Ask learners:</strong> {stage.presentation.question}</p><p>{stage.presentation.task}</p></>}</section>;})}</div>)}</section>
  <section id="teacher-discussion"><h3>Guided classroom discussion</h3>{guide.discussion.map(item=><section className="classroom-card" key={item.question}><h4>{item.question}</h4><p><strong>Follow-up:</strong> {item.followUp}</p><p><strong>Indicative reasoning:</strong> {item.indicativeReasoning}</p><p><strong>Partial understanding:</strong> {item.partialUnderstanding}</p></section>)}</section>
  <section id="teacher-practical"><h3>Practical application</h3><Bullets items={guide.practical.instructions}/><p><strong>In-class scope:</strong> {guide.practical.inClassScope}</p><p><strong>Expected output:</strong> {guide.practical.expectedOutput}</p><div className="classroom-table" role="region" aria-label="Practical work scaffold" tabIndex={0}><table><caption>Optional paper or board scaffold · Added teaching support</caption><thead><tr>{guide.practical.scaffold.columns.map(column=><th scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{guide.practical.scaffold.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell||"—"}</td>)}</tr>)}</tbody></table></div><p><strong>Later follow-up:</strong> {guide.practical.followUp}</p></section>
  <section id="teacher-checks"><h3>Checks of understanding</h3><p>A recorded response is not automatically correct. Use the explanation to decide what to teach next.</p>{guide.understandingChecks.map(item=><section className="classroom-card" key={item.prompt}><h4>{item.prompt}</h4><dl><div><dt>Secure reasoning</dt><dd>{item.secureReasoning}</dd></div><div><dt>Partial understanding</dt><dd>{item.partialUnderstanding}</dd></div><div><dt>Not yet evidenced</dt><dd>{item.notYetEvidenced}</dd></div><div><dt>Next teaching move</dt><dd>{item.nextTeachingMove}</dd></div></dl></section>)}</section>
  <section id="teacher-adaptations"><h3>Differentiation and classroom conditions</h3>{Object.entries({"Additional support":guide.differentiation.support,"Extension":guide.differentiation.extension,"Quiet participation":guide.differentiation.quietParticipation,"Large classes":guide.differentiation.largeClass,"Limited technology":guide.differentiation.lowTechnology,"Reading support":guide.differentiation.readingSupport}).map(([label,items])=><div key={label}><h4>{label}</h4><Bullets items={items}/></div>)}</section>
  <section id="teacher-continuity"><h3>Learning continuity</h3><p>{guide.continuity.connection}</p><p>{guide.continuity.nextUse}</p><h4>Independent learning</h4><Bullets items={guide.independentLearning}/></section>
  {!teachingOnly&&<details className="classroom-source-details"><summary>Source basis and review status</summary><p>{guide.selectionRationale}</p><p>Guide {guide.version} · Existing lesson {guide.lessonId}. New guidance is separate from the authored learner content.</p><ul>{guide.sourceReferences.map(ref=><li key={ref.blockId}>{ref.label} <code>{ref.blockId}</code></li>)}</ul><h3>Quality self-review</h3><dl>{guide.review.qualityChecks.map(check=><div key={check.criterion}><dt>{check.criterion} · {check.disposition==="pilot-required"?"Pilot required":"Draft self-review"}</dt><dd>{check.evidence}</dd></div>)}</dl><Bullets items={guide.review.limits}/><p>{guide.review.reviewedBy}</p></details>}
  <footer className="classroom-print-source">Applied Commerce · Grade {guide.grade}, Term {guide.term} · {guide.originalTitle}{!teachingOnly&&<> · {guide.lessonId} · {guide.version}</>} · Draft teacher guidance; human educator approval pending.</footer>
 </article>;
}
