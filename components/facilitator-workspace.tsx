"use client";

import {useCallback,useEffect,useMemo,useState,type Dispatch,type SetStateAction} from "react";
import {
  Archive,ArrowRight,BarChart3,BookOpenCheck,CheckCircle2,ClipboardCheck,
  FileBarChart,FileCheck2,Filter,Gauge,Layers3,LayoutDashboard,ListChecks,
  Search,ShieldCheck,TriangleAlert,UserRound,UsersRound,Menu,X
} from "lucide-react";
import {curriculum} from "@/lib/curriculum";
import {buildEvidenceRecords} from "@/lib/evidence/engine";
import {buildEvidenceReport} from "@/lib/evidence/reporting";
import {RUBRICS,rubricByKey,stageForGrade} from "@/lib/evidence/taxonomy";
import {useEvidenceReviewStore} from "@/lib/evidence/review-store";
import type {EvidenceDomain,EvidenceKind,EvidenceRecord,EvidenceReport,EvidenceReview,ReviewStatus} from "@/lib/evidence/types";
import {
  buildCohortSummary,buildDomainCoverage,buildKindCoverage,buildLearnerSummary,
  buildReviewPriorities,buildTermCoverage,statusLabel
} from "@/lib/facilitator/model";
import type {
  CoverageRow,FacilitatorCohortSummary,FacilitatorLearnerSummary,FacilitatorPriorityItem
} from "@/lib/facilitator/model";
import {useLearningStore} from "@/lib/learning-store";
import {saveSupabaseFacilitatorReview,useSupabaseFacilitatorWorkspace} from "@/lib/facilitator/supabase-data-source";

type Section="overview"|"learners"|"review"|"coverage"|"reports"|"rubrics";
type UnitRef={id:string;term:number};
type ReviewFilter="all"|"unreviewed"|"reviewed"|"revision"|"verification";

const copy:Record<Section,{label:string;title:string;description:string}>={
  overview:{label:"Overview",title:"Class overview",description:"See the review workload, learner status and evidence coverage before deciding where to spend facilitation time."},
  learners:{label:"Learners",title:"Learner workspace",description:"Scan the class, identify who needs support, and open a learner evidence record without losing the class context."},
  review:{label:"Review",title:"Evidence review",description:"Work through learner evidence systematically, apply the right rubric and leave feedback that supports the next attempt."},
  coverage:{label:"Coverage",title:"Evidence coverage",description:"Check whether learner work is producing evidence across developmental domains, terms and evidence types."},
  reports:{label:"Reports",title:"Reports",description:"Turn accumulated evidence and facilitator decisions into a readable learner record and operational class view."},
  rubrics:{label:"Rubrics",title:"Rubric library",description:"Use one consistent assessment language across analytical work, reflection, real-world action and projects."}
};

const nav:Array<{id:Section;icon:typeof LayoutDashboard}>=[
  {id:"overview",icon:LayoutDashboard},{id:"learners",icon:UsersRound},
  {id:"review",icon:ClipboardCheck},{id:"coverage",icon:BarChart3},
  {id:"reports",icon:FileBarChart},{id:"rubrics",icon:ListChecks}
];

function titleCase(value:string){return value.replace(/-/g," ").replace(/\b\w/g,char=>char.toUpperCase());}
function formatLastActivity(at?:string){
  if(!at)return "No recent lesson";
  const date=new Date(at);
  if(Number.isNaN(date.getTime()))return "Recent activity";
  return new Intl.DateTimeFormat("en-ZA",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}).format(date);
}

