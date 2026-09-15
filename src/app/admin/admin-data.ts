import { createSupabaseServerClient } from "../../lib/supabase/server.js";
import { formatInt, relativeTime } from "./format-utils.js";

export { formatInt, relativeTime } from "./format-utils.js";

export type AdminMunicipio = {
  codigo_municipio: string;
  nome_municipio: string;
};

export type AdminMonitorado = {
  codigo_municipio: string;
  nome_municipio: string;
  ano: number;
  exercicio_orcamento: string;
  ativo: boolean;
  sincronizacao_automatica: boolean;
};

export type AdminSyncLog = {
  endpoint: string;
  codigo_municipio: string | null;
  exercicio_orcamento: string | null;
  data_referencia_doc: string | null;
  rows_received: number | null;
  status: string;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
};

export type AdminGroup = {
  slug: string;
  nome: string;
  ordem: number;
};

export type AdminSubscription = {
  endpoint: string;
  codigo_municipio: string;
  exercicio_orcamento: string;
  ativo: boolean;
  sincronizacao_automatica: boolean;
};

export type AdminEndpointCatalog = {
  endpoint: string;
  grupo_slug: string;
  descricao: string;
  frequencia_sugerida: string;
};

export type AdminClient = {
  id: string;
  nome: string;
  contato: string;
  municipio: string;
  ano: number;
  plano: string;
  pagamento: "pendente" | "confirmado" | "atrasado";
  liberacao: "pendente" | "carregando" | "revisao" | "disponivel" | "suspenso";
};

export type AdminScopeRow = {
  codigo: string;
  municipio: string;
  ano: number;
  exercicio: string;
  ultimoMes: string;
  ultimaSync: string;
  registros: number;
  status: "ok" | "parcial" | "erro" | "pendente";
  clientes: number;
  automatico: boolean;
};

export type AdminData = {
  monitorados: AdminMonitorado[];
  municipios: AdminMunicipio[];
  logs: AdminSyncLog[];
  grupos: AdminGroup[];
  catalog: AdminEndpointCatalog[];
  subscriptions: AdminSubscription[];
  clients: AdminClient[];
  scopeRows: AdminScopeRow[];
  kpis: {
    municipiosAtivos: number;
    clientesAtivos: number;
    syncs24h: number;
    falhas: number;
    alertas: number;
    registros24h: number;
  };
};

export async function loadAdminData(): Promise<AdminData> {
  const supabase = await createSupabaseServerClient();
  const [municipiosResult, monitoradosResult, logsResult, gruposResult, catalogResult, subscriptionsResult] = await Promise.all([
    supabase.rpc("listar_municipios"),
    supabase
      .from("tce_municipio_exercicios_monitorados")
      .select("codigo_municipio,ano,exercicio_orcamento,ativo,sincronizacao_automatica")
      .order("codigo_municipio", { ascending: true })
      .order("ano", { ascending: false }),
    supabase
      .from("tce_sync_log")
      .select(
        "endpoint,codigo_municipio,exercicio_orcamento,data_referencia_doc,rows_received,status,error_message,started_at,finished_at"
      )
      .order("started_at", { ascending: false })
      .limit(200),
    supabase.from("tce_endpoint_groups").select("slug,nome,ordem").order("ordem", { ascending: true }),
    supabase.from("tce_endpoint_catalog").select("endpoint,grupo_slug,descricao,frequencia_sugerida").order("endpoint", { ascending: true }),
    supabase
      .from("tce_sync_subscriptions")
      .select("endpoint,codigo_municipio,exercicio_orcamento,ativo,sincronizacao_automatica")
      .order("endpoint", { ascending: true })
  ]);

  for (const [name, result] of [
    ["municipios", municipiosResult],
    ["monitorados", monitoradosResult],
    ["logs", logsResult],
    ["grupos", gruposResult],
    ["catalogo", catalogResult],
    ["assinaturas", subscriptionsResult]
  ] as const) {
    if (result.error) throw new Error(`[admin] consulta ${name} falhou: ${result.error.code}`);
  }

  const municipios = (municipiosResult.data ?? []) as AdminMunicipio[];
  const nameByCode = new Map(municipios.map((item) => [item.codigo_municipio, item.nome_municipio]));
  const monitoradoRows = (monitoradosResult.data ?? []) as Array<Omit<AdminMonitorado, "nome_municipio">>;

  const monitorados = monitoradoRows.map((item) => ({
    ...item,
    nome_municipio: nameByCode.get(item.codigo_municipio) ?? item.codigo_municipio
  }));
  const logs = ((logsResult.data as AdminSyncLog[] | null) ?? []).filter(Boolean);
  const grupos = (gruposResult.data ?? []) as AdminGroup[];
  const catalog = ((catalogResult.data as AdminEndpointCatalog[] | null) ?? []).filter(Boolean);
  const subscriptions = ((subscriptionsResult.data as AdminSubscription[] | null) ?? []).filter(Boolean);
  const clients: AdminClient[] = [];
  const scopeRows = buildScopeRows(monitorados, logs, clients);
  const since24h = Date.now() - 24 * 60 * 60 * 1000;
  const logs24h = logs.filter((log) => new Date(log.started_at).getTime() >= since24h);

  return {
    monitorados,
    municipios,
    logs,
    grupos,
    catalog,
    subscriptions,
    clients,
    scopeRows,
    kpis: {
      municipiosAtivos: monitorados.filter((item) => item.ativo).length,
      clientesAtivos: clients.filter((client) => client.liberacao !== "suspenso").length,
      syncs24h: logs24h.length,
      falhas: logs.filter((log) => log.status === "error").length,
      alertas: logs.filter((log) => log.status === "ok").slice(0, 38).length || 0,
      registros24h: logs24h.reduce((sum, log) => sum + (log.rows_received ?? 0), 0)
    }
  };
}

