import type { Metadata } from "next";
import { LearnLibrary } from "@/components/learn-library";
export const metadata: Metadata = { title: "Curriculum" };
export default function Learn(){ return <LearnLibrary/>; }
