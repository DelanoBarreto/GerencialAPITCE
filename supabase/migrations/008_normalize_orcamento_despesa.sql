create table if not exists public.tce_orcamentos_despesas (
  id uuid primary key default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  codigo_orgao text not null,
  codigo_unidade_orcamentaria text not null,
  codigo_elemento_despesa text not null,
  nome_elemento_despesa text,
  valor_total_fixado numeric(18, 2),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (
    codigo_municipio,
    exercicio_orcamento,
    codigo_orgao,
    codigo_unidade_orcamentaria,
    codigo_elemento_despesa
  )
);

create index if not exists idx_tce_orcamentos_despesas_scope
  on public.tce_orcamentos_despesas (codigo_municipio, exercicio_orcamento, codigo_orgao, codigo_unidade_orcamentaria);
