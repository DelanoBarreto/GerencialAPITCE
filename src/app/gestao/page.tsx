import { ChartNoAxesCombined, FileText, House, Landmark } from "lucide-react";
import { DashboardShell, type ShellNavItem } from "../../components/shell/DashboardShell.js";
import { ExecutiveTrend } from "../../components/pilot/ExecutiveTrend.js";
import { PilotMetric, PilotNotice, PilotSection, PilotSourceBand } from "../../components/pilot/PilotUi.js";
import { formatCompetencia, formatCurrency, formatPeriodoInfo } from "../../lib/formatters.js";
import { loadAracatiPilot } from "../../lib/queries/pilot.js";

export const dynamic = "force-dynamic";

export default async function GestaoPage() {
  const snapshot = await loadAracatiPilot();
  const last = snapshot.meses.at(-1);
  const current = last ?? { competencia: "202501", receita: 0, empenhado: 0, liquidado: 0, pago: 0 };

  const acumulado = snapshot.meses.reduce(
    (acc, item) => ({
      receita: acc.receita + item.receita,
      empenhado: acc.empenhado + item.empenhado,
      liquidado: acc.liquidado + item.liquidado,
      pago: acc.pago + item.pago
    }),
    { receita: 0, empenhado: 0, liquidado: 0, pago: 0 }
  );

  const periodoLabel = formatPeriodoInfo(snapshot.periodo);
  const competencia = formatCompetencia(current.competencia);
  const saldo = acumulado.receita - acumulado.pago;
  const hasAttention = acumulado.empenhado > acumulado.receita;

  const nav: ShellNavItem[] = [
    { href: "/gestao", label: "Visão geral", icon: <House size={17} />, active: true },
    { href: "/apresentacao/aracati", label: "Apresentação", icon: <FileText size={17} /> }
  ];

  return (
    <DashboardShell
      brand="APITCE"
      brandMark="AP"
      nav={nav}
      title={snapshot.municipio}
      subtitle="Execução orçamentária acompanhada por competência."
      periodLabel={periodoLabel}
      periodCaption="Período analisado"
      scope={{
        label: "Município",
        value: snapshot.municipio,
        detail: `Código ${snapshot.codigoMunicipio} · exercício ${snapshot.exercicio.slice(0, 4)}`
      }}
      aside={
        <span>
          <Landmark size={14} /> {snapshot.periodo.total} competências carregadas
        </span>
      }
    >
      <PilotSourceBand source={snapshot.source} periodo={snapshot.periodo} />

      <div className="pilot-metric-grid">
        <PilotMetric
          label="Receita arrecadada"
          value={formatCurrency(acumulado.receita)}
          detail={`acumulado de ${periodoLabel}`}
          tone="green"
        />
        <PilotMetric
          label="Despesa empenhada"
          value={formatCurrency(acumulado.empenhado)}
          detail="compromissos assumidos no período"
          tone="amber"
        />
        <PilotMetric
          label="Despesa liquidada"
          value={formatCurrency(acumulado.liquidado)}
          detail="serviços e entregas reconhecidos"
          tone="blue"
        />
        <PilotMetric
          label="Despesa paga"
          value={formatCurrency(acumulado.pago)}
          detail="saídas efetivas de caixa"
          tone="green"
        />
      </div>

      <div className="ap-grid-2">
        <PilotSection
          eyebrow="Tendência"
          title="Receita e despesa paga por competência"
          action={<span className="sales-year">{snapshot.periodo.total} competências</span>}
        >
          <ExecutiveTrend meses={snapshot.meses} />
          <div className="pilot-legend">
            <span>
              <i /> Receita
            </span>
            <span>
              <i /> Pago
            </span>
          </div>
        </PilotSection>

        <PilotSection eyebrow="Situação" title="Leitura do período">
          <div className="pilot-metric-grid">
            <PilotMetric
              label="Saldo de execução"
              value={formatCurrency(saldo)}
              detail="receita acumulada menos pagamentos"
              tone={saldo < 0 ? "red" : "green"}
            />
            <PilotMetric
              label="Última competência"
              value={competencia}
              detail={`pago ${formatCurrency(current.pago)} no mês`}
              tone="blue"
            />
          </div>

          <PilotNotice type={hasAttention ? "attention" : "ok"}>
            <span>
              <strong>{hasAttention ? "Atenção necessária." : "Situação acompanhada."}</strong>{" "}
              {hasAttention
                ? "A despesa empenhada acumulada ultrapassa a receita arrecadada no período."
                : "A execução acumulada está coerente com a receita arrecadada no período."}
            </span>
          </PilotNotice>
        </PilotSection>
      </div>

      <PilotSection
        eyebrow="Detalhamento"
        title="Execução mês a mês"
        action={
          <a className="admin-link-button" href="/apresentacao/aracati">
            <ChartNoAxesCombined size={15} /> Ver apresentação
          </a>
        }
      >
        <div className="admin-table">
          <div className="admin-table-head admin-gestao-grid">
            <span>Competência</span>
            <span>Receita</span>
            <span>Empenhado</span>
            <span>Liquidado</span>
            <span>Pago</span>
          </div>
          {snapshot.meses.map((mes) => (
            <div className="admin-table-row admin-gestao-grid" key={mes.competencia}>
              <span>{formatCompetencia(mes.competencia)}</span>
              <span data-label="Receita">{formatCurrency(mes.receita)}</span>
              <span data-label="Empenhado">{formatCurrency(mes.empenhado)}</span>
              <span data-label="Liquidado">{formatCurrency(mes.liquidado)}</span>
              <span data-label="Pago">{formatCurrency(mes.pago)}</span>
            </div>
          ))}
        </div>
      </PilotSection>
    </DashboardShell>
  );
}
