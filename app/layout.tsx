import type { Metadata } from "next";
import "./globals.css";
import "./personalisation.css";
import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/lib/auth-context";
import { PersonalisationProvider } from "@/components/personalisation-provider";

export const metadata: Metadata = {
  title: { default: "Applied Commerce", template: "%s · Applied Commerce" },
  description: "Applied Commerce learning platform for Grades 8–12.",
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><AuthProvider><PersonalisationProvider><AppShell>{children}</AppShell></PersonalisationProvider></AuthProvider></body></html>;
}
