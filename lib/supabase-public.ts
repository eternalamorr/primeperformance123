import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type LooseDatabase = {
  public: {
    Tables: Record<
      string,
      {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      }
    >;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let supabasePublic: SupabaseClient<LooseDatabase> | null = null;

export function getSupabasePublic() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }

  if (!supabasePublic) {
    supabasePublic = createClient<LooseDatabase>(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
  }

  return supabasePublic;
}
