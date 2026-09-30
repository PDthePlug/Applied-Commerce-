"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { GradeSummary } from "@/lib/types";
import { gradeThemes } from "@/lib/curriculum";

export function GradeCard({grade,completed}:{grade:GradeSummary;completed:number}) {
  const pct=grade.unitCount ? Math.round(completed/grade.unitCount*100):0;
  return <Link href={`/learn/${grade.grade}`} className={`grade-card grade-${grade.grade}`}>
    <div className="grade-card-top"><span>Grade</span><strong>{grade.grade}</strong><ArrowUpRight/></div>
    <div>
      <p className="eyebrow">{gradeThemes[grade.grade]}</p>
      <h2>{grade.title.replace(/^APPLIED COMMERCE\s*[—-]\s*/i,"")}</h2>
    </div>
    <div className="grade-card-bottom">
      <div><strong>{grade.unitCount}</strong><span>lesson pages</span></div>
      <div><strong>4</strong><span>terms</span></div>
      <div><strong>{pct}%</strong><span>complete</span></div>
    </div>
    <div className="mini-progress"><span style={{width:`${pct}%`}}/></div>
  </Link>;
}
