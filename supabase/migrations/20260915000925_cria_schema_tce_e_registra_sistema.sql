-- Schema do sistema de gerenciamento de dados do TCE-CE.
create schema if not exists tce;

-- Registra o TCE como segundo sistema da plataforma.
insert into plataforma.sistemas (chave, nome, status)
values ('tce', 'APITCE Gerencial', 'ativo')
on conflict (chave) do nothing;

-- Papeis espelhando o portalgov, sem "revisor": o APITCE nao tem
-- fluxo de aprovacao de conteudo, apenas operacao de cargas e consulta.
insert into plataforma.papeis (sistema, papel, nivel_plataforma, descricao)
values
  ('tce', 'superadmin',   true,  'Opera todos os municipios da plataforma'),
  ('tce', 'tenant_admin', false, 'Administra um municipio'),
  ('tce', 'editor',       false, 'Executa cargas e atualiza dados'),
  ('tce', 'viewer',       false, 'Somente leitura')
on conflict (sistema, papel) do nothing;
