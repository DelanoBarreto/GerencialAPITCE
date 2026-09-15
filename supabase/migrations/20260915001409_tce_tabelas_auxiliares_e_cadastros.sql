create table tce.tce_funcoes (
  codigo_funcao text not null,
  nome_funcao text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint tce_funcoes_pkey primary key (codigo_funcao)
);

create table tce.tce_tipos_unidades_administrativas (
  codigo_tipo_unidade_administrativa text not null,
  nome_tipo_unidade_administrativa text,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint tce_tipos_unidades_administrativas_pkey primary key (codigo_tipo_unidade_administrativa)
);

create table tce.tce_orgaos (
  id uuid not null default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  codigo_orgao text not null,
  nome_orgao text,
  cgc_orgao text,
  codigo_tipo_unidade text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_orgaos_pkey primary key (id),
  constraint tce_orgaos_codigo_municipio_exercicio_orcamento_codigo_orga_key
    unique (codigo_municipio, exercicio_orcamento, codigo_orgao)
);

create table tce.tce_unidades_orcamentarias (
  id uuid not null default gen_random_uuid(),
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
  constraint tce_unidades_orcamentarias_pkey primary key (id),
  constraint tce_unidades_orcamentarias_codigo_municipio_exercicio_orcam_key
    unique (codigo_municipio, exercicio_orcamento, codigo_orgao, codigo_unidade_orcamentaria)
);

create table tce.tce_unidades_gestoras (
  id uuid not null default gen_random_uuid(),
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
  constraint tce_unidades_gestoras_pkey primary key (id),
  constraint tce_unidades_gestoras_codigo_municipio_exercicio_orcamento__key
    unique (codigo_municipio, exercicio_orcamento, data_referencia_doc, codigo_orgao, codigo_unidade_orcamentaria, codigo_unidade_gestora)
);

create table tce.tce_ordenadores_despesas (
  id uuid not null default gen_random_uuid(),
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
  constraint tce_ordenadores_despesas_pkey primary key (id),
  constraint tce_ordenadores_despesas_codigo_municipio_exercicio_orcamen_key
    unique (codigo_municipio, exercicio_orcamento, data_referencia_doc, codigo_orgao, codigo_unidade_orcamentaria, codigo_unidade_gestora, nome_ordenador, data_inicio_gestao_ordenador)
);

create table tce.tce_contas_bancarias_municipio (
  id uuid not null default gen_random_uuid(),
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
  valor_saldo_abertura numeric(18,2),
  descricao_objetivo_conta text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_contas_bancarias_municipio_pkey primary key (id),
  constraint tce_contas_bancarias_municipi_codigo_municipio_exercicio_or_key
    unique (codigo_municipio, exercicio_orcamento, data_referencia_doc, codigo_orgao, codigo_unidade_orcamentaria, numero_banco, numero_agencia, numero_conta)
);

create table tce.tce_programas_governo (
  id uuid not null default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  codigo_programa text not null,
  numero_programa text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_programas_governo_pkey primary key (id),
  constraint tce_programas_governo_codigo_municipio_exercicio_orcamento__key
    unique (codigo_municipio, exercicio_orcamento, codigo_programa)
);
