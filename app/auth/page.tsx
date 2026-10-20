import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";
import { Brand } from "@/components/brand";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in or create an Applied Commerce account.",
};

export default async function AuthPage({searchParams}:{searchParams:Promise<{link?:string}>}) {
  const {link}=await searchParams;
  return <div className="auth-page">
    <header className="auth-header">
      <Brand subtitle="Learning platform" />
      <span className="auth-secure-label"><ShieldCheck aria-hidden="true" /> Secure sign-in</span>
    </header>
    <div className="auth-entry">
      {link==="expired"&&<p role="alert">That account link could not be used. Request a new link and open it in the browser where you started.</p>}
      <AuthPanel />
    </div>
    <footer className="auth-footer">
      <span>Applied Commerce</span>
      <span>Learning · Action · Evidence · Opportunity</span>
    </footer>
  </div>;
}
