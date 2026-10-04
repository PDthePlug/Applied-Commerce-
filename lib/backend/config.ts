export type AppliedCommerceBackendMode="local"|"supabase";
export const APPLIED_COMMERCE_SUPABASE_PROJECT_REF="vxmcykmrqubwlysrqjyt";
export function appliedCommerceBackendMode():AppliedCommerceBackendMode{
  return process.env.NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE==="supabase"?"supabase":"local";
}
export const backendCapabilities={
  local:{crossDevice:false,cohorts:false,educatorAccounts:false,sharedReviews:false,sharedReports:false},
  supabase:{crossDevice:true,cohorts:true,educatorAccounts:true,sharedReviews:true,sharedReports:true}
} as const;
