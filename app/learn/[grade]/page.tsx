import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GradeMap } from "@/components/grade-map";
export async function generateMetadata({params}:{params:Promise<{grade:string}>}):Promise<Metadata>{const {grade}=await params;return {title:`Grade ${grade}`};}
export default async function GradePage({params}:{params:Promise<{grade:string}>}){const {grade:raw}=await params;const grade=Number(raw);if(![8,9,10,11,12].includes(grade))notFound();return <GradeMap grade={grade}/>;}
