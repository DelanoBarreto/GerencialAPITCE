import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server.js";
import { hasPublicSupabaseConfig, requirePublishableKey, requireSupabaseUrl, TCE_SCHEMA } from "./config.js";

type CookieUpdate = { name: string; value: string; options: CookieOptions };

export async function updateSupabaseSession(request: NextRequest) {
  if (!hasPublicSupabaseConfig()) {
    return { response: NextResponse.next(), user: null };
  }

  let response = NextResponse.next({ request });
  const pendingCookies: CookieUpdate[] = [];
  const supabase = createServerClient(requireSupabaseUrl(), requirePublishableKey(), {
    db: { schema: TCE_SCHEMA },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        pendingCookies.push(...cookiesToSet);
        for (const cookie of cookiesToSet) request.cookies.set(cookie.name, cookie.value);
        response = NextResponse.next({ request });
      }
    }
  });

  const { data, error } = await supabase.auth.getUser();
  for (const { name, value, options } of pendingCookies) response.cookies.set(name, value, options);

  return { response, user: error ? null : data.user };
}
