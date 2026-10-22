"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useAuth} from "@/lib/auth-context";
import availability from "@/content/instructional/teaching-availability.v2.json";
import type {ClassroomPayload,TeacherGuide} from "@/lib/classroom/model";
import {validateTeachingPlan,teachingSource,type TeachingPlan,type TeachingMoment,type TeachingGroup} from "@/lib/classroom/teaching-plan";
import type {UnitContent} from "@/lib/types";

// Identity/session objects and request generation bind every private response.
// No URL, mode flag or client-side role claim grants access to the API.
export function useTeachingPlan(unitId:string,presentationOnly:boolean){
 const {user,session,loading}=useAuth();
 const [revision,setRevision]=useState(0);
 const [intent,setIntent]=useState<{account:typeof user;session:typeof session;unitId:string}|null>(null);
 const requested=intent?.account===user&&intent?.session===session&&intent?.unitId===unitId;
 const [result,setResult]=useState<{account:typeof user;session:typeof session;unitId:string;revision:number;guide:TeacherGuide|null;plan?:TeachingPlan|null;error?:string}|null>(null);
 const eligible=availability.lessonIds.includes(unitId)&&!presentationOnly;
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
   const plan=response.ok&&data.selected?.id===unitId&&data.plan?.lessonId===unitId?data.plan:null;
   const guide=plan?data.guide:null;
   setResult({account:user,session,unitId,revision,guide,plan,error:response.ok?(plan?undefined:"Teacher guidance does not match this lesson."):data.error??"Teacher guidance is unavailable."});
  }).catch(()=>{if(!controller.signal.aborted)setResult({account:user,session,unitId,revision,guide:null,error:"Check your connection and try teacher guidance again."});}).finally(()=>clearTimeout(timer));
  return()=>{controller.abort();clearTimeout(timer);};
 },[eligible,user,session,loading,unitId,revision]);
 const current=eligible&&!loading&&result?.account===user&&result.session===session&&result.unitId===unitId&&result.revision===revision?result:null;
 const guide=current?.guide??null;
 return {guide,plan:current?.plan??null,teacherMode:requested&&Boolean(current?.plan),pending:eligible&&Boolean(user)&&!current,error:current?.error,
  requested:requested&&eligible&&Boolean(user),toggle:()=>{if(requested)setIntent(null);else{setIntent({account:user,session,unitId});setRevision(value=>value+1);}},retry:()=>setRevision(value=>value+1)};
}

