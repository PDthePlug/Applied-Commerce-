import "server-only";
import fs from "node:fs/promises";
import catalogData from "@/content/instructional/catalog.v1.json";
import envelope from "@/content/instructional/benchmark-guides.v1.enc.json";
import manifest from "@/content/instructional/benchmark-manifest.v1.json";
import {openContent} from "./crypto";
import {validateTeacherGuide,type ClassroomCatalogEntry,type TeacherGuide} from "./model";

export const classroomCatalog=catalogData as ClassroomCatalogEntry[];

// No plaintext, content key or privileged answer package is imported by a client
// component. Decryption happens only after the API's fresh authorization check.
export async function loadClassroomGuides():Promise<TeacherGuide[]>{
 const keyPath=process.env.AC_CLASSROOM_CONTENT_KEY_FILE;
 // Hosted secret managers may bind a server-only value; local review uses a
 // private file. Neither setting is public or read by client components.
 const keyText=keyPath?await fs.readFile(keyPath,"utf8"):process.env.AC_CLASSROOM_CONTENT_KEY;
 if(!keyText)throw new Error("Private classroom content is not configured.");
 const key=Buffer.from(keyText.trim(),"base64");
 if(envelope.plaintextSHA256!==manifest.plaintextSHA256)throw new Error("Classroom release differs from its manifest.");
 const payload=JSON.parse(openContent(envelope,key,"applied-commerce-classroom-v1").toString("utf8")) as {guides:unknown[]};
 if(!Array.isArray(payload.guides)||payload.guides.length!==5)throw new Error("Five benchmark guides are required.");
 for(const guide of payload.guides)validateTeacherGuide(guide,classroomCatalog);
 const guides=payload.guides as TeacherGuide[];
 if(new Set(guides.map(guide=>guide.lessonId)).size!==5||guides.some(guide=>!manifest.guides.some(entry=>entry.lessonId===guide.lessonId&&entry.version===guide.version)))throw new Error("Classroom guide release identities differ.");
 return guides;
}
