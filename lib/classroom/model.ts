import type {ContextualEnrichment} from "./contextual-fields";
export type ClassroomCatalogEntry={id:string;grade:number;term:number;title:string;number:number;sourceUnitSHA256:string;benchmark:boolean};
export type SourceReference={blockId:string;label:string;excerpt:string};
export type TeachingStage={id:string;title:string;minutes:number;teacher:string[];learners:string[];successfulParticipation:string;sourceBlockIds:string[];presentation:{question:string;task:string}};
export type TeacherGuide={
 schemaVersion:1;version:string;status:"draft-review";lessonId:string;grade:number;term:number;originalTitle:string;sourceUnitSHA256:string;
 selectionRationale:string;centralConcept:string;prerequisites:string[];objectives:string[];observableOutcome:string;
 preparation:{knowledge:string[];materials:string[];vocabulary:Array<{term:string;explanation:string}>;misconceptions:Array<{belief:string;response:string}>;southAfricanContext:string;privacy:string[]};
 sourceReferences:SourceReference[];
 periods:Array<{title:string;minutes:45;stages:TeachingStage[]}>;
 discussion:Array<{question:string;followUp:string;indicativeReasoning:string;partialUnderstanding:string;sourceBlockIds:string[]}>;
 practical:{instructions:string[];expectedOutput:string;sourceBlockIds:string[];inClassScope:string;followUp:string;scaffold:{columns:string[];rows:string[][]}};
 understandingChecks:Array<{prompt:string;secureReasoning:string;partialUnderstanding:string;notYetEvidenced:string;nextTeachingMove:string;sourceBlockIds:string[]}>;
 differentiation:{support:string[];extension:string[];quietParticipation:string[];largeClass:string[];lowTechnology:string[];readingSupport:string[]};
 continuity:{previousLessonId:string|null;nextLessonId:string|null;connection:string;nextUse:string};
 independentLearning:string[];
 review:{status:"human-educator-review-required";reviewedBy:string;qualityChecks:Array<{criterion:string;evidence:string;disposition:"draft-meets"|"pilot-required"}>;limits:string[]};
};
export type ClassroomPayload={catalog:ClassroomCatalogEntry[];selected:ClassroomCatalogEntry;guide:TeacherGuide|null;contextual?:ContextualEnrichment|null};

