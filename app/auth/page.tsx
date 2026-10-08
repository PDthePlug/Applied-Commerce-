import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth-panel";
export const metadata: Metadata = { title: "Account access" };
export default function AuthPage(){ return <div className="auth-page"><p className="eyebrow">Applied Commerce</p><h1>Account access</h1><p>Sign in with one account. Access to learner, facilitator and institutional workspaces is assigned separately.</p><AuthPanel /></div>; }
