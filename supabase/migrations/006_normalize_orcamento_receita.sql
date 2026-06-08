alter table public.tce_orcamentos_receitas
  add column if not exists codigo_unidade_orcamentaria text,
  add column if not exists tipo_fonte text,
  add column if not exists codigo_fonte text,
  add column if not exists descricao_rubrica text;

alter table public.tce_orcamentos_receitas
  drop constraint if exists tce_orcamentos_receitas_codigo_municipio_exercicio_orcamento_codigo_orgao_codigo_rubrica_key;

alter table public.tce_orcamentos_receitas
  drop constraint if exists tce_orcamentos_receitas_codigo_municipio_exercicio_orcament_key;

alter table public.tce_orcamentos_receitas
  add constraint tce_orcamentos_receitas_scope_key unique (
    codigo_municipio,
    exercicio_orcamento,
    codigo_orgao,
    codigo_unidade_orcamentaria,
    codigo_rubrica,
    codigo_fonte
  );

create index if not exists idx_tce_orcamentos_receitas_scope
  on public.tce_orcamentos_receitas (codigo_municipio, exercicio_orcamento, codigo_orgao, codigo_unidade_orcamentaria);
