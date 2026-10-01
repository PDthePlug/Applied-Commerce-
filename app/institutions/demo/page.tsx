import type { Metadata } from "next";
import { InstitutionalDemo } from "@/components/institutional-demo";

export const metadata: Metadata = {
  title: "Institutional Demo",
  description: "Illustrative role-based demonstration of the Applied Commerce learning infrastructure.",
};

export default function InstitutionalDemoPage() {
  return <InstitutionalDemo/>;
}
