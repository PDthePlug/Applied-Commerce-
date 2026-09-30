export type TextBlockType =
  | "paragraph" | "list" | "activity" | "reflection" | "checkpoint"
  | "portfolio" | "story" | "learning" | "equation" | "section";

export type TextBlock = { kind: "text"; type: TextBlockType; text: string };
export type TableBlock = { kind: "table"; type: "table"; rows: string[][] };
export type ContentBlock = TextBlock | TableBlock;

export type UnitSummary = {
  id: string;
  type: "lesson" | "assessment";
  label: string;
  title: string;
  startLesson?: number;
  endLesson?: number;
};

export type TermSummary = {
  term: number;
  unitCount: number;
  assessmentCount: number;
  units: UnitSummary[];
  assessments: UnitSummary[];
};

export type GradeSummary = {
  grade: number;
  title: string;
  bookTitle: string;
  unitCount: number;
  bundleParts: number;
  terms: Array<{term:number; unitCount:number; assessmentCount:number}>;
};

export type CurriculumIndex = { product: string; grades: GradeSummary[] };

export type GradeIndex = {
  grade: number;
  title: string;
  bookTitle: string;
  sourceFile: string;
  preface: ContentBlock[];
  unitCount: number;
  terms: TermSummary[];
};

export type TermIndex = {
  term: number;
  intro: ContentBlock[];
  units: UnitSummary[];
  assessments: UnitSummary[];
};

export type UnitContent = UnitSummary & {
  grade: number;
  term: number;
  position: number;
  blocks: ContentBlock[];
};

export type LearnerProfile = {
  displayName?: string;
  grade?: number;
};

export type LearningState = {
  version: 1;
  activeGrade?: number;
  completed: Record<string, string>;
  responses: Record<string, string>;
  promptResponses: Record<string, string>;
  profile?: LearnerProfile;
  lastOpened?: {grade:number; term:number; unitId:string; at:string};
};
