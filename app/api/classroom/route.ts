import {createClient} from "@/lib/supabase/server";
import {appliedCommerceBackendMode} from "@/lib/backend/config";
import {checkClassroomAccess} from "@/lib/classroom/access";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store, max-age=0","Vary":"Cookie, Authorization","X-Content-Type-Options":"nosniff"};
const routeInstanceId=crypto.randomUUID();
let privateReadSequence=0;
export async function GET(request:Request){
 if(appliedCommerceBackendMode()!=="supabase")return Response.json({error:"Sign in through your institution to open teacher guidance."},{status:401,headers});
 try{
  const client=await createClient();
  const access=await checkClassroomAccess(client);
  if(access.status!==200)return Response.json({error:access.message},{status:access.status,headers});
  const expected=request.headers.get("x-ac-expected-user-id");
  if(expected&&expected!==access.userId)return Response.json({error:"The active account changed. Reload teacher guidance."},{status:409,headers});
  const measure=new URL(request.url).searchParams.get("measure")==="1";
  if(measure){
   // Optional staging instrumentation only. It cannot enable access, cache a
   // role decision, or run against the separate live application.
   if(process.env.AC_CLASSROOM_DIAGNOSTICS!=="1"||process.env.VERCEL_PROJECT_ID!=="prj_9MXnYeh3mxtFzcS1xzEDrTjOW2nP"||process.env.NEXT_PUBLIC_SUPABASE_URL!=="https://inxshlumnhcgiahxqewe.supabase.co")return Response.json({error:"Staging diagnostics are unavailable."},{status:403,headers});
   const admin=await client.rpc("is_platform_admin");
   if(admin.error||admin.data!==true)return Response.json({error:"Staging diagnostics require platform administration."},{status:403,headers});
  }
  const sequence=++privateReadSequence;
  const before=measure?process.memoryUsage():null;
  const started=performance.now();
  // Import the private release only after access has been established.
  const {classroomCatalog,loadClassroomGuides,loadContextualEnrichment,loadTeachingPlan}=await import("@/lib/classroom/private-library");
  const imported=performance.now();
  const id=new URL(request.url).searchParams.get("lesson")??"g8-t1-l08-008";
  const selected=classroomCatalog.find(entry=>entry.id===id);
  if(!selected)return Response.json({error:"This lesson is not in the classroom catalogue."},{status:404,headers});
  const guide=selected.benchmark?(await loadClassroomGuides()).find(item=>item.lessonId===id)??null:null;
  const contextual=guide?await loadContextualEnrichment(guide):null;
  const benchmarkLoaded=performance.now();
  const plan=await loadTeachingPlan(id);
  const loaded=performance.now();
  const measurement=measure?{
   routeInstanceId,privateReadSequence:sequence,firstPrivateReadInRouteInstance:sequence===1,
   processUptimeSeconds:process.uptime(),
   importMs:imported-started,benchmarkAndEnrichmentMs:benchmarkLoaded-imported,
   teachingPlanMs:loaded-benchmarkLoaded,privateReadMs:loaded-started,
   memoryBefore:before,memoryAfter:process.memoryUsage(),
   scope:"Hosted Node process observations; excludes authorisation and response serialization. Route-instance first private read is not proof of a platform cold process. Memory includes other work in the process and normal garbage collection.",
  }:undefined;
  // The lesson reader already has curriculum navigation. The standalone
  // workspace still receives the complete catalogue by default.
  const catalog=new URL(request.url).searchParams.get("catalog")==="omit"?[]:classroomCatalog;
  return Response.json({catalog,selected,guide,contextual,plan,measurement},{headers});
 }catch{
  console.error("Classroom guidance could not be loaded.");
  return Response.json({error:"Teacher guidance is not available just now. Ask your administrator to check the private classroom release."},{status:503,headers});
 }
}
