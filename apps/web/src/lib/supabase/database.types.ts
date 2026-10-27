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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_plan: UserPlan;
    };
    CompositeTypes: Record<string, never>;
  };
};
