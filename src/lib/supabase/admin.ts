import { createClient } from "@supabase/supabase-js";
import { requiredEnv } from "../tce/env.js";

// Singleton — reutiliza a mesma instância TCP por processo Node.js
// Evita criar um novo client a cada request no Server Component
let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (!_client) {
    _client = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }
  return _client;
}

/** @deprecated Use getSupabaseAdmin() */
export function createSupabaseAdminClient() {
  return getSupabaseAdmin();
}
