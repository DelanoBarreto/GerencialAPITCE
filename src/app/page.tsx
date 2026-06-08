import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  DatabaseZap,
  FileText,
  Landmark,
  Layers3
} from "lucide-react";
import type { ReactNode } from "react";
import { EndpointTable } from "./EndpointTable.js";
import { MonitorPanel } from "./MonitorPanel.js";
import { OperationPanel } from "./OperationPanel.js";
import { createSupabaseAdminClient } from "../lib/supabase/admin.js";
import {
  loadSyncLogs,
  loadEndpointStatus,
  countErrors,
  countContasBancarias,
  type SyncLog,
  type EndpointStatus
} from "../lib/queries/sync.js";

export const dynamic = "force-dynamic";

type ExecucaoMensal = {
  data_referencia_doc: string;
  receita_arrecadada_no_mes: string | number | null;
  despesa_empenhada_no_mes: string | number | null;
  despesa_liquidada_no_mes: string | number | null;
  despesa_paga_no_mes: string | number | null;
};

type GrupoApi = {
  slug: string;
  nome: string;
  ordem: number;
};


type Municipio = {
  codigo_municipio: string;
  nome_municipio: string;
};

type Monitorado = {
  codigo_municipio: string;
  nome_municipio: string;
  ano: number;
  exercicio_orcamento: string;
  ativo: boolean;
  sincronizacao_automatica: boolean;
};

type ImportResumo = {
  slug: string;
  nome: string;
  registros: number;
  tabelas: number;
  detalhe: string;
};


