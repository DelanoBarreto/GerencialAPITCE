create table if not exists public.tce_balancetes_receitas_extra_orcamentarias (
  id uuid primary key default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  data_referencia_doc text not null,
  codigo_orgao text not null,
  codigo_unidade_orcamentaria text not null,
  codigo_conta_extraorcamentaria text not null,
  tipo_balancete text,
  valor_anulacoes_no_mes numeric(18, 2),
  valor_anulacoes_ate_mes numeric(18, 2),
  valor_arrecadacao_no_mes numeric(18, 2),
  valor_arrecadacao_ate_mes numeric(18, 2),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (
    codigo_municipio,
    exercicio_orcamento,
    data_referencia_doc,
    codigo_orgao,
    codigo_unidade_orcamentaria,
    codigo_conta_extraorcamentaria
  )
);

create index if not exists idx_tce_bal_receitas_extra_scope
  on public.tce_balancetes_receitas_extra_orcamentarias (
    codigo_municipio,
    exercicio_orcamento,
    data_referencia_doc
  );

create table if not exists public.tce_balancetes_despesas_extra_orcamentarias (
  id uuid primary key default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  data_referencia_doc text not null,
  codigo_orgao text not null,
  codigo_unidade_orcamentaria text not null,
  codigo_conta_extraorcamentaria text not null,
  tipo_balancete text,
  valor_pago_no_mes numeric(18, 2),
  valor_pago_ate_mes numeric(18, 2),
  valor_anulacoes_no_mes numeric(18, 2),
  valor_anulacoes_ate_mes numeric(18, 2),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (
    codigo_municipio,
    exercicio_orcamento,
    data_referencia_doc,
    codigo_orgao,
    codigo_unidade_orcamentaria,
    codigo_conta_extraorcamentaria
  )
);

create index if not exists idx_tce_bal_despesas_extra_scope
  on public.tce_balancetes_despesas_extra_orcamentarias (
    codigo_municipio,
    exercicio_orcamento,
    data_referencia_doc
  );
