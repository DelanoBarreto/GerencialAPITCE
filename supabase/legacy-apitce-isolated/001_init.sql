create extension if not exists pgcrypto;

create table if not exists public.tce_sync_log (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  codigo_municipio text,
  exercicio_orcamento text,
  data_referencia_doc text,
  start_index integer not null default 0,
  count_requested integer not null default 1000,
  rows_received integer not null default 0,
  status text not null check (status in ('started', 'ok', 'error')),
  source_url text,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists idx_tce_sync_log_lookup
  on public.tce_sync_log (endpoint, codigo_municipio, exercicio_orcamento, data_referencia_doc, started_at desc);

create table if not exists public.tce_raw_records (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null,
  codigo_municipio text,
  exercicio_orcamento text,
  data_referencia_doc text,
  natural_key text not null,
  payload jsonb not null,
  source_url text not null,
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (endpoint, natural_key)
);

create index if not exists idx_tce_raw_records_scope
  on public.tce_raw_records (endpoint, codigo_municipio, exercicio_orcamento, data_referencia_doc);

create index if not exists idx_tce_raw_records_payload
  on public.tce_raw_records using gin (payload);

create table if not exists public.municipios (
  codigo_municipio text primary key,
  nome_municipio text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.tce_balancetes_receitas_orcamentarias (
  id uuid primary key default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  codigo_orgao text not null,
  codigo_unidade_orcamentaria text not null,
  codigo_rubrica text not null,
  data_referencia_doc text not null,
  tipo_balancete text,
  valor_previsto_orcamento numeric(18, 2),
  valor_anulacoes_no_mes numeric(18, 2),
  valor_arrecadacao_no_mes numeric(18, 2),
  valor_arrecadacao_ate_mes numeric(18, 2),
  valor_anulacoes_ate_mes numeric(18, 2),
  tipo_fonte text,
  codigo_fonte text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (
    codigo_municipio,
    exercicio_orcamento,
    codigo_orgao,
    codigo_unidade_orcamentaria,
    codigo_rubrica,
    data_referencia_doc,
    codigo_fonte
  )
);

create index if not exists idx_bal_rec_municipio_competencia
  on public.tce_balancetes_receitas_orcamentarias (codigo_municipio, exercicio_orcamento, data_referencia_doc);

create index if not exists idx_bal_rec_orgao_unidade
  on public.tce_balancetes_receitas_orcamentarias (codigo_orgao, codigo_unidade_orcamentaria);

create table if not exists public.tce_orcamentos_receitas (
  id uuid primary key default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  codigo_orgao text,
  codigo_rubrica text not null,
  valor_previsto_orcamento numeric(18, 2),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (codigo_municipio, exercicio_orcamento, codigo_orgao, codigo_rubrica)
);

create index if not exists idx_orc_rec_municipio_exercicio
  on public.tce_orcamentos_receitas (codigo_municipio, exercicio_orcamento);
