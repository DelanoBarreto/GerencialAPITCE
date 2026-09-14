import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Database,
  FileClock,
  MessageSquare,
  Users
} from "lucide-react";
import { AdminScopeStatusTable } from "./AdminScopeStatusTable.js";
import { AdminShell } from "./AdminShell.js";
import { formatInt, loadAdminData } from "./admin-data.js";
import type { AdminScopeRow } from "./admin-data.js";
import { formatPeriodoCompetencias } from "../../lib/formatters.js";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await loadAdminData();
  const currentScope = data.scopeRows.find((row) => row.ultimoMes !== "--") ?? data.scopeRows[0];
  const referenceStart = currentScope ? `${currentScope.ano}01` : undefined;
  const latestReference =
    currentScope?.ultimoMes && currentScope.ultimoMes !== "--"
      ? monthLabelToCompetencia(currentScope.ultimoMes)
      : undefined;
  const periodLabel = formatPeriodoCompetencias(
    referenceStart,
    latestReference ?? `${currentScope?.ano ?? new Date().getFullYear()}12`
  );

  const readyScopes = data.scopeRows.filter((row) => row.status === "ok" || row.status === "parcial").length;
  const coverage = data.scopeRows.length > 0 ? Math.round((readyScopes / data.scopeRows.length) * 100) : 0;

  const escoposComFalha = data.scopeRows.filter((row) => row.status === "erro");
  const escoposPendentes = data.scopeRows.filter((row) => row.status === "pendente");
  const logsComErro = dedupePorEndpoint(data.logs.filter((log) => log.status === "error")).slice(0, 4);
  const semPendencia =
    escoposComFalha.length === 0 && escoposPendentes.length === 0 && logsComErro.length === 0;

  return (
    <AdminShell
      active="dashboard"
      title="Painel operacional"
      subtitle="O que precisa de atenção agora e o que já está carregado na base."
      periodLabel={periodLabel}
      scopeLabel={currentScope ? `${currentScope.municipio} · ${currentScope.ano}` : "Sem escopo monitorado"}
      logs={data.logs}
    >
      <section className="admin-panel" aria-labelledby="secao-atencao">
        <div className="admin-panel-title">
          <div>
            <span>Fila de trabalho</span>
            <h2 id="secao-atencao">Precisa de atenção</h2>
          </div>
          <a className="admin-primary-link" href="/admin/dados">
            <Database size={16} /> Atualizar dados
          </a>
        </div>

        {semPendencia ? (
          <div className="admin-empty">
            <CheckCircle2 size={18} />
            <strong>Nenhuma pendência aberta.</strong>
            <span>Todos os escopos monitorados estão carregados e sem falhas registradas.</span>
          </div>
        ) : (
          <>
            {escoposComFalha.map((row) => (
              <PendenciaItem
                key={`erro-${row.codigo}-${row.ano}`}
                tone="erro"
                titulo={`${row.municipio} · ${row.ano} com falha na carga`}
                detalhe={`Última tentativa ${row.ultimaSync}. Reexecute o grupo para completar o exercício.`}
                acao="Reexecutar carga"
                href="/admin/dados"
              />
            ))}

            {escoposPendentes.map((row) => (
              <PendenciaItem
                key={`pendente-${row.codigo}-${row.ano}`}
                tone="pendente"
                titulo={`${row.municipio} · ${row.ano} sem dados carregados`}
                detalhe="Escopo monitorado, mas nenhuma competência foi baixada até agora."
                acao="Baixar dados"
                href="/admin/dados"
              />
            ))}

            {logsComErro.map((log, index) => (
              <PendenciaItem
                key={`log-${log.endpoint}-${log.started_at}-${index}`}
                tone="erro"
                titulo={`Falha em ${log.endpoint}`}
                detalhe={
                  mensagemUtil(log.error_message) ??
                  `Município ${log.codigo_municipio ?? "não informado"}, competência ${log.data_referencia_doc ?? "não informada"}.`
                }
                acao="Ver log"
                href="/admin/logs"
              />
            ))}
          </>
        )}
      </section>

      <section aria-labelledby="secao-cobertura">
        <div className="ap-section-head">
          <h2 id="secao-cobertura">Cobertura</h2>
          <small>
            {readyScopes} de {data.scopeRows.length} escopos com dados · {coverage}% de cobertura
          </small>
        </div>

        <div className="admin-kpi-grid">
          <AdminKpi
            icon={<Building2 size={20} />}
            label="Municípios ativos"
            value={formatInt(data.kpis.municipiosAtivos)}
            detail="escopos monitorados"
            tone="teal"
          />
          <AdminKpi
            icon={<Users size={20} />}
            label="Clientes ativos"
            value={formatInt(data.kpis.clientesAtivos)}
            detail="com liberação em andamento"
            tone="teal"
          />
          <AdminKpi
            icon={<CheckCircle2 size={20} />}
            label="Atualizações 24h"
            value={formatInt(data.kpis.syncs24h)}
            detail={`${formatInt(data.kpis.registros24h)} registros`}
            tone="teal"
          />
          <AdminKpi
            icon={<MessageSquare size={20} />}
            label="Falhas abertas"
            value={formatInt(data.kpis.falhas)}
            detail={`${formatInt(data.kpis.alertas)} alertas operacionais`}
            tone={data.kpis.falhas > 0 ? "red" : "teal"}
          />
        </div>

        <article className="admin-panel admin-table-panel">
          <div className="admin-panel-title">
            <div>
              <span>Base carregada</span>
              <h2>Status por município</h2>
            </div>
            <a className="admin-link-button" href="/admin/municipios">
              <FileClock size={15} /> Ver municípios
            </a>
          </div>
          <AdminScopeStatusTable rows={data.scopeRows} />
        </article>
      </section>
    </AdminShell>
  );
}

function PendenciaItem({
  tone,
  titulo,
  detalhe,
  acao,
  href
}: Readonly<{
  tone: "erro" | "pendente";
  titulo: string;
  detalhe: string;
  acao: string;
  href: string;
}>) {
  return (
    <div className={tone === "erro" ? "admin-attention-item is-error" : "admin-attention-item"}>
      <div>
        <strong>{titulo}</strong>
        <small>{detalhe}</small>
      </div>
      <a className="admin-attention-action" href={href}>
        {acao}
      </a>
    </div>
  );
}

function AdminKpi({
  icon,
  label,
  value,
  detail,
  tone
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "teal" | "amber" | "red";
}>) {
  return (
    <article className={`admin-kpi ${tone}`}>
      <div>
        <span>{label}</span>
        {icon}
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

// Registros antigos gravaram "[object Object]" antes da correcao em sync-runner.
function mensagemUtil(mensagem: string | null) {
  if (!mensagem) return undefined;
  const limpa = mensagem.trim();
  if (!limpa || limpa === "[object Object]") return undefined;
  return limpa;
}

function dedupePorEndpoint<T extends { endpoint: string; codigo_municipio: string | null }>(logs: T[]) {
  const vistos = new Set<string>();
  return logs.filter((log) => {
    const chave = `${log.endpoint}::${log.codigo_municipio ?? ""}`;
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

function monthLabelToCompetencia(value: string) {
  const [month, year] = value.split("/");
  const monthIndex = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"].indexOf(
    month ?? ""
  );

  if (!year || monthIndex < 0) return undefined;
  return `${year}${String(monthIndex + 1).padStart(2, "0")}`;
}
