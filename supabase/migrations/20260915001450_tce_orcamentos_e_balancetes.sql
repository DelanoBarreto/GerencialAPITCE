create table tce.tce_dados_orcamentos (
  id uuid not null default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  data_envio_loa date,
  nu_lei_orcamento text,
  data_aprovacao_loa date,
  data_publicacao_loa date,
  percentual_supl_orcamento numeric(18,2),
  valor_total_supl_orcamento numeric(18,2),
  valor_total_fixado_orcamento numeric(18,2),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_dados_orcamentos_pkey primary key (id),
  constraint tce_dados_orcamentos_codigo_municipio_exercicio_orcamento_key
    unique (codigo_municipio, exercicio_orcamento)
);

create table tce.tce_orcamentos_receitas (
  id uuid not null default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  codigo_orgao text,
  codigo_unidade_orcamentaria text,
  codigo_rubrica text not null,
  descricao_rubrica text,
  tipo_fonte text,
  codigo_fonte text,
  valor_previsto_orcamento numeric(18,2),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_orcamentos_receitas_pkey primary key (id),
  constraint tce_orcamentos_receitas_scope_key
    unique (codigo_municipio, exercicio_orcamento, codigo_orgao, codigo_unidade_orcamentaria, codigo_rubrica, codigo_fonte)
);

create table tce.tce_orcamentos_despesas (
  id uuid not null default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  codigo_orgao text not null,
  codigo_unidade_orcamentaria text not null,
  codigo_elemento_despesa text not null,
  nome_elemento_despesa text,
  valor_total_fixado numeric(18,2),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_orcamentos_despesas_pkey primary key (id),
  constraint tce_orcamentos_despesas_codigo_municipio_exercicio_orcament_key
    unique (codigo_municipio, exercicio_orcamento, codigo_orgao, codigo_unidade_orcamentaria, codigo_elemento_despesa)
);

create table tce.tce_orcamentos_despesas_projetos_atividades (
  id uuid not null default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  codigo_orgao text not null,
  codigo_unidade_orcamentaria text not null,
  codigo_funcao text not null,
  codigo_subfuncao text not null,
  codigo_programa text not null,
  codigo_tipo_orcamento text not null,
  codigo_projeto_atividade text not null,
  numero_projeto_atividade text not null,
  numero_subprojeto_atividade text not null,
  nome_projeto_atividade text,
  descricao_projeto_atividade text,
  valor_total_fixado_projeto_atividade numeric(18,2),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_orcamentos_despesas_projetos_atividades_pkey primary key (id),
  constraint tce_orcamentos_despesas_proje_codigo_municipio_exercicio_or_key
    unique (codigo_municipio, exercicio_orcamento, codigo_orgao, codigo_unidade_orcamentaria, codigo_funcao, codigo_subfuncao, codigo_programa, codigo_tipo_orcamento, codigo_projeto_atividade, numero_projeto_atividade, numero_subprojeto_atividade)
);

create table tce.tce_elementos_despesas_projetos_atividades (
  id uuid not null default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  codigo_orgao text not null,
  codigo_unidade_orcamentaria text not null,
  codigo_funcao text not null,
  codigo_subfuncao text not null,
  codigo_programa text not null,
  codigo_projeto_atividade text not null,
  numero_projeto_atividade text not null,
  numero_subprojeto_atividade text not null,
  codigo_elemento_despesa text not null,
  tipo_fonte text,
  codigo_fonte text not null,
  valor_atual_categoria_economica numeric(18,2),
  valor_orcado_categoria_economica numeric(18,2),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_elementos_despesas_projetos_atividades_pkey primary key (id),
  constraint tce_elementos_despesas_projet_codigo_municipio_exercicio_or_key
    unique (codigo_municipio, exercicio_orcamento, codigo_orgao, codigo_unidade_orcamentaria, codigo_funcao, codigo_subfuncao, codigo_programa, codigo_projeto_atividade, numero_projeto_atividade, numero_subprojeto_atividade, codigo_elemento_despesa, codigo_fonte)
);

