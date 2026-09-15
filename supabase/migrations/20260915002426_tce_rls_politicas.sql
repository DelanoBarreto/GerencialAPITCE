do $$
declare
  t text;
  -- Tabelas de dados: cada linha pertence a um municipio.
  tabelas_municipio text[] := array[
    'tce_balancetes_despesas_extra_orcamentarias','tce_balancetes_despesas_orcamentarias',
    'tce_balancetes_receitas_extra_orcamentarias','tce_balancetes_receitas_orcamentarias',
    'tce_contas_bancarias_municipio','tce_dados_orcamentos',
    'tce_elementos_despesas_projetos_atividades','tce_municipio_exercicios_monitorados',
    'tce_municipios_monitorados','tce_orcamentos_despesas',
    'tce_orcamentos_despesas_projetos_atividades','tce_orcamentos_receitas',
    'tce_ordenadores_despesas','tce_orgaos','tce_programas_governo','tce_raw_records',
    'tce_sync_availability_checks','tce_sync_log','tce_sync_subscriptions',
    'tce_unidades_gestoras','tce_unidades_orcamentarias'
  ];
  -- Tabelas de referencia: catalogo comum, sem dado de cliente.
  tabelas_referencia text[] := array[
    'tce_endpoint_catalog','tce_endpoint_groups','tce_funcoes','tce_tipos_unidades_administrativas'
  ];
begin
  foreach t in array tabelas_municipio loop
    execute format('alter table tce.%I enable row level security', t);

    -- Leitura: so os municipios que o usuario pode ver no sistema tce.
    execute format($f$
      create policy %I on tce.%I for select
      using (codigo_municipio in (select tce.municipios_permitidos()))
    $f$, t || '_select', t);

    -- Escrita: apenas quem administra, e sempre dentro do proprio municipio.
    -- A carga de dados roda com service_role, que ignora RLS.
    execute format($f$
      create policy %I on tce.%I for all
      using (
        codigo_municipio in (select tce.municipios_permitidos())
        and plataforma.papel_atual('tce') = any (array['superadmin','tenant_admin','editor'])
      )
      with check (
        codigo_municipio in (select tce.municipios_permitidos())
        and plataforma.papel_atual('tce') = any (array['superadmin','tenant_admin','editor'])
      )
    $f$, t || '_escrita', t);
  end loop;

  foreach t in array tabelas_referencia loop
    execute format('alter table tce.%I enable row level security', t);

    -- Catalogo e legivel por quem tem acesso ao sistema.
    execute format($f$
      create policy %I on tce.%I for select
      using (plataforma.tem_acesso('tce'))
    $f$, t || '_select', t);

    -- So papel de plataforma altera catalogo.
    execute format($f$
      create policy %I on tce.%I for all
      using (plataforma.eh_papel_de_plataforma('tce'))
      with check (plataforma.eh_papel_de_plataforma('tce'))
    $f$, t || '_escrita', t);
  end loop;
end $$;
