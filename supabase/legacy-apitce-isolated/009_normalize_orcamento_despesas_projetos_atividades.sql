create table if not exists public.tce_orcamentos_despesas_projetos_atividades (
  id uuid primary key default gen_random_uuid(),
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
  valor_total_fixado_projeto_atividade numeric(18, 2),
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
    codigo_tipo_orcamento,
    codigo_projeto_atividade,
    numero_projeto_atividade,
    numero_subprojeto_atividade
  )
);

create index if not exists idx_tce_orcamentos_despesas_proj_scope
  on public.tce_orcamentos_despesas_projetos_atividades (
    codigo_municipio,
    exercicio_orcamento,
    codigo_orgao,
    codigo_unidade_orcamentaria
  );
