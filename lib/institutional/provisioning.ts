"use client";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type School = Tables<"schools">;
export type Cohort = Tables<"cohorts">;

export async function loadInstitutionalContext(userId: string) {
  const supabase = createClient();
  const [{ data: isPlatformAdmin, error: platformAdminError }, { data: memberships, error: membershipError }] =
    await Promise.all([
      supabase.rpc("is_platform_admin"),
      supabase
        .from("school_memberships")
        .select("school_id,role,status")
        .eq("user_id", userId)
        .eq("status", "active")
    ]);

  if (platformAdminError) throw platformAdminError;
  if (membershipError) throw membershipError;

  const schoolIds = isPlatformAdmin
    ? undefined
    : [...new Set((memberships ?? []).map((row) => row.school_id))];
  if (schoolIds && !schoolIds.length) {
    return { isPlatformAdmin: Boolean(isPlatformAdmin), schools: [] as School[], memberships: memberships ?? [], cohorts: [] as Cohort[], selectedSchoolId: "" };
  }

  let schoolQuery = supabase
    .from("schools")
    .select("id,name,slug,status,metadata,created_at,updated_at")
    .eq("status", "active")
    .order("name");
  if (schoolIds) schoolQuery = schoolQuery.in("id", schoolIds);

  const { data: schools, error: schoolError } = await schoolQuery;
  if (schoolError) throw schoolError;

  const visibleSchoolIds = (schools ?? []).map((school) => school.id);
  if (!visibleSchoolIds.length) {
    return { isPlatformAdmin: Boolean(isPlatformAdmin), schools: [], memberships: memberships ?? [], cohorts: [] as Cohort[], selectedSchoolId: "" };
  }

  const { data: cohorts, error: cohortError } = await supabase
    .from("cohorts")
    .select("id,school_id,name,grade,academic_year,status,starts_on,ends_on,created_at,updated_at")
    .in("school_id", visibleSchoolIds)
    .order("academic_year", { ascending: false })
    .order("name");

  if (cohortError) throw cohortError;

  return {
    isPlatformAdmin: Boolean(isPlatformAdmin),
    schools: schools ?? [],
    memberships: memberships ?? [],
    cohorts: cohorts ?? [],
    selectedSchoolId: schools?.[0]?.id ?? ""
  };
}

export async function createInstitution(schoolName: string, slug: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_school", {
    p_name: schoolName.trim(),
    p_slug: slug.trim().toLowerCase()
  });
  if (error) throw error;
  return data;
}

export async function createInstitutionCohort(input: {
  schoolId: string;
  name: string;
  grade: number;
  academicYear: number;
  startsOn?: string;
  endsOn?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cohorts")
    .insert({
      school_id: input.schoolId,
      name: input.name.trim(),
      grade: input.grade,
      academic_year: input.academicYear,
      status: "active",
      starts_on: input.startsOn || null,
      ends_on: input.endsOn || null
    })
    .select("id,school_id,name,grade,academic_year,status,starts_on,ends_on,created_at,updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function addInstitutionMember(schoolId: string, email: string, role: "admin" | "educator") {
  const supabase = createClient();
  const { error } = await supabase.rpc("add_school_member_by_email", {
    p_school_id: schoolId,
    p_email: email.trim(),
    p_role: role
  });
  if (error) throw error;
}

export async function addCohortStaff(cohortId: string, email: string, role: "lead" | "educator" | "assistant") {
  const supabase = createClient();
  const { error } = await supabase.rpc("add_cohort_staff_by_email", {
    p_cohort_id: cohortId,
    p_email: email.trim(),
    p_role: role
  });
  if (error) throw error;
}

export async function enrolLearner(cohortId: string, email: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("enrol_learner_by_email", {
    p_cohort_id: cohortId,
    p_email: email.trim()
  });
  if (error) throw error;
}

export async function loadCohortPeople(cohortId: string) {
  const supabase = createClient();
  const [enrolments, staff] = await Promise.all([
    supabase
      .from("cohort_enrolments")
      .select("learner_id,status,enrolled_at,completed_at")
      .eq("cohort_id", cohortId)
      .in("status", ["active", "completed"])
      .order("enrolled_at"),
    supabase
      .from("cohort_staff")
      .select("user_id,role,status,created_at")
      .eq("cohort_id", cohortId)
      .eq("status", "active")
      .order("created_at")
  ]);

  if (enrolments.error) throw enrolments.error;
  if (staff.error) throw staff.error;

  const learnerIds = [...new Set((enrolments.data ?? []).map((row) => row.learner_id))];
  const staffIds = [...new Set((staff.data ?? []).map((row) => row.user_id))];

  const profiles = learnerIds.length
    ? await supabase.from("profiles").select("id,display_name,status").in("id", learnerIds)
    : { data: [], error: null };

  if (profiles.error) throw profiles.error;

  return {
    learners: (enrolments.data ?? []).map((row) => ({
      ...row,
      profile: (profiles.data ?? []).find((profile) => profile.id === row.learner_id) ?? null
    })),
    staff: staff.data ?? [],
    staffIds
  };
}
