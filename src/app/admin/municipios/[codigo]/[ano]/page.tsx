import { AlertCircle, CalendarDays, CheckCircle2, DatabaseZap, FileClock, Layers3 } from "lucide-react";
import { AdminDataOperations } from "../../../AdminDataOperations.js";
import { AdminGroupCards } from "../../../AdminGroupCards.js";
import { AdminShell } from "../../../AdminShell.js";
import { formatInt, groupRowsForScope, loadAdminData, monthStatusFor, relativeTime } from "../../../admin-data.js";

export const dynamic = "force-dynamic";

type ScopeDetailPageProps = {
  params: Promise<{
    codigo: string;
    ano: string;
  }>;
};

export default async function ScopeDetailPage({ params }: ScopeDetailPageProps) {
  const { codigo, ano: anoParam } = await params;
  const ano = Number(anoParam);
  const data = await loadAdminData();
  const requestedScope = data.monitorados.find((item) => item.codigo_municipio === codigo && item.ano === ano);
  const municipalityName = data.municipios.find((item) => item.codigo_municipio === codigo)?.nome_municipio ?? `Municipio ${codigo}`;

  const scope =
    requestedScope ?? {
      codigo_municipio: codigo,
      nome_municipio: municipalityName,
      ano,
      exercicio_orcamento: `${ano}00`,
      ativo: false,
      sincronizacao_automatica: false
    };

  const scopeLogs = data.logs.filter(
    (log) => log.codigo_municipio === scope.codigo_municipio && log.exercicio_orcamento === scope.exercicio_orcamento
  );
  const groupRows = groupRowsForScope(data, scope.codigo_municipio, scope.exercicio_orcamento);
  const totalRegistros = scopeLogs.filter((log) => log.status === "ok").reduce((sum, log) => sum + (log.rows_received ?? 0), 0);
  const totalErros = scopeLogs.filter((log) => log.status === "error").length;
  const okMonths = new Set(scopeLogs.filter((log) => log.status === "ok").map((log) => log.data_referencia_doc).filter(Boolean));
  const ultimoLog = scopeLogs[0];

  return (
    <AdminShell
      active="municipios"
      title={`${scope.nome_municipio} ${scope.ano}`}
      subtitle="Painel operacional do municipio/ano: acompanhe meses, grupos, atualizacao e logs em um unico lugar."
      logs={data.logs}
    >
      {!requestedScope ? (
        <section className="admin-empty admin-scope-warning">
          <AlertCircle size={18} />
          Escopo nao cadastrado. Esta tela usa o ano solicitado, mas ainda nao existe monitoramento ativo para este municipio.
        </section>
      ) : null}

      <section className="admin-scope-hero">
        <article className="admin-scope-identity">
          <span>Escopo aberto</span>
          <h2>{scope.nome_municipio}</h2>
          <p>
            Codigo {scope.codigo_municipio} · Exercicio {scope.exercicio_orcamento} ·{" "}
            {scope.sincronizacao_automatica ? "Atualizacao automatica ativa" : "Atualizacao manual"}
          </p>
          <div>
            <a className="admin-sync-button admin-link-button" href="#atualizar-dados">
              <DatabaseZap size={17} />
              Atualizar dados
            </a>
            <a className="admin-dark-button admin-link-button" href="/admin/logs">
              <FileClock size={17} />
              Ver logs
            </a>
          </div>
        </article>

        <article className="admin-scope-kpis">
          <div>
            <strong>{formatInt(okMonths.size)}</strong>
            <span>meses com dados</span>
          </div>
          <div>
            <strong>{formatInt(totalRegistros)}</strong>
            <span>registros carregados</span>
          </div>
          <div className={totalErros > 0 ? "attention" : "ready"}>
            <strong>{totalErros > 0 ? formatInt(totalErros) : "Ok"}</strong>
            <span>{totalErros > 0 ? "erros" : "sem erro recente"}</span>
          </div>
        </article>
      </section>

      <AdminDataOperations
        scopes={[
          {
            codigo_municipio: scope.codigo_municipio,
            nome_municipio: scope.nome_municipio,
            ano: scope.ano,
            exercicio_orcamento: scope.exercicio_orcamento
          }
        ]}
        groups={data.grupos.map((group) => ({ slug: group.slug, nome: group.nome }))}
        testHint={`${scope.nome_municipio} ${scope.ano} + BAS`}
      />

      <section className="admin-scope-detail-grid">
        <article className="admin-panel">
          <div className="admin-panel-title compact">
            <div>
              <span>Disponibilidade mensal</span>
              <h2>Meses do exercicio</h2>
            </div>
            <CalendarDays size={21} />
          </div>
          <div className="admin-scope-months-wide">
            {monthStatusFor(scope, data.logs).map((month) => (
              <span className={`admin-month ${month.status}`} key={month.competencia}>
                {month.label}
              </span>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-title compact">
            <div>
              <span>Situacao atual</span>
              <h2>Ultima execucao</h2>
            </div>
            {totalErros > 0 ? <AlertCircle size={21} /> : <CheckCircle2 size={21} />}
          </div>
          <div className="admin-scope-last-run">
            <strong>{ultimoLog ? relativeTime(ultimoLog.started_at) : "sem carga"}</strong>
            <span>{ultimoLog ? `${ultimoLog.endpoint} · ${ultimoLog.data_referencia_doc ?? "anual"}` : "Nenhum log encontrado para este escopo."}</span>
            <b className={`admin-status ${ultimoLog?.status === "ok" ? "ok" : ultimoLog?.status === "error" ? "erro" : "pendente"}`}>
              {ultimoLog?.status ?? "pendente"}
            </b>
          </div>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-title compact">
          <div>
            <span>Grupos deste escopo</span>
            <h2>O que ja esta monitorado</h2>
          </div>
          <Layers3 size={21} />
        </div>
        <AdminGroupCards rows={groupRows} />
      </section>
    </AdminShell>
  );
}