export function FacilitatorWorkspace(){
  const {state,hydrated}=useLearningStore();
  const {reviews:localReviews,saveReview:saveLocalReview}=useEvidenceReviewStore();
  const {workspace:remoteWorkspace,loading:remoteLoading,error:remoteError}=useSupabaseFacilitatorWorkspace();
  const [records,setRecords]=useState<EvidenceRecord[]>([]);
  const [selectedLearnerId,setSelectedLearnerId]=useState("");
  const [loading,setLoading]=useState(true);
  const [section,setSection]=useState<Section>("overview");
  const [selectedKey,setSelectedKey]=useState("");
  const [termFilter,setTermFilter]=useState<number|0>(0);
  const [statusFilter,setStatusFilter]=useState<ReviewFilter>("all");
  const [search,setSearch]=useState("");
  const [learnerSearch,setLearnerSearch]=useState("");
  const [gradeLessonTotal,setGradeLessonTotal]=useState(0);
  const [facMenuOpen,setFacMenuOpen]=useState(false);

  const remoteLearner=remoteWorkspace?.learners.find(item=>item.id===selectedLearnerId)??remoteWorkspace?.learners[0]??null;
  const activeState=remoteLearner?.state??state;
  const localPromptResponses=state.promptResponses;
  const reviews=remoteLearner?.reviews??localReviews;
  const grade=activeState.profile?.grade??activeState.activeGrade;
  const learnerName=activeState.profile?.displayName?.trim()||"Current learner";

  useEffect(()=>{
    if(remoteWorkspace?.learners.length&&!remoteWorkspace.learners.some(item=>item.id===selectedLearnerId)){
      setSelectedLearnerId(remoteWorkspace.learners[0].id);
    }
  },[remoteWorkspace,selectedLearnerId]);

  const saveReview=useCallback(async(review:EvidenceReview)=>{
    if(remoteLearner){
      const record=records.find(item=>item.responseKey===review.responseKey);
      if(!record)throw new Error("Evidence record is no longer available.");
      await saveSupabaseFacilitatorReview(remoteLearner.id,record,review);
      return;
    }
    saveLocalReview(review);
  },[records,remoteLearner,saveLocalReview]);

  useEffect(()=>{
    let cancelled=false;
    async function load(){
      if(remoteWorkspace){
        if(!cancelled){
          setRecords(remoteLearner?.records??[]);
          setGradeLessonTotal(grade?((await curriculum.grade(grade)).unitCount):0);
          setSelectedKey(current=>(remoteLearner?.records??[]).some(record=>record.responseKey===current)?current:(remoteLearner?.records[0]?.responseKey??""));
          setLoading(false);
        }
        return;
      }
      if(!hydrated)return;
      if(!grade){
        if(!cancelled){setRecords([]);setGradeLessonTotal(0);setLoading(false);}
        return;
      }
      setLoading(true);
      try{
        const gradeIndex=await curriculum.grade(grade);
        if(cancelled)return;
        setGradeLessonTotal(gradeIndex.unitCount);
        const unitIds=new Set(Object.keys(localPromptResponses).map(key=>key.split("::prompt-")[0]).filter(Boolean));
        if(!unitIds.size){setRecords([]);setLoading(false);return;}
        const refs:UnitRef[]=gradeIndex.terms.flatMap(term=>
          [...term.units,...term.assessments].map(unit=>({id:unit.id,term:term.term}))
        ).filter(item=>unitIds.has(item.id));
        const units=await Promise.all(refs.map(ref=>curriculum.unit(grade,ref.term,ref.id)));
        const next=units.flatMap(unit=>buildEvidenceRecords(unit,localPromptResponses));
        if(!cancelled){
          setRecords(next);
          setSelectedKey(current=>next.some(record=>record.responseKey===current)?current:(next[0]?.responseKey??""));
        }
      }finally{if(!cancelled)setLoading(false);}
    }
    void load();
    return ()=>{cancelled=true;};
  },[activeState.promptResponses,activeState,grade,hydrated,remoteLearner,remoteWorkspace]);

  const learner=useMemo(()=>{
    if(remoteLearner)return buildLearnerSummary({state:remoteLearner.state,records:remoteLearner.records,reviews:remoteLearner.reviews});
    return buildLearnerSummary({state:activeState,records,reviews});
  },[activeState,records,reviews,remoteLearner]);
  const remoteLearnerSummaries=useMemo(()=>remoteWorkspace?.learners.map(item=>buildLearnerSummary({state:item.state,records:item.records,reviews:item.reviews}))??[],[remoteWorkspace]);
  const cohort=useMemo(()=>remoteLearnerSummaries.length?buildCohortSummary(remoteLearnerSummaries):buildCohortSummary([learner]),[learner,remoteLearnerSummaries]);
  const priorities=useMemo(()=>buildReviewPriorities(records,reviews),[records,reviews]);
  const domains=useMemo(()=>buildDomainCoverage(records,reviews),[records,reviews]);
  const kinds=useMemo(()=>buildKindCoverage(records,reviews),[records,reviews]);
  const terms=useMemo(()=>buildTermCoverage(records,reviews),[records,reviews]);

  const filtered=useMemo(()=>records.filter(record=>{
    if(termFilter&&record.definition.term!==termFilter)return false;
    const review=reviews[record.responseKey];
    if(statusFilter==="unreviewed"&&review)return false;
    if(statusFilter==="reviewed"&&!review)return false;
    if(statusFilter==="revision"&&review?.status!=="needs-revision")return false;
    if(statusFilter==="verification"&&!(record.definition.assessmentMode==="verification"&&!review))return false;
    const query=search.trim().toLowerCase();
    if(query&&![record.definition.unitTitle,record.definition.prompt,record.responseValue,...record.definition.domains].join(" ").toLowerCase().includes(query))return false;
    return true;
  }),[records,reviews,search,statusFilter,termFilter]);

  const selected=filtered.find(record=>record.responseKey===selectedKey)??filtered[0]??records[0];
  const report=useMemo(()=>buildEvidenceReport({learnerName,grade,records,reviews}),[grade,records,reviews,learnerName]);
  const completionRate=gradeLessonTotal?Math.round(learner.completedLessons/gradeLessonTotal*100):0;
  const pendingTotal=priorities.reduce((sum,item)=>sum+item.count,0);
  const currentIndex=selected?filtered.findIndex(record=>record.responseKey===selected.responseKey):-1;
  const advance=()=>{
    if(!filtered.length)return;
    const next=currentIndex>=0&&currentIndex<filtered.length-1?filtered[currentIndex+1]:filtered[0];
    setSelectedKey(next.responseKey);
  };

  return <div className="fac-console">
    <aside className="fac-sidebar">
      <div className="fac-context">
        <span className="fac-context-mark">AC</span>
        <div><small>Facilitator workspace</small><strong>{grade?"Grade "+grade:"No grade selected"}</strong></div>
      </div>
      <nav aria-label="Facilitator dashboard">
        {nav.map(item=>{
          const Icon=item.icon;
          return <button key={item.id} type="button" className={section===item.id?"active":""} onClick={()=>setSection(item.id)} aria-current={section===item.id?"page":undefined}>
            <Icon/><span>{copy[item.id].label}</span>{item.id==="review"&&cohort.pendingCount>0?<em>{cohort.pendingCount}</em>:null}
          </button>;
        })}
      </nav>
      <div className="fac-backend-state">
        <div><span/><strong>{remoteWorkspace?"Shared Supabase cohort":"Local learner record"}</strong></div>
        <p>{remoteWorkspace?"Authenticated cohort data, durable learner records and facilitator reviews are now connected through the existing Supabase security model.":"Sign in with an assigned facilitator account to load the shared cohort workspace."}</p>
      </div>
    </aside>

    {facMenuOpen&&<>
      <button className="fac-menu-scrim" type="button" aria-label="Close facilitator menu" onClick={()=>setFacMenuOpen(false)}/>
      <section className="fac-menu-sheet" role="dialog" aria-modal="true" aria-label="Facilitator menu">
        <header>
          <div><span className="fac-context-mark">AC</span><div><strong>Facilitator workspace</strong><small>{grade?"Grade "+grade:"No grade selected"}</small></div></div>
          <button type="button" onClick={()=>setFacMenuOpen(false)} aria-label="Close facilitator menu"><X/></button>
        </header>
        <nav>
          {nav.map(item=>{
            const Icon=item.icon;
            return <button
              key={item.id}
              type="button"
              className={section===item.id?"active":""}
              onClick={()=>{setSection(item.id);setFacMenuOpen(false);}}
              aria-current={section===item.id?"page":undefined}
            >
              <Icon/>
              <span><strong>{copy[item.id].label}</strong><small>{copy[item.id].description}</small></span>
              {item.id==="review"&&cohort.pendingCount>0?<em>{cohort.pendingCount}</em>:null}
            </button>;
          })}
        </nav>
      </section>
    </>}

    <button
      className="fac-menu-trigger"
      type="button"
      onClick={()=>setFacMenuOpen(true)}
      aria-label="Open facilitator menu"
      aria-haspopup="dialog"
      aria-expanded={facMenuOpen}
    >
      <Menu/><span>Menu</span>
    </button>

    <main className="fac-main">
      <header className="fac-header">
        <div><p className="eyebrow">Evidence & Assessment Engine</p><h1>{copy[section].title}</h1><p>{copy[section].description}</p></div>
        <div className="fac-header-context">
          <small>Current workspace</small>
          <strong>{grade?"Grade "+grade+" · "+titleCase(stageForGrade(grade)):"Local learner record"}</strong>
          <span>{cohort.learnerCount} learner · {cohort.evidenceCount} evidence records</span>
        </div>
      </header>

      {!grade?<NoGradeState/>:null}
      {grade&&section==="overview"?<Overview learnerName={learnerName} cohort={cohort} learner={learner} priorities={priorities} domains={domains} completionRate={completionRate} gradeLessonTotal={gradeLessonTotal} pendingTotal={pendingTotal} onOpenReview={()=>setSection("review")} onOpenLearner={()=>setSection("learners")} onOpenCoverage={()=>setSection("coverage")}/>:null}
      {remoteError?<section className="fac-card"><strong>Shared facilitator data unavailable</strong><p>{remoteError}</p><small>Showing the local learner record until the shared cohort can be loaded.</small></section>:null}
      {remoteLoading&&!remoteWorkspace?<section className="fac-card"><strong>Loading shared cohort…</strong><p>Checking the authenticated facilitator scope and learner records.</p></section>:null}
      {grade&&section==="learners"?<LearnersView learner={learner} learners={remoteLearnerSummaries} selectedLearnerId={remoteLearner?.id??""} onSelectLearner={setSelectedLearnerId} learnerSearch={learnerSearch} setLearnerSearch={setLearnerSearch} gradeLessonTotal={gradeLessonTotal} completionRate={completionRate} domains={domains} terms={terms} onReview={()=>setSection("review")} onReport={()=>setSection("reports")}/>:null}
      {grade&&section==="review"?<ReviewView loading={loading} records={filtered} selected={selected} selectedKey={selectedKey} setSelectedKey={setSelectedKey} reviews={reviews} search={search} setSearch={setSearch} termFilter={termFilter} setTermFilter={setTermFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} saveReview={saveReview} advance={advance}/>:null}
      {grade&&section==="coverage"?<CoverageView learner={learner} domains={domains} terms={terms} kinds={kinds} gradeLessonTotal={gradeLessonTotal} completionRate={completionRate}/>:null}
      {grade&&section==="reports"?<ReportsView report={report} learner={learner} gradeLessonTotal={gradeLessonTotal} completionRate={completionRate}/>:null}
      {grade&&section==="rubrics"?<RubricLibrary/>:null}
    </main>
  </div>;
}

