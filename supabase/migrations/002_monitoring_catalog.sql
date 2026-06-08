create table if not exists public.tce_endpoint_groups (
  slug text primary key,
  nome text not null,
  ordem integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tce_endpoint_catalog (
  endpoint text primary key,
  grupo_slug text not null references public.tce_endpoint_groups(slug),
  descricao text not null,
  parametros_obrigatorios jsonb not null default '[]'::jsonb,
  parametros_opcionais jsonb not null default '[]'::jsonb,
  frequencia_sugerida text not null default 'manual' check (
    frequencia_sugerida in ('uma_vez', 'anual', 'mensal', 'evento', 'manual')
  ),
  habilitado_por_padrao boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tce_municipios_monitorados (
  codigo_municipio text primary key references public.municipios(codigo_municipio),
  ativo boolean not null default true,
  sincronizacao_automatica boolean not null default true,
  exercicio_orcamento_padrao text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tce_sync_subscriptions (
  id uuid primary key default gen_random_uuid(),
  codigo_municipio text not null references public.tce_municipios_monitorados(codigo_municipio),
  endpoint text not null references public.tce_endpoint_catalog(endpoint),
  ativo boolean not null default true,
  sincronizacao_automatica boolean not null default true,
  meses_retroativos integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (codigo_municipio, endpoint)
);

create table if not exists public.tce_sync_availability_checks (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null references public.tce_endpoint_catalog(endpoint),
  codigo_municipio text not null references public.tce_municipios_monitorados(codigo_municipio),
  exercicio_orcamento text,
  data_referencia_doc text,
  status text not null check (status in ('available', 'not_available', 'error')),
  rows_found integer,
  error_message text,
  checked_at timestamptz not null default now()
);

create index if not exists idx_tce_sync_subscriptions_active
  on public.tce_sync_subscriptions (ativo, sincronizacao_automatica, codigo_municipio);

create index if not exists idx_tce_availability_scope
  on public.tce_sync_availability_checks (endpoint, codigo_municipio, exercicio_orcamento, data_referencia_doc, checked_at desc);

insert into public.tce_endpoint_groups (slug, nome, ordem) values
  ('auxiliares', 'Auxiliares', 1),
  ('bas', 'Documentação de Informações Básicas (BAS)', 2),
  ('orc', 'Documentação referente ao Orçamento Municipal (ORC)', 3),
  ('bal', 'Documentação referente aos Balancetes (BAL)', 4),
  ('lic', 'Documentação referente às Licitações e Contratos (LIC)', 5),
  ('crd', 'Documentação referente à Abertura de Créditos Adicionais (CRD)', 6),
  ('out', 'Outros Tipos de Documentos (OUT)', 7),
  ('ose', 'Documentação de Obras Municipais ou Serviços de Engenharia (OSE)', 8),
  ('cpf', 'Cadastro de Pessoal e Folha (CPF)', 9),
  ('rpp', 'Regime Próprio de Previdência Social (RPP)', 10),
  ('pat', 'Patrimônio (PAT)', 11),
  ('vei', 'Veículos (VEI)', 12),
  ('emp', 'Documentação referente a Empenhos (EMP)', 13),
  ('liq', 'Documentação referente a Liquidações (LIQ)', 14),
  ('pag', 'Documentação referente a Pagamentos (PAG)', 15)
on conflict (slug) do update set
  nome = excluded.nome,
  ordem = excluded.ordem;

insert into public.tce_endpoint_catalog (
  endpoint,
  grupo_slug,
  descricao,
  parametros_obrigatorios,
  parametros_opcionais,
  frequencia_sugerida,
  habilitado_por_padrao
) values
  ('municipios', 'auxiliares', 'Municípios', '[]', '["codigo_municipio","nome_municipio","codigo_municipio_ibge","codigo_municipio_geonames"]', 'uma_vez', true),
  ('funcoes', 'auxiliares', 'Funções', '[]', '["codigo_funcao","nome_funcao"]', 'uma_vez', true),
  ('tipos_unidades_administrativas', 'auxiliares', 'Tipos de Unidades Administrativas', '[]', '["codigo_tipo_unidade_administrativa","nome_tipo_unidade_administrativa"]', 'uma_vez', true),
  ('gestores', 'bas', 'Gestores', '["codigo_municipio","exercicio_orcamento"]', '["codigo_unidade_gestora","codigo_orgao","codigo_unidade_orcamentaria","data_referencia_doc"]', 'anual', true),
  ('orgaos', 'bas', 'Órgãos', '["codigo_municipio","exercicio_orcamento"]', '["codigo_orgao"]', 'anual', true),
  ('unidades_orcamentarias', 'bas', 'Unidades Orçamentárias', '["codigo_municipio","exercicio_orcamento"]', '["codigo_orgao","codigo_unidade_orcamentaria"]', 'anual', true),
  ('contas_bancarias_municipio', 'bas', 'Contas Bancárias do Município', '["codigo_municipio","exercicio_orcamento"]', '["codigo_orgao","codigo_unidade_orcamentaria"]', 'anual', true),
  ('contas_extra_orcamentarias', 'bas', 'Contas Extra-Orçamentárias', '["codigo_municipio","exercicio_orcamento"]', '[]', 'anual', false),
  ('unidades_gestoras', 'bas', 'Unidades Gestoras', '["codigo_municipio","exercicio_orcamento"]', '["codigo_unidade_gestora"]', 'anual', true),
  ('ordenadores_despesas', 'bas', 'Ordenadores de Despesas', '["codigo_municipio","exercicio_orcamento"]', '["codigo_orgao","codigo_unidade_orcamentaria"]', 'anual', true),
  ('empresas_estatais', 'bas', 'Empresas Estatais', '["codigo_municipio","exercicio_orcamento"]', '[]', 'anual', false),
  ('dados_orcamentos', 'orc', 'Dados dos Orçamentos', '["codigo_municipio","exercicio_orcamento"]', '[]', 'anual', true),
  ('orcamento_receita', 'orc', 'Orçamento de Receita', '["codigo_municipio","exercicio_orcamento"]', '["codigo_orgao"]', 'anual', true),
  ('orcamento_despesa', 'orc', 'Orçamento de Despesa', '["codigo_municipio","exercicio_orcamento"]', '["codigo_orgao"]', 'anual', true),
  ('orcamento_despesas_projetos_atividades', 'orc', 'Orçamento de Despesas por Projetos e Atividades', '["codigo_municipio","exercicio_orcamento"]', '["codigo_orgao"]', 'anual', true),
  ('elementos_despesas_projetos_atividades', 'orc', 'Elementos de Despesas por Projetos e Atividades', '["codigo_municipio","exercicio_orcamento"]', '["codigo_orgao"]', 'anual', true),
  ('programas_governo', 'orc', 'Programas de Governo', '["codigo_municipio","exercicio_orcamento"]', '[]', 'anual', true),
  ('balancetes_receitas_orcamentarias', 'bal', 'Balancetes de Receitas Orçamentárias', '["codigo_municipio","exercicio_orcamento","data_referencia_doc"]', '["codigo_orgao","codigo_unidade_orcamentaria"]', 'mensal', true),
  ('balancetes_despesas_orcamentarias', 'bal', 'Balancetes de Despesas Orçamentárias', '["codigo_municipio","exercicio_orcamento","data_referencia_doc"]', '["codigo_orgao","codigo_unidade_orcamentaria"]', 'mensal', true),
  ('balancetes_receitas_extra_orcamentarias', 'bal', 'Balancetes de Receitas Extra-Orçamentárias', '["codigo_municipio","exercicio_orcamento","data_referencia_doc"]', '[]', 'mensal', true),
  ('balancetes_despesas_extra_orcamentarias', 'bal', 'Balancetes de Despesas Extra-Orçamentárias', '["codigo_municipio","exercicio_orcamento","data_referencia_doc"]', '[]', 'mensal', true),
  ('balancetes_contabeis', 'bal', 'Balancetes Contábeis', '["codigo_municipio","exercicio_orcamento","data_referencia_doc"]', '[]', 'mensal', false)
on conflict (endpoint) do update set
  grupo_slug = excluded.grupo_slug,
  descricao = excluded.descricao,
  parametros_obrigatorios = excluded.parametros_obrigatorios,
  parametros_opcionais = excluded.parametros_opcionais,
  frequencia_sugerida = excluded.frequencia_sugerida,
  habilitado_por_padrao = excluded.habilitado_por_padrao,
  updated_at = now();

insert into public.tce_municipios_monitorados (
  codigo_municipio,
  ativo,
  sincronizacao_automatica,
  exercicio_orcamento_padrao,
  observacoes
) values (
  '014',
  true,
  true,
  '202500',
  'Municipio piloto do APITCE'
) on conflict (codigo_municipio) do update set
  ativo = excluded.ativo,
  sincronizacao_automatica = excluded.sincronizacao_automatica,
  exercicio_orcamento_padrao = excluded.exercicio_orcamento_padrao,
  observacoes = excluded.observacoes,
  updated_at = now();

insert into public.tce_sync_subscriptions (
  codigo_municipio,
  endpoint,
  ativo,
  sincronizacao_automatica
)
select
  '014',
  endpoint,
  true,
  true
from public.tce_endpoint_catalog
where habilitado_por_padrao = true
on conflict (codigo_municipio, endpoint) do update set
  ativo = excluded.ativo,
  sincronizacao_automatica = excluded.sincronizacao_automatica,
  updated_at = now();

