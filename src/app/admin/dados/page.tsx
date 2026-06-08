import { AlertCircle, CheckCircle2, DatabaseZap } from "lucide-react";
import { AdminDataOperations } from "../AdminDataOperations.js";
import { AdminGroupStatusTable } from "../AdminGroupStatusTable.js";
import { AdminShell } from "../AdminShell.js";
import { formatInt, groupOperationalRows, loadAdminData } from "../admin-data.js";

export const dynamic = "force-dynamic";

export default async function AdminDadosPage() {
  const data = await loadAdminData();
  const rows = groupOperationalRows(data);
  const totalEndpoints = rows.reduce((sum, row) => sum + row.endpoints, 0);
  const totalAutomaticos = rows.reduce((sum, row) => sum + row.automaticos, 0);
  const totalErros = rows.reduce((sum, row) => sum + row.errors, 0);
  const totalRegistros = rows.reduce((sum, row) => sum + row.registros, 0);

  return (
    <AdminShell
      active="dados"
      title="Controle dos dados"
      subtitle="Uma tela unica para escolher o municipio, executar a carga e revisar o status dos grupos."
      logs={data.logs}
    >
      <AdminDataOperations
        scopes={data.monitorados.map((item) => ({
          codigo_municipio: item.codigo_municipio,
          nome_municipio: item.nome_municipio,
          ano: item.ano,
          exercicio_orcamento: item.exercicio_orcamento
        }))}
        groups={data.grupos.map((group) => ({ slug: group.slug, nome: group.nome }))}
      />

      <section className="admin-data-summary compact">
        <article className="admin-data-card">
          <span>Grupos</span>
          <strong>{formatInt(totalEndpoints)}</strong>
          <p>{formatInt(totalAutomaticos)} automáticos</p>
        </article>
        <article className="admin-data-card">
          <span>Registros</span>
          <strong>{formatInt(totalRegistros)}</strong>
          <p>Últimas cargas processadas</p>
        </article>
        <article className={`admin-data-card ${totalErros > 0 ? "attention" : "ready"}`}>
          <span>Status</span>
          <strong>{totalErros > 0 ? `${formatInt(totalErros)} erros` : "Ok"}</strong>
          <p>{totalErros > 0 ? "Reprocessar primeiro" : "Sem erros abertos"}</p>
        </article>
      </section>

      <section className="admin-panel admin-table-panel">
        <div className="admin-panel-title">
          <div>
            <span>Detalhamento</span>
            <h2>Controle por grupo</h2>
          </div>
          {totalErros > 0 ? <AlertCircle size={21} /> : <CheckCircle2 size={21} />}
        </div>

        <AdminGroupStatusTable rows={rows} />
      </section>

      <section className="admin-panel admin-data-note">
        <div className="admin-panel-title compact">
          <div>
            <span>Fluxo curto</span>
            <h2>O que fazer agora</h2>
          </div>
          <DatabaseZap size={21} />
        </div>
        <div className="admin-data-note-list">
          <div>
            <strong>1. Escolha o municipio/ano</strong>
            <span>Use Aracati 2024 ou Aracati 2025 como teste.</span>
          </div>
          <div>
            <strong>2. Rode verificar ou atualizar</strong>
            <span>Se houver erro, tente reprocessar antes de outra carga.</span>
          </div>
          <div>
            <strong>3. Confira o resultado na tabela</strong>
            <span>Veja quais grupos estão ok, pendentes ou sem log.</span>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