function NoGradeState(){
  return <section className="fac-empty large"><UserRound/><h2>No learner grade selected</h2><p>Set the learner grade in Profile first. Evidence is interpreted against the learner developmental stage, so the dashboard should not guess the grade.</p></section>;
}

type OverviewProps={
  learnerName:string;
  cohort:FacilitatorCohortSummary;
  learner:FacilitatorLearnerSummary;
  priorities:FacilitatorPriorityItem[];
  domains:CoverageRow<EvidenceDomain>[];
  completionRate:number;
  gradeLessonTotal:number;
  pendingTotal:number;
  onOpenReview:()=>void;
  onOpenLearner:()=>void;
  onOpenCoverage:()=>void;
};

function Overview({learnerName,cohort,learner,priorities,domains,completionRate,gradeLessonTotal,pendingTotal,onOpenReview,onOpenLearner,onOpenCoverage}:OverviewProps){
  return <div className="fac-section-stack">
    <section className="fac-metrics">
      <Metric icon={UsersRound} value={cohort.learnerCount} label="Learners in view" hint="Local mode currently exposes one learner record."/>
      <Metric icon={FileCheck2} value={cohort.evidenceCount} label="Evidence captured" hint={cohort.portfolioCount+" portfolio candidates"}/>
      <Metric icon={ClipboardCheck} value={cohort.pendingCount} label="Waiting for review" hint={cohort.reviewRate+"% review coverage"}/>
      <Metric icon={TriangleAlert} value={cohort.needsRevisionCount} label="Needs revision" hint={cohort.verifiedCount+" real-world evidence verified"}/>
    </section>

    <section className="fac-overview-grid">
      <article className="fac-card fac-priority-card">
        <header><div><p className="eyebrow">Today&apos;s work</p><h2>Review priorities</h2></div><button type="button" onClick={onOpenReview}>Open queue <ArrowRight/></button></header>
        <div className="fac-priority-list">
          {priorities.map(item=><button key={item.key} type="button" onClick={onOpenReview} className={item.priority}>
            <span>{item.count}</span><div><strong>{item.label}</strong><small>{item.description}</small></div><ArrowRight/>
          </button>)}
        </div>
        <footer><strong>{pendingTotal?pendingTotal+" items need facilitator attention":"Nothing urgent in the current record"}</strong><span>Queue counts come from actual saved evidence and review status.</span></footer>
      </article>

      <article className="fac-card fac-class-card">
        <header><div><p className="eyebrow">Class pulse</p><h2>{learnerName}</h2></div><button type="button" onClick={onOpenLearner}>Open learner <ArrowRight/></button></header>
        <div className="fac-class-status">
          <div className="fac-progress-circle"><strong>{completionRate}%</strong><span>lesson completion</span></div>
          <dl>
            <div><dt>Lessons complete</dt><dd>{learner.completedLessons}/{gradeLessonTotal||"—"}</dd></div>
            <div><dt>Evidence records</dt><dd>{learner.evidenceCount}</dd></div>
            <div><dt>Reviewed</dt><dd>{learner.reviewedCount}</dd></div>
            <div><dt>Status</dt><dd><em className={"learner-status "+learner.status}>{statusLabel(learner.status)}</em></dd></div>
          </dl>
        </div>
        <footer><span>Last activity</span><strong>{formatLastActivity(learner.lastOpened?.at)}</strong></footer>
      </article>
    </section>

    <section className="fac-overview-grid lower">
      <article className="fac-card fac-coverage-preview">
        <header><div><p className="eyebrow">Evidence quality</p><h2>Developmental coverage</h2></div><button type="button" onClick={onOpenCoverage}>Full coverage <ArrowRight/></button></header>
        {domains.length?<div className="fac-bars">{domains.slice(0,6).map(row=><ProgressRow key={row.key} rowLabel={titleCase(row.key)} value={row.count} reviewed={row.reviewed} rate={row.rate}/>)}</div>:<EmptyInline title="No developmental evidence yet" text="As the learner completes authored prompts, domain coverage will build here automatically."/>}
      </article>

      <article className="fac-card fac-operating-card">
        <p className="eyebrow">Operational rule</p><h2>Review what matters. Don&apos;t mark everything.</h2>
        <p>Applied Commerce keeps every authored response, but facilitator workload should focus on evidence that needs judgement, verification, revision or portfolio confirmation.</p>
        <div>
          <span><CheckCircle2/><strong>Objective checks</strong><small>Use deterministic rules only where an authored answer rule exists.</small></span>
          <span><ClipboardCheck/><strong>Open-ended work</strong><small>Use the relevant rubric and leave actionable feedback.</small></span>
          <span><ShieldCheck/><strong>Real-world evidence</strong><small>Verify that the action or observation actually happened.</small></span>
        </div>
      </article>
    </section>
  </div>;
}

