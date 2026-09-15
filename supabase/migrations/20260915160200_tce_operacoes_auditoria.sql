-- Trava atomica por municipio/exercicio/alvo e auditoria da equipe interna.
create table if not exists tce.tce_operacoes_ativas (
  chave text primary key,
  operacao_id uuid not null,
  auth_user_id uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists tce.tce_operacoes_auditoria (
  id uuid primary key,
  auth_user_id uuid not null,
  acao text not null check (acao in ('check', 'sync', 'monitor')),
  codigo_municipio text not null check (codigo_municipio ~ '^[0-9]{3}$'),
  exercicio_orcamento text not null check (exercicio_orcamento ~ '^[0-9]{4}00$'),
  alvo text not null,
  status text not null check (status in ('executando', 'ok', 'erro')),
  detalhe text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists tce_operacoes_auditoria_escopo_idx
  on tce.tce_operacoes_auditoria (codigo_municipio, exercicio_orcamento, started_at desc);

alter table tce.tce_operacoes_ativas enable row level security;
alter table tce.tce_operacoes_auditoria enable row level security;

revoke all on tce.tce_operacoes_ativas from public, anon, authenticated;
revoke all on tce.tce_operacoes_auditoria from public, anon, authenticated;
grant all on tce.tce_operacoes_ativas to service_role;
grant all on tce.tce_operacoes_auditoria to service_role;
