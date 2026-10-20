import {createClient} from "@/lib/supabase/server";
import {appliedCommerceBackendMode} from "@/lib/backend/config";
import {checkClassroomAccess} from "@/lib/classroom/access";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store, max-age=0","Vary":"Cookie, Authorization","X-Content-Type-Options":"nosniff"};
export async function GET(request:Request){
 if(appliedCommerceBackendMode()!=="supabase")return Response.json({error:"Sign in through your institution to open teacher guidance."},{status:401,headers});
 try{
  const access=await checkClassroomAccess(await createClient());
  if(access.status!==200)return Response.json({error:access.message},{status:access.status,headers});
  const expected=request.headers.get("x-ac-expected-user-id");
  if(expected&&expected!==access.userId)return Response.json({error:"The active account changed. Reload teacher guidance."},{status:409,headers});
  // Import the private release only after access has been established.
  const {classroomCatalog,loadClassroomGuides}=await import("@/lib/classroom/private-library");
  const id=new URL(request.url).searchParams.get("lesson")??"g8-t1-l08-008";
  const selected=classroomCatalog.find(entry=>entry.id===id);
  if(!selected)return Response.json({error:"This lesson is not in the classroom catalogue."},{status:404,headers});
  const guide=selected.benchmark?(await loadClassroomGuides()).find(item=>item.lessonId===id)??null:null;
  return Response.json({catalog:classroomCatalog,selected,guide},{headers});
 }catch{
  console.error("Classroom guidance could not be loaded.");
  return Response.json({error:"Teacher guidance is not available just now. Ask your administrator to check the private classroom release."},{status:503,headers});
 }
}