function Metric({icon:Icon,value,label,hint}:{icon:typeof FileCheck2;value:number;label:string;hint:string}){
  return <article><Icon/><div><strong>{value}</strong><span>{label}</span><small>{hint}</small></div></article>;
}

type LearnersViewProps={
  learner:FacilitatorLearnerSummary;
  learners:FacilitatorLearnerSummary[];
  selectedLearnerId:string;
  onSelectLearner:(id:string)=>void;
  learnerSearch:string;
  setLearnerSearch:Dispatch<SetStateAction<string>>;
  gradeLessonTotal:number;
  completionRate:number;
  domains:CoverageRow<EvidenceDomain>[];
  terms:CoverageRow<number>[];
  onReview:()=>void;
  onReport:()=>void;
};

function LearnersView({learner,learners,selectedLearnerId,onSelectLearner,learnerSearch,setLearnerSearch,gradeLessonTotal,completionRate,domains,terms,onReview,onReport}:LearnersViewProps){
  const matches=learner.name.toLowerCase().includes(learnerSearch.trim().toLowerCase());
  return <div className="fac-section-stack">
    <section className="fac-toolbar">
      <label><Search/><input value={learnerSearch} onChange={event=>setLearnerSearch(event.target.value)} placeholder="Search learner"/></label>
      <div><Filter/><span>Shared cohort filters will appear when the backend is active.</span></div>
    </section>

    <section className="fac-learners-layout">
      <article className="fac-card fac-roster-card">
        <header><div><p className="eyebrow">Roster</p><h2>Learners</h2></div><span>1 local record</span></header>
        <div className="fac-roster-table">
          <div className="fac-roster-head"><span>Learner</span><span>Lessons</span><span>Evidence</span><span>Review</span><span>Status</span></div>
          {learners.filter(item=>item.name.toLowerCase().includes(learnerSearch.trim().toLowerCase())).map(item=><button key={item.id} type="button" className={"fac-roster-row "+(item.id===selectedLearnerId?"active":"")} onClick={()=>onSelectLearner(item.id)}>
            <span className="fac-person"><i>{item.name.slice(0,1).toUpperCase()}</i><b>{item.name}</b><small>Grade {item.grade??"—"}</small></span>
            <span>{item.completedLessons}/{gradeLessonTotal||"—"}</span><span>{item.evidenceCount}</span><span>{item.reviewRate}%</span>
            <span><em className={"learner-status "+item.status}>{statusLabel(item.status)}</em></span>
          </button>)}
          {!learners.some(item=>item.name.toLowerCase().includes(learnerSearch.trim().toLowerCase()))?<EmptyInline title="No learner matches that search" text="Clear the search to return to the current cohort."/>:null}
        </div>
      </article>

      <article className="fac-card fac-learner-detail">
        <header>
          <div className="fac-person-large"><i>{learner.name.slice(0,1).toUpperCase()}</i><div><p className="eyebrow">Learner record</p><h2>{learner.name}</h2><span>Grade {learner.grade??"—"} · {statusLabel(learner.status)}</span></div></div>
          <div className="fac-detail-actions"><button type="button" onClick={onReview}>Review evidence</button><button type="button" onClick={onReport}>Open report</button></div>
        </header>
        <div className="fac-detail-metrics">
          <div><span>Lesson completion</span><strong>{completionRate}%</strong><small>{learner.completedLessons} of {gradeLessonTotal||"—"} lessons</small></div>
          <div><span>Evidence captured</span><strong>{learner.evidenceCount}</strong><small>{learner.portfolioCount} portfolio candidates</small></div>
          <div><span>Review coverage</span><strong>{learner.reviewRate}%</strong><small>{learner.pendingCount} waiting</small></div>
          <div><span>Needs revision</span><strong>{learner.needsRevisionCount}</strong><small>{learner.verifiedCount} verified actions</small></div>
        </div>
        <div className="fac-learner-insights">
          <section><h3>Strongest evidence coverage</h3>{domains.length?domains.slice(0,5).map(row=><ProgressRow key={row.key} rowLabel={titleCase(row.key)} value={row.count} reviewed={row.reviewed} rate={row.rate}/>):<p>No evidence domains yet.</p>}</section>
          <section><h3>Term activity</h3>{terms.map(row=><div className="fac-term-row" key={row.key}><span>Term {row.key}</span><strong>{row.count}</strong><small>{row.reviewed} reviewed</small></div>)}</section>
        </div>
      </article>
    </section>
  </div>;
}

