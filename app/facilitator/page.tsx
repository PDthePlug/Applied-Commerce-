import type { Metadata } from "next";
import { FacilitatorWorkspace } from "@/components/facilitator-workspace";
import { FacilitatorRoleGate } from "@/components/facilitator-role-gate";

export const metadata:Metadata={
  title:"Facilitator Workspace",
  description:"Review learner evidence, apply rubrics and generate Applied Commerce evidence reports.",
};

export default async function FacilitatorPage({searchParams}:{searchParams:Promise<{learner?:string|string[]}>}){
  const {learner}=await searchParams;
  return <FacilitatorRoleGate><FacilitatorWorkspace initialLearnerId={typeof learner==="string"?learner:""}/></FacilitatorRoleGate>;
}