// Validate actual decrypted content at authoring and read time; a public summary
// manifest cannot establish the completeness or quality of private teaching text.
export function validateTeacherGuide(value:unknown,catalog:ClassroomCatalogEntry[]):asserts value is TeacherGuide{
 if(!value||typeof value!=="object")throw new Error("Guide must be an object.");
 const guide=value as TeacherGuide;
 const entry=catalog.find(item=>item.id===guide.lessonId);
 if(!entry||!entry.benchmark||entry.grade!==guide.grade||entry.term!==guide.term||entry.title!==guide.originalTitle||entry.sourceUnitSHA256!==guide.sourceUnitSHA256)throw new Error("Guide does not match its source lesson.");
 if(guide.schemaVersion!==1||guide.status!=="draft-review"||!/^classroom-v1\./.test(guide.version))throw new Error("Unsupported guide release.");
 function required(value:unknown,label:string){if(typeof value!=="string"||!value.trim())throw new Error(`Missing ${label}.`);}
 function list(value:unknown,label:string){if(!Array.isArray(value)||!value.length)throw new Error(`Missing ${label}.`);value.forEach(item=>required(item,label));}
 for(const key of ['selectionRationale','centralConcept','observableOutcome']as const)required(guide[key],key);
 for(const key of ['prerequisites','objectives','independentLearning']as const)list(guide[key],key);
 if(!guide.preparation||!guide.practical||!guide.differentiation||!guide.continuity||!guide.review)throw new Error("Missing teaching section.");
 list(guide.preparation.knowledge,'educator preparation');list(guide.preparation.materials,'materials');list(guide.preparation.privacy,'privacy');required(guide.preparation.southAfricanContext,'context');
 if(!guide.preparation.vocabulary?.length||!guide.preparation.misconceptions?.length)throw new Error("Vocabulary and misconceptions are required.");
 for(const item of guide.preparation.vocabulary){required(item.term,'vocabulary term');required(item.explanation,'vocabulary explanation');}
 for(const item of guide.preparation.misconceptions){required(item.belief,'misconception');required(item.response,'misconception response');}
 const references=new Set(guide.sourceReferences?.map(ref=>ref.blockId));
 if(!references.size||references.size!==guide.sourceReferences.length)throw new Error("Unique source references are required.");
 for(const ref of guide.sourceReferences){required(ref.label,'source label');required(ref.excerpt,'source excerpt');}
 const checkRefs=(ids:string[])=>{if(!ids?.length||ids.some(id=>!references.has(id)))throw new Error("Broken teaching source reference.");};
 if(!guide.periods?.length||guide.periods.length>2)throw new Error("One or two periods are required.");
 const stageIds=new Set<string>();
 for(const period of guide.periods){
  required(period.title,'period title');if(period.minutes!==45||!period.stages||period.stages.length<3||period.stages.reduce((n,s)=>n+s.minutes,0)!==45)throw new Error("Each period must total 45 minutes across at least three stages.");
  for(const stage of period.stages){
   if(!stage.id||stageIds.has(stage.id)||!Number.isInteger(stage.minutes)||stage.minutes<=0)throw new Error("Invalid stage identity or duration.");stageIds.add(stage.id);
   required(stage.title,'stage title');list(stage.teacher,'teacher actions');list(stage.learners,'learner actions');required(stage.successfulParticipation,'participation');checkRefs(stage.sourceBlockIds);required(stage.presentation?.question,'presentation question');required(stage.presentation?.task,'presentation task');
  }
 }
 if(!guide.discussion?.length||!guide.understandingChecks?.length)throw new Error("Discussion and understanding checks are required.");
 for(const item of guide.discussion){for(const key of ['question','followUp','indicativeReasoning','partialUnderstanding']as const)required(item[key],key);checkRefs(item.sourceBlockIds);}
 for(const item of guide.understandingChecks){for(const key of ['prompt','secureReasoning','partialUnderstanding','notYetEvidenced','nextTeachingMove']as const)required(item[key],key);checkRefs(item.sourceBlockIds);}
 list(guide.practical.instructions,'practical instructions');for(const key of ['expectedOutput','inClassScope','followUp']as const)required(guide.practical[key],key);checkRefs(guide.practical.sourceBlockIds);
 if(!guide.practical.scaffold?.columns?.length||!guide.practical.scaffold.rows?.length||guide.practical.scaffold.rows.some(row=>row.length!==guide.practical.scaffold.columns.length))throw new Error("Invalid practical scaffold.");
 for(const key of ['support','extension','quietParticipation','largeClass','lowTechnology','readingSupport']as const)list(guide.differentiation[key],'differentiation');
 if(Object.keys(guide.differentiation).length!==6)throw new Error("Six adaptation fields are required.");
 required(guide.continuity.connection,'continuity');required(guide.continuity.nextUse,'next use');
 for(const id of [guide.continuity.previousLessonId,guide.continuity.nextLessonId])if(id&&!catalog.some(entry=>entry.id===id))throw new Error("Broken continuity link.");
 if(guide.review.status!=="human-educator-review-required"||guide.review.qualityChecks?.length!==10)throw new Error("Educational review status and ten quality checks are required.");
 for(const check of guide.review.qualityChecks){required(check.criterion,'quality criterion');required(check.evidence,'quality evidence');if(!['draft-meets','pilot-required'].includes(check.disposition))throw new Error("Invalid quality disposition.");}
 list(guide.review.limits,'review limits');required(guide.review.reviewedBy,'review provenance');
}
