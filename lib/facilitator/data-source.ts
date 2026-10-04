import type {EvidenceRecord,EvidenceReport,EvidenceReview} from "../evidence/types";
import type {FacilitatorCohortSummary,FacilitatorLearnerSummary} from "./model";

export type FacilitatorWorkspaceContext={
  mode:"local"|"supabase";
  schoolId?:string;
  schoolName?:string;
  cohortId?:string;
  cohortName?:string;
  grade?:number;
};

export type EvidenceQueueFilter={
  learnerId?:string;
  term?:number;
  status?:"all"|"unreviewed"|"reviewed"|"needs-revision"|"verification";
  search?:string;
};

export interface FacilitatorDataSource{
  readonly mode:"local"|"supabase";
  getContext():Promise<FacilitatorWorkspaceContext>;
  getCohortSummary():Promise<FacilitatorCohortSummary>;
  listLearners():Promise<FacilitatorLearnerSummary[]>;
  listEvidence(filter?:EvidenceQueueFilter):Promise<EvidenceRecord[]>;
  getReview(responseKey:string):Promise<EvidenceReview|undefined>;
  saveReview(review:EvidenceReview):Promise<void>;
  getLearnerReport(learnerId:string):Promise<EvidenceReport>;
}

/**
 * The production dashboard currently uses the local browser stores directly.
 * This interface is the activation seam for the shared Supabase implementation.
 * The Supabase adapter must satisfy this contract rather than changing the
 * facilitator components when the backend is restored.
 */
