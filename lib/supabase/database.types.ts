export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assessment_attempts: {
        Row: {
          attempt_number: number
          curriculum_release_id: string
          id: string
          learner_id: string
          result: Json
          reviewed_at: string | null
          score: number | null
          started_at: string
          status: string
          submitted_at: string | null
          unit_id: string
        }
        Insert: {
          attempt_number: number
          curriculum_release_id: string
          id?: string
          learner_id: string
          result?: Json
          reviewed_at?: string | null
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          unit_id: string
        }
        Update: {
          attempt_number?: number
          curriculum_release_id?: string
          id?: string
          learner_id?: string
          result?: Json
          reviewed_at?: string | null
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_curriculum_release_id_fkey"
            columns: ["curriculum_release_id"]
            isOneToOne: false
            referencedRelation: "curriculum_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          actor_user_id: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          school_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          school_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_enrolments: {
        Row: {
          cohort_id: string
          completed_at: string | null
          created_at: string
          enrolled_at: string
          id: string
          learner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          cohort_id: string
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string
          id?: string
          learner_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          cohort_id?: string
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string
          id?: string
          learner_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_enrolments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_enrolments_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_staff: {
        Row: {
          cohort_id: string
          created_at: string
          id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cohort_id: string
          created_at?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cohort_id?: string
          created_at?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_staff_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cohort_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cohorts: {
        Row: {
          academic_year: number
          created_at: string
          ends_on: string | null
          grade: number
          id: string
          name: string
          school_id: string
          starts_on: string | null
          status: string
          updated_at: string
        }
        Insert: {
          academic_year: number
          created_at?: string
          ends_on?: string | null
          grade: number
          id?: string
          name: string
          school_id: string
          starts_on?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          academic_year?: number
          created_at?: string
          ends_on?: string | null
          grade?: number
          id?: string
          name?: string
          school_id?: string
          starts_on?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohorts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_releases: {
        Row: {
          compiler_version: string
          created_at: string
          id: string
          metadata: Json
          published_at: string | null
          release_key: string
          runtime_format_version: number
          schema_version: number
          source_release_key: string | null
        }
        Insert: {
          compiler_version: string
          created_at?: string
          id?: string
          metadata?: Json
          published_at?: string | null
          release_key: string
          runtime_format_version?: number
          schema_version: number
          source_release_key?: string | null
        }
        Update: {
          compiler_version?: string
          created_at?: string
          id?: string
          metadata?: Json
          published_at?: string | null
          release_key?: string
          runtime_format_version?: number
          schema_version?: number
          source_release_key?: string | null
        }
        Relationships: []
      }
      evidence_definitions: {
        Row: {
          active: boolean
          assessment_mode: string
          created_at: string
          curriculum_key: string
          deterministic_rule: Json
          development_stage: string
          domains: string[]
          evidence_kind: string
          grade: number
          id: string
          lesson_number: number | null
          portfolio_eligible: boolean
          prompt_id: string
          prompt_text: string
          rubric_key: string | null
          slot: string
          term: number
          unit_id: string
          unit_title: string
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          assessment_mode: string
          created_at?: string
          curriculum_key: string
          deterministic_rule?: Json
          development_stage: string
          domains?: string[]
          evidence_kind: string
          grade: number
          id?: string
          lesson_number?: number | null
          portfolio_eligible?: boolean
          prompt_id: string
          prompt_text: string
          rubric_key?: string | null
          slot: string
          term: number
          unit_id: string
          unit_title: string
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          assessment_mode?: string
          created_at?: string
          curriculum_key?: string
          deterministic_rule?: Json
          development_stage?: string
          domains?: string[]
          evidence_kind?: string
          grade?: number
          id?: string
          lesson_number?: number | null
          portfolio_eligible?: boolean
          prompt_id?: string
          prompt_text?: string
          rubric_key?: string | null
          slot?: string
          term?: number
          unit_id?: string
          unit_title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      evidence_records: {
        Row: {
          auto_result: Json
          captured_at: string
          definition_id: string | null
          id: string
          learner_id: string
          response_key: string
          response_value: string
          status: string
          updated_at: string
        }
        Insert: {
          auto_result?: Json
          captured_at?: string
          definition_id?: string | null
          id?: string
          learner_id: string
          response_key: string
          response_value: string
          status?: string
          updated_at?: string
        }
        Update: {
          auto_result?: Json
          captured_at?: string
          definition_id?: string | null
          id?: string
          learner_id?: string
          response_key?: string
          response_value?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_records_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "evidence_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_report_snapshots: {
        Row: {
          generated_at: string
          generated_by: string | null
          id: string
          learner_id: string | null
          metrics: Json
          narrative: Json
          period: Json
          report_type: string
        }
        Insert: {
          generated_at?: string
          generated_by?: string | null
          id?: string
          learner_id?: string | null
          metrics?: Json
          narrative?: Json
          period?: Json
          report_type?: string
        }
        Update: {
          generated_at?: string
          generated_by?: string | null
          id?: string
          learner_id?: string | null
          metrics?: Json
          narrative?: Json
          period?: Json
          report_type?: string
        }
        Relationships: []
      }
      evidence_reviews: {
        Row: {
          criteria_scores: Json
          evidence_record_id: string
          feedback: string
          id: string
          next_pathway: string
          portfolio_interpretation: string
          reviewed_at: string
          reviewer_id: string
          rubric_key: string | null
          status: string
          updated_at: string
        }
        Insert: {
          criteria_scores?: Json
          evidence_record_id: string
          feedback?: string
          id?: string
          next_pathway?: string
          portfolio_interpretation?: string
          reviewed_at?: string
          reviewer_id: string
          rubric_key?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          criteria_scores?: Json
          evidence_record_id?: string
          feedback?: string
          id?: string
          next_pathway?: string
          portfolio_interpretation?: string
          reviewed_at?: string
          reviewer_id?: string
          rubric_key?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_reviews_evidence_record_id_fkey"
            columns: ["evidence_record_id"]
            isOneToOne: false
            referencedRelation: "evidence_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_reviews_rubric_key_fkey"
            columns: ["rubric_key"]
            isOneToOne: false
            referencedRelation: "rubric_templates"
            referencedColumns: ["key"]
          },
        ]
      }
      learner_profiles: {
        Row: {
          created_at: string
          current_grade: number | null
          preferred_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_grade?: number | null
          preferred_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_grade?: number | null
          preferred_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_notes: {
        Row: {
          created_at: string
          curriculum_release_id: string | null
          curriculum_version: string
          grade: number
          id: string
          learner_id: string
          note: string
          term: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          curriculum_release_id?: string | null
          curriculum_version?: string
          grade: number
          id?: string
          learner_id: string
          note?: string
          term: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          curriculum_release_id?: string | null
          curriculum_version?: string
          grade?: number
          id?: string
          learner_id?: string
          note?: string
          term?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_notes_curriculum_release_id_fkey"
            columns: ["curriculum_release_id"]
            isOneToOne: false
            referencedRelation: "curriculum_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_notes_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          curriculum_release_id: string | null
          curriculum_version: string
          grade: number
          id: string
          last_opened_at: string | null
          learner_id: string
          started_at: string | null
          status: string
          term: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          curriculum_release_id?: string | null
          curriculum_version?: string
          grade: number
          id?: string
          last_opened_at?: string | null
          learner_id: string
          started_at?: string | null
          status?: string
          term: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          curriculum_release_id?: string | null
          curriculum_version?: string
          grade?: number
          id?: string
          last_opened_at?: string | null
          learner_id?: string
          started_at?: string | null
          status?: string
          term?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_curriculum_release_id_fkey"
            columns: ["curriculum_release_id"]
            isOneToOne: false
            referencedRelation: "curriculum_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_artifacts: {
        Row: {
          artifact_type: string
          captured_at: string
          created_at: string
          curriculum_release_id: string | null
          curriculum_version: string
          grade: number
          id: string
          learner_id: string
          marker_key: string
          status: string
          term: number
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          artifact_type?: string
          captured_at?: string
          created_at?: string
          curriculum_release_id?: string | null
          curriculum_version?: string
          grade: number
          id?: string
          learner_id: string
          marker_key: string
          status?: string
          term: number
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          artifact_type?: string
          captured_at?: string
          created_at?: string
          curriculum_release_id?: string | null
          curriculum_version?: string
          grade?: number
          id?: string
          learner_id?: string
          marker_key?: string
          status?: string
          term?: number
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_artifacts_curriculum_release_id_fkey"
            columns: ["curriculum_release_id"]
            isOneToOne: false
            referencedRelation: "curriculum_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_artifacts_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_evidence: {
        Row: {
          artifact_id: string
          created_at: string
          curriculum_release_id: string | null
          id: string
          label: string | null
          position: number
          prompt_response_id: string
        }
        Insert: {
          artifact_id: string
          created_at?: string
          curriculum_release_id?: string | null
          id?: string
          label?: string | null
          position?: number
          prompt_response_id: string
        }
        Update: {
          artifact_id?: string
          created_at?: string
          curriculum_release_id?: string | null
          id?: string
          label?: string | null
          position?: number
          prompt_response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_evidence_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "portfolio_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_evidence_curriculum_release_id_fkey"
            columns: ["curriculum_release_id"]
            isOneToOne: false
            referencedRelation: "curriculum_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_evidence_prompt_response_id_fkey"
            columns: ["prompt_response_id"]
            isOneToOne: false
            referencedRelation: "prompt_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_responses: {
        Row: {
          answered_at: string
          created_at: string
          curriculum_release_id: string | null
          curriculum_version: string
          grade: number
          id: string
          learner_id: string
          prompt_key: string
          response: Json
          response_kind: string
          term: number
          unit_id: string
          updated_at: string
        }
        Insert: {
          answered_at?: string
          created_at?: string
          curriculum_release_id?: string | null
          curriculum_version?: string
          grade: number
          id?: string
          learner_id: string
          prompt_key: string
          response: Json
          response_kind?: string
          term: number
          unit_id: string
          updated_at?: string
        }
        Update: {
          answered_at?: string
          created_at?: string
          curriculum_release_id?: string | null
          curriculum_version?: string
          grade?: number
          id?: string
          learner_id?: string
          prompt_key?: string
          response?: Json
          response_kind?: string
          term?: number
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_responses_curriculum_release_id_fkey"
            columns: ["curriculum_release_id"]
            isOneToOne: false
            referencedRelation: "curriculum_releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_responses_learner_id_fkey"
            columns: ["learner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rubric_criteria: {
        Row: {
          criterion_key: string
          description: string
          id: string
          label: string
          levels: Json
          position: number
          rubric_key: string
          weight: number
        }
        Insert: {
          criterion_key: string
          description: string
          id?: string
          label: string
          levels: Json
          position?: number
          rubric_key: string
          weight?: number
        }
        Update: {
          criterion_key?: string
          description?: string
          id?: string
          label?: string
          levels?: Json
          position?: number
          rubric_key?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "rubric_criteria_rubric_key_fkey"
            columns: ["rubric_key"]
            isOneToOne: false
            referencedRelation: "rubric_templates"
            referencedColumns: ["key"]
          },
        ]
      }
      rubric_templates: {
        Row: {
          active: boolean
          created_at: string
          key: string
          name: string
          purpose: string
          version: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          key: string
          name: string
          purpose: string
          version?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          key?: string
          name?: string
          purpose?: string
          version?: number
        }
        Relationships: []
      }
      school_memberships: {
        Row: {
          created_at: string
          id: string
          role: string
          school_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          school_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          school_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_memberships_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_platform_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      add_cohort_staff_by_email: {
        Args: { p_cohort_id: string; p_email: string; p_role?: string }
        Returns: string
      }
      add_school_member_by_email: {
        Args: { p_email: string; p_role?: string; p_school_id: string }
        Returns: string
      }
      create_school: {
        Args: { p_name: string; p_slug: string }
        Returns: {
          created_at: string
          id: string
          metadata: Json
          name: string
          slug: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "schools"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      enrol_learner_by_email: {
        Args: { p_cohort_id: string; p_email: string }
        Returns: string
      }
      resolve_school_account: {
        Args: { p_email: string; p_school_id: string }
        Returns: {
          display_name: string
          user_id: string
        }[]
      }
      upsert_facilitator_evidence_record: {
        Args: {
          p_auto_result?: Json
          p_learner_id: string
          p_response_key: string
          p_response_value: string
          p_status?: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
