-- As tabelas do TCE se identificam por codigo_municipio, nao por organizacao_id.
-- Esta funcao traduz: devolve os codigos de municipio que o usuario atual pode
-- ver no sistema 'tce'. Papel de plataforma (superadmin) enxerga todos.
create or replace function tce.municipios_permitidos()
returns setof text
language sql
stable
security definer
set search_path = plataforma, pg_temp
as $$
  select o.codigo
  from plataforma.organizacoes o
  where plataforma.tem_acesso('tce')
    and (
      plataforma.eh_papel_de_plataforma('tce')
      or o.id = plataforma.org_atual('tce')
    );
$$;

revoke all on function tce.municipios_permitidos() from public;
grant execute on function tce.municipios_permitidos() to authenticated, service_role;
