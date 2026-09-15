-- O catalogo de municipios do Ceara e unico na plataforma. Esta view expoe o
-- catalogo com os nomes de coluna que o ETL do TCE ja usa, evitando um segundo
-- cadastro de municipios no banco.
-- Ter os 184 municipios aqui nao significa carregar dados de todos: os dados do
-- TCE sao baixados apenas para quem esta em tce_municipios_monitorados.
create view tce.municipios with (security_invoker = true) as
select codigo as codigo_municipio,
       nome as nome_municipio,
       uf,
       slug
from plataforma.catalogo_municipios;
