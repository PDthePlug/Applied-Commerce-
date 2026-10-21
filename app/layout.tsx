import { LearningSyncStatus } from "@/components/learning-sync-status";
import type { Metadata } from "next";
import "./globals.css";
import "./personalisation.css";
import "./uiux-hardening.css";
import "./classroom.css";
import "./contextual-teacher.css";
import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/lib/auth-context";
import { LearningStoreProvider } from "@/lib/learning-store";
import { PersonalisationProvider } from "@/components/personalisation-provider";

export const metadata: Metadata = {
  title: { default: "Applied Commerce", template: "%s · Applied Commerce" },
  description: "Applied Commerce learning platform for Grades 8–12.",
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><AuthProvider><LearningStoreProvider><PersonalisationProvider><AppShell><LearningSyncStatus/>{children}</AppShell></PersonalisationProvider></LearningStoreProvider></AuthProvider></body></html>;
}
