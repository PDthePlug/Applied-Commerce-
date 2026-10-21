import "server-only";
import fs from "node:fs/promises";
import {createHash} from "node:crypto";
import teachingEnvelope from "@/content/instructional/teaching-plans.v2.enc.json";
import teachingManifest from "@/content/instructional/teaching-manifest.v2.json";
import {validateTeachingPlan,type TeachingPlan} from "./teaching-plan";
import catalogData from "@/content/instructional/catalog.v1.json";
import envelope from "@/content/instructional/benchmark-guides.v1.enc.json";
import manifest from "@/content/instructional/benchmark-manifest.v1.json";
import contextualEnvelope from "@/content/instructional/g8-t1-l08-008.contextual.v1.enc.json";
import {validateContextualEnrichment,type ContextualEnrichment} from "./contextual-fields";
import {openContent} from "./crypto";
import {validateTeacherGuide,type ClassroomCatalogEntry,type TeacherGuide} from "./model";

export const classroomCatalog=catalogData as ClassroomCatalogEntry[];

// No plaintext, content key or privileged answer package is imported by a client
// component. Decryption happens only after the API's fresh authorization check.
async function contentKey(){
 const keyPath=process.env.AC_CLASSROOM_CONTENT_KEY_FILE;
 // Hosted secret managers may bind a server-only value; local review uses a
 // private file. Neither setting is public or read by client components.
 const keyText=keyPath?await fs.readFile(keyPath,"utf8"):process.env.AC_CLASSROOM_CONTENT_KEY;
 if(!keyText)throw new Error("Private classroom content is not configured.");
 return Buffer.from(keyText.trim(),"base64");
}
export async function loadClassroomGuides():Promise<TeacherGuide[]>{
 const key=await contentKey();
 if(envelope.plaintextSHA256!==manifest.plaintextSHA256)throw new Error("Classroom release differs from its manifest.");
 const payload=JSON.parse(openContent(envelope,key,"applied-commerce-classroom-v1").toString("utf8")) as {guides:unknown[]};
 if(!Array.isArray(payload.guides)||payload.guides.length!==5)throw new Error("Five benchmark guides are required.");
 for(const guide of payload.guides)validateTeacherGuide(guide,classroomCatalog);
 const guides=payload.guides as TeacherGuide[];
 if(new Set(guides.map(guide=>guide.lessonId)).size!==5||guides.some(guide=>!manifest.guides.some(entry=>entry.lessonId===guide.lessonId&&entry.version===guide.version)))throw new Error("Classroom guide release identities differ.");
 return guides;
}

export async function loadContextualEnrichment(guide:TeacherGuide):Promise<ContextualEnrichment|null>{
 if(guide.lessonId!=="g8-t1-l08-008")return null;
 const payload:unknown=JSON.parse(openContent(contextualEnvelope,await contentKey(),"applied-commerce-classroom-v1").toString("utf8"));
 validateContextualEnrichment(payload,guide);
 return payload;
}

export async function loadTeachingPlan(lessonId:string):Promise<TeachingPlan|null>{
 const binding=teachingManifest.plans.find(item=>item.lessonId===lessonId);
 if(!binding)return null;
 const payload=JSON.parse(openContent(teachingEnvelope,await contentKey(),"applied-commerce-classroom-v1").toString("utf8")) as {version:string;plans:TeachingPlan[]};
 if(payload.version!==teachingManifest.version||payload.plans?.length!==teachingManifest.plans.length||new Set(payload.plans.map(plan=>plan.lessonId)).size!==payload.plans.length)throw new Error("Teaching release identities differ.");
 for(const plan of payload.plans){
  const entry=teachingManifest.plans.find(item=>item.lessonId===plan.lessonId);
  if(!entry||createHash("sha256").update(JSON.stringify(plan)).digest("hex")!==entry.planSHA256||!classroomCatalog.some(item=>item.id===plan.lessonId&&item.sourceUnitSHA256===plan.sourceUnitSHA256))throw new Error("Teaching release differs from its source binding.");
  validateTeachingPlan(plan,entry.source);
 }
 return payload.plans.find(plan=>plan.lessonId===lessonId)??null;
}
