import type {LearningState} from "../types";
import type {EvidenceDomain,EvidenceKind,EvidenceRecord,EvidenceReview} from "../evidence/types";

export type FacilitatorLearnerStatus="on-track"|"review-needed"|"needs-support"|"no-evidence";
export type FacilitatorLearnerSummary={
  id:string;name:string;grade?:number;completedLessons:number;evidenceCount:number;
  reviewedCount:number;pendingCount:number;needsRevisionCount:number;verifiedCount:number;
  portfolioCount:number;reviewRate:number;status:FacilitatorLearnerStatus;lastOpened?:LearningState["lastOpened"];
};
export type FacilitatorCohortSummary={
  learnerCount:number;evidenceCount:number;reviewedCount:number;pendingCount:number;
  needsRevisionCount:number;verifiedCount:number;portfolioCount:number;reviewRate:number;
};
export type ReviewPriority="revision"|"verification"|"rubric";
export type FacilitatorPriorityItem={key:string;priority:ReviewPriority;label:string;count:number;description:string};
export type CoverageRow<T extends string|number>={key:T;count:number;reviewed:number;rate:number};

const percentage=(part:number,total:number)=>total?Math.round(part/total*100):0;

export function buildLearnerSummary({state,records,reviews}:{state:LearningState;records:EvidenceRecord[];reviews:Record<string,EvidenceReview>}):FacilitatorLearnerSummary{
  const reviewedCount=records.filter(record=>Boolean(reviews[record.responseKey])).length;
  const needsRevisionCount=records.filter(record=>reviews[record.responseKey]?.status==="needs-revision").length;
  const verifiedCount=records.filter(record=>reviews[record.responseKey]?.status==="verified").length;
  const pendingCount=records.length-reviewedCount;
  const status:FacilitatorLearnerStatus=records.length===0?"no-evidence":needsRevisionCount>0?"needs-support":pendingCount>0?"review-needed":"on-track";
  return {
    id:"local-current-learner",
    name:state.profile?.displayName?.trim()||"Current learner",
    grade:state.profile?.grade??state.activeGrade,
    completedLessons:Object.keys(state.completed).length,
    evidenceCount:records.length,reviewedCount,pendingCount,needsRevisionCount,verifiedCount,
    portfolioCount:records.filter(record=>record.definition.portfolioEligible).length,
    reviewRate:percentage(reviewedCount,records.length),status,lastOpened:state.lastOpened
  };
}

export function buildCohortSummary(learners:FacilitatorLearnerSummary[]):FacilitatorCohortSummary{
  const total=(key:keyof FacilitatorLearnerSummary)=>learners.reduce((sum,learner)=>sum+(typeof learner[key]==="number"?learner[key] as number:0),0);
  const evidenceCount=total("evidenceCount");const reviewedCount=total("reviewedCount");
  return {
    learnerCount:learners.length,evidenceCount,reviewedCount,pendingCount:total("pendingCount"),
    needsRevisionCount:total("needsRevisionCount"),verifiedCount:total("verifiedCount"),
    portfolioCount:total("portfolioCount"),reviewRate:percentage(reviewedCount,evidenceCount)
  };
}

export function buildReviewPriorities(records:EvidenceRecord[],reviews:Record<string,EvidenceReview>):FacilitatorPriorityItem[]{
  const revision=records.filter(record=>reviews[record.responseKey]?.status==="needs-revision").length;
  const verification=records.filter(record=>record.definition.assessmentMode==="verification"&&!reviews[record.responseKey]).length;
  const rubric=records.filter(record=>record.definition.assessmentMode==="rubric"&&!reviews[record.responseKey]).length;
  return [
    {key:"revision",priority:"revision",label:"Learner revisions",count:revision,description:"Evidence already reviewed but returned for another attempt."},
    {key:"verification",priority:"verification",label:"Real-world verification",count:verification,description:"Interviews, observations or actions waiting for facilitator verification."},
    {key:"rubric",priority:"rubric",label:"Rubric review",count:rubric,description:"Open-ended evidence that needs facilitator judgement."}
  ];
}

export function buildDomainCoverage(records:EvidenceRecord[],reviews:Record<string,EvidenceReview>):CoverageRow<EvidenceDomain>[]{
  const map=new Map<EvidenceDomain,{count:number;reviewed:number}>();
  records.forEach(record=>record.definition.domains.forEach(domain=>{
    const row=map.get(domain)??{count:0,reviewed:0};row.count+=1;if(reviews[record.responseKey])row.reviewed+=1;map.set(domain,row);
  }));
  return [...map.entries()].map(([key,row])=>({...row,key,rate:percentage(row.reviewed,row.count)})).sort((a,b)=>b.count-a.count);
}

export function buildKindCoverage(records:EvidenceRecord[],reviews:Record<string,EvidenceReview>):CoverageRow<EvidenceKind>[]{
  const map=new Map<EvidenceKind,{count:number;reviewed:number}>();
  records.forEach(record=>{const row=map.get(record.definition.kind)??{count:0,reviewed:0};row.count+=1;if(reviews[record.responseKey])row.reviewed+=1;map.set(record.definition.kind,row);});
  return [...map.entries()].map(([key,row])=>({...row,key,rate:percentage(row.reviewed,row.count)})).sort((a,b)=>b.count-a.count);
}

export function buildTermCoverage(records:EvidenceRecord[],reviews:Record<string,EvidenceReview>):CoverageRow<number>[]{
  return [1,2,3,4].map(term=>{const inTerm=records.filter(record=>record.definition.term===term);const reviewed=inTerm.filter(record=>Boolean(reviews[record.responseKey])).length;return {key:term,count:inTerm.length,reviewed,rate:percentage(reviewed,inTerm.length)};});
}

export function statusLabel(status:FacilitatorLearnerStatus){
  if(status==="needs-support")return "Needs support";
  if(status==="review-needed")return "Review needed";
  if(status==="no-evidence")return "No evidence yet";
  return "On track";
}
