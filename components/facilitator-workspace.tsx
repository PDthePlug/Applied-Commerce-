"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Search,
  ShieldCheck,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { curriculum } from "@/lib/curriculum";
import { buildEvidenceRecords } from "@/lib/evidence/engine";
import { buildEvidenceReport } from "@/lib/evidence/reporting";
import { RUBRICS, rubricByKey } from "@/lib/evidence/taxonomy";
import { useEvidenceReviewStore } from "@/lib/evidence/review-store";
import type { EvidenceRecord, EvidenceReview, ReviewStatus } from "@/lib/evidence/types";
import { useLearningStore } from "@/lib/learning-store";

type Tab="queue"|"report"|"rubrics";
type UnitRef={id:string;term:number};

function label(value:string){
  return value.replace(/-/g," ").replace(/\b\w/g,char=>char.toUpperCase());
}

export function FacilitatorWorkspace(){
  const {state,hydrated}=useLearningStore();
  const {reviews,saveReview}=useEvidenceReviewStore();
  const [records,setRecords]=useState<EvidenceRecord[]>([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState<Tab>("queue");
  const [selectedKey,setSelectedKey]=useState("");
  const [termFilter,setTermFilter]=useState<number|0>(0);
  const [statusFilter,setStatusFilter]=useState<"all"|"unreviewed"|"reviewed"|"revision">("all");
  const [search,setSearch]=useState("");

  const grade=state.profile?.grade??state.activeGrade;

  useEffect(()=>{
    let cancelled=false;
    async function load(){
      if(!hydrated) return;
      if(!grade){
        if(!cancelled){setRecords([]);setLoading(false);}
        return;
      }
      setLoading(true);
      const ids=new Set(
        Object.keys(state.promptResponses)
          .map(key=>key.split("::prompt-")[0])
          .filter(Boolean)
      );
      if(!ids.size){
        if(!cancelled){setRecords([]);setLoading(false);}
        return;
      }
      try{
        const gradeIndex=await curriculum.grade(grade);
        const refs:UnitRef[]=gradeIndex.terms.flatMap(term=>
          [...term.units,...term.assessments].map(unit=>({id:unit.id,term:term.term}))
        ).filter(item=>ids.has(item.id));
        const units=await Promise.all(refs.map(ref=>curriculum.unit(grade,ref.term,ref.id)));
        const next=units.flatMap(unit=>buildEvidenceRecords(unit,state.promptResponses));
        if(!cancelled){
          setRecords(next);
          setSelectedKey(current=>next.some(record=>record.responseKey===current)?current:(next[0]?.responseKey??""));
        }
      }finally{
        if(!cancelled) setLoading(false);
      }
    }
    void load();
    return ()=>{cancelled=true;};
  },[grade,hydrated,state.promptResponses]);

  const filtered=useMemo(()=>records.filter(record=>{
    if(termFilter&&record.definition.term!==termFilter) return false;
    const review=reviews[record.responseKey];
    if(statusFilter==="unreviewed"&&review) return false;
    if(statusFilter==="reviewed"&&!review) return false;
    if(statusFilter==="revision"&&review?.status!=="needs-revision") return false;
    const query=search.trim().toLowerCase();
    if(query&&![
      record.definition.unitTitle,
      record.definition.prompt,
      record.responseValue,
      ...record.definition.domains,
    ].join(" ").toLowerCase().includes(query)) return false;
    return true;
  }),[records,reviews,search,statusFilter,termFilter]);

  const selected=records.find(record=>record.responseKey===selectedKey)??filtered[0]??records[0];
  const report=useMemo(()=>buildEvidenceReport({
    learnerName:state.profile?.displayName?.trim()||"Current learner",
    grade,
    records,
    reviews,
  }),[grade,records,reviews,state.profile?.displayName]);

  const counts={
    responses:records.length,
    portfolio:records.filter(record=>record.definition.portfolioEligible).length,
    reviewed:records.filter(record=>Boolean(reviews[record.responseKey])).length,
    attention:records.filter(record=>reviews[record.responseKey]?.status==="needs-revision").length,
  };

  return <div className="facilitator-page">
    <section className="facilitator-hero">
      <div>
        <p className="eyebrow">Evidence & Assessment Engine</p>
        <h1>Facilitator review workspace</h1>
        <p>Review actual learner responses, connect them to developmental evidence, apply a consistent rubric and turn the record into a report.</p>
      </div>
      <aside>
        <ShieldCheck/>
        <div><strong>Local evidence mode</strong><span>This workspace is reading real responses saved in this browser. Shared school/cohort access will switch on when the dedicated Applied Commerce backend is active.</span></div>
      </aside>
    </section>

    <section className="facilitator-metrics">
      <Metric icon={FileCheck2} value={counts.responses} label="Captured responses"/>
      <Metric icon={Archive} value={counts.portfolio} label="Portfolio candidates"/>
      <Metric icon={ClipboardCheck} value={counts.reviewed} label="Reviewed"/>
      <Metric icon={TriangleAlert} value={counts.attention} label="Needs revision"/>
    </section>

    <nav className="facilitator-tabs" aria-label="Facilitator workspace sections">
      <button className={tab==="queue"?"active":""} onClick={()=>setTab("queue")}>Review queue</button>
      <button className={tab==="report"?"active":""} onClick={()=>setTab("report")}>Learner report</button>
      <button className={tab==="rubrics"?"active":""} onClick={()=>setTab("rubrics")}>Rubrics</button>
    </nav>

    {!grade?<section className="facilitator-empty"><UserRound/><h2>No learner grade selected</h2><p>Set the learner&apos;s grade in Profile first. Evidence is always interpreted in the context of the learner&apos;s current developmental stage.</p></section>:null}

    {grade&&tab==="queue"?<section className="facilitator-review-layout">
      <aside className="facilitator-queue">
        <div className="queue-tools">
          <label><Search/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search evidence"/></label>
          <div>
            <select value={termFilter} onChange={event=>setTermFilter(Number(event.target.value))} aria-label="Filter by term">
              <option value={0}>All terms</option>
              {[1,2,3,4].map(term=><option value={term} key={term}>Term {term}</option>)}
            </select>
            <select value={statusFilter} onChange={event=>setStatusFilter(event.target.value as typeof statusFilter)} aria-label="Filter by review status">
              <option value="all">All evidence</option>
              <option value="unreviewed">Unreviewed</option>
              <option value="reviewed">Reviewed</option>
              <option value="revision">Needs revision</option>
            </select>
          </div>
        </div>
        <div className="queue-list">
          {loading?<p className="queue-state">Mapping learner evidence…</p>:null}
          {!loading&&!filtered.length?<p className="queue-state">No evidence matches this view.</p>:null}
          {filtered.map(record=>{
            const review=reviews[record.responseKey];
            return <button key={record.responseKey} onClick={()=>setSelectedKey(record.responseKey)} className={selected?.responseKey===record.responseKey?"selected":""}>
              <span className="queue-meta">Term {record.definition.term}{record.definition.lessonNumber?" · Lesson "+record.definition.lessonNumber:""}</span>
              <strong>{record.definition.prompt}</strong>
              <small>{label(record.definition.kind)} · {record.definition.domains.slice(0,2).map(label).join(" · ")}</small>
              <em className={review?.status??"pending"}>{review?label(review.status):"Pending review"}</em>
            </button>;
          })}
        </div>
      </aside>

      <div className="facilitator-review-panel">
        {selected?<EvidenceReviewPanel
          key={selected.responseKey}
          record={selected}
          existing={reviews[selected.responseKey]}
          onSave={saveReview}
        />:<section className="facilitator-empty compact"><ClipboardCheck/><h2>Select evidence to review</h2><p>The learner&apos;s saved responses will appear here as evidence records.</p></section>}
      </div>
    </section>:null}

    {grade&&tab==="report"?<LearnerReportView report={report}/>:null}
    {grade&&tab==="rubrics"?<RubricLibrary/>:null}
  </div>;
}

function Metric({icon:Icon,value,label:metricLabel}:{icon:typeof FileCheck2;value:number;label:string}){
  return <article><Icon/><strong>{value}</strong><span>{metricLabel}</span></article>;
}

function EvidenceReviewPanel({
  record,
  existing,
  onSave,
}:{
  record:EvidenceRecord;
  existing?:EvidenceReview;
  onSave:(review:EvidenceReview)=>void;
}){
  const rubric=rubricByKey(record.definition.rubricKey);
  const [status,setStatus]=useState<ReviewStatus>(existing?.status??"pending");
  const [criteria,setCriteria]=useState<Record<string,1|2|3|4>>(existing?.criteria??{});
  const [feedback,setFeedback]=useState(existing?.feedback??"");
  const [saved,setSaved]=useState(false);

  const persist=(nextStatus:ReviewStatus)=>{
    onSave({
      responseKey:record.responseKey,
      rubricKey:rubric?.key,
      status:nextStatus,
      criteria,
      feedback:feedback.trim(),
      reviewedAt:new Date().toISOString(),
    });
    setStatus(nextStatus);
    setSaved(true);
    window.setTimeout(()=>setSaved(false),1200);
  };

  return <article className="evidence-review-card">
    <header>
      <div>
        <p className="eyebrow">Grade {record.definition.grade} · Term {record.definition.term}{record.definition.lessonNumber?" · Lesson "+record.definition.lessonNumber:""}</p>
        <h2>{record.definition.unitTitle}</h2>
      </div>
      <span className="assessment-mode">{label(record.definition.assessmentMode)}</span>
    </header>

    <section className="evidence-prompt">
      <span>Prompt</span>
      <strong>{record.definition.prompt}</strong>
    </section>
    <section className="evidence-answer">
      <span>Learner response</span>
      <p>{record.responseValue}</p>
    </section>

    <section className="evidence-mapping">
      <div><span>Development stage</span><strong>{label(record.definition.stage)}</strong></div>
      <div><span>Evidence type</span><strong>{label(record.definition.kind)}</strong></div>
      <div><span>Portfolio</span><strong>{record.definition.portfolioEligible?"Candidate":"Learning evidence"}</strong></div>
      <div><span>Auto-check</span><strong>{record.autoCheck.label}</strong></div>
      <div className="wide"><span>Domains</span><p>{record.definition.domains.map(domain=><em key={domain}>{label(domain)}</em>)}</p></div>
    </section>

    {rubric?<section className="review-rubric">
      <div className="review-rubric-heading"><div><span>Rubric</span><h3>{rubric.name}</h3></div><p>{rubric.purpose}</p></div>
      {rubric.criteria.map(criterion=><div className="rubric-row" key={criterion.key}>
        <div><strong>{criterion.label}</strong><small>{criterion.description}</small></div>
        <select
          value={criteria[criterion.key]??""}
          onChange={event=>setCriteria(current=>({...current,[criterion.key]:Number(event.target.value) as 1|2|3|4}))}
          aria-label={criterion.label}
        >
          <option value="">Not scored</option>
          {criterion.levels.map(level=><option value={level.level} key={level.level}>{level.level} · {level.label}</option>)}
        </select>
      </div>)}
    </section>:null}

    <label className="review-feedback"><span>Facilitator feedback</span><textarea rows={5} value={feedback} onChange={event=>setFeedback(event.target.value)} placeholder="What is strong, what is missing, and what should the learner do next?"/></label>

    <footer className="review-actions">
      <button className="revision" onClick={()=>persist("needs-revision")}>Needs revision</button>
      <button className="accept" onClick={()=>persist(record.definition.assessmentMode==="verification"?"verified":"accepted")}>
        {record.definition.assessmentMode==="verification"?"Verify evidence":"Accept evidence"}
      </button>
      {saved?<span><CheckCircle2/>Saved</span>:null}
    </footer>
  </article>;
}

function LearnerReportView({report}:{report:ReturnType<typeof buildEvidenceReport>}){
  return <section className="evidence-report">
    <header>
      <div><p className="eyebrow">Evidence report</p><h2>{report.learnerName}</h2><p>{report.grade?"Grade "+report.grade:""}{report.stage?" · "+label(report.stage):""}</p></div>
      <button onClick={()=>window.print()}>Print report</button>
    </header>
    <div className="report-metrics">
      <article><strong>{report.totals.responses}</strong><span>evidence records</span></article>
      <article><strong>{report.totals.reviewed}</strong><span>reviewed</span></article>
      <article><strong>{report.totals.portfolioEligible}</strong><span>portfolio candidates</span></article>
      <article><strong>{report.averageRubricLevel??"—"}</strong><span>average rubric level</span></article>
    </div>
    <div className="report-grid">
      <article>
        <h3>Developmental evidence</h3>
        {report.byDomain.length?report.byDomain.map(item=><div className="report-row" key={item.domain}><span>{label(item.domain)}</span><strong>{item.count}</strong><small>{item.reviewed} reviewed</small></div>):<p>No evidence captured yet.</p>}
      </article>
      <article>
        <h3>Evidence by term</h3>
        {report.byTerm.length?report.byTerm.map(item=><div className="report-row" key={item.term}><span>Term {item.term}</span><strong>{item.count}</strong><small>{item.reviewed} reviewed</small></div>):<p>No evidence captured yet.</p>}
      </article>
      <article>
        <h3>Evidence types</h3>
        {report.byKind.length?report.byKind.map(item=><div className="report-row" key={item.kind}><span>{label(item.kind)}</span><strong>{item.count}</strong></div>):<p>No evidence captured yet.</p>}
      </article>
      <article className="report-status">
        <h3>Review status</h3>
        <div><CheckCircle2/><span><strong>{report.totals.accepted}</strong> accepted</span></div>
        <div><ShieldCheck/><span><strong>{report.totals.verified}</strong> verified real-world evidence</span></div>
        <div><TriangleAlert/><span><strong>{report.totals.needsRevision}</strong> needs revision</span></div>
      </article>
    </div>
    <footer>This report describes observable curriculum evidence. It does not claim to measure a learner&apos;s internal identity or character.</footer>
  </section>;
}

function RubricLibrary(){
  return <section className="rubric-library">
    <header><p className="eyebrow">Assessment framework</p><h2>Four reusable evidence rubrics</h2><p>Open-ended work is facilitator-reviewed. Automated checks are deterministic only and never invent a correctness judgement without an authored answer rule.</p></header>
    <div>{RUBRICS.map(rubric=><article key={rubric.key}><h3>{rubric.name}</h3><p>{rubric.purpose}</p>{rubric.criteria.map(criterion=><section key={criterion.key}><strong>{criterion.label}</strong><small>{criterion.description}</small><ol>{criterion.levels.map(level=><li key={level.level}><b>{level.level} · {level.label}</b><span>{level.description}</span></li>)}</ol></section>)}</article>)}</div>
  </section>;
}
