create table if not exists public.tce_unidades_gestoras (
  id uuid primary key default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  data_referencia_doc text,
  codigo_orgao text not null,
  codigo_unidade_orcamentaria text not null,
  codigo_unidade_gestora text not null,
  nome_unidade_gestora text,
  numero_lei_criacao text,
  data_criacao_ug date,
  data_extincao_ug date,
  data_inclusao_uo date,
  data_exclusao_uo date,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (
    codigo_municipio,
    exercicio_orcamento,
    data_referencia_doc,
    codigo_orgao,
    codigo_unidade_orcamentaria,
    codigo_unidade_gestora
  )
);

create index if not exists idx_tce_unidades_gestoras_scope
  on public.tce_unidades_gestoras (codigo_municipio, exercicio_orcamento, codigo_orgao, codigo_unidade_orcamentaria);

create table if not exists public.tce_ordenadores_despesas (
  id uuid primary key default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  data_referencia_doc text,
  codigo_orgao text not null,
  codigo_unidade_orcamentaria text not null,
  codigo_unidade_gestora text not null,
  nome_ordenador text,
  cpf_ordenador text,
  tipo_cargo text,
  codigo_vinculo text,
  codigo_ingresso text,
  numero_expediente_nomeacao text,
  data_inicio_gestao_ordenador date,
  data_fim_gestao_ordenador date,
  data_inclusao_unidade_orcamentaria date,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (
    codigo_municipio,
    exercicio_orcamento,
    data_referencia_doc,
    codigo_orgao,
    codigo_unidade_orcamentaria,
    codigo_unidade_gestora,
    nome_ordenador,
    data_inicio_gestao_ordenador
  )
);

create index if not exists idx_tce_ordenadores_despesas_scope
  on public.tce_ordenadores_despesas (codigo_municipio, exercicio_orcamento, codigo_orgao, codigo_unidade_orcamentaria);
