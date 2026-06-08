import { CalendarDays, Plus } from "lucide-react";
import { AdminMonitorRegistration } from "../AdminMonitorRegistration.js";
import { AdminScopeCards } from "../AdminScopeCards.js";
import { AdminShell } from "../AdminShell.js";
import { formatInt, loadAdminData, monthStatusFor } from "../admin-data.js";

export const dynamic = "force-dynamic";

export default async function AdminMunicipiosPage() {
  const data = await loadAdminData();
  const defaultMunicipio = data.municipios.find((municipio) => municipio.codigo_municipio === "014") ?? data.municipios[0];
  const scopes = data.monitorados.map((scope) => ({
    ...scope,
    months: monthStatusFor(scope, data.logs)
  }));

  return (
    <AdminShell
      active="municipios"
      title="Municipios e exercicios"
      subtitle="Cadastro e acompanhamento dos escopos contratados para carga automatica."
      logs={data.logs}
    >
      <section className="admin-two-column">
        <article className="admin-panel">
          <div className="admin-panel-title">
            <div>
              <span>Novo escopo</span>
              <h2>Cadastrar municipio + ano</h2>
            </div>
            <Plus size={20} />
          </div>
          <AdminMonitorRegistration municipios={data.municipios} defaultCodigo={defaultMunicipio?.codigo_municipio ?? "014"} />
        </article>

        <article className="admin-panel">
          <div className="admin-panel-title">
            <div>
              <span>Resumo</span>
              <h2>Escopos acompanhados</h2>
            </div>
            <CalendarDays size={20} />
          </div>
          <div className="admin-mini-stats">
            <div>
              <strong>{formatInt(data.monitorados.length)}</strong>
              <span>municipio/ano</span>
            </div>
            <div>
              <strong>{formatInt(data.monitorados.filter((item) => item.sincronizacao_automatica).length)}</strong>
              <span>automaticos</span>
            </div>
            <div>
              <strong>{formatInt(data.scopeRows.filter((item) => item.status === "erro").length)}</strong>
              <span>com erro</span>
            </div>
          </div>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-title">
          <div>
            <span>Disponibilidade mensal</span>
            <h2>Meses por municipio</h2>
          </div>
        </div>
        <AdminScopeCards scopes={scopes} />
      </section>
    </AdminShell>
  );
}
