create table if not exists public.tce_funcoes (
  codigo_funcao text primary key,
  nome_funcao text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.tce_tipos_unidades_administrativas (
  codigo_tipo_unidade_administrativa text primary key,
  nome_tipo_unidade_administrativa text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
