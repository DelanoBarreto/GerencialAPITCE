-- Nunca executar antes do backup e da validacao dos vinculos TCE.
-- Exclusivo do schema tce. Nao modifica plataforma nem portalgov.
revoke usage on schema tce from public, anon;
grant usage on schema tce to authenticated, service_role;

revoke all on all tables in schema tce from public, anon, authenticated;
revoke all on all sequences in schema tce from public, anon, authenticated;
revoke all on all routines in schema tce from public, anon, authenticated;

alter default privileges for role postgres in schema tce revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema tce revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema tce revoke execute on routines from public, anon, authenticated;

-- A ponte autenticada e a unica superficie de funcoes TCE neste momento.
grant execute on function tce.meu_papel() to authenticated, service_role;
grant execute on function tce.listar_municipios() to authenticated, service_role;
grant execute on function tce.tem_acesso_municipio(text) to authenticated, service_role;
grant execute on function tce.sou_superadmin() to authenticated, service_role;
grant execute on function tce.vincular_usuario_existente(uuid, text, text, text) to authenticated, service_role;

-- Dados brutos e verificacoes internas nao sao concedidos ao cliente.
grant select on table
  tce.tce_endpoint_catalog,
  tce.tce_endpoint_groups,
  tce.tce_funcoes,
  tce.tce_tipos_unidades_administrativas,
  tce.tce_municipios_monitorados,
  tce.tce_municipio_exercicios_monitorados,
  tce.tce_sync_log,
  tce.tce_sync_subscriptions,
  tce.tce_balancetes_despesas_extra_orcamentarias,
  tce.tce_balancetes_despesas_orcamentarias,
  tce.tce_balancetes_receitas_extra_orcamentarias,
  tce.tce_balancetes_receitas_orcamentarias,
  tce.tce_contas_bancarias_municipio,
  tce.tce_dados_orcamentos,
  tce.tce_elementos_despesas_projetos_atividades,
  tce.tce_orcamentos_despesas,
  tce.tce_orcamentos_despesas_projetos_atividades,
  tce.tce_orcamentos_receitas,
  tce.tce_ordenadores_despesas,
  tce.tce_orgaos,
  tce.tce_programas_governo,
  tce.tce_unidades_gestoras,
  tce.tce_unidades_orcamentarias,
  tce.vw_tce_despesas_mensais,
  tce.vw_tce_receitas_mensais,
  tce.vw_tce_execucao_orcamentaria_mensal
to authenticated;

-- Remove as 50 policies anteriores, inclusive ALL/TO PUBLIC.
do $block$
declare item record;
begin
  for item in
    select schemaname, tablename, policyname
    from pg_policies where schemaname = 'tce'
  loop
    execute format('drop policy %I on %I.%I', item.policyname, item.schemaname, item.tablename);
  end loop;
end
$block$;

-- Referencias globais exigem vinculo ativo ao sistema, mas nao a um municipio.
do $block$
declare table_name text;
begin
  foreach table_name in array array[
    'tce_endpoint_catalog', 'tce_endpoint_groups',
    'tce_funcoes', 'tce_tipos_unidades_administrativas'
  ] loop
    execute format(
      'create policy %I on tce.%I for select to authenticated using ((select tce.meu_papel()) is not null)',
      table_name || '_leitura_tce', table_name
    );
  end loop;
end
$block$;

-- Dados normalizados: municipio informado na URL nao e autorizacao.
do $block$
declare table_name text;
begin
  foreach table_name in array array[
    'tce_balancetes_despesas_extra_orcamentarias',
    'tce_balancetes_despesas_orcamentarias',
    'tce_balancetes_receitas_extra_orcamentarias',
    'tce_balancetes_receitas_orcamentarias',
    'tce_contas_bancarias_municipio',
    'tce_dados_orcamentos',
    'tce_elementos_despesas_projetos_atividades',
    'tce_orcamentos_despesas',
    'tce_orcamentos_despesas_projetos_atividades',
    'tce_orcamentos_receitas',
    'tce_ordenadores_despesas',
    'tce_orgaos',
    'tce_programas_governo',
    'tce_unidades_gestoras',
    'tce_unidades_orcamentarias'
  ] loop
    execute format(
      'create policy %I on tce.%I for select to authenticated using ((select tce.tem_acesso_municipio(codigo_municipio)))',
      table_name || '_leitura_municipio', table_name
    );
  end loop;
end
$block$;

-- Escopos, assinaturas e logs de operacao pertencem apenas a equipe interna.
do $block$
declare table_name text;
begin
  foreach table_name in array array[
    'tce_municipios_monitorados', 'tce_municipio_exercicios_monitorados',
    'tce_sync_log', 'tce_sync_subscriptions',
    'tce_sync_availability_checks', 'tce_raw_records'
  ] loop
    execute format(
      'create policy %I on tce.%I for select to authenticated using ((select tce.sou_superadmin()))',
      table_name || '_leitura_interna', table_name
    );
  end loop;
end
$block$;

-- A view de compatibilidade municipios nao deve abrir leitura direta na plataforma.
revoke all on tce.municipios from anon, authenticated;
