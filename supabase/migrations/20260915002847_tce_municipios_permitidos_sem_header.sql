-- Correcao: plataforma.org_atual() depende do header x-portalgov-tenant-slug,
-- usado pelo portal multi-tenant. O APITCE nao trabalha por dominio de tenant,
-- entao resolve a organizacao direto do vinculo do usuario em usuarios_sistema.
-- Assim tenant_admin e editor enxergam o proprio municipio sem depender de header.
create or replace function tce.municipios_permitidos()
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  -- Papel de nivel de plataforma (superadmin) enxerga todos os municipios.
  select o.codigo
  from plataforma.organizacoes o
  where exists (
    select 1
    from plataforma.usuarios_sistema us
    join plataforma.papeis p on p.sistema = us.sistema and p.papel = us.papel
    where us.auth_user_id = (select auth.uid())
      and us.sistema = 'tce'
      and us.status = 'ativo'
      and p.nivel_plataforma
  )

  union

  -- Demais papeis: apenas as organizacoes as quais o usuario esta vinculado.
  select o.codigo
  from plataforma.usuarios_sistema us
  join plataforma.organizacoes o on o.id = us.organizacao_id
  where us.auth_user_id = (select auth.uid())
    and us.sistema = 'tce'
    and us.status = 'ativo';
$$;

revoke all on function tce.municipios_permitidos() from public;
grant execute on function tce.municipios_permitidos() to authenticated, service_role;
