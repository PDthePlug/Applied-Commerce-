"use client";

import type { ReactNode } from "react";
import { Archive, CheckCircle2, ChevronDown, Equal, House, Lightbulb, MessageCircleQuestion, PenLine } from "lucide-react";

type NoticeTone = "activity" | "reflection" | "checkpoint" | "portfolio" | "home";

const noticeMeta={
  activity:{label:"Activity",icon:PenLine},
  reflection:{label:"Reflect",icon:MessageCircleQuestion},
  checkpoint:{label:"Checkpoint",icon:CheckCircle2},
  portfolio:{label:"Portfolio evidence",icon:Archive},
  home:{label:"Try This at Home",icon:House},
} as const;

export function LearningNotice({
  tone,
  title,
  body,
}:{
  tone:NoticeTone;
  title:string;
  body?:string;
}){
  const meta=noticeMeta[tone];
  const Icon=meta.icon;
  const toneClass=tone==="home"?"learning-notice-activity learning-notice-home":`learning-notice-${tone}`;
  return <aside className={`learning-notice ${toneClass}`}>
    <div className="learning-notice-icon"><Icon aria-hidden="true"/></div>
    <div className="learning-notice-copy">
      <span>{meta.label}</span>
      <strong>{title}</strong>
      {body?<p>{body}</p>:null}
    </div>
  </aside>;
}

export function ThinkingEquationNotice({equation}:{equation:string}){
  return <aside className="thinking-equation-notice">
    <div className="thinking-equation-icon"><Equal aria-hidden="true"/></div>
    <div className="thinking-equation-copy">
      <span>Thinking Equation</span>
      <strong>{equation}</strong>
    </div>
  </aside>;
}

export function DeepeningInsightPanel({children}:{children:ReactNode}){
  return <details className="deepening-insight">
    <summary>
      <div className="learning-notice-icon"><Lightbulb aria-hidden="true"/></div>
      <div><strong>Deepening Insight</strong><small>Tap to explore the deeper idea</small></div>
      <ChevronDown aria-hidden="true"/>
    </summary>
    <div className="deepening-insight-body">{children}</div>
  </details>;
}

export function ResponseSurface({
  prompt,
  children,
  compact=false,
}:{
  prompt?:ReactNode;
  children:ReactNode;
  compact?:boolean;
}){
  return <section className={`response-surface ${compact?"response-surface-compact":""}`}>
    {prompt?<div className="response-surface-prompt">{prompt}</div>:null}
    <div className="response-surface-control">{children}</div>
  </section>;
}

export function PortfolioCaptureNotice(){
  return <LearningNotice
    tone="portfolio"
    title="This work is added to your portfolio automatically."
    body="Complete the activity here. Applied Commerce keeps the relevant evidence with this lesson—there is nothing extra to save."
  />;
}
