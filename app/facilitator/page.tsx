import type { Metadata } from "next";
import { FacilitatorWorkspace } from "@/components/facilitator-workspace";
import { FacilitatorRoleGate } from "@/components/facilitator-role-gate";

export const metadata:Metadata={
  title:"Facilitator Workspace",
  description:"Review learner evidence, apply rubrics and generate Applied Commerce evidence reports.",
};

export default function FacilitatorPage(){
  return <FacilitatorRoleGate><FacilitatorWorkspace/></FacilitatorRoleGate>;
}
