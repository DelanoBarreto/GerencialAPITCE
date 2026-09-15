import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server.js";
import { isAllowedRequestOrigin } from "./origin.js";

export type OperationAuthorization = { ok: true; user: User } | { ok: false; response: Response };

export async function authorizeInternalOperation(request: Request): Promise<OperationAuthorization> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, response: Response.json({ ok: false, error: "Autenticacao obrigatoria." }, { status: 401 }) };
  }

  if (!isAllowedRequestOrigin(request, process.env.APITCE_APP_ORIGIN, process.env.NODE_ENV === "production")) {
    return { ok: false, response: Response.json({ ok: false, error: "Origem nao autorizada." }, { status: 403 }) };
  }

  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return { ok: false, response: Response.json({ ok: false, error: "Envie JSON." }, { status: 415 }) };
  }

  const { data: isSuperadmin, error: roleError } = await supabase.rpc("sou_superadmin");
  if (roleError || isSuperadmin !== true) {
    return { ok: false, response: Response.json({ ok: false, error: "Operacao restrita a equipe interna." }, { status: 403 }) };
  }

  return { ok: true, user: data.user };
}
