import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  FileWarning,
  Landmark,
  ShieldCheck
} from "lucide-react";

export function PilotSourceBand({
  source,
  competencia,
  inicio,
  fim
}: {
  source: "sim" | "demonstracao";
  competencia: string;
  inicio?: string;
  fim?: string;
}) {
  const real = source === "sim";

  return (
    <div className={`pilot-source-band ${real ? "is-real" : "is-demo"}`}>
      {real ? <ShieldCheck size={16} /> : <Database size={16} />}
      <span>{real ? "Dados oficiais SIM/TCE-CE" : "Dados de demonstração local"}</span>
      <strong>
        <CalendarRange size={15} />
        {inicio && fim ? `Período: ${inicio} a ${fim}` : `Última competência: ${competencia}`}
      </strong>
      <small>Referência final: {competencia}</small>
    </div>
  );
}

export function PilotMetric({
  label,
  value,
  detail,
  tone = "blue"
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "blue" | "green" | "amber";
}) {
  return (
    <article className={`pilot-metric tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export function PilotSection({ eyebrow, title, action, children }: { eyebrow: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="pilot-section">
      <div className="pilot-section-head">
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PilotEmpty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="pilot-empty">
      <FileWarning size={20} />
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}

export function PilotNotice({ type, children }: { type: "ok" | "attention"; children: ReactNode }) {
  const Icon = type === "ok" ? CheckCircle2 : AlertTriangle;
  return (
    <div className={`pilot-notice ${type}`}>
      <Icon size={18} />
      {children}
    </div>
  );
}

export function PilotDetailLink({ children }: { children: ReactNode }) {
  return (
    <button type="button" className="pilot-detail-link">
      {children}
      <ChevronRight size={17} />
    </button>
  );
}

export const PilotIcons = { Clock3, Landmark };
