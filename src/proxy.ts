import { NextResponse, type NextRequest } from "next/server.js";
import { updateSupabaseSession } from "./lib/supabase/proxy.js";

const PUBLIC_PATHS = new Set(["/login", "/acesso-negado"]);

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSupabaseSession(request);
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) return response;

  if (!user && !PUBLIC_PATHS.has(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${request.nextUrl.search}`);
    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  if (user && pathname === "/login") {
    return copyCookies(response, NextResponse.redirect(new URL("/", request.url)));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"]
};

function copyCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) target.cookies.set(cookie);
  return target;
}
