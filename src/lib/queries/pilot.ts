import { hasSupabaseConfig, createSupabaseAdminClient } from "../supabase/admin.js";
import { describePeriodo, type PeriodoInfo } from "../periodo.js";

export type PilotMonth = {
  competencia: string;
  receita: number;
  empenhado: number;
  liquidado: number;
  pago: number;
};

export type PilotSnapshot = {
  municipio: string;
  codigoMunicipio: string;
  exercicio: string;
  meses: PilotMonth[];
  periodo: PeriodoInfo;
  source: "sim" | "demonstracao";
  updatedAt: string | null;
};

const fallbackMonths: PilotMonth[] = [
  { competencia: "202501", receita: 18500000, empenhado: 16200000, liquidado: 12300000, pago: 11600000 },
  { competencia: "202502", receita: 20100000, empenhado: 17400000, liquidado: 13900000, pago: 12600000 },
  { competencia: "202503", receita: 19400000, empenhado: 18100000, liquidado: 14500000, pago: 13700000 },
  { competencia: "202504", receita: 22000000, empenhado: 19800000, liquidado: 15800000, pago: 14900000 },
  { competencia: "202505", receita: 21100000, empenhado: 20400000, liquidado: 16400000, pago: 15700000 },
  { competencia: "202506", receita: 22900000, empenhado: 21800000, liquidado: 17900000, pago: 16800000 }
];

export async function loadAracatiPilot(): Promise<PilotSnapshot> {
  const fallback = (): PilotSnapshot => ({
    municipio: "Aracati",
    codigoMunicipio: "014",
    exercicio: "202500",
    meses: fallbackMonths,
    periodo: describePeriodo(fallbackMonths.map((m) => m.competencia)),
    source: "demonstracao",
    updatedAt: null
  });

  if (!hasSupabaseConfig()) return fallback();

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("vw_tce_execucao_orcamentaria_mensal")
      .select("data_referencia_doc,receita_arrecadada_no_mes,despesa_empenhada_no_mes,despesa_liquidada_no_mes,despesa_paga_no_mes")
      .eq("codigo_municipio", "014")
      .eq("exercicio_orcamento", "202500")
      .order("data_referencia_doc", { ascending: true });

    if (error || !data?.length) return fallback();

    const aggregate = new Map<string, PilotMonth>();
    for (const row of data) {
      const competencia = String(row.data_referencia_doc);
      const current = aggregate.get(competencia) ?? { competencia, receita: 0, empenhado: 0, liquidado: 0, pago: 0 };
      current.receita += numberValue(row.receita_arrecadada_no_mes);
      current.empenhado += numberValue(row.despesa_empenhada_no_mes);
      current.liquidado += numberValue(row.despesa_liquidada_no_mes);
      current.pago += numberValue(row.despesa_paga_no_mes);
      aggregate.set(competencia, current);
    }

    const meses = [...aggregate.values()].sort((a, b) => a.competencia.localeCompare(b.competencia));

    return {
      municipio: "Aracati",
      codigoMunicipio: "014",
      exercicio: "202500",
      meses,
      periodo: describePeriodo(meses.map((m) => m.competencia)),
      source: "sim",
      updatedAt: new Date().toISOString()
    };
  } catch {
    return fallback();
  }
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
