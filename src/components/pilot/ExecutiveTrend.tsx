import type { PilotMonth } from "../../lib/queries/pilot.js";
import { formatCompetencia, formatCurrency, formatCurrencyCompact } from "../../lib/formatters.js";
import { PilotEmpty } from "./PilotUi.js";

const chartWidth = 760;
const chartHeight = 236;
const padding = { top: 18, right: 18, bottom: 34, left: 72 };

export function ExecutiveTrend({ meses }: { meses: PilotMonth[] }) {
  if (meses.length === 0) {
    return <PilotEmpty title="Sem competências no período" detail="Nenhum dado disponível para desenhar o gráfico." />;
  }

  const maxValue = Math.max(...meses.flatMap((item) => [item.receita, item.pago]), 1);
  const receitaPoints = pointsFor(meses, "receita", maxValue);
  const pagoPoints = pointsFor(meses, "pago", maxValue);
  const ticks = [0.25, 0.5, 0.75, 1].map((ratio) => ({ ratio, value: maxValue * ratio, y: yFor(maxValue * ratio, maxValue) }));

  return (
    <div className="pilot-chart" aria-label="Evolução mensal de receita e despesa paga">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img">
        <title>Evolução mensal de receita e despesa paga</title>
        {ticks.map((tick) => (
          <g key={tick.ratio}>
            <line x1={padding.left} x2={chartWidth - padding.right} y1={tick.y} y2={tick.y} className="pilot-chart-grid" />
            <text x={padding.left - 10} y={tick.y + 4} textAnchor="end" className="pilot-chart-axis">
              {formatCurrencyCompact(tick.value)}
            </text>
          </g>
        ))}
        <polyline points={receitaPoints} className="pilot-chart-line income-line" />
        <polyline points={pagoPoints} className="pilot-chart-line paid-line" />
        {meses.map((item, index) => {
          const x = xFor(index, meses.length);
          return (
            <g key={`ponto-${item.competencia}`}>
              <circle cx={x} cy={yFor(item.receita, maxValue)} r={3} className="pilot-chart-dot income-dot">
                <title>{`${formatCompetencia(item.competencia)} · receita ${formatCurrency(item.receita)}`}</title>
              </circle>
              <circle cx={x} cy={yFor(item.pago, maxValue)} r={3} className="pilot-chart-dot paid-dot">
                <title>{`${formatCompetencia(item.competencia)} · pago ${formatCurrency(item.pago)}`}</title>
              </circle>
            </g>
          );
        })}
        {meses.map((item, index) => {
          const x = xFor(index, meses.length);
          const show = meses.length <= 6 || index % 2 === 0 || index === meses.length - 1;
          return show ? (
            <text key={item.competencia} x={x} y={chartHeight - 10} textAnchor="middle" className="pilot-chart-axis">
              {formatCompetencia(item.competencia)}
            </text>
          ) : null;
        })}
      </svg>
    </div>
  );
}

function pointsFor(meses: PilotMonth[], key: "receita" | "pago", maxValue: number) {
  return meses.map((item, index) => `${xFor(index, meses.length)},${yFor(item[key], maxValue)}`).join(" ");
}

function xFor(index: number, total: number) {
  if (total <= 1) return padding.left;
  const usableWidth = chartWidth - padding.left - padding.right;
  return padding.left + (usableWidth * index) / (total - 1);
}

function yFor(value: number, maxValue: number) {
  const usableHeight = chartHeight - padding.top - padding.bottom;
  return padding.top + usableHeight - (value / maxValue) * usableHeight;
}
