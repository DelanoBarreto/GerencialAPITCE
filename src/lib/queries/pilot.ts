import { createSupabaseServerClient } from "../supabase/server.js";
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
  source: "sim" | "sem_dados";
  updatedAt: string | null;
};

export async function loadPilot(
  codigoMunicipio: string,
  exercicio: string,
  municipioNome: string
): Promise<PilotSnapshot> {
  const fallback = (): PilotSnapshot => ({
    municipio: municipioNome,
    codigoMunicipio,
    exercicio,
    meses: [],
    periodo: describePeriodo([]),
    source: "sem_dados",
    updatedAt: null
  });

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("vw_tce_execucao_orcamentaria_mensal")
      .select("data_referencia_doc,receita_arrecadada_no_mes,despesa_empenhada_no_mes,despesa_liquidada_no_mes,despesa_paga_no_mes")
      .eq("codigo_municipio", codigoMunicipio)
      .eq("exercicio_orcamento", exercicio)
      .order("data_referencia_doc", { ascending: true });

    if (error) {
      console.error("[gestao] consulta da view falhou", { codigoMunicipio, exercicio, code: error.code });
      return fallback();
    }
    if (!data?.length) return fallback();

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
      municipio: municipioNome,
      codigoMunicipio,
      exercicio,
      meses,
      periodo: describePeriodo(meses.map((m) => m.competencia)),
      source: "sim",
      updatedAt: null
    };
  } catch (error) {
    console.error("[gestao] falha ao carregar dados reais do municipio", {
      codigoMunicipio,
      exercicio,
      error: error instanceof Error ? error.message : "erro desconhecido"
    });
    return fallback();
  }
}

/** Compatibilidade temporaria para a rota legada de Aracati. */
export function loadAracatiPilot(): Promise<PilotSnapshot> {
  return loadPilot("014", "202500", "Aracati");
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
