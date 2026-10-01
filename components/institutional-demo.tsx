"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  Users,
} from "lucide-react";

type Role = "learner" | "facilitator" | "manager" | "sponsor";

const roles: {id:Role; label:string; detail:string; icon:typeof GraduationCap}[] = [
  {id:"learner",label:"Learner",detail:"Guided learning and portfolio",icon:GraduationCap},
  {id:"facilitator",label:"Facilitator",detail:"Cohort attention and evidence",icon:Users},
  {id:"manager",label:"Programme Manager",detail:"Delivery and intervention",icon:Building2},
  {id:"sponsor",label:"Sponsor",detail:"Reach, progress and proof",icon:BarChart3},
];

const learners = [
  {name:"Lerato M.",progress:82,evidence:11,status:"On track"},
  {name:"Thabo N.",progress:74,evidence:9,status:"On track"},
  {name:"Anele D.",progress:41,evidence:4,status:"Needs support"},
  {name:"Karabo S.",progress:88,evidence:13,status:"On track"},
];

export function InstitutionalDemo() {
  const [role,setRole]=useState<Role>("learner");

  return <div className="institutional-page institutional-demo-page">
    <div className="institutional-demo-topline">
      <Link className="institutional-back" href="/institutions"><ArrowLeft/> For institutions</Link>
      <span>Illustrative demo data · Not client results</span>
    </div>

    <section className="institutional-demo-heading">
      <p className="eyebrow">Institutional operating model</p>
      <h1>One programme. Four perspectives.</h1>
      <p>
        This demonstration shows how the same learning activity can move from a learner experience into facilitator action,
        programme management and sponsor-level evidence.
      </p>
    </section>

    <div className="institutional-role-tabs" role="tablist" aria-label="Choose demo perspective">
      {roles.map(item=>{
        const Icon=item.icon;
        const active=role===item.id;
        return <button
          key={item.id}
          type="button"
          className={active?"active":""}
          onClick={()=>setRole(item.id)}
          role="tab"
          aria-selected={active}
        >
          <Icon/><span><strong>{item.label}</strong><small>{item.detail}</small></span>
        </button>;
      })}
    </div>

    <section className="institutional-demo-frame">
      <header className="institutional-demo-programme">
        <div>
          <span>Illustrative programme</span>
          <h2>Youth Enterprise Accelerator</h2>
          <p>Gauteng · Cohort A · 30 learners · 8-week programme</p>
        </div>
        <small>Demo environment</small>
      </header>

      {role==="learner" && <LearnerView/>}
      {role==="facilitator" && <FacilitatorView/>}
      {role==="manager" && <ManagerView/>}
      {role==="sponsor" && <SponsorView/>}
    </section>

    <section className="institutional-demo-explainer">
      <FileCheck2/>
      <div>
        <p className="eyebrow">Why this matters</p>
        <h2>The evidence does not begin in a report. It begins inside the learning task.</h2>
        <p>
          That is the architecture Applied Commerce is proving: learner action becomes structured evidence, which can then
          support facilitation, programme operations and sponsor reporting.
        </p>
      </div>
      <Link href="/institutions/digitise">See programme digitisation <ArrowRight/></Link>
    </section>
  </div>;
}

function LearnerView(){
  return <div className="institutional-role-view">
    <section className="demo-learner-hero">
      <div>
        <p className="eyebrow">Your next step</p>
        <h3>Module 4 · Test the value proposition</h3>
        <p>Speak to two potential customers, record what they actually say, then update your offer.</p>
        <button type="button">Continue learning <ArrowRight/></button>
      </div>
      <div className="demo-progress-ring"><strong>68%</strong><span>programme complete</span></div>
    </section>
    <div className="demo-stat-grid">
      <article><BookOpenCheck/><strong>12 / 18</strong><span>learning tasks complete</span></article>
      <article><FileCheck2/><strong>9</strong><span>evidence items captured</span></article>
      <article><ClipboardCheck/><strong>3</strong><span>portfolio milestones</span></article>
    </div>
    <article className="demo-evidence-card">
      <span>Portfolio evidence · captured from Module 3</span>
      <h3>Customer problem interview</h3>
      <p>“Three people said the biggest problem is not price — it is not knowing when their order will be ready.”</p>
      <small><CheckCircle2/> Saved to learner portfolio</small>
    </article>
  </div>;
}

