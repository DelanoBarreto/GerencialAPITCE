import { createClient } from "@supabase/supabase-js";
import { hasSupabaseServerConfig, requiredEnv, requiredSupabaseServerKey } from "../tce/env.js";

export function createSupabaseAdminClient() {
  return createClient(requiredEnv("SUPABASE_URL"), requiredSupabaseServerKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function hasSupabaseConfig(): boolean {
  return hasSupabaseServerConfig();
}

