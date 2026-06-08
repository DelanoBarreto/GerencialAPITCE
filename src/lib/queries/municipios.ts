import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "../supabase/admin.js";

export type Municipio = {
  codigo_municipio: string;
  nome_municipio: string;
};

export type Monitorado = {
  codigo_municipio: string;
  nome_municipio: string;
  ano: number;
  exercicio_orcamento: string;
  ativo: boolean;
  sincronizacao_automatica: boolean;
};

/**
 * Lista todos os municípios disponíveis.
 * Cacheado por 5 minutos — muda raramente.
 */
export const loadMunicipios = unstable_cache(
  async (): Promise<Municipio[]> => {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("municipios")
      .select("codigo_municipio,nome_municipio")
      .order("nome_municipio", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Municipio[];
  },
  ["municipios-disponiveis"],
  { revalidate: 300 }
);

/**
 * Lista municípios/anos ativos para monitoramento.
 * Cacheado por 60 segundos — pode mudar durante o uso.
 */
export const loadMonitorados = unstable_cache(
  async (): Promise<Monitorado[]> => {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tce_municipio_exercicios_monitorados")
      .select("codigo_municipio,ano,exercicio_orcamento,ativo,sincronizacao_automatica")
      .eq("ativo", true)
      .order("codigo_municipio", { ascending: true })
      .order("ano", { ascending: false });

    if (error) throw error;

    const rows = (data ?? []) as Array<Omit<Monitorado, "nome_municipio">>;
    const municipios = await loadMunicipios();
    const nameByCode = new Map(municipios.map((m) => [m.codigo_municipio, m.nome_municipio]));

    return rows.map((row) => ({
      ...row,
      nome_municipio: nameByCode.get(row.codigo_municipio) ?? row.codigo_municipio
    }));
  },
  ["monitorados-ativos"],
  { revalidate: 60 }
);

/**
 * Carrega os grupos oficiais disponíveis.
 * Cacheado por 10 minutos — estrutura estática.
 */
export const loadGrupos = unstable_cache(
  async (slugs: string[] = ["auxiliares", "bas", "orc", "bal"]) => {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tce_endpoint_groups")
      .select("slug,nome,ordem")
      .in("slug", slugs)
      .order("ordem", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Array<{ slug: string; nome: string; ordem: number }>;
  },
  ["grupos-tce"],
  { revalidate: 600 }
);
