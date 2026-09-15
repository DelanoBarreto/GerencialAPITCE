create table if not exists public.tce_municipio_exercicios_monitorados (
  codigo_municipio text not null references public.tce_municipios_monitorados(codigo_municipio),
  exercicio_orcamento text not null,
  ano integer not null,
  ativo boolean not null default true,
  sincronizacao_automatica boolean not null default true,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (codigo_municipio, exercicio_orcamento),
  check (exercicio_orcamento ~ '^[0-9]{6}$'),
  check (ano between 2000 and 2100)
);

insert into public.tce_municipio_exercicios_monitorados (
  codigo_municipio,
  exercicio_orcamento,
  ano,
  ativo,
  sincronizacao_automatica,
  observacoes
)
select distinct
  codigo_municipio,
  exercicio_orcamento,
  left(exercicio_orcamento, 4)::integer,
  true,
  true,
  'Exercicio migrado das assinaturas existentes'
from public.tce_sync_subscriptions
where exercicio_orcamento is not null
on conflict (codigo_municipio, exercicio_orcamento) do update set
  ativo = excluded.ativo,
  sincronizacao_automatica = excluded.sincronizacao_automatica,
  updated_at = now();

alter table public.tce_sync_subscriptions
  drop constraint if exists tce_sync_subscriptions_exercicio_fk;

alter table public.tce_sync_subscriptions
  add constraint tce_sync_subscriptions_exercicio_fk
  foreign key (codigo_municipio, exercicio_orcamento)
  references public.tce_municipio_exercicios_monitorados(codigo_municipio, exercicio_orcamento);

create index if not exists idx_tce_municipio_exercicios_active
  on public.tce_municipio_exercicios_monitorados (ativo, sincronizacao_automatica, codigo_municipio, exercicio_orcamento);
