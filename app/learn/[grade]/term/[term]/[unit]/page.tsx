import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonReader } from "@/components/lesson-reader";
export async function generateMetadata({params}:{params:Promise<{grade:string;term:string}>}):Promise<Metadata>{const p=await params;return {title:`Grade ${p.grade} · Term ${p.term}`};}
export default async function UnitPage({params,searchParams}:{params:Promise<{grade:string;term:string;unit:string}>;searchParams:Promise<{classroom?:string;presentation?:string}>}){const p=await params;const grade=Number(p.grade),term=Number(p.term);if(![8,9,10,11,12].includes(grade)||![1,2,3,4].includes(term))notFound();const context=await searchParams;const presentationOnly=p.unit==="g8-t1-l08-008"&&context.presentation==="1";return <LessonReader grade={grade} term={term} unitId={p.unit} classroomContext={!presentationOnly&&context.classroom==="1"} presentationOnly={presentationOnly}/>;}
