import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Database, FileWarning, ShieldCheck } from "lucide-react";
import type { PeriodoInfo } from "../../lib/periodo.js";
import { formatPeriodoInfo } from "../../lib/formatters.js";

export function PilotSourceBand({
  source,
  periodo
}: {
  source: "sim" | "demonstracao";
  periodo: PeriodoInfo;
}) {
  const real = source === "sim";

  return (
    <div className={`pilot-source-band ${real ? "is-real" : "is-demo"}`}>
      {real ? <ShieldCheck size={16} /> : <Database size={16} />}
      <span>{real ? "Dados oficiais SIM/TCE-CE" : "Dados de demonstração local"}</span>
      <strong className="pilot-period-range">
        {formatPeriodoInfo(periodo)}
        <small>{periodo.total} competência(s)</small>
      </strong>
      {!periodo.continuo ? (
        <span className="pilot-period-gap">
          {periodo.faltantes.length} competência(s) sem dados no intervalo
        </span>
      ) : null}
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
  tone?: "blue" | "green" | "amber" | "red";
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

