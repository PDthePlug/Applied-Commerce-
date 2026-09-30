import type { Metadata } from "next";
import { PortfolioDashboard } from "@/components/portfolio-dashboard";
export const metadata: Metadata = { title: "Portfolio" };
export default function Portfolio(){return <PortfolioDashboard/>;}
