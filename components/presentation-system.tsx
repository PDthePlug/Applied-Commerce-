"use client";

import type { ReactNode } from "react";
import type { LearningMode } from "@/lib/semantic-learning";
import { ChevronDown } from "lucide-react";
import { lessonHeadingText, lessonIcons, learningLevelIcons, type LessonIconName } from "@/lib/lesson-icons";

type NoticeTone = "activity" | "reflection" | "checkpoint" | "portfolio" | "home";
export type ResponseTone = "default" | "activity" | "reflection" | "checkpoint" | "home" | "assessment";

const noticeMeta={
  activity:{label:"Activity",icon:"activity"},
  reflection:{label:"Reflect",icon:"reflection"},
  checkpoint:{label:"Checkpoint",icon:"checkpoint"},
  portfolio:{label:"Portfolio evidence",icon:"portfolio"},
  home:{label:"Try This at Home",icon:"home"},
} as const;

export function LessonIcon({name}:{name:LessonIconName}){
  return <span className="lesson-symbol" aria-hidden="true" data-lesson-icon={name}>{lessonIcons[name].symbol}</span>;
}

function CheckpointTitle({title}:{title:string}){
  // Restore only an explicitly named level; do not guess the level of a question.
  const match=title.match(/\b(Remember|Understand|Apply|Analy[sz]e|Evaluate|Create)\b/i);
  if(!match||match.index===undefined) return title;
  const name=Object.keys(learningLevelIcons).find(level=>level.toLowerCase()===match[0].toLowerCase().replace("analyse","analyze")) as keyof typeof learningLevelIcons;
  const before=title.slice(0,match.index);
  const symbol=learningLevelIcons[name];
  return <>{before}{before.trimEnd().endsWith(symbol)?null:<span className="lesson-symbol lesson-level-symbol" aria-hidden="true">{symbol}</span>}{title.slice(match.index)}</>;
}

export function LessonIconKey(){
  return <details className="lesson-icon-key">
    <summary>Lesson icons <ChevronDown aria-hidden="true"/></summary>
    <dl>{Object.entries(lessonIcons).map(([name,meta])=><div key={name}>
      <dt><LessonIcon name={name as LessonIconName}/>{meta.label}</dt><dd>{meta.meaning}</dd>
    </div>)}</dl>
    <p className="lesson-level-key-label">Learning levels</p>
    <ul>{Object.entries(learningLevelIcons).map(([label,symbol])=><li key={label}><span className="lesson-symbol" aria-hidden="true">{symbol}</span>{label}</li>)}</ul>
  </details>;
}

export function LessonSectionHeading({title}:{title:string}){
  const text=lessonHeadingText(title);
  return <h2 className="source-section">{/^Learning Outcomes$/i.test(text)?null:<LessonIcon name="read"/>}{text}</h2>;
}

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
  const text=lessonHeadingText(title);
  const toneClass=tone==="home"?"learning-notice-activity learning-notice-home":`learning-notice-${tone}`;
  return <aside className={`learning-notice ${toneClass}`} data-learning-mode={tone==="reflection"?"reflect":tone==="checkpoint"||tone==="portfolio"?"prove":"do"}>
    <div className="learning-notice-icon"><LessonIcon name={meta.icon}/></div>
    <div className="learning-notice-copy">
      <span>{meta.label}</span>
      <h2>{tone==="checkpoint"?<CheckpointTitle title={text}/>:text}</h2>
      {body?<p>{body}</p>:null}
    </div>
  </aside>;
}

export function StoryHeading({title}:{title:string}){
  return <header className="story-heading-block" data-learning-mode="read">
    <span><LessonIcon name="read"/> Story</span>
    <h2 className="story-heading">{lessonHeadingText(title)}</h2>
  </header>;
}

export function ThinkingEquationNotice({equation}:{equation:string}){
  return <aside className="thinking-equation-notice" data-learning-mode="understand">
    <div className="thinking-equation-icon"><LessonIcon name="equation"/></div>
    <div className="thinking-equation-copy">
      <span>Thinking Equation</span>
      <strong>{equation}</strong>
    </div>
  </aside>;
}

export function DeepeningInsightPanel({children}:{children:ReactNode}){
  return <details className="deepening-insight">
    <summary>
      <div className="learning-notice-icon"><LessonIcon name="reflection"/></div>
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
  tone="default",
  mode,
}:{
  prompt?:ReactNode;
  children:ReactNode;
  compact?:boolean;
  tone?:ResponseTone;
  mode?:LearningMode;
}){
  const learningMode=mode??(tone==="reflection"?"reflect":tone==="checkpoint"||tone==="assessment"?"prove":"do");
  return <section data-learning-mode={learningMode} className={`response-surface response-surface-${tone} ${compact?"response-surface-compact":""}`}>
    {prompt?<div className="response-surface-prompt">{prompt}</div>:null}
    <div className="response-surface-control">{children}</div>
  </section>;
}

export function PortfolioCaptureNotice({instruction}:{instruction?:string}){
  const body=instruction ? `${instruction.replace(/^Portfolio:\s*/i,"")} Your responses stay with this lesson on this device.` : "Your responses stay with this lesson on this device.";
  return <details className="portfolio-capture-disclosure">
    <summary>
      <span><LessonIcon name="portfolio"/>Portfolio evidence</span>
      <ChevronDown aria-hidden="true"/>
    </summary>
    <div className="portfolio-capture-body"><p>{body}</p></div>
  </details>;
}