type ReviewViewProps={
  loading:boolean;
  records:EvidenceRecord[];
  selected?:EvidenceRecord;
  selectedKey:string;
  setSelectedKey:Dispatch<SetStateAction<string>>;
  reviews:Record<string,EvidenceReview>;
  search:string;
  setSearch:Dispatch<SetStateAction<string>>;
  termFilter:number;
  setTermFilter:Dispatch<SetStateAction<number>>;
  statusFilter:ReviewFilter;
  setStatusFilter:Dispatch<SetStateAction<ReviewFilter>>;
  saveReview:(review:EvidenceReview)=>void;
  advance:()=>void;
};

function ReviewView({loading,records,selected,selectedKey,setSelectedKey,reviews,search,setSearch,termFilter,setTermFilter,statusFilter,setStatusFilter,saveReview,advance}:ReviewViewProps){
  return <section className="fac-review-layout">
    <aside className="fac-review-queue fac-card">
      <header><div><p className="eyebrow">Queue</p><h2>{records.length} evidence items</h2></div></header>
      <div className="fac-review-filters">
        <label><Search/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search evidence"/></label>
        <div>
          <select value={termFilter} onChange={event=>setTermFilter(Number(event.target.value))} aria-label="Filter by term"><option value={0}>All terms</option>{[1,2,3,4].map(term=><option value={term} key={term}>Term {term}</option>)}</select>
          <select value={statusFilter} onChange={event=>setStatusFilter(event.target.value as ReviewFilter)} aria-label="Filter by review state">
            <option value="all">All evidence</option><option value="unreviewed">Unreviewed</option><option value="verification">Needs verification</option><option value="revision">Needs revision</option><option value="reviewed">Reviewed</option>
          </select>
        </div>
      </div>
      <div className="fac-review-list">
        {loading?<p className="fac-list-state">Mapping learner evidence…</p>:null}
        {!loading&&!records.length?<p className="fac-list-state">No evidence matches this view.</p>:null}
        {records.map((record:EvidenceRecord)=>{
          const review=reviews[record.responseKey] as EvidenceReview|undefined;
          return <button key={record.responseKey} type="button" onClick={()=>setSelectedKey(record.responseKey)} className={selectedKey===record.responseKey?"selected":""}>
            <span className="fac-review-meta">T{record.definition.term}{record.definition.lessonNumber?" · L"+record.definition.lessonNumber:""} · {titleCase(record.definition.kind)}</span>
            <strong>{record.definition.prompt}</strong><small>{record.definition.unitTitle}</small>
            <em className={review?.status??"pending"}>{review?titleCase(review.status):record.definition.assessmentMode==="verification"?"Needs verification":"Pending review"}</em>
          </button>;
        })}
      </div>
    </aside>
    <div className="fac-review-panel">
      {selected?<EvidenceReviewPanel key={selected.responseKey} record={selected} existing={reviews[selected.responseKey]} onSave={saveReview} onAdvance={advance}/>:<section className="fac-empty"><ClipboardCheck/><h2>No evidence selected</h2><p>Choose an evidence item from the review queue.</p></section>}
    </div>
  </section>;
}

