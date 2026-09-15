import {
  Building2,
  CircleHelp,
  Database,
  FileClock,
  LayoutDashboard,
  Smartphone,
  Users
} from "lucide-react";
import type { ReactNode } from "react";
import { DashboardShell, type ShellNavItem } from "../../components/shell/DashboardShell.js";
import type { AdminSyncLog } from "./admin-data.js";
import { relativeTime } from "./format-utils.js";

type AdminShellProps = {
  active: "dashboard" | "municipios" | "clientes" | "dados" | "logs";
  title: string;
  subtitle: string;
  status?: string;
  periodLabel?: string;
  scopeLabel?: string;
  hidePageChrome?: boolean;
  logs: AdminSyncLog[];
  children: ReactNode;
};

const navItems = [
  { id: "dashboard", href: "/admin", label: "Painel", icon: LayoutDashboard },
  { id: "municipios", href: "/admin/municipios", label: "Municípios", icon: Building2 },
  { id: "clientes", href: "/admin/clientes", label: "Clientes", icon: Users },
  { id: "dados", href: "/admin/dados", label: "Controle de dados", icon: Database },
  { id: "logs", href: "/admin/logs", label: "Logs", icon: FileClock }
] as const;

export function AdminShell({
  active,
  title,
  subtitle,
  status = "Sistema operacional",
  periodLabel = "Jan/2025 a última competência SIM",
  scopeLabel = "Contratos e amostras comerciais",
  hidePageChrome = false,
  logs,
  children
}: AdminShellProps) {
  const liveLogs = logs.length > 0 ? logs.slice(0, 8) : fallbackLiveLogs;
  const lastLog = liveLogs[0];

  const nav: ShellNavItem[] = navItems.map((item) => {
    const Icon = item.icon;
    return {
      href: item.href,
      label: item.label,
      icon: <Icon size={17} />,
      active: active === item.id
    };
  });

  return (
    <>
      <DashboardShell
        isAdmin
        brand="APITCE"
        brandMark="AP"
        nav={nav}
        title={title}
        subtitle={hidePageChrome ? undefined : subtitle}
        periodLabel={periodLabel}
        scope={{
          label: "Escopo atual",
          value: scopeLabel,
          detail: lastLog ? `Última execução ${relativeTime(lastLog.started_at)}` : "Sem carga registrada"
        }}
        aside={
          <>
            <a href="/admin/municipios">Cadastrar município</a>
            <a href="mailto:suporte@apitce.local">
              <CircleHelp size={14} /> Suporte
            </a>
            <span>{status}</span>
          </>
        }
      >
        {children}

        <section className="admin-panel" aria-label="Atividades recentes">
          <div className="admin-panel-title">
            <div>
              <span>Execuções</span>
              <h2>Atividades recentes</h2>
            </div>
            <a className="admin-link-button" href="/admin/logs">
              Ver todos os logs
            </a>
          </div>
          {liveLogs.map((log, index) => (
            <div
              className={`admin-activity ${log.status === "error" ? "error" : log.status === "ok" ? "ok" : "warn"}`}
              key={`${log.endpoint}-${log.started_at}-${index}`}
            >
              <i />
              <div>
                <strong>{log.endpoint}</strong>
                <span>
                  {log.codigo_municipio ? `município ${log.codigo_municipio}` : "sem município"}
                  {log.data_referencia_doc ? ` · competência ${log.data_referencia_doc}` : ""}
                  {` · ${log.rows_received ?? 0} registros · ${relativeTime(log.started_at)}`}
                  {log.error_message ? ` · ${log.error_message}` : ""}
                </span>
              </div>
            </div>
          ))}
        </section>
      </DashboardShell>

      <section className="admin-mobile-gate" aria-label="Orientação para dispositivos móveis">
        <div className="admin-mobile-gate-mark">
          <Smartphone size={26} />
        </div>
        <h1>Acompanhamento feito para o seu celular.</h1>
        <p>
          A central operacional continua disponível no computador. Para consultar a execução
          municipal, abra a experiência gerencial.
        </p>
        <a href="/gestao">Abrir painel gerencial</a>
      </section>
    </>
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
    error_message: "Falha de paginação na competência",
    started_at: new Date(Date.now() - 42 * 60_000).toISOString(),
    finished_at: new Date(Date.now() - 38 * 60_000).toISOString()
  }
];
