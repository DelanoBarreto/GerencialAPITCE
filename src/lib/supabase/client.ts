"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requirePublishableKey, requireSupabaseUrl, TCE_SCHEMA } from "./config.js";

export function createSupabaseBrowserClient() {
  return createBrowserClient(requireSupabaseUrl(), requirePublishableKey(), {
    db: { schema: TCE_SCHEMA }
  });
}