function EvidenceReviewPanel({record,existing,onSave,onAdvance}:{record:EvidenceRecord;existing?:EvidenceReview;onSave:(review:EvidenceReview)=>void;onAdvance:()=>void}){
  const rubric=rubricByKey(record.definition.rubricKey);
  const [status,setStatus]=useState<ReviewStatus>(existing?.status??"pending");
  const [criteria,setCriteria]=useState<Record<string,1|2|3|4>>(existing?.criteria??{});
  const [feedback,setFeedback]=useState(existing?.feedback??"");
  const [saved,setSaved]=useState(false);
  const scored=rubric?.criteria.filter(criterion=>criteria[criterion.key]).length??0;
  const rubricComplete=!rubric||scored===rubric.criteria.length;
  const scoreValues=Object.values(criteria);
  const average=scoreValues.length?Number((scoreValues.reduce((sum,value)=>sum+value,0)/scoreValues.length).toFixed(1)):null;

  const persist=(nextStatus:ReviewStatus,moveNext=false)=>{
    onSave({responseKey:record.responseKey,rubricKey:rubric?.key,status:nextStatus,criteria,feedback:feedback.trim(),reviewedAt:new Date().toISOString()});
    setStatus(nextStatus);setSaved(true);
    window.setTimeout(()=>{setSaved(false);if(moveNext)onAdvance();},500);
  };

  return <article className="fac-evidence-card">
    <header>
      <div><p className="eyebrow">Grade {record.definition.grade} · Term {record.definition.term}{record.definition.lessonNumber?" · Lesson "+record.definition.lessonNumber:""}</p><h2>{record.definition.unitTitle}</h2>
        <div className="fac-evidence-flags"><span>{titleCase(record.definition.kind)}</span><span>{titleCase(record.definition.assessmentMode)}</span>{record.definition.portfolioEligible?<span className="portfolio">Portfolio candidate</span>:null}</div>
      </div>
      <em className={"fac-review-status "+status}>{titleCase(status)}</em>
    </header>

    <section className="fac-source-context"><div><span>Prompt</span><strong>{record.definition.prompt}</strong></div><div><span>Learner response</span><p>{record.responseValue}</p></div></section>
    <section className="fac-evidence-map">
      <div><span>Development stage</span><strong>{titleCase(record.definition.stage)}</strong></div>
      <div><span>Auto-check</span><strong>{record.autoCheck.label}</strong><small>{record.autoCheck.detail}</small></div>
      <div className="wide"><span>Evidence domains</span><p>{record.definition.domains.map(domain=><em key={domain}>{titleCase(domain)}</em>)}</p></div>
    </section>

    {rubric?<section className="fac-rubric-review">
      <header><div><span>Rubric</span><h3>{rubric.name}</h3><p>{rubric.purpose}</p></div><aside><strong>{average??"—"}</strong><small>{scored}/{rubric.criteria.length} criteria scored</small></aside></header>
      <div className="fac-rubric-criteria">{rubric.criteria.map(criterion=>{
        const selectedLevel=criterion.levels.find(level=>level.level===criteria[criterion.key]);
        return <article key={criterion.key}>
          <div><strong>{criterion.label}</strong><small>{criterion.description}</small>{selectedLevel?<p><b>{selectedLevel.label}</b> — {selectedLevel.description}</p>:null}</div>
          <select value={criteria[criterion.key]??""} onChange={event=>setCriteria(current=>({...current,[criterion.key]:Number(event.target.value) as 1|2|3|4}))} aria-label={criterion.label}>
            <option value="">Not scored</option>{criterion.levels.map(level=><option value={level.level} key={level.level}>{level.level} · {level.label}</option>)}
          </select>
        </article>;
      })}</div>
    </section>:null}

    <label className="fac-feedback"><span>Facilitator feedback</span><textarea rows={5} value={feedback} onChange={event=>setFeedback(event.target.value)} placeholder="Name what is working, what is missing, and the learner next step."/><small>Feedback is part of the evidence history and should help the learner act, not simply explain a score.</small></label>

    <footer className="fac-review-actions">
      <button className="needs-revision" type="button" disabled={!feedback.trim()} onClick={()=>persist("needs-revision")}>Needs revision</button>
      <button className="accept" type="button" disabled={!rubricComplete} onClick={()=>persist(record.definition.assessmentMode==="verification"?"verified":"accepted",true)}>{record.definition.assessmentMode==="verification"?"Verify & next":"Accept & next"}</button>
      {!rubricComplete?<span>Score all rubric criteria before accepting.</span>:null}
      {feedback.trim()===""?<span>Add feedback before returning work for revision.</span>:null}
      {saved?<span className="saved"><CheckCircle2/>Saved</span>:null}
    </footer>
  </article>;
}

