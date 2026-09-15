import { createSupabaseServerClient } from "../supabase/server.js";

export type ImportResumo = {
  slug: string;
  nome: string;
  registros: number;
  tabelas: number;
  detalhe: string;
};

export type ExecucaoMensal = {
  data_referencia_doc: string;
  receita_arrecadada_no_mes: number;
  despesa_empenhada_no_mes: number;
  despesa_liquidada_no_mes: number;
  despesa_paga_no_mes: number;
};

/**
 * Carrega o resumo de importação via RPC (1 query em vez de 18).
 * Cacheado por 60 segundos — muda a cada sync.
 */
export function loadImportResumo(codigoMunicipio: string, exercicio: string) {
  return (async (): Promise<ImportResumo[]> => {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.rpc("get_import_summary", {
        p_municipio: codigoMunicipio,
        p_exercicio: exercicio
      });

      if (error) {
        throw new Error(`RPC get_import_summary falhou: ${error.code}`);
      }

      return ((data ?? []) as ImportResumo[]).map((row) => ({
        slug: row.slug,
        nome: row.nome,
        registros: Number(row.registros),
        tabelas: Number(row.tabelas),
        detalhe: row.detalhe
      }));
    })();
}

/**
 * Carrega execução mensal para o dashboard.
 * Cacheado por 60 segundos.
 */
export function loadExecucaoMensal(codigoMunicipio: string, exercicio: string) {
  return (async (): Promise<ExecucaoMensal[]> => {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("vw_tce_execucao_orcamentaria_mensal")
        .select(
          "data_referencia_doc,receita_arrecadada_no_mes,despesa_empenhada_no_mes,despesa_liquidada_no_mes,despesa_paga_no_mes"
        )
        .eq("codigo_municipio", codigoMunicipio)
        .eq("exercicio_orcamento", exercicio)
        .order("data_referencia_doc", { ascending: true });

      if (error) throw error;

      // Agrega por mês (deduplica linhas de diferentes órgãos)
      const byMonth = new Map<string, ExecucaoMensal>();
      for (const row of (data ?? []) as Array<Record<string, unknown>>) {
        const key = String(row.data_referencia_doc);
        const current = byMonth.get(key);
        const r = toNum(row.receita_arrecadada_no_mes);
        const emp = toNum(row.despesa_empenhada_no_mes);
        const liq = toNum(row.despesa_liquidada_no_mes);
        const pago = toNum(row.despesa_paga_no_mes);

        if (!current) {
          byMonth.set(key, {
            data_referencia_doc: key,
            receita_arrecadada_no_mes: r,
            despesa_empenhada_no_mes: emp,
            despesa_liquidada_no_mes: liq,
            despesa_paga_no_mes: pago
          });
        } else {
          current.receita_arrecadada_no_mes += r;
          current.despesa_empenhada_no_mes += emp;
          current.despesa_liquidada_no_mes += liq;
          current.despesa_paga_no_mes += pago;
        }
      }

      return [...byMonth.values()].sort((a, b) =>
        a.data_referencia_doc.localeCompare(b.data_referencia_doc)
      );
    })();
}

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
