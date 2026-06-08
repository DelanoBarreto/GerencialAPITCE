import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import { AdminLogFeed } from "../AdminLogFeed.js";
import { AdminShell } from "../AdminShell.js";
import { formatInt, loadAdminData, relativeTime } from "../admin-data.js";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const data = await loadAdminData();

  return (
    <AdminShell
      active="logs"
      title="Logs e auditoria"
      subtitle="Historico resumido de cargas, falhas, competencias e registros processados."
      logs={data.logs}
    >
      <section className="admin-kpi-grid compact">
        <article className="admin-kpi teal">
          <div>
            <span>Total de eventos</span>
            <Clock3 size={20} />
          </div>
          <strong>{formatInt(data.logs.length)}</strong>
          <small>ultimos registros consultados</small>
        </article>
        <article className="admin-kpi teal">
          <div>
            <span>Concluidos</span>
            <CheckCircle2 size={20} />
          </div>
          <strong>{formatInt(data.logs.filter((log) => log.status === "ok").length)}</strong>
          <small>status ok</small>
        </article>
        <article className="admin-kpi red">
          <div>
            <span>Com erro</span>
            <AlertTriangle size={20} />
          </div>
          <strong>{formatInt(data.logs.filter((log) => log.status === "error").length)}</strong>
          <small>precisam revisao</small>
        </article>
      </section>

      <section className="admin-panel admin-table-panel">
        <div className="admin-panel-title">
          <div>
            <span>Auditoria</span>
            <h2>Historico recente de sincronizacao</h2>
          </div>
        </div>
        <AdminLogFeed logs={data.logs} />
      </section>

      <section className="admin-panel">
        <div className="admin-panel-title compact">
          <div>
            <span>Leitura rapida</span>
            <h2>O que olhar primeiro</h2>
          </div>
        </div>
        <div className="admin-data-note-list">
          <div>
            <strong>Filtre por municipio ou endpoint</strong>
            <span>Use isso para chegar rapido em Aracati, BAS ou qualquer outra base.</span>
          </div>
          <div>
            <strong>Olhe o status mais recente</strong>
            <span>Ok, erro e pendente sao suficientes para a revisao diaria.</span>
          </div>
          <div>
            <strong>Abra os detalhes quando precisar</strong>
            <span>O historico inteiro continua no banco, mas a tela mostra o que importa agora.</span>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
