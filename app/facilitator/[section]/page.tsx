import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FacilitatorWorkspace } from "@/components/facilitator-workspace";
import { FacilitatorRoleGate } from "@/components/facilitator-role-gate";

export const metadata: Metadata = {
  title: "Facilitator Workspace",
  description: "Open a dedicated Applied Commerce facilitator task page.",
};

export const dynamic = "force-dynamic";

const sections = new Set(["learners", "review", "coverage", "reports", "rubrics"]);

export default async function FacilitatorSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!sections.has(section)) notFound();

  return (
    <FacilitatorRoleGate>
      <FacilitatorWorkspace initialSection={section as "learners" | "review" | "coverage" | "reports" | "rubrics"} />
    </FacilitatorRoleGate>
  );
}
