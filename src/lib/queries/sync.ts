import { createSupabaseAdminClient } from "../supabase/admin.js";

export type SyncLog = {
  endpoint: string;
  data_referencia_doc: string | null;
  rows_received: number | null;
  status: string;
  started_at: string;
  finished_at: string | null;
};

export type EndpointStatus = {
  endpoint: string;
  grupo: string;
  descricao: string;
  frequencia: string;
  ativo: boolean;
  automatico: boolean;
  ultimo_status: string;
  ultima_competencia: string;
  ultimas_linhas: number;
};

/**
 * Últimos logs de sincronização.
 * Sem cache pois é a seção de auditoria — deve refletir o estado atual.
 */
export async function loadSyncLogs(
  codigoMunicipio: string,
  exercicio: string,
  limit = 8
): Promise<SyncLog[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tce_sync_log")
    .select("endpoint,data_referencia_doc,rows_received,status,started_at,finished_at")
    .eq("codigo_municipio", codigoMunicipio)
    .eq("exercicio_orcamento", exercicio)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as SyncLog[];
}

/**
 * Status de cada endpoint monitorado.
 * Busca apenas o log mais recente por endpoint (em vez de 300 registros brutos).
 */
export async function loadEndpointStatus(
  codigoMunicipio: string,
  exercicio: string
): Promise<EndpointStatus[]> {
  const supabase = createSupabaseAdminClient();

  const [{ data: subscriptions, error: subErr }, { data: catalog, error: catErr }, { data: logs, error: logErr }] =
    await Promise.all([
      supabase
        .from("tce_sync_subscriptions")
        .select("endpoint,ativo,sincronizacao_automatica")
        .eq("codigo_municipio", codigoMunicipio)
        .eq("exercicio_orcamento", exercicio)
        .order("endpoint", { ascending: true }),
      supabase
        .from("tce_endpoint_catalog")
        .select("endpoint,grupo_slug,descricao,frequencia_sugerida")
        .order("endpoint", { ascending: true }),
      // Reduzido de 300 para 50 — busca os mais recentes e filtra por endpoint
      supabase
        .from("tce_sync_log")
        .select("endpoint,data_referencia_doc,rows_received,status,started_at")
        .eq("codigo_municipio", codigoMunicipio)
        .eq("exercicio_orcamento", exercicio)
        .order("started_at", { ascending: false })
        .limit(50)
    ]);

  if (subErr) throw subErr;
  if (catErr) throw catErr;
  if (logErr) throw logErr;

  const catalogByEndpoint = new Map(
    ((catalog ?? []) as Array<{ endpoint: string; grupo_slug: string; descricao: string; frequencia_sugerida: string }>)
      .map((item) => [item.endpoint, item])
  );

  const latestLogByEndpoint = new Map<string, { data_referencia_doc: string | null; rows_received: number | null; status: string | null }>();
  for (const log of (logs ?? []) as Array<{ endpoint: string; data_referencia_doc: string | null; rows_received: number | null; status: string | null }>) {
    if (!latestLogByEndpoint.has(log.endpoint)) {
      latestLogByEndpoint.set(log.endpoint, log);
    }
  }

  return ((subscriptions ?? []) as Array<{ endpoint: string; ativo: boolean; sincronizacao_automatica: boolean }>).map(
    (item) => {
      const cat = catalogByEndpoint.get(item.endpoint);
      const latestLog = latestLogByEndpoint.get(item.endpoint);
      return {
        endpoint: item.endpoint,
        grupo: cat?.grupo_slug?.toUpperCase() ?? "-",
        descricao: cat?.descricao ?? item.endpoint,
        frequencia: cat?.frequencia_sugerida ?? "manual",
        ativo: item.ativo,
        automatico: item.sincronizacao_automatica,
        ultimo_status: latestLog?.status ?? "sem_log",
        ultima_competencia: latestLog?.data_referencia_doc ?? "anual",
        ultimas_linhas: latestLog?.rows_received ?? 0
      };
    }
  );
}

/** Contagem de erros registrados. */
export async function countErrors(codigoMunicipio: string, exercicio: string): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("tce_sync_log")
    .select("*", { count: "exact", head: true })
    .eq("codigo_municipio", codigoMunicipio)
    .eq("exercicio_orcamento", exercicio)
    .eq("status", "error");

  if (error) throw error;
  return count ?? 0;
}

/** Contagem de contas bancárias. */
export async function countContasBancarias(codigoMunicipio: string, exercicio: string): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("tce_contas_bancarias_municipio")
    .select("*", { count: "exact", head: true })
    .eq("codigo_municipio", codigoMunicipio)
    .eq("exercicio_orcamento", exercicio);

  if (error) throw error;
  return count ?? 0;
}
