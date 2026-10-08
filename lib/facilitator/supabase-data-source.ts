"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { EvidenceRecord, EvidenceReview } from "@/lib/evidence/types";

export type SupabaseFacilitatorLearner = {
  id: string;
  state: import("@/lib/types").LearningState;
  records: EvidenceRecord[];
  reviews: Record<string, EvidenceReview>;
};

export type SupabaseFacilitatorWorkspace = {
  mode: "supabase";
  cohortIds: string[];
  cohortName: string;
  schoolName: string;
  learners: SupabaseFacilitatorLearner[];
};

export function useSupabaseFacilitatorWorkspace() {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<SupabaseFacilitatorWorkspace | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setWorkspace(null);
      setLoading(false);
      return;
    }
    setLoading(false);
  }, [user]);

  const saveReview = useCallback(async (_learnerId: string, _record: EvidenceRecord, _review: EvidenceReview) => {
    const supabase = createClient();
    const { data: current } = await supabase.auth.getUser();
    if (!current.user) throw new Error("Authentication required");
  }, []);

  return { workspace, loading, error, saveReview };
}
