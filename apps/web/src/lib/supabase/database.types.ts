export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserPlan = "free" | "pro";

export type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  plan: UserPlan;
  credits: number;
  created_at: string;
  updated_at: string;
};

export type ReportStatus =
  | "queued"
  | "searching"
  | "extracting"
  | "normalizing"
  | "analyzing"
  | "rendering"
  | "completed"
  | "failed";

export type ReportSourceLimit = 5 | 10 | 20;

export type ReportRow = {
  id: string;
  user_id: string;
  query: string;
  title: string | null;
  status: ReportStatus;
  progress: number;
  source_limit: ReportSourceLimit;
  language: string | null;
  executive_summary: string | null;
  analysis_json: Json | null;
  visualization_json: Json | null;
  is_paid: boolean;
  created_at: string;
  completed_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          plan?: UserPlan;
          credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          display_name?: string | null;
          plan?: UserPlan;
          credits?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: ReportRow;
        Insert: {
          id?: string;
          user_id: string;
          query: string;
          title?: string | null;
          status?: ReportStatus;
          progress?: number;
          source_limit?: ReportSourceLimit;
          language?: string | null;
          executive_summary?: string | null;
          analysis_json?: Json | null;
          visualization_json?: Json | null;
          is_paid?: boolean;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          title?: string | null;
          status?: ReportStatus;
          progress?: number;
          executive_summary?: string | null;
          analysis_json?: Json | null;
          visualization_json?: Json | null;
          is_paid?: boolean;
          completed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_plan: UserPlan;
    };
    CompositeTypes: Record<string, never>;
  };
};
