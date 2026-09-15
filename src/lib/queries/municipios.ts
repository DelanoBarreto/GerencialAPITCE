import { cache } from "react";
import { createSupabaseServerClient } from "../supabase/server.js";

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
export const loadMunicipios = cache(async (): Promise<Municipio[]> => {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("listar_municipios");

    if (error) throw error;
    return (data ?? []) as Municipio[];
  });

/**
 * Lista municípios/anos ativos para monitoramento.
 * Cacheado por 60 segundos — pode mudar durante o uso.
 */
export const loadMonitorados = cache(async (): Promise<Monitorado[]> => {
    const supabase = await createSupabaseServerClient();
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
  });

/**
 * Carrega os grupos oficiais disponíveis.
 * Cacheado por 10 minutos — estrutura estática.
 */
export const loadGrupos = cache(
  async (slugs: string[] = ["auxiliares", "bas", "orc", "bal"]) => {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("tce_endpoint_groups")
      .select("slug,nome,ordem")
      .in("slug", slugs)
      .order("ordem", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Array<{ slug: string; nome: string; ordem: number }>;
  },
);
