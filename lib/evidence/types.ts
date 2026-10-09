export type DevelopmentStage =
  | "self-awareness"
  | "agency"
  | "strategy"
  | "architecture"
  | "adult-execution";

export type EvidenceDomain =
  | "self-awareness"
  | "agency"
  | "economic-reasoning"
  | "systems-thinking"
  | "value-creation"
  | "financial-capability"
  | "decision-making"
  | "research-observation"
  | "communication"
  | "planning"
  | "execution"
  | "reflection";

export type EvidenceKind =
  | "knowledge-response"
  | "analysis"
  | "reflection"
  | "calculation"
  | "observation"
  | "interview"
  | "plan"
  | "project"
  | "action"
  | "structured-work";

export type AssessmentMode = "rubric" | "verification" | "deterministic" | "unscored";
export type ReviewStatus = "pending" | "accepted" | "needs-revision" | "verified";

export type DeterministicRule =
  | { kind:"presence" }
  | { kind:"exact"; accepted:string[]; caseSensitive?:boolean }
  | { kind:"number"; expected:number; tolerance?:number }
  | { kind:"range"; min:number; max:number };

export type AutoCheckResult = {
  rule: DeterministicRule["kind"];
  passed: boolean | null;
  label: string;
  detail: string;
};

export type EvidenceDefinition = {
  key:string;
  grade:number;
  term:number;
  lessonNumber?:number;
  unitId:string;
  unitTitle:string;
  promptId:string;
  slot:string;
  prompt:string;
  stage:DevelopmentStage;
  kind:EvidenceKind;
  domains:EvidenceDomain[];
  assessmentMode:AssessmentMode;
  rubricKey?:string;
  portfolioEligible:boolean;
  deterministicRule:DeterministicRule;
};

export type EvidenceRecord = {
  responseKey:string;
  responseValue:string;
  definition:EvidenceDefinition;
  captured:boolean;
  autoCheck:AutoCheckResult;
};

export type RubricLevel = {
  level:1|2|3|4;
  label:string;
  description:string;
};

export type RubricCriterion = {
  key:string;
  label:string;
  description:string;
  weight:number;
  levels:RubricLevel[];
};

export type RubricTemplate = {
  key:string;
  name:string;
  purpose:string;
  criteria:RubricCriterion[];
};

export type EvidenceReview = {
  responseKey:string;
  rubricKey?:string;
  status:ReviewStatus;
  criteria:Record<string,1|2|3|4>;
  feedback:string;
  portfolioInterpretation?:string;
  nextPathway?:string;
  reviewerName?:string;
  reviewedAt:string;
};

export type EvidenceReport = {
  generatedAt:string;
  learnerName:string;
  grade?:number;
  stage?:DevelopmentStage;
  totals:{
    responses:number;
    portfolioEligible:number;
    reviewed:number;
    accepted:number;
    needsRevision:number;
    verified:number;
  };
  byDomain:Array<{domain:EvidenceDomain;count:number;reviewed:number}>;
  byKind:Array<{kind:EvidenceKind;count:number}>;
  byTerm:Array<{term:number;count:number;reviewed:number}>;
  averageRubricLevel:number|null;
};
