import type { Metadata } from "next";
import { InstitutionalAdmin } from "@/components/institutional-admin";

export const metadata: Metadata = {
  title: "Institution Operations",
  description: "Provision Applied Commerce schools, cohorts, educators and learners.",
};

export default function InstitutionOperationsPage() {
  return <InstitutionalAdmin />;
}
