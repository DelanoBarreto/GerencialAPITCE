import { ArrowRight, BarChart3, Building2, CalendarRange, CircleCheckBig, Gauge, Landmark, Smartphone } from "lucide-react";
import { ExecutiveTrend } from "../../../components/pilot/ExecutiveTrend.js";
import { PilotMetric, PilotNotice, PilotSection, PilotSourceBand } from "../../../components/pilot/PilotUi.js";
import { formatCurrency, formatCurrencyCompact, formatPeriodoInfo } from "../../../lib/formatters.js";
import { loadAracatiPilot } from "../../../lib/queries/pilot.js";

export const dynamic = "force-dynamic";

export default async function ApresentacaoAracatiPage() {
  const snapshot = await loadAracatiPilot();
  const totals = snapshot.meses.reduce(
    (acc, month) => ({
      receita: acc.receita + month.receita,
      empenhado: acc.empenhado + month.empenhado,
      liquidado: acc.liquidado + month.liquidado,
      pago: acc.pago + month.pago
    }),
    { receita: 0, empenhado: 0, liquidado: 0, pago: 0 }
  );
  const periodo = formatPeriodoInfo(snapshot.periodo);
  const saldo = totals.receita - totals.pago;

  return (
    <main className="sales-pilot">
      <aside className="sales-sidebar" aria-label="Navegação da apresentação">
        <a href="/apresentacao/aracati" className="sales-brand">
          <span>AP</span>
          <strong>APITCE</strong>
        </a>
        <nav>
          <a className="active" href="#visao">
            <Gauge size={18} /> Visão executiva
          </a>
          <a href="#evolucao">
            <BarChart3 size={18} /> Evolução
          </a>
          <a href="#valor">
            <CircleCheckBig size={18} /> Valor para gestão
          </a>
        </nav>
        <div className="sales-sidebar-card">
          <span>Município demonstrado</span>
          <strong>{snapshot.municipio}</strong>
          <small>CE · código {snapshot.codigoMunicipio}</small>
        </div>
        <a className="sales-sidebar-action" href="/admin">
          Central operacional <ArrowRight size={16} />
        </a>
      </aside>

      <section className="sales-dashboard" id="visao">
        <header className="sales-console-head">
          <div>
            <span className="sales-kicker">
              <Landmark size={16} /> Demonstração comercial com dados identificados
            </span>
            <h1>Aracati em painel executivo</h1>
            <p>Receita, despesa e saldo com fonte, início e fim do período visíveis antes dos números.</p>
          </div>
          <a className="sales-secondary" href="/gestao">
            <Smartphone size={17} /> Ver no celular
          </a>
        </header>

        <PilotSourceBand source={snapshot.source} periodo={snapshot.periodo} />

        <section className="sales-period-strip" aria-label="Período da demonstração">
          <div>
            <CalendarRange size={18} />
            <span>Período analisado</span>
            <strong>{periodo}</strong>
          </div>
          <div>
            <Gauge size={18} />
            <span>Competências</span>
            <strong>{snapshot.periodo.total}</strong>
          </div>
          <div>
            <Building2 size={18} />
            <span>Saldo do período</span>
            <strong>{formatCurrencyCompact(saldo)}</strong>
          </div>
        </section>

        <div className="pilot-metric-grid">
          <PilotMetric label="Receita arrecadada" value={formatCurrency(totals.receita)} detail={`acumulado de ${periodo}`} />
          <PilotMetric label="Despesa empenhada" value={formatCurrency(totals.empenhado)} detail="compromissos registrados" tone="amber" />
          <PilotMetric label="Despesa liquidada" value={formatCurrency(totals.liquidado)} detail="etapa anterior ao pagamento" tone="blue" />
          <PilotMetric label="Despesa paga" value={formatCurrency(totals.pago)} detail="pagamentos realizados" tone="green" />
        </div>

        <div className="sales-visual-grid" id="evolucao">
          <PilotSection eyebrow="Evolução mensal" title="Receita e despesa paga" action={<span className="sales-year">Exercício {snapshot.exercicio.slice(0, 4)}</span>}>
            {snapshot.meses.length ? <ExecutiveTrend meses={snapshot.meses} /> : <p>Sem dados disponíveis para a demonstração.</p>}
            <div className="pilot-legend">
              <span>
                <i className="income" /> Receita
              </span>
              <span>
                <i className="paid" /> Despesa paga
              </span>
            </div>
          </PilotSection>
          <PilotSection eyebrow="Leitura rápida" title="O que observar">
            <div className="sales-value-list" id="valor">
              <div>
                <BarChart3 size={20} />
                <span>
                  <strong>Recorte confiável</strong> O painel declara início e fim antes de apresentar totais.
                </span>
              </div>
              <div>
                <Building2 size={20} />
                <span>
                  <strong>Prova comercial</strong> A amostra mostra dados reais quando o Supabase estiver conectado.
                </span>
              </div>
              <div>
                <Smartphone size={20} />
                <span>
                  <strong>Continuidade mobile</strong> O gestor consulta o mesmo período no celular, com menos ruído.
                </span>
              </div>
            </div>
          </PilotSection>
        </div>

        <PilotNotice type={snapshot.source === "sim" ? "ok" : "attention"}>
          <span>
            <strong>{snapshot.source === "sim" ? "Fonte oficial carregada." : "Prévia local de demonstração."}</strong>{" "}
            {snapshot.source === "sim"
              ? `Valores oficiais SIM/TCE-CE no recorte ${periodo}.`
              : "Conecte o Supabase para apresentar os valores oficiais carregados."}
          </span>
        </PilotNotice>
      </section>
    </main>
  );
}
