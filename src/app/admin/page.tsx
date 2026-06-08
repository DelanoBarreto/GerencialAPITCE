import { AlertTriangle, Building2, CheckCircle2, MessageSquare, Users } from "lucide-react";
import { AdminScopeStatusTable } from "./AdminScopeStatusTable.js";
import { AdminShell } from "./AdminShell.js";
import { formatInt, loadAdminData } from "./admin-data.js";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await loadAdminData();

  return (
    <AdminShell
      active="dashboard"
      title="Visao geral do sistema"
      subtitle="Acompanhe municipios, exercicios contratados e atualizacoes de dados em um so lugar."
      logs={data.logs}
    >
      <section className="admin-kpi-grid">
        <AdminKpi icon={<Building2 size={22} />} label="Municipios ativos" value={formatInt(data.kpis.municipiosAtivos)} detail="escopos monitorados" tone="teal" />
        <AdminKpi icon={<Users size={22} />} label="Clientes ativos" value={formatInt(data.kpis.clientesAtivos)} detail="mock comercial inicial" tone="amber" />
        <AdminKpi icon={<CheckCircle2 size={22} />} label="Atualizacoes 24h" value={formatInt(data.kpis.syncs24h)} detail={`${formatInt(data.kpis.registros24h)} registros`} tone="teal" />
        <AdminKpi icon={<MessageSquare size={22} />} label="Alertas enviados" value={formatInt(data.kpis.alertas)} detail={`${formatInt(data.kpis.falhas)} falhas em aberto`} tone={data.kpis.falhas > 0 ? "red" : "amber"} />
      </section>

      <section className="admin-content-grid">
        <article className="admin-panel admin-table-panel">
          <div className="admin-panel-title">
            <div>
              <span>Status operacional</span>
              <h2>Status por municipio</h2>
            </div>
          </div>
          <AdminScopeStatusTable rows={data.scopeRows} />
        </article>

        <article className="admin-panel">
          <div className="admin-panel-title">
            <div>
              <span>Fila operacional</span>
              <h2>Ultimas atividades</h2>
            </div>
          </div>
          <div className="admin-activity-list">
            {data.logs.slice(0, 6).map((log, index) => (
              <div className={`admin-activity ${log.status === "error" ? "error" : log.status === "ok" ? "ok" : "warn"}`} key={`${log.endpoint}-${log.started_at}-${index}`}>
                <i />
                <div>
                  <strong>
                    {log.status === "error" ? "Erro" : "Carga concluida"} {log.codigo_municipio ?? "global"} {log.data_referencia_doc ?? ""}
                  </strong>
                  <span>
                    {log.endpoint} · {formatInt(log.rows_received ?? 0)} registros
                  </span>
                </div>
              </div>
            ))}
            {data.logs.length === 0 ? (
              <div className="admin-empty">
                <AlertTriangle size={18} />
                Nenhum log encontrado. A tela esta pronta para receber execucoes reais.
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}

function AdminKpi({
  icon,
  label,
  value,
  detail,
  tone
}: Readonly<{ icon: React.ReactNode; label: string; value: string; detail: string; tone: "teal" | "amber" | "red" }>) {
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
