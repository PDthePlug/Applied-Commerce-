import type { Metadata } from "next";
import { ProgressDashboard } from "@/components/progress-dashboard";
export const metadata: Metadata = { title: "Progress" };
export default function Progress(){return <ProgressDashboard/>;}
