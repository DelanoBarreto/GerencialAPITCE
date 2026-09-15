-- Espelha as permissoes que o schema portalgov ja tem, para o PostgREST
-- conseguir servir o schema tce. O RLS continua sendo quem decide o acesso
-- linha a linha; estes grants apenas tornam o schema visivel a API.
grant usage on schema tce to anon, authenticated, service_role;

grant select on all tables in schema tce to anon, authenticated;
grant all on all tables in schema tce to service_role;
grant all on all sequences in schema tce to service_role;

-- Objetos criados daqui para frente herdam as mesmas permissoes.
alter default privileges in schema tce grant select on tables to anon, authenticated;
alter default privileges in schema tce grant all on tables to service_role;
alter default privileges in schema tce grant all on sequences to service_role;
