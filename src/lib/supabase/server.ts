import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers.js";
import { requirePublishableKey, requireSupabaseUrl, TCE_SCHEMA } from "./config.js";

/** Cliente do usuario autenticado. Este e o cliente padrao para paginas e leituras. */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(requireSupabaseUrl(), requirePublishableKey(), {
    db: { schema: TCE_SCHEMA },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components nao escrevem cookies. O refresh fica no proxy.
        }
      }
    }
  });
}
