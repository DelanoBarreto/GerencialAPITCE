import type { SupabaseClient } from "@supabase/supabase-js";

export type GroupEndpoint = {
  endpoint: string;
  frequencia_sugerida: string;
};

export async function loadGroupEndpoints(
  supabase: SupabaseClient,
  groupSlug: string,
  onlyDefault = false
): Promise<GroupEndpoint[]> {
  let query = supabase
    .from("tce_endpoint_catalog")
    .select("endpoint, frequencia_sugerida")
    .eq("grupo_slug", groupSlug)
    .order("endpoint", { ascending: true });

  if (onlyDefault) {
    query = query.eq("habilitado_por_padrao", true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as GroupEndpoint[];
}

export async function ensureGroupSubscriptions(
  supabase: SupabaseClient,
  codigoMunicipio: string,
  exercicioOrcamento: string,
  endpoints: GroupEndpoint[]
) {
  if (endpoints.length === 0) {
    return;
  }

  const { error } = await supabase.from("tce_sync_subscriptions").upsert(
    endpoints.map((endpoint) => ({
      codigo_municipio: codigoMunicipio,
      exercicio_orcamento: exercicioOrcamento,
      endpoint: endpoint.endpoint,
      ativo: true,
      sincronizacao_automatica: true,
      updated_at: new Date().toISOString()
    })),
    { onConflict: "codigo_municipio,exercicio_orcamento,endpoint" }
  );

  if (error) {
    throw error;
  }
}

