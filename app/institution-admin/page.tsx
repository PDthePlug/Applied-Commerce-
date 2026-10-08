import type { Metadata } from "next";
import { InstitutionAdmin } from "@/components/institution-admin";

export const metadata: Metadata = {
  title: "Institution Administration",
  description: "Provision Applied Commerce schools, cohorts, facilitators and learners.",
};

export default function InstitutionAdminPage() {
  return <InstitutionAdmin />;
}
