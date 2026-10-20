import type {SupabaseClient} from "@supabase/supabase-js";
import type {Database} from "@/lib/supabase/database.types";

export type ClassroomAccess={status:200;userId:string}|{status:401|403|503;message:string};

// Uses existing database roles, never a URL, browser flag or user-editable JWT
// metadata. These read-only checks do not expand access to learner records.
export async function checkClassroomAccess(client:SupabaseClient<Database>):Promise<ClassroomAccess>{
 try{
  const identity=await client.auth.getUser();
  if(identity.error||!identity.data.user)return{status:401,message:"Sign in to open teacher guidance."};
  const session=await client.rpc("has_active_session");
  if(session.error)return{status:503,message:"Teacher access could not be confirmed. Try again."};
  if(!session.data)return{status:401,message:"Your session ended. Sign in again."};
  const id=identity.data.user.id;
  const [admin,staff,school]=await Promise.all([
   client.rpc("is_platform_admin"),
   client.from("cohort_staff").select("id").eq("user_id",id).eq("status","active").limit(1),
   client.from("school_memberships").select("id").eq("user_id",id).eq("status","active").in("role",["owner","admin"]).limit(1),
  ]);
  if(admin.error||staff.error||school.error)return{status:503,message:"Teacher access could not be confirmed. Try again."};
  if(admin.data===true||staff.data?.length||school.data?.length)return{status:200,userId:id};
  return{status:403,message:"Teacher guidance requires an active cohort assignment or institution administrator role."};
 }catch{return{status:503,message:"Teacher access could not be confirmed. Try again."};}
}
