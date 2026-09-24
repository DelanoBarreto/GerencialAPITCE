-- Ponte minima para o catalogo e os vinculos da plataforma.
-- A plataforma permanece fora da Data API e sem grants diretos ao cliente.
-- Somente wrappers SECURITY INVOKER ficam no schema tce exposto.
create schema if not exists tce_internal;
revoke all on schema tce_internal from public, anon;
grant usage on schema tce_internal to authenticated, service_role;
alter default privileges for role postgres in schema tce_internal revoke execute on routines from public;

create or replace function tce_internal.meu_papel()
returns text
language sql
stable
security definer
set search_path = ''
as $function$
  select us.papel
  from plataforma.usuarios_sistema us
  join plataforma.papeis p on p.sistema = us.sistema and p.papel = us.papel
  where us.auth_user_id = (select auth.uid())
    and exists (select 1 from auth.users u where u.id = (select auth.uid()) and u.deleted_at is null)
    and us.sistema = 'tce'
    and us.status = 'ativo'
    and (us.organizacao_id is null or exists (
      select 1
      from plataforma.organizacoes o
      join plataforma.assinaturas a on a.organizacao_id = o.id
      where o.id = us.organizacao_id
        and o.status = 'ativo'
        and a.sistema = 'tce'
        and a.status = 'ativa'
    ))
    and (us.organizacao_id is not null or p.nivel_plataforma)
  order by p.nivel_plataforma desc,
    case us.papel
      when 'superadmin' then 0
      when 'tenant_admin' then 1
      when 'editor' then 2
      when 'viewer' then 3
      else 4
    end
  limit 1;
$function$;

create or replace function tce_internal.listar_municipios()
returns table(codigo_municipio text, nome_municipio text)
language sql
stable
security definer
set search_path = ''
as $function$
  select distinct c.codigo, c.nome
  from plataforma.catalogo_municipios c
  where (select auth.uid()) is not null
    and exists (select 1 from auth.users u where u.id = (select auth.uid()) and u.deleted_at is null)
    and (
      exists (
        select 1
        from plataforma.usuarios_sistema us
        join plataforma.papeis p on p.sistema = us.sistema and p.papel = us.papel
        where us.auth_user_id = (select auth.uid())
          and us.sistema = 'tce'
          and us.status = 'ativo'
          and us.organizacao_id is null
          and us.papel = 'superadmin'
          and p.nivel_plataforma
      )
      or exists (
        select 1
        from plataforma.usuarios_sistema us
        join plataforma.organizacoes o on o.id = us.organizacao_id
        join plataforma.assinaturas a on a.organizacao_id = o.id
        where us.auth_user_id = (select auth.uid())
          and us.sistema = 'tce'
          and us.status = 'ativo'
          and o.status = 'ativo'
          and a.sistema = 'tce'
          and a.status = 'ativa'
          and o.codigo = c.codigo
      )
    )
  order by c.nome;
$function$;

