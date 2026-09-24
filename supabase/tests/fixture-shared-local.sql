-- Modelo minimo do contrato compartilhado. Nao reproduz dados ou permissoes
-- do PortalGov; serve apenas para testar migrations TCE sem tocar no remoto.
create role anon;
create role authenticated;
create role service_role bypassrls;

create schema auth;
create schema plataforma;

create table auth.users (
  id uuid primary key,
  deleted_at timestamptz,
  encrypted_password varchar
);
create function auth.uid() returns uuid language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create table plataforma.sistemas (
  chave text primary key,
  nome text not null,
  status text not null
);
create table plataforma.papeis (
  sistema text not null,
  papel text not null,
  nivel_plataforma boolean not null,
  descricao text,
  primary key (sistema, papel)
);
create table plataforma.catalogo_municipios (
  codigo text primary key,
  slug text unique not null,
  nome text not null,
  uf text not null
);
create table plataforma.organizacoes (
  id uuid primary key,
  codigo text unique,
  slug text unique not null,
  nome text not null,
  status text not null
);
create table plataforma.assinaturas (
  id uuid primary key,
  organizacao_id uuid not null references plataforma.organizacoes(id),
  sistema text not null,
  status text not null,
  unique (organizacao_id, sistema)
);
create table plataforma.usuarios_sistema (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id),
  sistema text not null,
  organizacao_id uuid references plataforma.organizacoes(id),
  papel text not null,
  nome text not null,
  status text not null,
  foreign key (sistema, papel) references plataforma.papeis(sistema, papel)
);

-- Funcoes antigas da plataforma aparecem nas migrations historicas, mas as
-- respectivas policies sao removidas pelo endurecimento TCE antes dos testes.
create function plataforma.tem_acesso(text) returns boolean language sql stable as $$ select false $$;
create function plataforma.eh_papel_de_plataforma(text) returns boolean language sql stable as $$ select false $$;
create function plataforma.papel_atual(text) returns text language sql stable as $$ select null::text $$;
create function plataforma.org_atual(text) returns uuid language sql stable as $$ select null::uuid $$;

insert into plataforma.catalogo_municipios (codigo, slug, nome, uf) values
  ('014', 'aracati', 'Aracati', 'CE'),
  ('001', 'outro', 'Outro municipio', 'CE'),
  ('002', 'suspenso', 'Municipio suspenso', 'CE');
insert into plataforma.organizacoes (id, codigo, slug, nome, status) values
  ('00000000-0000-0000-0000-000000000014', '014', 'aracati', 'Aracati', 'ativo'),
  ('00000000-0000-0000-0000-000000000001', '001', 'outro', 'Outro municipio', 'ativo'),
  ('00000000-0000-0000-0000-000000000002', '002', 'suspenso', 'Municipio suspenso', 'ativo');