function FacilitatorView(){
  return <div className="institutional-role-view">
    <div className="demo-stat-grid">
      <article><Users/><strong>24</strong><span>active this week</span></article>
      <article><FileCheck2/><strong>18</strong><span>new evidence items</span></article>
      <article><ClipboardCheck/><strong>3</strong><span>learners need attention</span></article>
    </div>
    <section className="demo-attention-panel">
      <div className="demo-panel-heading"><div><p className="eyebrow">Facilitator attention</p><h3>Who needs you today?</h3></div><span>3 flagged</span></div>
      {learners.map(learner=><article key={learner.name} className={learner.status==="Needs support"?"needs-support":""}>
        <div><strong>{learner.name}</strong><small>{learner.evidence} evidence items</small></div>
        <span>{learner.progress}%</span>
        <em>{learner.status}</em>
      </article>)}
    </section>
  </div>;
}

function ManagerView(){
  return <div className="institutional-role-view">
    <div className="demo-stat-grid four-up">
      <article><Users/><strong>30</strong><span>enrolled</span></article>
      <article><BarChart3/><strong>76%</strong><span>average progress</span></article>
      <article><FileCheck2/><strong>91</strong><span>evidence items</span></article>
      <article><ClipboardCheck/><strong>4</strong><span>open interventions</span></article>
    </div>
    <section className="demo-manager-grid">
      <article>
        <p className="eyebrow">Cohort progression</p>
        <h3>Where the programme is moving</h3>
        {[["Module 1","97%"],["Module 2","90%"],["Module 3","83%"],["Module 4","64%"],["Module 5","31%"]].map(([label,value])=><div className="demo-progress-row" key={label}>
          <span>{label}</span><div><i style={{width:value}}/></div><strong>{value}</strong>
        </div>)}
      </article>
      <article className="demo-signal-card">
        <p className="eyebrow">Programme signal</p>
        <h3>Customer interviews are the current friction point.</h3>
        <p>Six learners have opened the task more than once without submitting evidence. Facilitators can intervene before the cohort falls behind.</p>
        <span>6 learners · Module 4</span>
      </article>
    </section>
  </div>;
}

function SponsorView(){
  return <div className="institutional-role-view">
    <div className="demo-stat-grid four-up sponsor-stats">
      <article><Users/><strong>120</strong><span>learners reached</span></article>
      <article><Building2/><strong>4</strong><span>cohorts</span></article>
      <article><FileCheck2/><strong>436</strong><span>evidence items</span></article>
      <article><BarChart3/><strong>78%</strong><span>illustrative completion</span></article>
    </div>
    <section className="demo-sponsor-grid">
      <article>
        <p className="eyebrow">Evidence mix</p>
        <h3>What learners have actually produced</h3>
        <ul>
          <li><strong>112</strong><span>Problem observations</span></li>
          <li><strong>96</strong><span>Customer interviews</span></li>
          <li><strong>84</strong><span>Value propositions</span></li>
          <li><strong>73</strong><span>Simple budgets</span></li>
          <li><strong>71</strong><span>Reflection records</span></li>
        </ul>
      </article>
      <article className="demo-signal-card">
        <p className="eyebrow">Reporting principle</p>
        <h3>Move beyond attendance as the primary proof of delivery.</h3>
        <p>Reach and completion still matter. The platform adds structured evidence of learner action so programme reporting can show what happened between enrolment and completion.</p>
        <span>Illustrative reporting architecture</span>
      </article>
    </section>
  </div>;
}
