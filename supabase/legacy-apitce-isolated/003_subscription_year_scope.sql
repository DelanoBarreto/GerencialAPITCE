alter table public.tce_sync_subscriptions
  add column if not exists exercicio_orcamento text;

update public.tce_sync_subscriptions s
set exercicio_orcamento = coalesce(m.exercicio_orcamento_padrao, '202500')
from public.tce_municipios_monitorados m
where s.codigo_municipio = m.codigo_municipio
  and s.exercicio_orcamento is null;

alter table public.tce_sync_subscriptions
  alter column exercicio_orcamento set not null;

alter table public.tce_sync_subscriptions
  drop constraint if exists tce_sync_subscriptions_codigo_municipio_endpoint_key;

alter table public.tce_sync_subscriptions
  add constraint tce_sync_subscriptions_municipio_exercicio_endpoint_key
  unique (codigo_municipio, exercicio_orcamento, endpoint);

create index if not exists idx_tce_sync_subscriptions_year
  on public.tce_sync_subscriptions (codigo_municipio, exercicio_orcamento, ativo, sincronizacao_automatica);