export function alignedTeachingPlan(unit:UnitContent,plan:TeachingPlan|null){
 if(!plan)return null;
 try{validateTeachingPlan(plan,teachingSource(unit,plan.sourceUnitSHA256));return plan;}catch{return null;}
}
export function jumpTeaching(id:string){
 const target=document.getElementById(id);if(!target)return;
 let focus=target;
 if(target instanceof HTMLDetailsElement)focus=target.querySelector<HTMLElement>(":scope > summary")??target;
 if(target.matches(".learning-section")){
  target.querySelectorAll<HTMLDetailsElement>("details.deepening-insight").forEach(details=>details.open=true);
  focus=target.querySelector<HTMLElement>("h2,h3,summary")??target;
 }
 if(!focus.matches("summary,button,a,input,select,textarea")){focus.tabIndex=-1;focus.addEventListener("blur",()=>focus.removeAttribute("tabindex"),{once:true});}
 focus.scrollIntoView({block:"start",behavior:"instant"});focus.focus({preventScroll:true});
}
// Labels describe the shared instructional model, never a lesson-specific
// stage or source reference. Keep labels outside the preserved text field.
function fieldLabel(path:string){
 const key=path.split(".").at(-1)??"";
 if(!/^(discussion|understandingChecks|preparation\.(misconceptions|vocabulary)|practical)\./.test(path))return undefined;
 return ({question:"Discuss",followUp:"Follow-up",indicativeReasoning:"Indicative reasoning",partialUnderstanding:"Partial understanding",prompt:"Check",secureReasoning:"Secure reasoning",notYetEvidenced:"Not yet evidenced",nextTeachingMove:"Next teaching move",belief:"Common misconception",response:"Response",term:"Vocabulary",explanation:"Plain-language explanation",expectedOutput:"Expected output",inClassScope:"Current classroom scope"} as Record<string,string>)[key];
}
function Groups({plan,groups,guide}:{plan:TeachingPlan;groups:TeachingGroup[];guide?:TeacherGuide|null}){
 return <>{groups.map((group,index)=>{
  const firstScaffold=guide?group.fields.find(path=>path.startsWith("practical.scaffold.")):undefined;
  return <section key={index}><h3>{group.heading}</h3>{group.fields.map(path=>{
   // Preserve the original field identity on its table cell, rather than
   // repeating column/row labels as disconnected paragraphs above the table.
   if(guide&&path.startsWith("practical.scaffold."))return path===firstScaffold?<Scaffold key={path} guide={guide} fields={group.fields}/>:null;
   return <div key={path}>{fieldLabel(path)&&<h4>{fieldLabel(path)}</h4>}<p data-instructional-field={path}>{plan.fields[path]}</p></div>;
  })}</section>;
 })}</>;
}
function timing(plan:TeachingPlan,moment:TeachingMoment){
 if(moment.schedule==="support")return "Current classroom support · within the scheduled stage";
 if(moment.period===null)return moment.schedule==="later"?"Later work · outside contact time":"Optional support · not additional scheduled work";
 const period=plan.periods[moment.period];const index=period.moments.indexOf(moment.id);const start=period.moments.slice(0,index).reduce((sum,id)=>sum+plan.moments.find(m=>m.id===id)!.minutes,0);
 return `Period ${moment.period+1} · ${start}–${start+moment.minutes} min · ${moment.minutes} minutes`;
}
export function TeachingModeControl({teacher}:{teacher:ReturnType<typeof useTeachingPlan>}){
 if(!teacher.plan&&!teacher.requested)return null;
 return <div className="contextual-mode contextual-private contextual-no-print" role="group" aria-label="Lesson viewing mode">
  {teacher.plan&&<><button type="button" aria-pressed={!teacher.teacherMode} onClick={()=>{if(teacher.requested)teacher.toggle();}}>Learner View</button><button type="button" aria-pressed={teacher.teacherMode} onClick={()=>{if(!teacher.requested)teacher.toggle();}}>Teacher View</button></>}
  {teacher.pending&&<p role="status">Checking teacher access…</p>}{teacher.error&&teacher.requested&&<><p role="alert">{teacher.error}</p><button type="button" onClick={teacher.retry}>Try teacher guidance again</button></>}
 </div>;
}
export function TeachingPreparation({plan,unit,active,onStage,onPrint}:{plan:TeachingPlan;unit:UnitContent;active:string;onStage:(id:string)=>void;onPrint:()=>void}){
 const timed=plan.periods.flatMap(period=>period.moments);
 const selected=timed.includes(active)?active:timed[0];
 const href=`/learn/${unit.grade}/term/${unit.term}/${unit.id}`;
 return <aside className="contextual-preparation contextual-private contextual-no-print" aria-label="Teacher preparation and delivery">
  <details data-instructional-location="preparation"><summary>Prepare to teach · {plan.periods.length} × 45 minutes</summary><div className="contextual-body">
   <h2>Educator preparation</h2><Groups plan={plan} groups={plan.preparation}/><h3>Teaching sequence and timing</h3>
   {plan.periods.map((period,index)=><section key={index}><h4 data-instructional-field={period.title}>{plan.fields[period.title]}</h4><ol>{period.moments.map(id=>{const moment=plan.moments.find(m=>m.id===id)!;return <li key={id}>{timing(plan,moment)} · {plan.fields[moment.title]}</li>;})}</ol></section>)}
   <p>Follow teaching order using the navigator. A stage can revisit earlier learner material; the learner reading order remains intact. Later and optional panels describe work outside the scheduled core. Review the draft with your educator team before expanding the programme.</p>
  </div></details>
  <nav aria-label="Classroom teaching stages"><label htmlFor="classroom-stage">Teaching sequence · {plan.periods.length===1?"45 minutes":"two 45-minute periods"}</label><div className="contextual-stage-picker"><select id="classroom-stage" value={selected} onChange={event=>onStage(event.target.value)}>{plan.periods.map((period,index)=><optgroup key={index} label={`Period ${index+1}`}>{period.moments.map(id=>{const moment=plan.moments.find(m=>m.id===id)!;return <option key={id} value={id}>{timing(plan,moment)} · {plan.fields[moment.title]}</option>;})}</optgroup>)}</select><button type="button" onClick={()=>jumpTeaching(`teacher-moment-${selected}`)}>Go to stage</button></div></nav>
  <details className="contextual-tools"><summary>Presentation, print and fallback</summary><div className="contextual-body"><div className="contextual-actions"><a href={`${href}?presentation=1`} target="_blank" rel="noopener noreferrer">Open learner presentation in a new window</a><button type="button" onClick={onPrint}>Print complete teacher preparation</button><Link href={`/facilitator/classroom?lesson=${unit.id}`}>Standalone guide</Link></div><p>Keep guidance on your own screen and share only the learner presentation window. No device synchronisation is provided. Learner notes and completion controls are available in Learner View.</p></div></details>
 </aside>;
}
function Scaffold({guide,fields}:{guide:TeacherGuide;fields:string[]}){
 const scaffold=guide.practical.scaffold;
 return <div className="classroom-table" role="region" aria-label="Practical work scaffold" tabIndex={0}><table><caption>Paper or board scaffold · added teaching support</caption><thead><tr>{scaffold.columns.map((column,index)=>{const path=`practical.scaffold.columns.${index}`;return <th scope="col" key={index} data-instructional-field={fields.includes(path)?path:undefined}>{column}</th>;})}</tr></thead><tbody>{scaffold.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>{const path=`practical.scaffold.rows.${i}.${j}`;return <td key={j} data-instructional-field={fields.includes(path)?path:undefined}>{cell||"—"}</td>;})}</tr>)}</tbody></table></div>;
}
export function TeachingGuidance({plan,moment,onStage,guide}:{plan:TeachingPlan;moment:TeachingMoment;onStage:(id:string)=>void;guide?:TeacherGuide|null}){
 const timed=moment.schedule==="classroom";const index=timed?plan.periods[moment.period!].moments.indexOf(moment.id):-1;
 return <details className="contextual-guidance contextual-private contextual-no-print" data-teaching-stage={timed?moment.id:undefined} data-teaching-activity={timed?undefined:moment.id} data-instructional-location={moment.id} data-source-placement={moment.placement.blockId} onToggle={event=>{if(event.target===event.currentTarget&&event.currentTarget.open&&timed)onStage(moment.id);}}>
  <summary id={`teacher-moment-${moment.id}`}><span className="contextual-summary"><strong>Teacher guidance{timed?` · Stage ${index+1} of ${plan.periods[moment.period!].moments.length}`:""}</strong><span data-instructional-field={moment.title}>{plan.fields[moment.title]}</span><small>{timing(plan,moment)}</small></span><span className="contextual-expand" aria-hidden="true">+</span></summary>
  <div className="contextual-body" role="region" aria-label={`Teaching support: ${plan.fields[moment.title]}`}><Groups plan={plan} groups={moment.core} guide={guide}/>
   {moment.depth.length>0&&<details className="contextual-depth"><summary>Deeper teaching support and adaptations</summary><div className="contextual-body"><Groups plan={plan} groups={moment.depth} guide={guide}/></div></details>}
   <nav className="contextual-actions contextual-next" aria-label={`Teaching transitions for ${plan.fields[moment.title]}`}>{moment.links.map(id=>{const target=plan.moments.find(m=>m.id===id)!;return <button key={id} type="button" onClick={()=>{if(target.schedule==="classroom")onStage(id);jumpTeaching(`teacher-moment-${id}`);}}>Go to {plan.fields[target.title]}{target.period!==null?` · Period ${target.period+1}`:""}</button>;})}<button type="button" onClick={()=>jumpTeaching("classroom-stage")}>Teaching navigator</button></nav>
  </div>
 </details>;
}
export function TeachingPrintGuide({plan,guide,title}:{plan:TeachingPlan;guide?:TeacherGuide|null;title:string}){
 return <div className="contextual-print-guide contextual-private"><article className="classroom-workspace"><h2>{title} · Teacher preparation</h2><p>Private draft instructional enrichment · {plan.periods.length} × 45-minute periods · educator review required</p><Groups plan={plan} groups={plan.preparation} guide={guide}/>{plan.periods.map((period,index)=><section key={index}><h2 data-instructional-field={period.title}>{plan.fields[period.title]}</h2>{period.moments.map(id=>{const moment=plan.moments.find(m=>m.id===id)!;return <section key={id}><h3 data-instructional-field={moment.title}>{timing(plan,moment)} · {plan.fields[moment.title]}</h3><Groups plan={plan} groups={[...moment.core,...moment.depth]} guide={guide}/></section>;})}</section>)}<h2>Supporting material and later learning</h2>{plan.moments.filter(m=>m.schedule!=="classroom").map(moment=><section key={moment.id}><h3 data-instructional-field={moment.title}>{plan.fields[moment.title]} · {moment.schedule}</h3><Groups plan={plan} groups={[...moment.core,...moment.depth]} guide={guide}/></section>)}</article></div>;
}
export function StandaloneTeachingPlan({plan,guide,title}:{plan:TeachingPlan;guide?:TeacherGuide|null;title:string}){
 return <div className="standalone-teaching-plan"><TeachingPrintGuide plan={plan} guide={guide} title={title}/></div>;
}
