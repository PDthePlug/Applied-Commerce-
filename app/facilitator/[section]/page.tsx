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
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{learner?:string|string[]}>;
}) {
  const [{ section },{learner}] = await Promise.all([params,searchParams]);
  if (!sections.has(section)) notFound();

  return (
    <FacilitatorRoleGate>
      <FacilitatorWorkspace initialLearnerId={typeof learner==="string"?learner:""} initialSection={section as "learners" | "review" | "coverage" | "reports" | "rubrics"} />
    </FacilitatorRoleGate>
  );
}
