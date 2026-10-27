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
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

export type SourceStatus = "found" | "extracted" | "partial" | "failed" | "filtered";

export type SourceRow = {
  id: string;
  report_id: string;
  url: string;
  title: string | null;
  domain: string;
  snippet: string | null;
  published_at: string | null;
  search_rank: number | null;
  status: SourceStatus;
  quality_score: number | null;
  raw_metadata: Json | null;
  fetched_at: string | null;
  created_at: string;
};

export type ExtractedItemRow = {
  id: string;
  report_id: string;
  source_id: string;
  entity_name: string;
  entity_type: string;
  normalized_data: Json;
  confidence: number | null;
  schema_version: string;
  created_at: string;
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
          error_message?: string | null;
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
          error_message?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      sources: {
        Row: SourceRow;
        Insert: {
          id?: string;
          report_id: string;
          url: string;
          title?: string | null;
          domain: string;
          snippet?: string | null;
          published_at?: string | null;
          search_rank?: number | null;
          status?: SourceStatus;
          quality_score?: number | null;
          raw_metadata?: Json | null;
          fetched_at?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string | null;
          snippet?: string | null;
          published_at?: string | null;
          status?: SourceStatus;
          quality_score?: number | null;
          raw_metadata?: Json | null;
          fetched_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sources_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "reports";
            referencedColumns: ["id"];
          },
        ];
      };
      extracted_items: {
        Row: ExtractedItemRow;
        Insert: {
          id?: string;
          report_id: string;
          source_id: string;
          entity_name: string;
          entity_type?: string;
          normalized_data: Json;
          confidence?: number | null;
          schema_version: string;
          created_at?: string;
        };
        Update: {
          entity_name?: string;
          entity_type?: string;
          normalized_data?: Json;
          confidence?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "extracted_items_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "extracted_items_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
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
