-- Tabelas de catalogo de endpoints (sem dependencia de municipio).
create table tce.tce_endpoint_groups (
  slug text not null,
  nome text not null,
  ordem integer not null,
  created_at timestamptz not null default now(),
  constraint tce_endpoint_groups_pkey primary key (slug)
);

create table tce.tce_endpoint_catalog (
  endpoint text not null,
  grupo_slug text not null,
  descricao text not null,
  parametros_obrigatorios jsonb not null default '[]'::jsonb,
  parametros_opcionais jsonb not null default '[]'::jsonb,
  frequencia_sugerida text not null default 'manual'::text,
  habilitado_por_padrao boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_endpoint_catalog_pkey primary key (endpoint),
  constraint tce_endpoint_catalog_grupo_slug_fkey foreign key (grupo_slug)
    references tce.tce_endpoint_groups(slug),
  constraint tce_endpoint_catalog_frequencia_sugerida_check
    check (frequencia_sugerida = any (array['uma_vez','anual','mensal','evento','manual']))
);

-- Quem e monitorado. O catalogo da plataforma tem os 184 municipios do Ceara,
-- mas so entram aqui os que sao cliente, prospect ou amostra: os dados do TCE
-- sao carregados apenas para estes.
create table tce.tce_municipios_monitorados (
  codigo_municipio text not null,
  ativo boolean not null default true,
  sincronizacao_automatica boolean not null default true,
  exercicio_orcamento_padrao text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_municipios_monitorados_pkey primary key (codigo_municipio),
  constraint tce_municipios_monitorados_codigo_municipio_fkey foreign key (codigo_municipio)
    references plataforma.catalogo_municipios(codigo)
);

create table tce.tce_municipio_exercicios_monitorados (
  codigo_municipio text not null,
  exercicio_orcamento text not null,
  ano integer not null,
  ativo boolean not null default true,
  sincronizacao_automatica boolean not null default true,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_municipio_exercicios_monitorados_pkey primary key (codigo_municipio, exercicio_orcamento),
  constraint tce_municipio_exercicios_monitorados_codigo_municipio_fkey foreign key (codigo_municipio)
    references tce.tce_municipios_monitorados(codigo_municipio),
  constraint tce_municipio_exercicios_monitorados_ano_check check (ano >= 2000 and ano <= 2100),
  constraint tce_municipio_exercicios_monitorados_exercicio_orcamento_check
    check (exercicio_orcamento ~ '^[0-9]{6}$')
);

create table tce.tce_sync_subscriptions (
  id uuid not null default gen_random_uuid(),
  codigo_municipio text not null,
  endpoint text not null,
  exercicio_orcamento text not null,
  ativo boolean not null default true,
  sincronizacao_automatica boolean not null default true,
  meses_retroativos integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_sync_subscriptions_pkey primary key (id),
  constraint tce_sync_subscriptions_municipio_exercicio_endpoint_key
    unique (codigo_municipio, exercicio_orcamento, endpoint),
  constraint tce_sync_subscriptions_codigo_municipio_fkey foreign key (codigo_municipio)
    references tce.tce_municipios_monitorados(codigo_municipio),
  constraint tce_sync_subscriptions_endpoint_fkey foreign key (endpoint)
    references tce.tce_endpoint_catalog(endpoint),
  constraint tce_sync_subscriptions_exercicio_fk foreign key (codigo_municipio, exercicio_orcamento)
    references tce.tce_municipio_exercicios_monitorados(codigo_municipio, exercicio_orcamento)
);

create table tce.tce_sync_log (
  id uuid not null default gen_random_uuid(),
  endpoint text not null,
  codigo_municipio text,
  exercicio_orcamento text,
  data_referencia_doc text,
  start_index integer not null default 0,
  count_requested integer not null default 1000,
  rows_received integer not null default 0,
  status text not null,
  source_url text,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint tce_sync_log_pkey primary key (id),
  constraint tce_sync_log_status_check check (status = any (array['started','ok','error']))
);

create table tce.tce_sync_availability_checks (
  id uuid not null default gen_random_uuid(),
  endpoint text not null,
  codigo_municipio text not null,
  exercicio_orcamento text,
  data_referencia_doc text,
  status text not null,
  rows_found integer,
  error_message text,
  checked_at timestamptz not null default now(),
  constraint tce_sync_availability_checks_pkey primary key (id),
  constraint tce_sync_availability_checks_codigo_municipio_fkey foreign key (codigo_municipio)
    references tce.tce_municipios_monitorados(codigo_municipio),
  constraint tce_sync_availability_checks_endpoint_fkey foreign key (endpoint)
    references tce.tce_endpoint_catalog(endpoint),
  constraint tce_sync_availability_checks_status_check
    check (status = any (array['available','not_available','error']))
);

create table tce.tce_raw_records (
  id uuid not null default gen_random_uuid(),
  endpoint text not null,
  codigo_municipio text,
  exercicio_orcamento text,
  data_referencia_doc text,
  natural_key text not null,
  payload jsonb not null,
  source_url text not null,
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tce_raw_records_pkey primary key (id),
  constraint tce_raw_records_endpoint_natural_key_key unique (endpoint, natural_key)
);
