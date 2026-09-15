-- Migration 017: RPC get_import_summary
-- Consolida 18 queries COUNT(*) separadas em uma única chamada de banco.
-- Substitui a função loadImportResumo do page.tsx que disparava 18 round-trips.

create or replace function public.get_import_summary(
  p_municipio text,
  p_exercicio text
)
returns table (
  slug        text,
  nome        text,
  registros   bigint,
  tabelas     int,
  detalhe     text
)
language sql
stable
as $$
  select
    'auxiliares'::text as slug,
    'Auxiliares'::text as nome,
    (select count(*) from public.municipios)
    + (select count(*) from public.tce_funcoes)
    + (select count(*) from public.tce_tipos_unidades_administrativas)
    as registros,
    3 as tabelas,
    'municipios, funcoes e tipos de unidades'::text as detalhe

  union all

  select
    'bas'::text,
    'BAS'::text,
    (select count(*) from public.tce_orgaos                where codigo_municipio = p_municipio and exercicio_orcamento = p_exercicio)
    + (select count(*) from public.tce_unidades_orcamentarias  where codigo_municipio = p_municipio and exercicio_orcamento = p_exercicio)
    + (select count(*) from public.tce_unidades_gestoras        where codigo_municipio = p_municipio and exercicio_orcamento = p_exercicio)
    + (select count(*) from public.tce_ordenadores_despesas     where codigo_municipio = p_municipio and exercicio_orcamento = p_exercicio)
    + (select count(*) from public.tce_contas_bancarias_municipio where codigo_municipio = p_municipio and exercicio_orcamento = p_exercicio)
    as registros,
    5 as tabelas,
    'orgaos, unidades, gestores de despesa e contas'::text

  union all

  select
    'orc'::text,
    'ORC'::text,
    (select count(*) from public.tce_dados_orcamentos                         where codigo_municipio = p_municipio and exercicio_orcamento = p_exercicio)
    + (select count(*) from public.tce_programas_governo                      where codigo_municipio = p_municipio and exercicio_orcamento = p_exercicio)
    + (select count(*) from public.tce_orcamentos_receitas                    where codigo_municipio = p_municipio and exercicio_orcamento = p_exercicio)
    + (select count(*) from public.tce_orcamentos_despesas                    where codigo_municipio = p_municipio and exercicio_orcamento = p_exercicio)
    + (select count(*) from public.tce_orcamentos_despesas_projetos_atividades where codigo_municipio = p_municipio and exercicio_orcamento = p_exercicio)
    + (select count(*) from public.tce_elementos_despesas_projetos_atividades  where codigo_municipio = p_municipio and exercicio_orcamento = p_exercicio)
    as registros,
    6 as tabelas,
    'orcamento, programas, projetos e elementos'::text

  union all

  select
    'bal'::text,
    'BAL'::text,
    (select count(*) from public.tce_balancetes_receitas_orcamentarias       where codigo_municipio = p_municipio and exercicio_orcamento = p_exercicio)
    + (select count(*) from public.tce_balancetes_despesas_orcamentarias     where codigo_municipio = p_municipio and exercicio_orcamento = p_exercicio)
    + (select count(*) from public.tce_balancetes_receitas_extra_orcamentarias where codigo_municipio = p_municipio and exercicio_orcamento = p_exercicio)
    + (select count(*) from public.tce_balancetes_despesas_extra_orcamentarias where codigo_municipio = p_municipio and exercicio_orcamento = p_exercicio)
    as registros,
    4 as tabelas,
    'balancetes normalizados no banco'::text;
$$;

-- Garante que apenas service_role pode chamar (sem acesso anônimo)
revoke all on function public.get_import_summary(text, text) from public, anon;
grant execute on function public.get_import_summary(text, text) to service_role;
