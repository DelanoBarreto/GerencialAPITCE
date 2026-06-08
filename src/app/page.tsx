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
import { Suspense } from "react";
import { EndpointTable } from "./EndpointTable.js";
import { MonitorPanel } from "./MonitorPanel.js";
import { OperationPanel } from "./OperationPanel.js";

// Queries
import { loadMunicipios, loadMonitorados, loadGrupos } from "../lib/queries/municipios.js";
import { loadImportResumo, loadExecucaoMensal } from "../lib/queries/dashboard.js";
import { loadSyncLogs, loadEndpointStatus, countErrors, countContasBancarias } from "../lib/queries/sync.js";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const requestedMunicipio = firstParam(params.municipio);
  const requestedAno = Number(firstParam(params.ano));

  // O carregamento do shell é super rápido graças ao cache nos monitorados
  const [monitorados, municipiosDisponiveis, grupos] = await Promise.all([
    loadMonitorados(),
    loadMunicipios(),
    loadGrupos()
  ]);

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

  const municipioCodigo = selectedMonitorado.codigo_municipio;
  const municipioNome = selectedMonitorado.nome_municipio;
  const anoAtivo = selectedMonitorado.ano ?? 2025;
  const exercicio = selectedMonitorado.exercicio_orcamento ?? "202500";

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
            <span>{municipioNome}</span>
            <strong>{anoAtivo}</strong>
          </div>
        </header>

        <section className="hero-grid" id="operacao">
          <article className="summary-panel">
            <div className="panel-heading">
              <span>Escopo ativo</span>
              <strong>{municipioCodigo} / {exercicio}</strong>
            </div>
            <OperationPanel
              municipioCodigo={municipioCodigo}
              municipioNome={municipioNome}
              ano={Number(anoAtivo)}
              grupos={grupos.map((g) => ({ slug: g.slug, nome: g.nome }))}
            />
          </article>

          <Suspense fallback={<div className="status-grid skeleton">Carregando métricas...</div>}>
            <TopMetrics codigoMunicipio={municipioCodigo} exercicio={exercicio} />
          </Suspense>
        </section>

        <section className="monitor-band" id="monitoramento">
          <MonitorPanel
            municipios={municipiosDisponiveis}
            monitorados={monitorados}
            selectedCodigo={municipioCodigo}
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
                const resumo = getGrupoResumo(grupo.slug);
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

          <Suspense fallback={<div className="panel import-panel skeleton">Carregando importação...</div>}>
            <ImportSummarySection codigoMunicipio={municipioCodigo} exercicio={exercicio} />
          </Suspense>
        </section>

        <Suspense fallback={<div className="panel endpoint-panel skeleton">Carregando endpoints...</div>}>
          <EndpointsSection codigoMunicipio={municipioCodigo} exercicio={exercicio} anoAtivo={anoAtivo} />
        </Suspense>

        <section className="dashboard-grid" id="dashboard">
          <Suspense fallback={<div className="panel chart-panel skeleton">Carregando gráfico...</div>}>
            <DashboardChartSection codigoMunicipio={municipioCodigo} exercicio={exercicio} anoAtivo={anoAtivo} />
          </Suspense>

          <Suspense fallback={<div className="panel logs-panel skeleton">Carregando logs...</div>}>
            <LogsSection codigoMunicipio={municipioCodigo} exercicio={exercicio} />
          </Suspense>
        </section>
      </section>
    </main>
  );
}

// ============================================================================
// Server Components Extraídos para Suspense
// ============================================================================

