create table if not exists public.tce_dados_orcamentos (
  id uuid primary key default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  data_envio_loa date,
  nu_lei_orcamento text,
  data_aprovacao_loa date,
  data_publicacao_loa date,
  percentual_supl_orcamento numeric(18, 2),
  valor_total_supl_orcamento numeric(18, 2),
  valor_total_fixado_orcamento numeric(18, 2),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (codigo_municipio, exercicio_orcamento)
);

create index if not exists idx_tce_dados_orcamentos_scope
  on public.tce_dados_orcamentos (codigo_municipio, exercicio_orcamento);

create table if not exists public.tce_programas_governo (
  id uuid primary key default gen_random_uuid(),
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  codigo_programa text not null,
  numero_programa text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (codigo_municipio, exercicio_orcamento, codigo_programa)
);

create index if not exists idx_tce_programas_governo_scope
  on public.tce_programas_governo (codigo_municipio, exercicio_orcamento);

create table if not exists public.tce_elementos_despesas_projetos_atividades (
  id uuid primary key default gen_random_uuid(),
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
  valor_atual_categoria_economica numeric(18, 2),
  valor_orcado_categoria_economica numeric(18, 2),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (
    codigo_municipio,
    exercicio_orcamento,
    codigo_orgao,
    codigo_unidade_orcamentaria,
    codigo_funcao,
    codigo_subfuncao,
    codigo_programa,
    codigo_projeto_atividade,
    numero_projeto_atividade,
    numero_subprojeto_atividade,
    codigo_elemento_despesa,
    codigo_fonte
  )
);

create index if not exists idx_tce_elementos_despesas_proj_scope
  on public.tce_elementos_despesas_projetos_atividades (
    codigo_municipio,
    exercicio_orcamento,
    codigo_orgao,
    codigo_unidade_orcamentaria
  );
