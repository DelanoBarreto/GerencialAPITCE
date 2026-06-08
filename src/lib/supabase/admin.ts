import { createClient } from "@supabase/supabase-js";
import { requiredEnv } from "../tce/env.js";

export function createSupabaseAdminClient() {
  return createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

