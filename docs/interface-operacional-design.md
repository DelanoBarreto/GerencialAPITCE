# Interface operacional APITCE

## Objetivo

A primeira interface web do APITCE deve permitir operar a base do TCE sem terminal.

O usuario escolhe municipio, ano e grupo da API. O sistema executa os comandos ja validados, mostra status de carga e disponibiliza uma primeira leitura de dashboard sobre as views do Supabase.

Autenticacao, usuarios, permissoes e multi-cliente com login ficam fora do MVP visual. O painel inicial sera administrativo/local.

## Skills usadas nesta fase

- `/ajuda`: organizar quais skills entram em cada etapa.
- `/designer`: definir estrutura visual, componentes, fluxo de uso e cuidados de UX.
- `/dashboard`: proxima etapa para KPIs, filtros e graficos.
- `/banco-de-dados`: proxima etapa para novas views, indices e consultas.
- `/frontend`: proxima etapa para implementar a interface web.
- `/relatorios`: etapa posterior para exportacao e relatorios contabeis.
- `/auth`: ultima etapa, apenas depois do painel funcionar sem login.

## Principios de UX

- O usuario nao deve precisar conhecer endpoints tecnicos.
- A escolha principal deve ser `municipio + ano + grupo`.
- Endpoints aparecem apenas em uma area avancada.
- Para grupos mensais, como `BAL`, a interface nao deve pedir mes inicial/final. O sistema executa todos os meses disponiveis do ano.
- Para `contas_bancarias_municipio`, a interface deve indicar regra especial: sincronizacao por orgao.
- Dados sensiveis, como contas bancarias, devem aparecer apenas em tela restrita de operacao, nao em dashboard publico.
- Numeros ficam como `numeric` no banco e sao formatados em pt-BR apenas na tela.

## Navegacao principal

Menu lateral:

- `Operacao`: sincronizar dados e acompanhar status.
- `Dashboard`: consultar execucao orcamentaria mensal.
- `Relatorios`: area futura para relatorios contabeis.
- `Municipios`: cadastrar e monitorar municipios/anos.
- `Catalogo TCE`: consultar grupos e endpoints oficiais.
- `Configuracoes`: parametros tecnicos e rotinas.

No MVP, a primeira tela implementada deve ser `Operacao`.

## Tela Operacao

Objetivo: permitir que o usuario cadastre o escopo e rode sincronizacao com seguranca.

Blocos visuais:

- Barra superior com `APITCE`, municipio ativo e ano ativo.
- Filtros principais: municipio, ano, grupo da API.
- Cards de status: municipios monitorados, ano ativo, ultima carga, pendencias.
- Tabela de grupos oficiais: Auxiliares, BAS, ORC, BAL.
- Mensagem de escopo anual para endpoints mensais.
- Painel de logs recentes: endpoint, competencia, paginas, registros, status.

Acoes principais:

- `Verificar atualizacoes`
- `Sincronizar grupo`
- `Forcar atualizacao`
- `Ver logs`

Estados por grupo/mes:

- `nunca baixado`
- `baixado`
- `pendente`
- `erro`
- `sem dados`
- `atualizado`

## Tela Dashboard

Objetivo: consultar rapidamente a execucao orcamentaria validada.

Fonte inicial:

- `vw_tce_execucao_orcamentaria_mensal`
- `vw_tce_receitas_mensais`
- `vw_tce_despesas_mensais`

Filtros:

- municipio
- ano
- competencia inicial/final
- orgao
- unidade orcamentaria

KPIs iniciais:

- receita arrecadada no mes
- receita arrecadada ate o mes
- despesa empenhada no mes
- despesa liquidada no mes
- despesa paga no mes
- saldo de dotacao

Visualizacoes iniciais:

- linha mensal de receita arrecadada x despesa paga
- barras por orgao
- tabela por orgao/unidade
- comparativo empenhado, liquidado e pago

## Tela Municipios

Objetivo: preparar a futura operacao multi-municipio sem login.

Campos:

- codigo do municipio
- nome do municipio
- anos monitorados
- sincronizacao automatica ativa/inativa
- grupos ativos

Acoes:

- adicionar municipio
- ativar ano
- desativar ano
- sincronizar carga inicial

## Tela Catalogo TCE

Objetivo: permitir consulta tecnica controlada, sem misturar com a operacao comum.

Conteudo:

- grupos oficiais da OpenAPI
- endpoints por grupo
- parametros obrigatorios
- parametros opcionais
- frequencia sugerida
- tabela destino
- status: normalizado, bruto, pendente, erro conhecido

## Layout recomendado

Visual:

- painel administrativo claro, denso e legivel;
- fundo neutro com areas bem separadas;
- cards com raio baixo, no maximo 8px;
- tabelas com linhas compactas;
- chips de status por cor;
- botoes com icones para acoes;
- nada de hero, landing page ou pagina comercial.

Hierarquia:

- topo: contexto atual;
- esquerda: navegacao;
- centro: operacao ou dashboard;
- direita, quando necessario: detalhes do item selecionado.

## Componentes principais

- `AppShell`
- `Sidebar`
- `Topbar`
- `MunicipioAnoSelector`
- `GrupoApiTable`
- `MesesStatusGrid`
- `SyncActionBar`
- `SyncLogTable`
- `KpiCard`
- `ChartPanel`
- `DataTable`
- `EndpointStatusBadge`

## Regras especificas de sincronizacao na interface

- `auxiliares`: carga global ou por ano quando aplicavel.
- `bas`: carga por municipio/ano, exceto contas bancarias.
- `contas_bancarias_municipio`: sempre usar `sync:contas-bancarias`.
- `orc`: carga anual por municipio/ano.
- `bal`: carga mensal por ano, usando competencias `AAAAMM`, exemplo `202501`; na interface, o usuario escolhe apenas o ano.
- endpoint com status `ok` nao deve baixar de novo, salvo se o usuario acionar `forcar atualizacao`.

## Estado implementado

- Base frontend em Next.js criada.
- Tela `Operacao` criada sem login.
- Selecao de municipio/ano por URL, exemplo `/?municipio=014&ano=2026`.
- Operacao por grupo criada com backend real.
- Operacao por endpoint criada com backend real.
- Monitoramento de municipios/anos criado.
- Filtros manuais de mes removidos.
- Proximo foco: melhorar cadastro de municipio buscando direto na API do TCE quando o municipio ainda nao existir no banco local.
