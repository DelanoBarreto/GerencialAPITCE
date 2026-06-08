import { createSupabaseAdminClient } from "../../lib/supabase/admin.js";

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

const fallbackMunicipios: AdminMunicipio[] = [
  { codigo_municipio: "014", nome_municipio: "ARACATI" },
  { codigo_municipio: "120", nome_municipio: "QUIXADA" },
  { codigo_municipio: "024", nome_municipio: "CRATO" },
  { codigo_municipio: "158", nome_municipio: "SOBRAL" },
  { codigo_municipio: "061", nome_municipio: "IGUATU" }
];

const fallbackClients: AdminClient[] = [
  {
    id: "CLI-001",
    nome: "Prefeitura de Aracati",
    contato: "gestao@aracati.ce.gov.br",
    municipio: "ARACATI",
    ano: 2025,
    plano: "Gestao municipal",
    pagamento: "confirmado",
    liberacao: "disponivel"
  },
  {
    id: "CLI-002",
    nome: "Escritorio Melo Contabil",
    contato: "atendimento@melocontabil.com.br",
    municipio: "SOBRAL",
    ano: 2025,
    plano: "Contabil multiusuario",
    pagamento: "confirmado",
    liberacao: "carregando"
  },
  {
    id: "CLI-003",
    nome: "Assessoria Publica Ceara",
    contato: "suporte@apce.com.br",
    municipio: "QUIXADA",
    ano: 2025,
    plano: "Gerencial",
    pagamento: "pendente",
    liberacao: "pendente"
  },
  {
    id: "CLI-004",
    nome: "Consultoria Gestor Norte",
    contato: "operacao@gestornorte.com.br",
    municipio: "CRATO",
    ano: 2025,
    plano: "Relatorios avancados",
    pagamento: "confirmado",
    liberacao: "revisao"
  },
  {
    id: "CLI-005",
    nome: "Controle Municipal Ltda",
    contato: "financeiro@controlemunicipal.com",
    municipio: "IGUATU",
    ano: 2025,
    plano: "Monitoramento",
    pagamento: "atrasado",
    liberacao: "suspenso"
  }
];

const fallbackGroups: AdminGroup[] = [
  { slug: "auxiliares", nome: "Auxiliares", ordem: 1 },
  { slug: "bas", nome: "Documentacao de Informacoes Basicas (BAS)", ordem: 2 },
  { slug: "orc", nome: "Documentacao referente ao Orcamento Municipal (ORC)", ordem: 3 },
  { slug: "bal", nome: "Documentacao referente aos Balancetes (BAL)", ordem: 4 }
];

export async function loadAdminData(): Promise<AdminData> {
  const supabase = createSupabaseAdminClient();
  const [municipiosResult, monitoradosResult, logsResult, gruposResult, catalogResult, subscriptionsResult] = await Promise.all([
    supabase.from("municipios").select("codigo_municipio,nome_municipio").order("nome_municipio", { ascending: true }),
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

  const municipios = ((municipiosResult.data as AdminMunicipio[] | null) ?? fallbackMunicipios).length
    ? ((municipiosResult.data as AdminMunicipio[] | null) ?? fallbackMunicipios)
    : fallbackMunicipios;
  const nameByCode = new Map(municipios.map((item) => [item.codigo_municipio, item.nome_municipio]));
  const monitoradoRows =
    ((monitoradosResult.data as Array<Omit<AdminMonitorado, "nome_municipio">> | null) ?? []).length > 0
      ? ((monitoradosResult.data as Array<Omit<AdminMonitorado, "nome_municipio">>) ?? [])
      : [{ codigo_municipio: "014", ano: 2025, exercicio_orcamento: "202500", ativo: true, sincronizacao_automatica: true }];

  const monitorados = monitoradoRows.map((item) => ({
    ...item,
    nome_municipio: nameByCode.get(item.codigo_municipio) ?? item.codigo_municipio
  }));
  const logs = ((logsResult.data as AdminSyncLog[] | null) ?? []).filter(Boolean);
  const grupos = ((gruposResult.data as AdminGroup[] | null) ?? fallbackGroups).length
    ? ((gruposResult.data as AdminGroup[] | null) ?? fallbackGroups)
    : fallbackGroups;
  const catalog = ((catalogResult.data as AdminEndpointCatalog[] | null) ?? []).filter(Boolean);
  const subscriptions = ((subscriptionsResult.data as AdminSubscription[] | null) ?? []).filter(Boolean);
  const clients = fallbackClients;
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

export function formatInt(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function relativeTime(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60_000));

  if (minutes < 1) {
    return "agora";
  }

  if (minutes < 60) {
    return `ha ${minutes} min`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `ha ${hours} h`;
  }

  const days = Math.round(hours / 24);
  return `ha ${days} dias`;
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