const grupoResumo: Record<string, { status: string; detalhe: string }> = {
  auxiliares: { status: "Atualizado", detalhe: "Cadastros globais carregados" },
  bas: { status: "Atualizado", detalhe: "Referencias e contas por orgao" },
  orc: { status: "Atualizado", detalhe: "Orcamento anual validado" },
  bal: { status: "Atualizado", detalhe: "12 competencias carregadas" }
};

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const supabase = createSupabaseAdminClient();
  const requestedMunicipio = firstParam(params.municipio);
  const requestedAno = Number(firstParam(params.ano));

  const [monitorados, municipiosDisponiveis] = await Promise.all([loadMonitorados(), loadMunicipiosDisponiveis()]);
  const selectedMonitorado =
    monitorados.find(
      (item) =>
        item.codigo_municipio === (requestedMunicipio ?? item.codigo_municipio) &&
        item.ano === (Number.isFinite(requestedAno) ? requestedAno : item.ano)
    ) ??
    monitorados[0] ?? {
      codigo_municipio: "014",
      nome_municipio: "ARACATI",
      ano: 2025,
      exercicio_orcamento: "202500",
      ativo: true,
      sincronizacao_automatica: true
    };

  const [
    municipioResult,
    exerciciosResult,
    gruposResult,
    execucaoResult,
    logsResult,
    contasCount,
    pendenciasCount
  ] = await Promise.all([
    supabase
      .from("municipios")
      .select("codigo_municipio,nome_municipio")
      .eq("codigo_municipio", selectedMonitorado.codigo_municipio)
      .single(),
    supabase
      .from("tce_municipio_exercicios_monitorados")
      .select("ano,exercicio_orcamento,ativo")
      .eq("codigo_municipio", selectedMonitorado.codigo_municipio)
      .order("ano", { ascending: false }),
    supabase
      .from("tce_endpoint_groups")
      .select("slug,nome,ordem")
      .in("slug", ["auxiliares", "bas", "orc", "bal"])
      .order("ordem", { ascending: true }),
    supabase
      .from("vw_tce_execucao_orcamentaria_mensal")
      .select(
        "data_referencia_doc,receita_arrecadada_no_mes,despesa_empenhada_no_mes,despesa_liquidada_no_mes,despesa_paga_no_mes"
      )
      .eq("codigo_municipio", selectedMonitorado.codigo_municipio)
      .eq("exercicio_orcamento", selectedMonitorado.exercicio_orcamento)
      .order("data_referencia_doc", { ascending: true }),
    loadSyncLogs(selectedMonitorado.codigo_municipio, selectedMonitorado.exercicio_orcamento),
    countContasBancarias(selectedMonitorado.codigo_municipio, selectedMonitorado.exercicio_orcamento),
    countErrors(selectedMonitorado.codigo_municipio, selectedMonitorado.exercicio_orcamento)
  ]);

  const municipio = municipioResult.data as Municipio | null;
  const grupos = (gruposResult.data ?? []) as GrupoApi[];
  const execucao = aggregateExecucaoMensal((execucaoResult.data ?? []) as ExecucaoMensal[]);
  const logs = logsResult;
  const anoAtivo = selectedMonitorado.ano ?? exerciciosResult.data?.[0]?.ano ?? 2025;
  const exercicio = selectedMonitorado.exercicio_orcamento ?? exerciciosResult.data?.[0]?.exercicio_orcamento ?? "202500";
  const importResumo = await loadImportResumo(municipio?.codigo_municipio ?? selectedMonitorado.codigo_municipio, exercicio);
  const endpointStatus = await loadEndpointStatus(selectedMonitorado.codigo_municipio, exercicio);
  const totais = buildTotals(execucao);
  const ultimoMes = execucao.at(-1);
  const totalImportado = importResumo.reduce((sum, item) => sum + item.registros, 0);
  const totalTabelas = importResumo.reduce((sum, item) => sum + item.tabelas, 0);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>APITCE</strong>
            <span>Operacao SIM/TCE-CE</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Modulos">
          <a className="nav-item active" href="#operacao">
            <DatabaseZap size={18} /> Operacao
          </a>
          <a className="nav-item" href="#dashboard">
            <BarChart3 size={18} /> Dashboard
          </a>
          <a className="nav-item" href="#relatorios">
            <FileText size={18} /> Relatorios
          </a>
          <a className="nav-item" href="#catalogo">
            <Layers3 size={18} /> Catalogo TCE
          </a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Painel local sem login</span>
            <h1>Operacao da base TCE</h1>
          </div>
          <div className="context-pill">
            <Landmark size={18} />
            <span>{municipio?.nome_municipio ?? "ARACATI"}</span>
            <strong>{anoAtivo}</strong>
          </div>
        </header>

        <section className="hero-grid" id="operacao">
          <article className="summary-panel">
            <div className="panel-heading">
              <span>Escopo ativo</span>
              <strong>{municipio?.codigo_municipio ?? "014"} / {exercicio}</strong>
            </div>
            <OperationPanel
              municipioCodigo={municipio?.codigo_municipio ?? "014"}
              municipioNome={municipio?.nome_municipio ?? "ARACATI"}
              ano={Number(anoAtivo)}
              grupos={grupos.map((grupo) => ({ slug: grupo.slug, nome: grupo.nome }))}
            />
          </article>

          <div className="status-grid">
            <MetricCard icon={<CalendarDays size={20} />} label="Registros importados" value={formatInt(totalImportado)} detail={`${totalTabelas} tabelas controladas`} />
            <MetricCard icon={<CheckCircle2 size={20} />} label="Contas bancarias" value={formatInt(contasCount)} detail="carga por orgao" />
            <MetricCard icon={<Clock3 size={20} />} label="Pendencias" value={formatInt(pendenciasCount)} detail="erros registrados" />
            <MetricCard icon={<CircleDollarSign size={20} />} label="Receita no ultimo mes" value={formatMoney(toNumber(ultimoMes?.receita_arrecadada_no_mes))} detail="base dashboard" />
          </div>
        </section>

        <section className="monitor-band" id="monitoramento">
          <MonitorPanel
            municipios={municipiosDisponiveis}
            monitorados={monitorados}
            selectedCodigo={municipio?.codigo_municipio ?? selectedMonitorado.codigo_municipio}
            selectedAno={anoAtivo}
          />
        </section>

        <section className="content-grid">
          <article className="panel groups-panel" id="catalogo">
            <div className="section-title">
              <div>
              <span className="eyebrow">Grupos oficiais</span>
              <h2>Sincronizacao por bloco</h2>
              </div>
              <span className="badge">{anoAtivo}</span>
            </div>

            <div className="group-list">
              {grupos.map((grupo) => {
                const resumo = grupoResumo[grupo.slug] ?? { status: "Pendente", detalhe: "Aguardando normalizacao" };
                return (
                  <div className="group-row" key={grupo.slug}>
                    <div>
                      <strong>{grupo.nome}</strong>
                      <span>{resumo.detalhe}</span>
                    </div>
                    <span className="status-badge">{resumo.status}</span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="panel import-panel">
            <div className="section-title">
              <div>
                <span className="eyebrow">Banco local</span>
                <h2>Resumo de importacao</h2>
              </div>
              <span className="badge">{formatInt(totalImportado)} registros</span>
            </div>
            <div className="import-summary">
              {importResumo.map((item) => (
                <div className="import-row" key={item.slug}>
                  <div>
                    <strong>{item.nome}</strong>
                    <span>{item.detalhe}</span>
                  </div>
                  <em>{formatInt(item.registros)}</em>
                  <small>{item.tabelas} tabelas</small>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="panel endpoint-panel" id="endpoints">
          <div className="section-title">
            <div>
              <span className="eyebrow">Endpoints monitorados</span>
              <h2>Controle por item da API</h2>
            </div>
            <span className="badge">{endpointStatus.length} itens</span>
          </div>

          <div className="endpoint-table">
            <EndpointTable
              codigoMunicipio={selectedMonitorado.codigo_municipio}
              ano={anoAtivo}
              endpoints={endpointStatus.map((item) => ({
                ...item,
                frequenciaLabel: formatFrequency(item.frequencia),
                statusLabel: formatStatus(item),
                linhasLabel: formatInt(item.ultimas_linhas)
              }))}
            />
          </div>
        </section>

        <section className="dashboard-grid" id="dashboard">
          <article className="panel chart-panel">
            <div className="section-title">
              <div>
                <span className="eyebrow">Execucao mensal</span>
                <h2>Receita arrecadada x despesa paga</h2>
              </div>
              <span className="badge">{formatMoney(totais.receita)} arrecadado</span>
            </div>

            {execucao.length > 0 ? (
              <div className="bar-chart" aria-label="Comparativo mensal">
                {execucao.map((mes) => (
                  <div className="bar-row" key={mes.data_referencia_doc}>
                    <span>{monthLabel(mes.data_referencia_doc)}</span>
                    <div className="bar-track">
                      <i style={{ width: `${barWidth(toNumber(mes.receita_arrecadada_no_mes), totais.max)}` }} />
                      <b style={{ width: `${barWidth(toNumber(mes.despesa_paga_no_mes), totais.max)}` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <strong>Sem execucao importada para {anoAtivo}</strong>
                <span>Use Verificar ou Sincronizar grupo para carregar dados deste exercicio.</span>
              </div>
            )}
          </article>

          <article className="panel logs-panel">
            <div className="section-title">
              <div>
                <span className="eyebrow">Auditoria</span>
                <h2>Logs recentes</h2>
              </div>
              <span className="badge">{logs.length} eventos</span>
            </div>

            <div className="log-table">
              {logs.map((log) => (
                <div className="log-row" key={`${log.endpoint}-${log.started_at}`}>
                  <span>{log.endpoint}</span>
                  <strong>{log.data_referencia_doc ?? "anual"}</strong>
                  <em>{formatInt(log.rows_received ?? 0)} linhas</em>
                  <b>{log.status}</b>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail
}: Readonly<{ icon: ReactNode; label: string; value: string; detail: string }>) {
  return (
    <article className="metric-card">
      <div>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

async function loadMonitorados(): Promise<Monitorado[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("tce_municipio_exercicios_monitorados")
    .select("codigo_municipio,ano,exercicio_orcamento,ativo,sincronizacao_automatica")
    .eq("ativo", true)
    .order("codigo_municipio", { ascending: true })
    .order("ano", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Array<Omit<Monitorado, "nome_municipio">>;
  const municipios = await loadMunicipiosDisponiveis();
  const nameByCode = new Map(municipios.map((item) => [item.codigo_municipio, item.nome_municipio]));

  return rows.map((row) => ({
    ...row,
    nome_municipio: nameByCode.get(row.codigo_municipio) ?? row.codigo_municipio
  }));
}

async function loadMunicipiosDisponiveis(): Promise<Municipio[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("municipios")
    .select("codigo_municipio,nome_municipio")
    .order("nome_municipio", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Municipio[];
}

async function loadImportResumo(codigoMunicipio: string, exercicio: string): Promise<ImportResumo[]> {
  const supabase = createSupabaseAdminClient();
  const [
    municipiosResult,
    funcoesResult,
    tiposUnidadesResult,
    orgaosResult,
    unidadesResult,
    unidadesGestorasResult,
    ordenadoresResult,
    contasResult,
    dadosOrcamentosResult,
    programasResult,
    receitasOrcamentoResult,
    despesasOrcamentoResult,
    projetosResult,
    elementosResult,
    balReceitasResult,
    balDespesasResult,
    balReceitasExtraResult,
    balDespesasExtraResult
  ] = await Promise.all([
    countAll("municipios"),
    countAll("tce_funcoes"),
    countAll("tce_tipos_unidades_administrativas"),
    countScoped("tce_orgaos"),
    countScoped("tce_unidades_orcamentarias"),
    countScoped("tce_unidades_gestoras"),
    countScoped("tce_ordenadores_despesas"),
    countScoped("tce_contas_bancarias_municipio"),
    countScoped("tce_dados_orcamentos"),
    countScoped("tce_programas_governo"),
    countScoped("tce_orcamentos_receitas"),
    countScoped("tce_orcamentos_despesas"),
    countScoped("tce_orcamentos_despesas_projetos_atividades"),
    countScoped("tce_elementos_despesas_projetos_atividades"),
    countScoped("tce_balancetes_receitas_orcamentarias"),
    countScoped("tce_balancetes_despesas_orcamentarias"),
    countScoped("tce_balancetes_receitas_extra_orcamentarias"),
    countScoped("tce_balancetes_despesas_extra_orcamentarias")
  ]);

  const auxiliares = sumCounts(municipiosResult, funcoesResult, tiposUnidadesResult);
  const bas = sumCounts(orgaosResult, unidadesResult, unidadesGestorasResult, ordenadoresResult, contasResult);
  const orc = sumCounts(
    dadosOrcamentosResult,
    programasResult,
    receitasOrcamentoResult,
    despesasOrcamentoResult,
    projetosResult,
    elementosResult
  );
  const bal = sumCounts(balReceitasResult, balDespesasResult, balReceitasExtraResult, balDespesasExtraResult);

  return [
    { slug: "auxiliares", nome: "Auxiliares", registros: auxiliares, tabelas: 3, detalhe: "municipios, funcoes e tipos de unidades" },
    { slug: "bas", nome: "BAS", registros: bas, tabelas: 5, detalhe: "orgaos, unidades, gestores de despesa e contas" },
    { slug: "orc", nome: "ORC", registros: orc, tabelas: 6, detalhe: "orcamento, programas, projetos e elementos" },
    { slug: "bal", nome: "BAL", registros: bal, tabelas: 4, detalhe: "balancetes normalizados no banco" }
  ];

  function countAll(table: string) {
    return supabase.from(table).select("*", { count: "exact", head: true });
  }

  function countScoped(table: string) {
    return supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("codigo_municipio", codigoMunicipio)
      .eq("exercicio_orcamento", exercicio);
  }
}


function sumCounts(...results: Array<{ count: number | null }>): number {
  return results.reduce((sum, result) => sum + (result.count ?? 0), 0);
}

function aggregateExecucaoMensal(rows: ExecucaoMensal[]): ExecucaoMensal[] {
  const byMonth = new Map<string, ExecucaoMensal>();

  for (const row of rows) {
    const current = byMonth.get(row.data_referencia_doc);

    if (!current) {
      byMonth.set(row.data_referencia_doc, {
        data_referencia_doc: row.data_referencia_doc,
        receita_arrecadada_no_mes: toNumber(row.receita_arrecadada_no_mes),
        despesa_empenhada_no_mes: toNumber(row.despesa_empenhada_no_mes),
        despesa_liquidada_no_mes: toNumber(row.despesa_liquidada_no_mes),
        despesa_paga_no_mes: toNumber(row.despesa_paga_no_mes)
      });
      continue;
    }

    current.receita_arrecadada_no_mes = toNumber(current.receita_arrecadada_no_mes) + toNumber(row.receita_arrecadada_no_mes);
    current.despesa_empenhada_no_mes = toNumber(current.despesa_empenhada_no_mes) + toNumber(row.despesa_empenhada_no_mes);
    current.despesa_liquidada_no_mes = toNumber(current.despesa_liquidada_no_mes) + toNumber(row.despesa_liquidada_no_mes);
    current.despesa_paga_no_mes = toNumber(current.despesa_paga_no_mes) + toNumber(row.despesa_paga_no_mes);
  }

  return [...byMonth.values()].sort((a, b) => a.data_referencia_doc.localeCompare(b.data_referencia_doc));
}

function buildTotals(rows: ExecucaoMensal[]) {
  const receita = rows.reduce((sum, row) => sum + toNumber(row.receita_arrecadada_no_mes), 0);
  const pago = rows.reduce((sum, row) => sum + toNumber(row.despesa_paga_no_mes), 0);
  const max = Math.max(
    1,
    ...rows.flatMap((row) => [toNumber(row.receita_arrecadada_no_mes), toNumber(row.despesa_paga_no_mes)])
  );

  return { receita, pago, max };
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatInt(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function monthLabel(dataReferencia: string): string {
  const month = Number(dataReferencia.slice(4, 6));
  return ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][month - 1] ?? dataReferencia;
}

function barWidth(value: number, max: number): string {
  return `${Math.max(3, Math.round((value / max) * 100))}%`;
}

function formatFrequency(value: string): string {
  const labels: Record<string, string> = {
    uma_vez: "unica",
    anual: "anual",
    mensal: "mensal",
    evento: "evento",
    manual: "manual"
  };

  return labels[value] ?? value;
}

function formatStatus(item: EndpointStatus): string {
  if (item.ultimo_status === "sem_log") {
    return "pendente";
  }

  if (item.frequencia === "mensal") {
    return `${item.ultimo_status} ${item.ultima_competencia}`;
  }

  return item.ultimo_status;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
