export type AppliedCommerceBackendMode="local"|"supabase";
export const APPLIED_COMMERCE_SUPABASE_PROJECT_REF="upvbxplswxhoqzbvgdxv";
export function appliedCommerceBackendMode():AppliedCommerceBackendMode{
  if(process.env.NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE==="local")return "local";
  return process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?"supabase":"local";
}
export const backendCapabilities={
  local:{crossDevice:false,cohorts:false,educatorAccounts:false,sharedReviews:false,sharedReports:false},
  supabase:{crossDevice:true,cohorts:true,educatorAccounts:true,sharedReviews:true,sharedReports:true}
} as const;