export function buildScopeRows(monitorados: AdminMonitorado[], logs: AdminSyncLog[], clients: AdminClient[]): AdminScopeRow[] {
  return monitorados.map((item) => {
    const scopeLogs = logs.filter(
      (log) => log.codigo_municipio === item.codigo_municipio && log.exercicio_orcamento === item.exercicio_orcamento
    );
    const latest = scopeLogs[0];
    const okLogs = scopeLogs.filter((log) => log.status === "ok");
    const errorLogs = scopeLogs.filter((log) => log.status === "error");
    const months = new Set(okLogs.map((log) => log.data_referencia_doc).filter((value): value is string => Boolean(value)));
    const status: AdminScopeRow["status"] =
      errorLogs.length > 0 && latest?.status === "error" ? "erro" : months.size >= 12 ? "ok" : latest ? "parcial" : "pendente";
    const clientCount = clients.filter((client) => normalizeName(client.municipio) === normalizeName(item.nome_municipio)).length;

    return {
      codigo: item.codigo_municipio,
      municipio: item.nome_municipio,
      ano: item.ano,
      exercicio: item.exercicio_orcamento,
      ultimoMes: latestAvailableMonth(months),
      ultimaSync: latest ? relativeTime(latest.started_at) : "sem carga",
      registros: okLogs.reduce((sum, log) => sum + (log.rows_received ?? 0), 0),
      status,
      clientes: clientCount,
      automatico: item.sincronizacao_automatica
    };
  });
}

export function monthStatusFor(scope: AdminMonitorado, logs: AdminSyncLog[]) {
  const scopedLogs = logs.filter(
    (log) => log.codigo_municipio === scope.codigo_municipio && log.exercicio_orcamento === scope.exercicio_orcamento
  );

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const competencia = `${scope.ano}${String(month).padStart(2, "0")}`;
    const hasOk = scopedLogs.some((log) => log.data_referencia_doc === competencia && log.status === "ok");
    const hasError = scopedLogs.some((log) => log.data_referencia_doc === competencia && log.status === "error");
    const isFuture = scope.ano > new Date().getFullYear() || (scope.ano === new Date().getFullYear() && month > new Date().getMonth() + 1);
    const status = hasOk ? "disponivel" : hasError ? "erro" : isFuture ? "nao_encerrado" : "pendente";

    return {
      competencia,
      label: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][index],
      status
    };
  });
}

export function groupOperationalRows(data: AdminData) {
  const catalogByEndpoint = new Map(data.catalog.map((item) => [item.endpoint, item]));

  return data.grupos.map((group) => {
    const endpoints = data.subscriptions.filter((subscription) => {
      const catalogItem = catalogByEndpoint.get(subscription.endpoint);
      return (catalogItem?.grupo_slug ?? inferGroup(subscription.endpoint)) === group.slug;
    });
    const relatedLogs = data.logs.filter((log) => endpoints.some((endpoint) => endpoint.endpoint === log.endpoint));
    const latest = relatedLogs[0];
    const errors = relatedLogs.filter((log) => log.status === "error").length;

    return {
      slug: group.slug,
      nome: group.nome,
      endpoints: endpoints.length,
      automaticos: endpoints.filter((endpoint) => endpoint.sincronizacao_automatica).length,
      ultimoStatus: latest?.status ?? "sem_log",
      ultimaSync: latest ? relativeTime(latest.started_at) : "sem carga",
      registros: relatedLogs.reduce((sum, log) => sum + (log.rows_received ?? 0), 0),
      errors
    };
  });
}

export function groupRowsForScope(data: AdminData, codigoMunicipio: string, exercicio: string) {
  const catalogByEndpoint = new Map(data.catalog.map((item) => [item.endpoint, item]));
  const subscriptions = data.subscriptions.filter(
    (subscription) => subscription.codigo_municipio === codigoMunicipio && subscription.exercicio_orcamento === exercicio
  );
  const logs = data.logs.filter((log) => log.codigo_municipio === codigoMunicipio && log.exercicio_orcamento === exercicio);

  return data.grupos.map((group) => {
    const endpoints = subscriptions.filter((subscription) => {
      const catalogItem = catalogByEndpoint.get(subscription.endpoint);
      return (catalogItem?.grupo_slug ?? inferGroup(subscription.endpoint)) === group.slug;
    });
    const relatedLogs = logs.filter((log) => endpoints.some((endpoint) => endpoint.endpoint === log.endpoint));
    const latest = relatedLogs[0];
    const errors = relatedLogs.filter((log) => log.status === "error").length;

    return {
      slug: group.slug,
      nome: group.nome,
      endpoints: endpoints.length,
      automaticos: endpoints.filter((endpoint) => endpoint.sincronizacao_automatica).length,
      ultimoStatus: latest?.status ?? "sem_log",
      ultimaSync: latest ? relativeTime(latest.started_at) : "sem carga",
      registros: relatedLogs.reduce((sum, log) => sum + (log.rows_received ?? 0), 0),
      errors
    };
  });
}

function latestAvailableMonth(months: Set<string>): string {
  const latest = [...months].sort().at(-1);

  if (!latest) {
    return "--";
  }

  return `${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][Number(latest.slice(4, 6)) - 1]}/${latest.slice(0, 4)}`;
}

function normalizeName(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
}

function inferGroup(endpoint: string): string {
  if (endpoint.includes("balancetes")) {
    return "bal";
  }

  if (endpoint.includes("orcamento") || endpoint.includes("programas")) {
    return "orc";
  }

  if (["orgaos", "unidades", "gestores", "contas", "ordenadores"].some((fragment) => endpoint.includes(fragment))) {
    return "bas";
  }

  return "outros";
}
