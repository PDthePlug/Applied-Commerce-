import { readAllRows } from "@/lib/supabase/read-all";
import type { LearningState } from "@/lib/types";
import { pendingChanges, syncId, type SyncChange, type SyncResult } from "@/lib/learning-sync";
import type { Json } from "./database.types";
import { createClient } from "./client";
import { reconcileRemote } from "@/lib/learning-sync";

export const CURRICULUM_RUNTIME_RELEASE = "ac-runtime-3";

function emptyState():LearningState{
 return {version:2,previousResponses:{},completed:{},completedMeta:{},responses:{},responseUpdatedAt:{},promptResponses:{},promptResponseUpdatedAt:{}};
}

export async function loadRemoteLearningState(userId:string):Promise<LearningState>{
 const supabase=createClient();
 const releaseResult=await supabase.from("curriculum_releases").select("id").eq("release_key",CURRICULUM_RUNTIME_RELEASE).single();
 if(releaseResult.error)throw releaseResult.error;
 const releaseId=releaseResult.data.id;
 const [profileResult,progressResult,promptResult,notesResult]=await Promise.all([
  supabase.from("learner_profiles").select("preferred_name,current_grade,sync_revision").eq("user_id",userId).maybeSingle(),
  readAllRows(supabase.from("lesson_progress").select("grade,term,unit_id,status,last_opened_at,completed_at,updated_at,sync_revision").eq("learner_id",userId).eq("curriculum_release_id",releaseId).order("id")),
  readAllRows(supabase.from("prompt_responses").select("unit_id,prompt_key,response,updated_at,sync_revision").eq("learner_id",userId).eq("curriculum_release_id",releaseId).order("id")),
  readAllRows(supabase.from("lesson_notes").select("unit_id,note,updated_at,sync_revision").eq("learner_id",userId).eq("curriculum_release_id",releaseId).order("id")),
 ]);
 for(const result of [profileResult,progressResult,promptResult,notesResult])if(result.error)throw result.error;
 const remote=emptyState();
 remote.sync={baseline:{},conflicts:{}};
 const [admin,membership,staff]=await Promise.all([supabase.rpc("is_platform_admin"),supabase.from("school_memberships").select("id").eq("user_id",userId).eq("status","active").limit(1),supabase.from("cohort_staff").select("id").eq("user_id",userId).eq("status","active").limit(1)]);
 for(const result of [admin,membership,staff])if(result.error)throw result.error;
 remote.sync.profileAllowed=!admin.data&&!membership.data?.length&&!staff.data?.length;
 if(profileResult.data){remote.profile={displayName:profileResult.data.preferred_name??undefined,grade:profileResult.data.current_grade??undefined};remote.activeGrade=profileResult.data.current_grade??undefined;}
 if(profileResult.data){remote.sync.baseline["profile:self"]={kind:"profile",key:"self",revision:profileResult.data.sync_revision,value:{displayName:profileResult.data.preferred_name??"",grade:profileResult.data.current_grade}};}
 for(const row of progressResult.data??[]){
  remote.sync.baseline[syncId("completion",row.unit_id)]={kind:"completion",key:row.unit_id,value:row.status==="completed",revision:row.sync_revision};
  remote.completionUpdatedAt??={};
  remote.completionUpdatedAt[row.unit_id]=row.updated_at;
  if(row.status==="completed")remote.completed[row.unit_id]=row.completed_at??row.updated_at;
  remote.completedMeta![row.unit_id]={grade:row.grade,term:row.term};
  if(row.last_opened_at&&(!remote.lastOpened||row.last_opened_at>remote.lastOpened.at)){remote.lastOpened={grade:row.grade,term:row.term,unitId:row.unit_id,at:row.last_opened_at};remote.activeGrade=row.grade;}
 }
 for(const row of promptResult.data??[]){remote.sync.baseline[syncId("prompt",row.prompt_key)]={kind:"prompt",key:row.prompt_key,value:typeof row.response==="string"?row.response:JSON.stringify(row.response),revision:row.sync_revision};remote.promptResponses[row.prompt_key]=typeof row.response==="string"?row.response:JSON.stringify(row.response);remote.promptResponseUpdatedAt![row.prompt_key]=row.updated_at;}
 for(const row of notesResult.data??[]){remote.sync.baseline[syncId("note",row.unit_id)]={kind:"note",key:row.unit_id,value:row.note,revision:row.sync_revision};remote.responses[row.unit_id]=row.note;remote.responseUpdatedAt![row.unit_id]=row.updated_at;}
 return remote;
}

export async function syncLearningState(userId:string,state:LearningState):Promise<{sent:SyncChange[];results:SyncResult[]}> {
 const supabase=createClient();
 // Verify the client account before dispatch as well as deriving ownership in SQL.
 const session=await supabase.auth.getSession();
 if(session.error||session.data.session?.user.id!==userId)throw new Error("Account changed before save");
 const sent=pendingChanges(state).filter(x=>x.kind!=="profile"||state.sync?.profileAllowed===true).slice(0,200);
 const opened=state.lastOpened&&state.lastOpened.at!==state.sync?.openedAt?state.lastOpened.unitId:undefined;
 if(!sent.length&&!opened)return {sent,results:[]};
 const result=await supabase.rpc("save_learning_changes",{p_changes:sent as unknown as Json,p_opened_unit:opened});
 if(result.error)throw result.error;
 return {sent,results:result.data as unknown as SyncResult[]};
}
export function mergeForTest(local:LearningState,remote:LearningState){return reconcileRemote(local,remote);}
