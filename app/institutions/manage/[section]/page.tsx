import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstitutionalAdmin } from "@/components/institutional-admin";

export const metadata: Metadata = {
  title: "Institution Workspace",
  description: "Manage a focused Applied Commerce institution task.",
};

export const dynamic = "force-dynamic";

const sections = new Set(["cohorts", "learners", "facilitators", "team"]);

export default async function InstitutionWorkspaceSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!sections.has(section)) notFound();

  return <InstitutionalAdmin initialSection={section as "cohorts" | "learners" | "facilitators" | "team"} />;
}
