import { Info, MoreVertical, UserPlus } from "lucide-react";
import { AdminShell } from "../AdminShell.js";
import { loadAdminData } from "../admin-data.js";

export const dynamic = "force-dynamic";

export default async function AdminClientesPage() {
  const data = await loadAdminData();

  return (
    <AdminShell
      active="clientes"
      title="Clientes e contratos"
      subtitle="Gestao comercial inicial dos acessos por municipio e exercicio contratado."
      logs={data.logs}
    >
      <section className="admin-two-column">
        <article className="admin-panel">
          <div className="admin-panel-title">
            <div>
              <span>Cadastro comercial</span>
              <h2>Novo cliente</h2>
            </div>
            <UserPlus size={20} />
          </div>
          <div className="admin-form-grid">
            <label>
              Cliente
              <input placeholder="Nome do cliente ou escritorio" />
            </label>
            <label>
              Municipio / ano
              <select defaultValue="ARACATI-2025">
                {data.monitorados.map((item) => (
                  <option value={`${item.nome_municipio}-${item.ano}`} key={`${item.codigo_municipio}-${item.ano}`}>
                    {item.nome_municipio} - {item.ano}
                  </option>
                ))}
              </select>
            </label>
            <div className="admin-form-message pending">
              <Info size={16} />
              Cadastro comercial ainda está em mock. A carga real de dados fica em Controle de dados.
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-title">
            <div>
              <span>Status comercial</span>
              <h2>Fila de liberacao</h2>
            </div>
          </div>
          <div className="admin-release-grid">
            {["pendente", "carregando", "revisao", "disponivel", "suspenso"].map((status) => (
              <div key={status}>
                <strong>{data.clients.filter((client) => client.liberacao === status).length}</strong>
                <span>{status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-panel admin-table-panel">
        <div className="admin-panel-title">
          <div>
            <span>Contratos</span>
            <h2>Clientes vinculados a municipios</h2>
          </div>
        </div>
        <div className="admin-table">
          <div className="admin-table-head admin-client-grid">
            <span>Cliente</span>
            <span>Municipio</span>
            <span>Plano</span>
            <span>Pagamento</span>
            <span>Liberacao</span>
            <span>Acoes</span>
          </div>
          {data.clients.map((client) => (
            <div className="admin-table-row admin-client-grid" key={client.id}>
              <div>
                <strong>{client.nome}</strong>
                <small>{client.contato}</small>
              </div>
              <span>
                {client.municipio} / {client.ano}
              </span>
              <span>{client.plano}</span>
              <b className={`admin-status ${client.pagamento === "confirmado" ? "ok" : client.pagamento === "atrasado" ? "erro" : "pendente"}`}>
                {client.pagamento}
              </b>
              <b className={`admin-status ${client.liberacao === "disponivel" ? "ok" : client.liberacao === "suspenso" ? "erro" : client.liberacao === "revisao" ? "parcial" : "pendente"}`}>
                {client.liberacao}
              </b>
              <a className="admin-row-action admin-link-button" href="/admin/clientes" title="Detalhe comercial ainda em mock">
                <MoreVertical size={18} />
              </a>
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