async function TopMetrics({ codigoMunicipio, exercicio }: { codigoMunicipio: string; exercicio: string }) {
  const [importResumo, execucao, contasCount, errorsCount] = await Promise.all([
    loadImportResumo(codigoMunicipio, exercicio),
    loadExecucaoMensal(codigoMunicipio, exercicio),
    countContasBancarias(codigoMunicipio, exercicio),
    countErrors(codigoMunicipio, exercicio)
  ]);

  const totalImportado = importResumo.reduce((sum, item) => sum + item.registros, 0);
  const totalTabelas = importResumo.reduce((sum, item) => sum + item.tabelas, 0);
  const ultimoMes = execucao.at(-1);

  return (
    <div className="status-grid">
      <MetricCard icon={<CalendarDays size={20} />} label="Registros importados" value={formatInt(totalImportado)} detail={`${totalTabelas} tabelas controladas`} />
      <MetricCard icon={<CheckCircle2 size={20} />} label="Contas bancarias" value={formatInt(contasCount)} detail="carga por orgao" />
      <MetricCard icon={<Clock3 size={20} />} label="Pendencias" value={formatInt(errorsCount)} detail="erros registrados" />
      <MetricCard icon={<CircleDollarSign size={20} />} label="Receita no ultimo mes" value={formatMoney(ultimoMes?.receita_arrecadada_no_mes ?? 0)} detail="base dashboard" />
    </div>
  );
}

async function ImportSummarySection({ codigoMunicipio, exercicio }: { codigoMunicipio: string; exercicio: string }) {
  const importResumo = await loadImportResumo(codigoMunicipio, exercicio);
  const totalImportado = importResumo.reduce((sum, item) => sum + item.registros, 0);

  return (
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
  );
}

async function EndpointsSection({ codigoMunicipio, exercicio, anoAtivo }: { codigoMunicipio: string; exercicio: string; anoAtivo: number }) {
  const endpointStatus = await loadEndpointStatus(codigoMunicipio, exercicio);

  return (
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
          codigoMunicipio={codigoMunicipio}
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
  );
}

async function DashboardChartSection({ codigoMunicipio, exercicio, anoAtivo }: { codigoMunicipio: string; exercicio: string; anoAtivo: number }) {
  const execucao = await loadExecucaoMensal(codigoMunicipio, exercicio);
  const totais = buildTotals(execucao);

  return (
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
                <i style={{ width: `${barWidth(mes.receita_arrecadada_no_mes, totais.max)}` }} />
                <b style={{ width: `${barWidth(mes.despesa_paga_no_mes, totais.max)}` }} />
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
  );
}

async function LogsSection({ codigoMunicipio, exercicio }: { codigoMunicipio: string; exercicio: string }) {
  const logs = await loadSyncLogs(codigoMunicipio, exercicio);

  return (
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
  );
}

// ============================================================================
// Utils
// ============================================================================

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

function getGrupoResumo(slug: string) {
  const resumos: Record<string, { status: string; detalhe: string }> = {
    auxiliares: { status: "Atualizado", detalhe: "Cadastros globais carregados" },
    bas: { status: "Atualizado", detalhe: "Referencias e contas por orgao" },
    orc: { status: "Atualizado", detalhe: "Orcamento anual validado" },
    bal: { status: "Atualizado", detalhe: "12 competencias carregadas" }
  };
  return resumos[slug] ?? { status: "Pendente", detalhe: "Aguardando normalizacao" };
}

function buildTotals(rows: any[]) {
  const receita = rows.reduce((sum, row) => sum + row.receita_arrecadada_no_mes, 0);
  const pago = rows.reduce((sum, row) => sum + row.despesa_paga_no_mes, 0);
  const max = Math.max(1, ...rows.flatMap((row) => [row.receita_arrecadada_no_mes, row.despesa_paga_no_mes]));
  return { receita, pago, max };
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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
  const labels: Record<string, string> = { uma_vez: "unica", anual: "anual", mensal: "mensal", evento: "evento", manual: "manual" };
  return labels[value] ?? value;
}

function formatStatus(item: any): string {
  if (item.ultimo_status === "sem_log") return "pendente";
  if (item.frequencia === "mensal") return `${item.ultimo_status} ${item.ultima_competencia}`;
  return item.ultimo_status;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
