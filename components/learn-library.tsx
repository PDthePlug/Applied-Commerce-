"use client";
import { useEffect, useState } from "react";
import { curriculum } from "@/lib/curriculum";
import type { CurriculumIndex } from "@/lib/types";
import { GradeCard } from "./grade-card";
import { useLearningStore } from "@/lib/learning-store";

export function LearnLibrary(){
 const [index,setIndex]=useState<CurriculumIndex|null>(null); const {state}=useLearningStore();
 useEffect(()=>{curriculum.index().then(setIndex)},[]);
 return <div className="page library-page"><section className="page-intro"><p className="eyebrow">Curriculum library</p><h1>Five grades. One learning journey.</h1><p>Select a grade to open its four-term map. Lesson numbering, projects and assessments follow the authored curriculum.</p></section><div className="grade-grid compact">{index?.grades.map(g=><GradeCard key={g.grade} grade={g} completed={Object.keys(state.completed).filter(id=>id.startsWith(`g${g.grade}-`)).length}/>)}</div></div>
}
