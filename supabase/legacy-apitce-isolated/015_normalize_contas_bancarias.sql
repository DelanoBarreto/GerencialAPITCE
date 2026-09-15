create table if not exists public.tce_contas_bancarias_municipio (
  id uuid primary key default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  data_referencia_doc text,
  codigo_orgao text not null,
  codigo_unidade_orcamentaria text not null,
  numero_banco text not null,
  numero_agencia text not null,
  numero_conta text not null,
  tipo_conta text,
  codigo_funcao_conta text,
  data_abertura_conta date,
  valor_saldo_abertura numeric(18, 2),
  descricao_objetivo_conta text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (
    codigo_municipio,
    exercicio_orcamento,
    data_referencia_doc,
    codigo_orgao,
    codigo_unidade_orcamentaria,
    numero_banco,
    numero_agencia,
    numero_conta
  )
);

create index if not exists idx_tce_contas_bancarias_scope
  on public.tce_contas_bancarias_municipio (
    codigo_municipio,
    exercicio_orcamento,
    data_referencia_doc,
    codigo_orgao,
    codigo_unidade_orcamentaria
  );
