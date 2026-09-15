import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation.js";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server.js";

export type TceRole = "superadmin" | "tenant_admin" | "editor" | "viewer";
export type AllowedMunicipio = { codigo_municipio: string; nome_municipio: string };
export type TceAccess = { user: User; role: TceRole; municipios: AllowedMunicipio[] };

export const getTceAccess = cache(async (): Promise<TceAccess | null> => {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  const [{ data: roleData, error: roleError }, { data: municipiosData, error: municipiosError }] = await Promise.all([
    supabase.rpc("meu_papel"),
    supabase.rpc("listar_municipios")
  ]);

  const role = parseRole(roleData);
  if (roleError || municipiosError || !role) {
    console.warn("[auth] usuario autenticado sem acesso TCE valido", {
      roleError: roleError?.code,
      municipiosError: municipiosError?.code
    });
    return null;
  }

  return {
    user: userData.user,
    role,
    municipios: parseMunicipios(municipiosData)
  };
});

export async function requireTcePage(redirectPath: string): Promise<TceAccess> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`);

  const access = await getTceAccess();
  if (!access) redirect("/acesso-negado");
  return access;
}

export async function requireSuperadminPage(redirectPath: string): Promise<TceAccess> {
  const access = await requireTcePage(redirectPath);
  if (access.role !== "superadmin") redirect("/acesso-negado");
  return access;
}

export function canAccessMunicipio(access: TceAccess, codigoMunicipio: string): boolean {
  return access.role === "superadmin" || access.municipios.some((item) => item.codigo_municipio === codigoMunicipio);
}

function parseRole(value: unknown): TceRole | null {
  return value === "superadmin" || value === "tenant_admin" || value === "editor" || value === "viewer" ? value : null;
}

function parseMunicipios(value: unknown): AllowedMunicipio[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    const codigo = String(item.codigo_municipio ?? "");
    const nome = String(item.nome_municipio ?? "");
    return /^\d{3}$/.test(codigo) && nome ? [{ codigo_municipio: codigo, nome_municipio: nome }] : [];
  });
}
