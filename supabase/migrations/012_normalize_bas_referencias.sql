create table if not exists public.tce_orgaos (
  id uuid primary key default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  codigo_orgao text not null,
  nome_orgao text,
  cgc_orgao text,
  codigo_tipo_unidade text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (codigo_municipio, exercicio_orcamento, codigo_orgao)
);

create index if not exists idx_tce_orgaos_scope
  on public.tce_orgaos (codigo_municipio, exercicio_orcamento);

create table if not exists public.tce_unidades_orcamentarias (
  id uuid primary key default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  codigo_orgao text not null,
  codigo_unidade_orcamentaria text not null,
  nome_unidade text,
  codigo_tipo_unidade text,
  tipo_administracao_unidade text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (
    codigo_municipio,
    exercicio_orcamento,
    codigo_orgao,
    codigo_unidade_orcamentaria
  )
);

create index if not exists idx_tce_unidades_orcamentarias_scope
  on public.tce_unidades_orcamentarias (codigo_municipio, exercicio_orcamento, codigo_orgao);
