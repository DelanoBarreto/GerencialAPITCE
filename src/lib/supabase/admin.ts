import "server-only";

import { createClient } from "@supabase/supabase-js";
import { hasSupabaseServerConfig, requiredEnv, requiredSupabaseServerKey } from "../tce/env.js";

// As tabelas do TCE vivem no schema `tce` da plataforma, ao lado de `portalgov`.
// Definir o schema aqui evita prefixar cada chamada .from() no projeto inteiro.
export function createSupabaseAdminClient() {
  return createClient(requiredEnv("SUPABASE_URL"), requiredSupabaseServerKey(), {
    db: { schema: "tce" },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function hasSupabaseConfig(): boolean {
  return hasSupabaseServerConfig();
}