create or replace function tce_internal.tem_acesso_municipio(p_codigo_municipio text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select (select auth.uid()) is not null
    and exists (select 1 from auth.users u where u.id = (select auth.uid()) and u.deleted_at is null)
    and p_codigo_municipio ~ '^[0-9]{3}$'
    and exists (
      select 1
      from plataforma.catalogo_municipios c
      where c.codigo = p_codigo_municipio
        and (
          exists (
            select 1
            from plataforma.usuarios_sistema us
            join plataforma.papeis p on p.sistema = us.sistema and p.papel = us.papel
            where us.auth_user_id = (select auth.uid())
              and us.sistema = 'tce'
              and us.status = 'ativo'
              and us.organizacao_id is null
              and us.papel = 'superadmin'
              and p.nivel_plataforma
          )
          or exists (
            select 1
            from plataforma.usuarios_sistema us
            join plataforma.organizacoes o on o.id = us.organizacao_id
            join plataforma.assinaturas a on a.organizacao_id = o.id
            where us.auth_user_id = (select auth.uid())
              and us.sistema = 'tce'
              and us.status = 'ativo'
              and o.status = 'ativo'
              and o.codigo = p_codigo_municipio
              and a.sistema = 'tce'
              and a.status = 'ativa'
          )
        )
    );
$function$;

create or replace function tce_internal.sou_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select (select auth.uid()) is not null
    and exists (select 1 from auth.users u where u.id = (select auth.uid()) and u.deleted_at is null)
    and exists (
      select 1
      from plataforma.usuarios_sistema us
      join plataforma.papeis p on p.sistema = us.sistema and p.papel = us.papel
      where us.auth_user_id = (select auth.uid())
        and us.sistema = 'tce'
        and us.status = 'ativo'
        and us.organizacao_id is null
        and us.papel = 'superadmin'
        and p.nivel_plataforma
    );
$function$;

-- Vinculo municipal sem duplicar auth.users. Bootstrap de superadmin e feito
-- uma unica vez pelo operador privilegiado apos backup e conferencia do alvo.
create or replace function tce_internal.vincular_usuario_existente(
  p_auth_user_id uuid,
  p_codigo_municipio text,
  p_papel text,
  p_nome text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_organizacao_id uuid;
  v_usuario_id uuid;
begin
  if (select auth.uid()) is null or not tce_internal.sou_superadmin() then
    raise exception 'Operacao restrita a equipe interna.' using errcode = '42501';
  end if;

  if p_papel not in ('tenant_admin', 'editor', 'viewer')
    or p_codigo_municipio !~ '^[0-9]{3}$'
    or nullif(btrim(p_nome), '') is null then
    raise exception 'Parametros de vinculo invalidos.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from auth.users u
    where u.id = p_auth_user_id
      and u.deleted_at is null
      and nullif(u.encrypted_password, '') is not null
  ) then
    raise exception 'Conta ativa com senha nao encontrada.' using errcode = '22023';
  end if;

  select o.id into v_organizacao_id
  from plataforma.organizacoes o
  join plataforma.assinaturas a on a.organizacao_id = o.id
  where o.codigo = p_codigo_municipio
    and o.status = 'ativo'
    and a.sistema = 'tce'
    and a.status = 'ativa';

  if v_organizacao_id is null then
    raise exception 'Municipio sem assinatura TCE ativa.' using errcode = '22023';
  end if;

  insert into plataforma.usuarios_sistema
    (auth_user_id, sistema, organizacao_id, papel, nome, status)
  values
    (p_auth_user_id, 'tce', v_organizacao_id, p_papel, btrim(p_nome), 'ativo')
  returning id into v_usuario_id;

  return v_usuario_id;
end;
$function$;

revoke all on all routines in schema tce_internal from public, anon, authenticated;
grant execute on function tce_internal.meu_papel() to authenticated, service_role;
grant execute on function tce_internal.listar_municipios() to authenticated, service_role;
grant execute on function tce_internal.tem_acesso_municipio(text) to authenticated, service_role;
grant execute on function tce_internal.sou_superadmin() to authenticated, service_role;
grant execute on function tce_internal.vincular_usuario_existente(uuid, text, text, text) to authenticated, service_role;

alter default privileges for role postgres in schema tce revoke execute on routines from public;

create or replace function tce.meu_papel()
returns text language sql stable security invoker set search_path = ''
as $function$ select tce_internal.meu_papel(); $function$;

create or replace function tce.listar_municipios()
returns table(codigo_municipio text, nome_municipio text)
language sql stable security invoker set search_path = ''
as $function$ select * from tce_internal.listar_municipios(); $function$;

create or replace function tce.tem_acesso_municipio(p_codigo_municipio text)
returns boolean language sql stable security invoker set search_path = ''
as $function$ select tce_internal.tem_acesso_municipio(p_codigo_municipio); $function$;

create or replace function tce.sou_superadmin()
returns boolean language sql stable security invoker set search_path = ''
as $function$ select tce_internal.sou_superadmin(); $function$;

create or replace function tce.vincular_usuario_existente(
  p_auth_user_id uuid, p_codigo_municipio text, p_papel text, p_nome text
)
returns uuid language sql security invoker set search_path = ''
as $function$
  select tce_internal.vincular_usuario_existente(p_auth_user_id, p_codigo_municipio, p_papel, p_nome);
$function$;

revoke all on function tce.meu_papel() from public, anon, authenticated;
revoke all on function tce.listar_municipios() from public, anon, authenticated;
revoke all on function tce.tem_acesso_municipio(text) from public, anon, authenticated;
revoke all on function tce.sou_superadmin() from public, anon, authenticated;
revoke all on function tce.vincular_usuario_existente(uuid, text, text, text) from public, anon, authenticated;
grant execute on function tce.meu_papel() to authenticated, service_role;
grant execute on function tce.listar_municipios() to authenticated, service_role;
grant execute on function tce.tem_acesso_municipio(text) to authenticated, service_role;
grant execute on function tce.sou_superadmin() to authenticated, service_role;
grant execute on function tce.vincular_usuario_existente(uuid, text, text, text) to authenticated, service_role;
