import { createClient } from "@/lib/supabase/server";

export async function GET(request:Request){
  const url=new URL(request.url);
  const code=url.searchParams.get("code");
  if(code){
    try{
      const supabase=await createClient();
      const {error}=await supabase.auth.exchangeCodeForSession(code);
      if(!error){
        const next=url.searchParams.get("next")==="/auth/reset"?"/auth/reset":"/auth";
        return Response.redirect(new URL(next,url.origin),303);
      }
    }catch{ /* Show a recoverable message without exposing provider errors. */ }
  }
  return Response.redirect(new URL("/auth?link=expired",url.origin),303);
}
