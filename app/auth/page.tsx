import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth-panel";
export const metadata: Metadata = { title: "Learner account" };
export default function AuthPage(){ return <div className="auth-page"><p className="eyebrow">Applied Commerce</p><h1>Learner account</h1><p>Use an account when the learning record needs to travel beyond this browser.</p><AuthPanel /></div>; }