create table tce.tce_balancetes_receitas_orcamentarias (
  id uuid not null default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  codigo_orgao text not null,
  codigo_unidade_orcamentaria text not null,
  codigo_rubrica text not null,
  data_referencia_doc text not null,
  tipo_balancete text,
  valor_previsto_orcamento numeric(18,2),
  valor_anulacoes_no_mes numeric(18,2),
  valor_arrecadacao_no_mes numeric(18,2),
  valor_arrecadacao_ate_mes numeric(18,2),
  valor_anulacoes_ate_mes numeric(18,2),
  tipo_fonte text,
  codigo_fonte text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_balancetes_receitas_orcamentarias_pkey primary key (id),
  constraint tce_balancetes_receitas_orcam_codigo_municipio_exercicio_or_key
    unique (codigo_municipio, exercicio_orcamento, codigo_orgao, codigo_unidade_orcamentaria, codigo_rubrica, data_referencia_doc, codigo_fonte)
);

create table tce.tce_balancetes_despesas_orcamentarias (
  id uuid not null default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  data_referencia_doc text not null,
  codigo_orgao text not null,
  codigo_unidade_orcamentaria text not null,
  codigo_funcao text not null,
  codigo_subfuncao text not null,
  codigo_programa text not null,
  codigo_projeto_atividade text not null,
  numero_projeto_atividade text not null,
  numero_subprojeto_atividade text not null,
  codigo_elemento_despesa text not null,
  tipo_balancete text,
  tipo_fonte text,
  codigo_fonte text not null,
  valor_fixado_orcamento numeric(18,2),
  valor_suplementado_no_mes numeric(18,2),
  valor_suplementado_ate_mes numeric(18,2),
  valor_anulacoes_dotacao_ate_mes numeric(18,2),
  valor_anulacoes_empenhos_no_mes numeric(18,2),
  valor_anulacoes_empenhos_ate_mes numeric(18,2),
  valor_empenhado_no_mes numeric(18,2),
  valor_empenhado_ate_mes numeric(18,2),
  valor_liquidado_no_mes numeric(18,2),
  valor_liquidado_ate_mes numeric(18,2),
  valor_pago_no_mes numeric(18,2),
  valor_pago_ate_mes numeric(18,2),
  valor_empenhado_pagar numeric(18,2),
  valor_estornos_liquidacao_no_mes numeric(18,2),
  valor_estornos_liquidacao_ate_mes numeric(18,2),
  valor_estornos_pagos_no_mes numeric(18,2),
  valor_estornos_pagos_ate_mes numeric(18,2),
  valor_saldo_dotacao numeric(18,2),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_balancetes_despesas_orcamentarias_pkey primary key (id),
  constraint tce_balancetes_despesas_orcam_codigo_municipio_exercicio_or_key
    unique (codigo_municipio, exercicio_orcamento, data_referencia_doc, codigo_orgao, codigo_unidade_orcamentaria, codigo_funcao, codigo_subfuncao, codigo_programa, codigo_projeto_atividade, numero_projeto_atividade, numero_subprojeto_atividade, codigo_elemento_despesa, codigo_fonte)
);

create table tce.tce_balancetes_receitas_extra_orcamentarias (
  id uuid not null default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  data_referencia_doc text not null,
  codigo_orgao text not null,
  codigo_unidade_orcamentaria text not null,
  codigo_conta_extraorcamentaria text not null,
  tipo_balancete text,
  valor_anulacoes_no_mes numeric(18,2),
  valor_anulacoes_ate_mes numeric(18,2),
  valor_arrecadacao_no_mes numeric(18,2),
  valor_arrecadacao_ate_mes numeric(18,2),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_balancetes_receitas_extra_orcamentarias_pkey primary key (id),
  constraint tce_balancetes_receitas_extra_codigo_municipio_exercicio_or_key
    unique (codigo_municipio, exercicio_orcamento, data_referencia_doc, codigo_orgao, codigo_unidade_orcamentaria, codigo_conta_extraorcamentaria)
);

create table tce.tce_balancetes_despesas_extra_orcamentarias (
  id uuid not null default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  data_referencia_doc text not null,
  codigo_orgao text not null,
  codigo_unidade_orcamentaria text not null,
  codigo_conta_extraorcamentaria text not null,
  tipo_balancete text,
  valor_pago_no_mes numeric(18,2),
  valor_pago_ate_mes numeric(18,2),
  valor_anulacoes_no_mes numeric(18,2),
  valor_anulacoes_ate_mes numeric(18,2),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_balancetes_despesas_extra_orcamentarias_pkey primary key (id),
  constraint tce_balancetes_despesas_extra_codigo_municipio_exercicio_or_key
    unique (codigo_municipio, exercicio_orcamento, data_referencia_doc, codigo_orgao, codigo_unidade_orcamentaria, codigo_conta_extraorcamentaria)
);
