import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: { default: "Applied Commerce", template: "%s · Applied Commerce" },
  description: "Applied Commerce learning platform for Grades 8–12.",
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;
}
