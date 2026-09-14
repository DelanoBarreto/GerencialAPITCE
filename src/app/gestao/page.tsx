import {
  Bell,
  CalendarRange,
  ChartNoAxesCombined,
  CircleAlert,
  FileText,
  House,
  Landmark,
  ReceiptText,
  SlidersHorizontal
} from "lucide-react";
import { ExecutiveTrend } from "../../components/pilot/ExecutiveTrend.js";
import { PilotMetric, PilotNotice, PilotSection, PilotSourceBand } from "../../components/pilot/PilotUi.js";
import { formatCompetencia, formatCurrency, formatCurrencyCompact, formatPeriodoCompetencias } from "../../lib/formatters.js";
import { loadAracatiPilot } from "../../lib/queries/pilot.js";

export const dynamic = "force-dynamic";

export default async function GestaoPage() {
  const snapshot = await loadAracatiPilot();
  const first = snapshot.meses.at(0);
  const last = snapshot.meses.at(-1);
  const current = last ?? { competencia: "202501", receita: 0, empenhado: 0, liquidado: 0, pago: 0 };
  const acumulado = snapshot.meses.reduce((acc, item) => ({ receita: acc.receita + item.receita, pago: acc.pago + item.pago }), { receita: 0, pago: 0 });
  const competencia = formatCompetencia(current.competencia);
  const inicio = first ? formatCompetencia(first.competencia) : undefined;
  const fim = last ? formatCompetencia(last.competencia) : undefined;
  const periodo = formatPeriodoCompetencias(first?.competencia, last?.competencia);
  const hasAttention = current.empenhado > current.receita;

  return (
    <main className="management-pilot">
      <header className="management-topbar">
        <a className="management-brand" href="/gestao">
          <span>AP</span>
          <strong>Gestão</strong>
        </a>
        <button type="button" aria-label="Notificações">
          <Bell size={20} />
          <i />
        </button>
      </header>

      <div className="management-scroll">
        <section className="management-hero">
          <span>Dashboard gerencial</span>
          <h1>{snapshot.municipio}</h1>
          <button type="button" className="management-scope">
            <Landmark size={16} /> {snapshot.codigoMunicipio} · {snapshot.exercicio.slice(0, 4)} <SlidersHorizontal size={15} />
          </button>
        </section>

        <section className="management-period-card" aria-label="Período analisado">
          <CalendarRange size={18} />
          <div>
            <span>Período analisado</span>
            <strong>{periodo}</strong>
          </div>
        </section>

        <PilotSourceBand source={snapshot.source} competencia={competencia} inicio={inicio} fim={fim} />

        <section className="management-featured-card">
          <div>
            <span>Receita arrecadada no período</span>
            <strong>{formatCurrency(acumulado.receita)}</strong>
            <small>acumulado de {periodo}</small>
          </div>
          <div className="management-progress" aria-label="Receita acumulada no período">
            <span style={{ width: `${Math.min(100, Math.max(18, (acumulado.receita / 160000000) * 100))}%` }} />
          </div>
          <a href="#detalhes">
            Ver detalhamento <ChartNoAxesCombined size={16} />
          </a>
        </section>

        <div className="management-pair-grid">
          <PilotMetric label="Empenhado no último mês" value={formatCurrencyCompact(current.empenhado)} detail={`competência ${competencia}`} tone="amber" />
          <PilotMetric label="Liquidado no último mês" value={formatCurrencyCompact(current.liquidado)} detail={`competência ${competencia}`} tone="blue" />
          <PilotMetric label="Pago no último mês" value={formatCurrencyCompact(current.pago)} detail={`competência ${competencia}`} tone="green" />
        </div>

        <PilotSection eyebrow="Tendência" title="Evolução no recorte" action={<span className="management-period">{snapshot.meses.length} competências</span>}>
          <ExecutiveTrend meses={snapshot.meses} />
          <div className="pilot-legend">
            <span>
              <i className="income" /> Receita
            </span>
            <span>
              <i className="paid" /> Pago
            </span>
          </div>
        </PilotSection>

        <section className="management-status" id="detalhes">
          <div>
            <span>Saldo de execução</span>
            <strong>{formatCurrency(acumulado.receita - acumulado.pago)}</strong>
            <small>receita acumulada menos pagamentos no período</small>
          </div>
          <a href="#alertas" aria-label="Abrir alertas">
            <CircleAlert size={21} />
          </a>
        </section>

        <PilotNotice type={hasAttention ? "attention" : "ok"}>
          <span>
            <strong>{hasAttention ? "Atenção necessária." : "Situação acompanhada."}</strong>{" "}
            {hasAttention ? "O valor empenhado do último mês ultrapassa a receita informada." : "O painel está coerente com o período selecionado."}
          </span>
        </PilotNotice>

        <section className="management-list" id="alertas">
          <div className="management-list-head">
            <div>
              <span>Para acompanhar</span>
              <h2>Próximos passos</h2>
            </div>
            <a href="#mais">Ver todos</a>
          </div>
          <a href="#detalhes">
            <ReceiptText size={19} />
            <span>
              <strong>Detalhar receita e despesa</strong>
              <small>Órgãos, unidades e competências</small>
            </span>
            <span>›</span>
          </a>
          <a href="#alertas">
            <Bell size={19} />
            <span>
              <strong>Ver alertas do período</strong>
              <small>{hasAttention ? "1 item precisa de atenção" : "Nenhum alerta crítico agora"}</small>
            </span>
            <span>›</span>
          </a>
        </section>
      </div>

      <nav className="management-bottom-nav" aria-label="Navegação gerencial">
        <a className="active" href="/gestao">
          <House size={20} />
          <span>Visão geral</span>
        </a>
        <a href="#detalhes">
          <ChartNoAxesCombined size={20} />
          <span>Detalhes</span>
        </a>
        <a href="#alertas">
          <Bell size={20} />
          <span>Alertas</span>
        </a>
        <a id="mais" href="/apresentacao/aracati">
          <FileText size={20} />
          <span>Mais</span>
        </a>
      </nav>
    </main>
  );
}
