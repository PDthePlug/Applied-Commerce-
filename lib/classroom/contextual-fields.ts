import type {TeacherGuide} from "./model";

export type TeachingLocation="preparation"|"g8-open"|"g8-explore"|"g8-discuss"|"g8-do"|"g8-check"|"independent";
export type InstructionalField={path:string;value:string;location:TeachingLocation};
const governance=new Set(["sourceReferences","sourceBlockIds","review","selectionRationale","schemaVersion","version","status","lessonId","sourceUnitSHA256","id","previousLessonId","nextLessonId"]);
// Explicit educational ownership. Unknown teaching fields fail closed rather
// than quietly surviving only in the standalone document or print tree.
export function instructionalLocation(path:string):TeachingLocation{
 const stage=path.match(/^periods\.0\.stages\.([0-4])\./);
 if(stage)return ["g8-open","g8-explore","g8-discuss","g8-do","g8-check"][Number(stage[1])] as TeachingLocation;
 if(/^(originalTitle|centralConcept|prerequisites\.\d+|objectives\.\d+|observableOutcome|preparation\.(knowledge|materials|privacy)\.\d+|preparation\.southAfricanContext|continuity\.connection|periods\.0\.title)$/.test(path))return "preparation";
 if(/^preparation\.(vocabulary\.|misconceptions\.0\.)|^differentiation\.readingSupport\./.test(path))return "g8-explore";
 if(/^discussion\.0\.|^understandingChecks\.0\.|^preparation\.misconceptions\.1\.|^differentiation\.largeClass\./.test(path))return "g8-discuss";
 if(/^discussion\.1\.|^practical\.(instructions\.|expectedOutput$|inClassScope$|scaffold\.)|^differentiation\.(support|lowTechnology)\./.test(path))return "g8-do";
 if(/^understandingChecks\.1\.|^practical\.followUp$|^continuity\.nextUse$/.test(path))return "g8-check";
 if(/^differentiation\.quietParticipation\./.test(path))return "g8-open";
 if(/^independentLearning\.|^differentiation\.extension\./.test(path))return "independent";
 throw new Error("An instructional field requires contextual placement review.");
}
export function instructionalFields(guide:TeacherGuide):InstructionalField[]{
 const fields:InstructionalField[]=[];
 function visit(value:object,path=""){
  for(const [key,item]of Object.entries(value)){
   if(governance.has(key))continue;
   const next=path?`${path}.${key}`:key;
   if(typeof item==="string"&&item.trim())fields.push({path:next,value:item,location:instructionalLocation(next)});
   else if(item&&typeof item==="object")visit(item,next);
  }
 }
 visit(guide);return fields;
}

export type ContextualEnrichment={schemaVersion:1;version:string;lessonId:"g8-t1-l08-008";sourceUnitSHA256:string;guideVersion:string;
 distinction:{survival:string;functional:string;preference:string;example:string;caution:string};
 transitions:Record<"g8-open"|"g8-explore"|"g8-discuss"|"g8-do"|"g8-check",string>;
 activities:Record<"reflection"|"partA"|"partB"|"partC"|"deepening"|"checkpoint"|"home",{title:string;text:string}>;
};
export function validateContextualEnrichment(value:unknown,guide:TeacherGuide):asserts value is ContextualEnrichment{
 const item=value as ContextualEnrichment;
 if(!item||item.schemaVersion!==1||item.version!=="contextual-g8-v1.2026-10-21.1"||item.lessonId!=="g8-t1-l08-008"||item.lessonId!==guide.lessonId||item.sourceUnitSHA256!==guide.sourceUnitSHA256||item.guideVersion!==guide.version)throw new Error("Contextual enrichment differs from its reviewed guide.");
 const required=(obj:unknown,keys:string[])=>{
  if(!obj||typeof obj!=="object"||Object.keys(obj).length!==keys.length||keys.some(key=>typeof (obj as Record<string,unknown>)[key]!=="string"||!(obj as Record<string,string>)[key].trim()))throw new Error("Contextual teaching support is incomplete.");
 };
 required(item.distinction,["survival","functional","preference","example","caution"]);
 required(item.transitions,["g8-open","g8-explore","g8-discuss","g8-do","g8-check"]);
 const activities=["reflection","partA","partB","partC","deepening","checkpoint","home"] as const;
 if(!item.activities||Object.keys(item.activities).length!==activities.length)throw new Error("Activity scheduling requires review.");
 for(const activity of activities)required(item.activities[activity],["title","text"]);
 // Preserve every original field and reject unassigned additions at read time.
 if(instructionalFields(guide).length!==100)throw new Error("The original instructional coverage requires review.");
}
