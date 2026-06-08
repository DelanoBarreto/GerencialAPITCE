import {
  BookOpen,
  Building2,
  CircleHelp,
  Clock3,
  Database,
  FileClock,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Shield,
  Users
} from "lucide-react";
import type { ReactNode } from "react";
import type { AdminSyncLog } from "./admin-data.js";
import { relativeTime } from "./admin-data.js";

type AdminShellProps = {
  active: "dashboard" | "municipios" | "clientes" | "dados" | "logs";
  title: string;
  subtitle: string;
  status?: string;
  logs: AdminSyncLog[];
  children: ReactNode;
};

const navItems = [
  { id: "dashboard", href: "/admin", label: "Painel", icon: LayoutDashboard },
  { id: "municipios", href: "/admin/municipios", label: "Municipios", icon: Building2 },
  { id: "clientes", href: "/admin/clientes", label: "Clientes", icon: Users },
  { id: "dados", href: "/admin/dados", label: "Controle de dados", icon: Database },
  { id: "logs", href: "/admin/logs", label: "Logs", icon: FileClock }
] as const;

export function AdminShell({ active, title, subtitle, status = "Sistema operacional", logs, children }: AdminShellProps) {
  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <a className="admin-logo" href="/admin">
          <Database size={22} />
          <strong>APITCE Admin</strong>
        </a>
        <nav className="admin-topnav" aria-label="Atalhos administrativos">
          <a className={active === "dashboard" ? "active" : ""} href="/admin">
            Dashboard
          </a>
          <a className={active === "dados" ? "active" : ""} href="/admin/dados">
            Dados
          </a>
          <a className={active === "municipios" ? "active" : ""} href="/admin/municipios">
            Municipios
          </a>
        </nav>
        <div className="admin-top-actions">
          <span className="admin-system-pill">
            <i />
            {status}
          </span>
          <a className="admin-sync-button admin-link-button" href="/admin/dados">
            <RefreshCw size={18} />
            Atualizar dados
          </a>
          <div className="admin-avatar" aria-label="Administrador">
            DB
          </div>
        </div>
      </header>

      <aside className="admin-sidebar">
        <section className="admin-operator">
          <div className="admin-operator-mark">
            <Shield size={22} />
          </div>
          <div>
            <strong>Administracao</strong>
            <span>Gestao operacional</span>
          </div>
        </section>

        <nav className="admin-sidenav" aria-label="Area administrativa">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a className={active === item.id ? "active" : ""} href={item.href} key={item.id}>
                <Icon size={20} />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <a className="admin-outline-button admin-link-button" href="/admin/municipios">
            + Novo municipio
          </a>
          <a href="/docs">
            <BookOpen size={17} />
            Documentacao
          </a>
          <a href="mailto:suporte@apitce.local">
            <CircleHelp size={17} />
            Suporte
          </a>
          <a href="/admin">
            <LogOut size={17} />
            Sair
          </a>
        </div>
      </aside>

      <section className="admin-main">
        <div className="admin-page-heading">
          <div>
            <span>Operacao interna</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>
        <nav className="admin-workflow" aria-label="Fluxo principal do administrador">
          <a className={active === "municipios" ? "active" : ""} href="/admin/municipios">
            <Building2 size={18} />
            <span>
              <strong>1. Cadastrar municipio/ano</strong>
              <small>Exemplo: Aracati 2025</small>
            </span>
          </a>
          <a className={active === "dados" ? "active" : ""} href="/admin/dados">
            <Database size={18} />
            <span>
              <strong>2. Baixar ou atualizar dados</strong>
              <small>Escolha o grupo e execute a carga</small>
            </span>
          </a>
          <a className={active === "logs" ? "active" : ""} href="/admin/logs">
            <FileClock size={18} />
            <span>
              <strong>3. Conferir logs</strong>
              <small>Veja sucesso, erro e registros</small>
            </span>
          </a>
        </nav>
        {children}
      </section>

      <aside className="admin-live">
        <div className="admin-live-header">
          <span>
            <i />
            Atividades recentes
          </span>
          <Clock3 size={18} />
        </div>
        <div className="admin-live-list">
          {(logs.length > 0 ? logs.slice(0, 12) : fallbackLiveLogs).map((log, index) => (
            <article className={`admin-live-item ${log.status === "error" ? "error" : log.status === "ok" ? "ok" : "warn"}`} key={`${log.endpoint}-${log.started_at}-${index}`}>
              <div>
                <strong>{log.status === "error" ? "SYNC_ERROR" : log.status === "ok" ? "SYNC_OK" : "SYNC_INFO"}</strong>
                <span>{relativeTime(log.started_at)}</span>
              </div>
              <p>
                {log.endpoint}
                {log.codigo_municipio ? ` / ${log.codigo_municipio}` : ""}
                {log.data_referencia_doc ? ` / ${log.data_referencia_doc}` : ""}
              </p>
              <code>
                {JSON.stringify({
                  status: log.status,
                  rows: log.rows_received ?? 0,
                  error: log.error_message ?? undefined
                })}
              </code>
            </article>
          ))}
        </div>
      </aside>
    </main>
  );
}

const fallbackLiveLogs: AdminSyncLog[] = [
  {
    endpoint: "balancetes_receitas_orcamentarias",
    codigo_municipio: "014",
    exercicio_orcamento: "202500",
    data_referencia_doc: "202504",
    rows_received: 4847,
    status: "ok",
    error_message: null,
    started_at: new Date(Date.now() - 8 * 60_000).toISOString(),
    finished_at: new Date(Date.now() - 6 * 60_000).toISOString()
  },
  {
    endpoint: "balancetes_despesas_orcamentarias",
    codigo_municipio: "061",
    exercicio_orcamento: "202500",
    data_referencia_doc: "202505",
    rows_received: 0,
    status: "error",
    error_message: "Falha de paginacao na competencia",
    started_at: new Date(Date.now() - 42 * 60_000).toISOString(),
    finished_at: new Date(Date.now() - 38 * 60_000).toISOString()
  }
];