type CoverageViewProps={
  learner:FacilitatorLearnerSummary;
  domains:CoverageRow<EvidenceDomain>[];
  terms:CoverageRow<number>[];
  kinds:CoverageRow<EvidenceKind>[];
  gradeLessonTotal:number;
  completionRate:number;
};

function CoverageView({learner,domains,terms,kinds,gradeLessonTotal,completionRate}:CoverageViewProps){
  const allDomains=["self-awareness","agency","economic-reasoning","systems-thinking","value-creation","financial-capability","decision-making","research-observation","communication","planning","execution","reflection"];
  const missingDomains=allDomains.filter(domain=>!domains.some(row=>row.key===domain));
  return <div className="fac-section-stack">
    <section className="fac-metrics">
      <Metric icon={BookOpenCheck} value={learner.completedLessons} label="Lessons completed" hint={completionRate+"% of "+(gradeLessonTotal||"—")+" grade lessons"}/>
      <Metric icon={FileCheck2} value={learner.evidenceCount} label="Evidence records" hint={learner.portfolioCount+" portfolio candidates"}/>
      <Metric icon={ClipboardCheck} value={learner.reviewedCount} label="Reviewed evidence" hint={learner.reviewRate+"% review coverage"}/>
      <Metric icon={Layers3} value={domains.length} label="Domains evidenced" hint={missingDomains.length+" domains not yet represented"}/>
    </section>

    <section className="fac-coverage-grid">
      <article className="fac-card"><header><div><p className="eyebrow">Developmental domains</p><h2>What the evidence is showing</h2></div></header>{domains.length?<div className="fac-bars">{domains.map(row=><ProgressRow key={row.key} rowLabel={titleCase(row.key)} value={row.count} reviewed={row.reviewed} rate={row.rate}/>)}</div>:<EmptyInline title="No domain evidence yet" text="The dashboard will populate as the learner produces authored responses."/>}</article>
      <article className="fac-card"><header><div><p className="eyebrow">Term balance</p><h2>Evidence by term</h2></div></header><div className="fac-term-coverage">{terms.map(row=><div key={row.key}><span>Term {row.key}</span><strong>{row.count}</strong><small>{row.reviewed} reviewed · {row.rate}% coverage</small><i><b style={{width:row.rate+"%"}}/></i></div>)}</div></article>
      <article className="fac-card"><header><div><p className="eyebrow">Evidence mix</p><h2>What learners are being asked to produce</h2></div></header>{kinds.length?<div className="fac-kind-grid">{kinds.map(row=><div key={row.key}><span>{titleCase(row.key)}</span><strong>{row.count}</strong><small>{row.reviewed} reviewed</small></div>)}</div>:<EmptyInline title="No evidence types yet" text="Evidence types are inferred from the authored curriculum prompt and its interaction."/>}</article>
      <article className="fac-card fac-gap-card"><header><div><p className="eyebrow">Coverage gaps</p><h2>Signals not yet visible</h2></div></header>{missingDomains.length?<div className="fac-gap-list">{missingDomains.map(domain=><span key={domain}>{titleCase(domain)}</span>)}</div>:<p className="fac-positive"><CheckCircle2/>All evidence domains have at least one captured signal.</p>}<footer>Absence here means not yet evidenced in the current record. It does not mean the learner lacks the capability.</footer></article>
    </section>
  </div>;
}

