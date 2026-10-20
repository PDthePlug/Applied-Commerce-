import type {Metadata} from "next";
import {ClassroomWorkspace} from "@/components/classroom-workspace";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Classroom teaching",description:"Source-linked Applied Commerce classroom guidance for authorised educators."};
export default async function ClassroomPage({searchParams}:{searchParams:Promise<{lesson?:string}>}){
 const {lesson}=await searchParams;
 return <ClassroomWorkspace initialLessonId={typeof lesson==="string"?lesson:"g8-t1-l08-008"}/>;
}