type ReportsViewProps={
  report:EvidenceReport;
  learner:FacilitatorLearnerSummary;
  gradeLessonTotal:number;
  completionRate:number;
};

function ReportsView({report,learner,gradeLessonTotal,completionRate}:ReportsViewProps){
  return <div className="fac-section-stack">
    <section className="fac-report-actions"><div><p className="eyebrow">Current report</p><h2>{report.learnerName}</h2><p>Built from actual saved responses and facilitator review decisions.</p></div><button type="button" onClick={()=>window.print()}>Print learner report</button></section>
    <section className="fac-report-sheet">
      <header><div><span>Applied Commerce</span><h2>Learning, action & evidence report</h2><p>{report.grade?"Grade "+report.grade:""}{report.stage?" · "+titleCase(report.stage):""}</p></div><div><small>Learner</small><strong>{report.learnerName}</strong></div></header>
      <div className="fac-report-summary">
        <article><strong>{completionRate}%</strong><span>lesson completion</span><small>{learner.completedLessons}/{gradeLessonTotal||"—"} lessons</small></article>
        <article><strong>{report.totals.responses}</strong><span>evidence records</span><small>{report.totals.portfolioEligible} portfolio candidates</small></article>
        <article><strong>{report.totals.reviewed}</strong><span>reviewed</span><small>{report.totals.needsRevision} need revision</small></article>
        <article><strong>{report.averageRubricLevel??"—"}</strong><span>average rubric level</span><small>across scored evidence</small></article>
      </div>
      <div className="fac-report-columns">
        <article><h3>Developmental evidence</h3>{report.byDomain.length?report.byDomain.map(item=><div className="fac-report-row" key={item.domain}><span>{titleCase(item.domain)}</span><strong>{item.count}</strong><small>{item.reviewed} reviewed</small></div>):<p>No evidence captured yet.</p>}</article>
        <article><h3>Evidence by term</h3>{report.byTerm.length?report.byTerm.map(item=><div className="fac-report-row" key={item.term}><span>Term {item.term}</span><strong>{item.count}</strong><small>{item.reviewed} reviewed</small></div>):<p>No evidence captured yet.</p>}</article>
        <article><h3>Evidence types</h3>{report.byKind.length?report.byKind.map(item=><div className="fac-report-row" key={item.kind}><span>{titleCase(item.kind)}</span><strong>{item.count}</strong></div>):<p>No evidence captured yet.</p>}</article>
        <article className="fac-report-status"><h3>Review status</h3><div><CheckCircle2/><span><strong>{report.totals.accepted}</strong> accepted</span></div><div><ShieldCheck/><span><strong>{report.totals.verified}</strong> verified real-world evidence</span></div><div><TriangleAlert/><span><strong>{report.totals.needsRevision}</strong> needs revision</span></div></article>
      </div>
      <footer>This report describes observable curriculum evidence. It does not claim to measure a learner internal identity, personality or character.</footer>
    </section>
    <section className="fac-card fac-cohort-report-note"><Gauge/><div><p className="eyebrow">Prepared for activation</p><h2>Cohort and school reporting</h2><p>The report model is already structured to aggregate learners by cohort, grade, term, school and evidence domain. It will use shared Supabase records when the backend is reactivated; no redesign of this reporting layer is required.</p></div></section>
  </div>;
}

function RubricLibrary(){
  return <section className="fac-rubric-library">
    <header><p className="eyebrow">Assessment framework</p><h2>One assessment language across the programme</h2><p>Open-ended work remains facilitator-reviewed. Automated checks are deterministic only and never invent a correctness judgement without an authored answer rule.</p></header>
    <div>{RUBRICS.map(rubric=><article className="fac-card" key={rubric.key}>
      <header><div><span>Rubric</span><h3>{rubric.name}</h3></div><small>{rubric.criteria.length} criteria · 4 levels</small></header><p>{rubric.purpose}</p>
      <div className="fac-rubric-library-criteria">{rubric.criteria.map(criterion=><section key={criterion.key}><div><strong>{criterion.label}</strong><small>{criterion.description}</small></div><ol>{criterion.levels.map(level=><li key={level.level}><b>{level.level}</b><span><strong>{level.label}</strong><small>{level.description}</small></span></li>)}</ol></section>)}</div>
    </article>)}</div>
  </section>;
}

function ProgressRow({rowLabel,value,reviewed,rate}:{rowLabel:string;value:number;reviewed:number;rate:number}){
  return <div className="fac-progress-row"><span>{rowLabel}</span><div><i style={{width:Math.min(100,Math.max(0,rate))+"%"}}/></div><strong>{value}</strong><small>{reviewed} reviewed</small></div>;
}

function EmptyInline({title,text}:{title:string;text:string}){
  return <div className="fac-empty-inline"><Archive/><div><strong>{title}</strong><p>{text}</p></div></div>;
}
