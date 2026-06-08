# PRD - Projeto APITCE

## 1. Visao geral

O APITCE e um sistema web para coletar, armazenar, organizar e consultar dados publicos do SIM/TCE-CE em uma base propria no Supabase/Postgres.

O sistema nasce para apoiar gestores municipais, contadores, controladores internos e equipes tecnicas que precisam acompanhar informacoes contabeis, orcamentarias, financeiras e administrativas de municipios cearenses.

A ideia central e simples:

1. cadastrar municipios e anos de interesse;
2. buscar os dados oficiais na API do TCE-CE;
3. gravar tudo em banco local com controle de duplicidade;
4. consultar a base em dashboards, relatorios e telas gerenciais;
5. automatizar atualizacoes conforme os dados forem disponibilizados pelo TCE.

O projeto nao deve depender de consulta em tempo real na API do TCE para montar dashboards e relatorios. A API externa serve como fonte de carga e atualizacao; a operacao diaria deve consultar o banco local.

## 2. Problema que o projeto resolve

Hoje, dados do TCE estao disponiveis em API publica, mas o uso direto apresenta dificuldades:

- muitos endpoints;
- parametros tecnicos;
- paginacao;
- limites de requisicao;
- risco de baixar dados duplicados;
- dificuldade de cruzar informacoes entre tabelas;
- necessidade de montar calculos contabeis e gerenciais;
- necessidade de consultar historico por municipio, ano, orgao, fornecedor, contrato, despesa e receita.

Para um usuario comum ou gestor, operar diretamente a API nao e pratico. O APITCE transforma esse processo em uma rotina operacional guiada por tela.

## 3. Objetivos do produto

### Objetivo principal

Criar uma plataforma gerencial que mantenha uma base local atualizada com dados do TCE-CE e permita consultar, analisar e gerar relatorios contabeis e administrativos por municipio.

### Objetivos especificos

- Cadastrar municipios monitorados.
- Cadastrar um ou mais anos por municipio.
- Sincronizar dados da API do TCE para Supabase/Postgres.
- Evitar duplicidade em cargas repetidas.
- Monitorar disponibilidade de novas competencias.
- Permitir carga inicial completa de um municipio/ano.
- Permitir verificacao e sincronizacao por grupo da API.
- Permitir verificacao e sincronizacao por endpoint.
- Criar dashboards de execucao orcamentaria.
- Criar relatorios gerenciais e contabeis.
- Preparar a base para autenticacao, clientes e permissoes por municipio.

## 4. Publico-alvo

### Usuario operacional interno

Pessoa que opera o sistema para cadastrar municipios, baixar dados, verificar erros e acompanhar logs.

Responsabilidades:

- cadastrar municipio/ano;
- verificar disponibilidade;
- rodar sincronizacao;
- conferir se houve erro;
- acompanhar status dos endpoints.

### Gestor municipal

Pessoa que precisa visualizar dados de forma simples e tomar decisoes.

Interesses:

- execucao da receita;
- execucao da despesa;
- contratos por fornecedor;
- licitacoes;
- gastos com pessoal;
- limites legais;
- saude, educacao e FUNDEB;
- alertas de risco.

### Contador ou consultor contabil

Pessoa que analisa informacoes tecnicas e prepara relatorios.

Interesses:

- balancetes;
- orcamento;
- empenhos, liquidacoes e pagamentos;
- fontes de recurso;
- rubricas;
- orgaos e unidades;
- relatorios legais.

### Administrador do sistema

Pessoa que gerencia usuarios, clientes e permissoes quando a etapa de autenticacao for implementada.

Responsabilidades futuras:

- criar clientes;
- vincular usuarios a municipios;
- controlar permissao por modulo;
- auditar acesso.

## 5. Escopo atual do MVP

O MVP atual esta focado em:

- municipio piloto: Aracati, codigo `014`;
- ano validado com carga completa: 2025 (`202500`);
- ano aceito e testado na interface: 2026 (`202600`);
- grupos iniciais da API:
  - Auxiliares;
  - BAS;
  - ORC;
  - BAL.

O login ainda nao faz parte do MVP. A primeira versao e uma area operacional local/admin para validar dados, fluxos e sincronizacao.

## 6. Fora do escopo inicial

Ficam para fases posteriores:

- login de usuarios;
- controle de permissao por cliente;
- RLS no Supabase;
- multi-tenant completo;
- relatorios finais em PDF/Excel;
- portal publico;
- alertas automaticos por email/WhatsApp;
- integracao com sistemas internos de prefeituras;
- carga completa de todos os municipios do Ceara.

## 7. Decisoes de arquitetura

### 7.1 API do TCE como fonte, nao como banco de consulta

O sistema nao deve montar dashboards consultando a API do TCE diretamente.

Motivos:

- a API pode estar lenta ou indisponivel;
- os endpoints possuem paginacao;
- ha limite operacional de requisicoes;
- varios relatorios exigem cruzamento entre tabelas;
- consultas diretas podem gerar telas lentas;
- dados historicos precisam ser preservados mesmo que a API mude.

### 7.2 Banco local como base oficial de trabalho

O Supabase/Postgres e a base operacional do APITCE.

Ele guarda:

- dados brutos;
- dados normalizados;
- logs de sincronizacao;
- catalogo de endpoints;
- municipios monitorados;
- anos monitorados;
- assinaturas de sincronizacao.

### 7.3 Sincronizacao com controle de duplicidade

Toda carga precisa ser idempotente. Rodar a mesma sincronizacao duas vezes nao deve duplicar registros.

Mecanismos:

- `upsert`;
- chaves unicas;
- chave natural;
- hash do payload em registros brutos;
- logs de sincronizacao;
- opcao `--force` apenas quando for necessario rebaixar dados corrigidos.

### 7.4 Numeros contabeis

Valores monetarios ficam como `numeric` no banco.

No banco:

- usar ponto decimal internamente;
- permitir valores negativos;
- nao transformar valor monetario em texto.

Na tela:

- formatar em pt-BR;
- usar virgula decimal;
- exemplo: `R$ 1.234,56`.

## 8. Conceitos principais

### Municipio

Municipio do Ceara identificado pelo codigo do SIM/TCE.

Exemplo:

- Aracati: `014`.

### Ano

Ano de trabalho escolhido pelo usuario.

Exemplo:

- `2025`;
- `2026`.

### Exercicio orcamento

Formato usado pela API do TCE.

Exemplos:

- ano 2025 -> `202500`;
- ano 2026 -> `202600`.

### Competencia mensal

Usada em endpoints mensais.

Formato:

- `AAAAMM`.

Exemplos:

- janeiro/2025: `202501`;
- dezembro/2025: `202512`;
- janeiro/2026: `202601`.

### Grupo da API

Conjunto de endpoints por tema, seguindo a organizacao oficial da API.

Grupos iniciais:

- Auxiliares;
- BAS;
- ORC;
- BAL.

Grupos futuros:

- LIC;
- CRD;
- OUT;
- OSE;
- CPF;
- RPP;
- PAT;
- EMP;
- LIQ;
- PAG.

### Endpoint

Item especifico da API do TCE.

Exemplos:

- `municipios`;
- `orgaos`;
- `orcamento_receita`;
- `balancetes_receitas_orcamentarias`;
- `contas_bancarias_municipio`.

## 9. Fluxo operacional diario

### 9.1 Cadastro de municipio/ano

Fluxo esperado:

1. operador acessa a tela de monitoramento;
2. escolhe municipio;
3. escolhe ano;
4. clica em cadastrar monitoramento;
5. sistema cria o exercicio no formato `AAAA00`;
6. sistema cria assinaturas padrao dos endpoints;
7. municipio/ano passa a aparecer como escopo monitorado.

Estado atual:

- funciona se o municipio ja existir na tabela `municipios`.

Proxima melhoria:

- se o municipio nao existir localmente, buscar direto na API do TCE e cadastrar.

### 9.2 Verificacao de dados

Fluxo esperado:

1. operador escolhe municipio e ano;
2. escolhe grupo ou endpoint;
3. clica em `Verificar`;
4. sistema consulta a API do TCE sem gravar dados principais;
5. sistema registra disponibilidade;
6. tela mostra status.

Objetivo:

- saber se ha dados disponiveis antes de sincronizar;
- detectar competencias novas;
- evitar carga desnecessaria.

### 9.3 Sincronizacao por grupo

Fluxo esperado:

1. operador escolhe municipio, ano e grupo;
2. clica em `Sincronizar grupo`;
3. sistema percorre os endpoints padrao daquele grupo;
4. se endpoint for mensal, percorre janeiro a dezembro;
5. sistema pagina a API ate finalizar;
6. sistema grava no banco;
7. sistema registra logs;
8. tela mostra resultado.

Regra importante:

- a tela nao deve pedir mes inicial/final;
- o usuario escolhe ano;
- o sistema cuida dos meses automaticamente.

### 9.4 Sincronizacao por endpoint

Fluxo esperado:

1. operador acessa tabela de endpoints monitorados;
2. escolhe um endpoint;
3. clica em `Verificar` ou `Sync`;
4. sistema executa apenas aquele endpoint;
5. se for mensal, roda o ano inteiro;
6. se for anual/unico, roda uma vez.

Uso:

- corrigir uma carga pontual;
- testar endpoint;
- reprocessar um item especifico.

### 9.5 Acompanhamento de logs

Fluxo esperado:

1. operador consulta logs recentes;
2. confere endpoint, competencia, linhas e status;
3. identifica erro;
4. corrige/reexecuta se necessario.

Status esperados:

- `started`;
- `ok`;
- `error`;
- `available`;
- `not_available`.

### 9.6 Atualizacao automatica futura

Fluxo desejado:

1. sistema roda rotina diaria em horario definido;
2. busca municipios/anos ativos;
3. verifica endpoints monitorados;
4. detecta competencias ou dados novos;
5. sincroniza automaticamente;
6. registra logs;
7. mostra pendencias para o operador.

Essa rotina deve considerar apenas municipios cadastrados, nao todos os municipios do Ceara.

## 10. Fluxos de usuario

### Fluxo A - Novo cliente/municipio

1. Cliente contrata o sistema.
2. Operador cadastra municipio.
3. Operador marca os anos desejados.
4. Sistema cria monitoramento.
5. Operador executa carga inicial.
6. Sistema valida contagens.
7. Dashboard passa a mostrar dados.
8. Cliente passa a consultar relatorios.

### Fluxo B - Novo ano para cliente existente

1. Operador abre municipio existente.
2. Seleciona novo ano.
3. Cadastra monitoramento.
4. Executa verificacao.
5. Executa sincronizacao.
6. Sistema passa a monitorar automaticamente.

### Fluxo C - Atualizacao mensal

1. TCE disponibiliza dados de nova competencia.
2. Sistema verifica disponibilidade.
3. Sistema sincroniza endpoints mensais.
4. Dashboard passa a refletir nova competencia.
5. Logs registram o processamento.

### Fluxo D - Reprocessamento

1. TCE corrige dados antigos.
2. Operador identifica necessidade de rebaixar dados.
3. Operador usa sync com `--force`.
4. Sistema aplica `upsert`.
5. Registros sao atualizados sem duplicidade.

## 11. Modulos do sistema

### 11.1 Operacao

Modulo para sincronizar e acompanhar dados.

Funcionalidades:

- selecionar municipio/ano;
- selecionar grupo;
- verificar grupo;
- sincronizar grupo;
- ver resumo de importacao;
- ver logs;
- ver endpoints monitorados.

### 11.2 Monitoramento

Modulo para cadastrar municipios e anos.

Funcionalidades:

- listar escopos monitorados;
- cadastrar municipio/ano;
- ativar/desativar sincronizacao automatica futuramente;
- criar assinaturas de endpoints.

### 11.3 Catalogo TCE

Modulo tecnico para entender a API.

Funcionalidades:

- listar grupos;
- listar endpoints;
- ver frequencia;
- ver parametros obrigatorios;
- ver status de normalizacao.

### 11.4 Dashboard

Modulo para visualizar dados ja sincronizados.

Primeira fonte:

- `vw_tce_execucao_orcamentaria_mensal`;
- `vw_tce_receitas_mensais`;
- `vw_tce_despesas_mensais`.

Visualizacoes iniciais:

- receita arrecadada x despesa paga;
- execucao por mes;
- totalizadores;
- futuramente orgao/unidade.

### 11.5 Relatorios

Modulo futuro para gerar saidas contabeis e gerenciais.

Relatorios planejados:

- despesa com pessoal;
- saude;
- educacao;
- FUNDEB;
- contratos por fornecedor;
- licitacoes;
- execucao orcamentaria;
- restos a pagar;
- pagamentos;
- alertas de limites.

### 11.6 Administracao e usuarios

Modulo futuro.

Funcionalidades:

- login;
- usuarios;
- clientes;
- permissao por municipio;
- permissao por modulo;
- RLS no Supabase.

## 12. Dados e grupos da API

### Auxiliares

Uso:

- dados de referencia global.

Exemplos:

- municipios;
- funcoes;
- tipos de unidades administrativas.

Frequencia:

- carga inicial;
- atualizar quando mudar catalogo.

### BAS

Uso:

- estrutura basica do municipio.

Exemplos:

- orgaos;
- unidades orcamentarias;
- unidades gestoras;
- ordenadores de despesas;
- contas bancarias.

Frequencia:

- anual por municipio/ano.

Regra especial:

- `contas_bancarias_municipio` deve ser sincronizado por orgao usando comando dedicado.

### ORC

Uso:

- orcamento inicial.

Exemplos:

- dados do orcamento;
- orcamento da receita;
- orcamento da despesa;
- programas;
- projetos/atividades;
- elementos de despesa.

Frequencia:

- anual por municipio/ano.

### BAL

Uso:

- execucao mensal.

Exemplos:

- balancetes de receitas orcamentarias;
- balancetes de despesas orcamentarias;
- receitas extra-orcamentarias;
- despesas extra-orcamentarias.

Frequencia:

- mensal, mas operado na interface por ano completo.

## 13. Requisitos funcionais

### RF-01 - Cadastrar municipio/ano

O sistema deve permitir cadastrar municipio e ano para monitoramento.

Aceite:

- cria exercicio `AAAA00`;
- cria assinaturas padrao;
- aparece na lista de monitorados.

### RF-02 - Verificar grupo

O sistema deve verificar disponibilidade dos endpoints de um grupo para municipio/ano.

Aceite:

- mensal percorre janeiro a dezembro;
- anual roda uma vez;
- registra disponibilidade/log.

### RF-03 - Sincronizar grupo

O sistema deve baixar dados de todos os endpoints padrao do grupo.

Aceite:

- pagina todos os registros;
- grava no banco;
- nao duplica;
- mostra resultado.

### RF-04 - Verificar endpoint

O sistema deve verificar um endpoint especifico.

Aceite:

- respeita frequencia do endpoint;
- mostra resultado na tela.

### RF-05 - Sincronizar endpoint

O sistema deve sincronizar um endpoint especifico.

Aceite:

- mensal percorre o ano inteiro;
- aplica upsert;
- retorna log.

### RF-06 - Exibir resumo de importacao

O sistema deve mostrar resumo por grupo.

Aceite:

- mostra total de registros;
- mostra quantidade de tabelas controladas;
- separa Auxiliares, BAS, ORC e BAL.

### RF-07 - Exibir dashboard inicial

O sistema deve mostrar execucao mensal quando houver dados.

Aceite:

- agrupa por competencia;
- nao repete meses;
- usa formatacao pt-BR.

### RF-08 - Exibir estado vazio

Se nao houver dados para o ano, o sistema deve informar claramente.

Aceite:

- mensagem clara;
- orienta verificar/sincronizar.

### RF-09 - Logs operacionais

O sistema deve exibir ultimos logs.

Aceite:

- endpoint;
- competencia;
- linhas;
- status.

### RF-10 - Evitar duplicidade

O sistema nao deve duplicar dados ao rodar sincronizacoes repetidas.

Aceite:

- reexecucao sem force pula escopo ja concluido;
- reexecucao com force atualiza via upsert;
- contagem final nao duplica.

## 14. Requisitos nao funcionais

### RNF-01 - Confiabilidade

Falhas de API ou pagina devem ser registradas sem apagar dados ja carregados.

### RNF-02 - Rastreabilidade

Toda sincronizacao deve gerar log.

### RNF-03 - Performance

Dashboards devem consultar Supabase/Postgres, nao a API externa.

### RNF-04 - Segurança

Credenciais ficam em `.env` local. Login e RLS entram em fase posterior.

### RNF-05 - Manutenibilidade

Endpoints devem seguir catalogo oficial da API e documentacao local.

### RNF-06 - Usabilidade

Usuario comum nao deve precisar saber detalhes como `$start_index`, `$count`, `data_referencia_doc` ou paginacao.

## 15. Tabelas e estruturas principais

Controle:

- `municipios`;
- `tce_endpoint_groups`;
- `tce_endpoint_catalog`;
- `tce_municipios_monitorados`;
- `tce_municipio_exercicios_monitorados`;
- `tce_sync_subscriptions`;
- `tce_sync_log`;
- `tce_sync_availability_checks`;
- `tce_raw_records`.

Normalizadas iniciais:

- `tce_funcoes`;
- `tce_tipos_unidades_administrativas`;
- `tce_orgaos`;
- `tce_unidades_orcamentarias`;
- `tce_unidades_gestoras`;
- `tce_ordenadores_despesas`;
- `tce_contas_bancarias_municipio`;
- `tce_dados_orcamentos`;
- `tce_programas_governo`;
- `tce_orcamentos_receitas`;
- `tce_orcamentos_despesas`;
- `tce_orcamentos_despesas_projetos_atividades`;
- `tce_elementos_despesas_projetos_atividades`;
- `tce_balancetes_receitas_orcamentarias`;
- `tce_balancetes_despesas_orcamentarias`;
- `tce_balancetes_receitas_extra_orcamentarias`;
- `tce_balancetes_despesas_extra_orcamentarias`.

Views:

- `vw_tce_receitas_mensais`;
- `vw_tce_despesas_mensais`;
- `vw_tce_execucao_orcamentaria_mensal`.

## 16. Interface atual

URL local:

```text
http://127.0.0.1:3030
```

Exemplo de escopo:

```text
http://127.0.0.1:3030/?municipio=014&ano=2026#operacao
```

Componentes implementados:

- painel de operacao;
- monitoramento de municipios/anos;
- resumo de importacao;
- tabela de endpoints monitorados;
- dashboard inicial;
- logs recentes.

Rotas internas:

- `POST /api/operacao/grupo`;
- `POST /api/operacao/endpoint`;
- `POST /api/monitoramento/municipio`.

## 17. Operacao por comandos

Rodar app:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3030
```

Validar:

```bash
npm run typecheck
npm run build
```

Verificar grupo:

```bash
npm run check:grupo -- --municipio 014 --grupo bal --exercicio 202600 --data-inicial 202601 --data-final 202612 --default
```

Sincronizar grupo:

```bash
npm run sync:grupo -- --municipio 014 --grupo bal --exercicio 202600 --data-inicial 202601 --data-final 202612 --default
```

Verificar endpoint:

```bash
npm run check:updates -- --municipio 014 --endpoint funcoes --exercicio 202600
```

Sincronizar contas bancarias:

```bash
npm run sync:contas-bancarias -- --municipio 014 --exercicio 202500 --force
```

## 18. Estado atual dos dados

### Aracati 2025

Codigo:

- `014`.

Exercicio:

- `202500`.

Estado:

- carga controlada concluida para Auxiliares, BAS, ORC e BAL;
- BAL carregado de `202501` a `202512`;
- ORC validado;
- views iniciais validadas;
- contas bancarias normalizadas.

Contagens conhecidas:

- ORC receitas: 346;
- ORC despesas: 682;
- ORC despesas por projeto/atividade: 241;
- ORC elementos por projeto/atividade: 1.768;
- contas bancarias: 10.210 registros.

### Aracati 2026

Codigo:

- `014`.

Exercicio:

- `202600`.

Estado:

- interface aceita o escopo;
- verificacao de BAL retornou `OK=True`;
- endpoint `funcoes` retornou `OK=True`;
- ainda falta carga completa e validacao de contagens.

## 19. Riscos e cuidados

### API publica pode bloquear endpoints

O endpoint `gestores` retornou 403.

Mitigacao:

- manter fora do MVP padrao;
- registrar erro;
- revisar depois com documentacao/credenciais se necessario.

### Paginacao pode ser instavel em endpoints grandes

`contas_bancarias_municipio` exigiu tratamento por orgao.

Mitigacao:

- comando dedicado;
- validacao de duplicidade;
- logs por execucao.

### Dados podem mudar no TCE

Mitigacao:

- permitir `--force`;
- aplicar upsert;
- manter logs.

### Usuario comum pode se confundir com parametros tecnicos

Mitigacao:

- interface usa municipio + ano + grupo;
- meses sao automaticos;
- endpoints ficam em area avancada.

## 20. Roadmap

### Fase 1 - Base operacional

Status: em andamento.

Itens:

- sincronizacao Auxiliares, BAS, ORC, BAL;
- interface local sem login;
- monitoramento de municipio/ano;
- operacao por grupo;
- operacao por endpoint;
- logs;
- dashboard inicial.

### Fase 2 - Melhorias operacionais

Itens:

- buscar municipio direto na API se nao existir localmente;
- atualizar status de endpoint sem recarregar pagina;
- contagem real por endpoint/tabela;
- rotina diaria automatica;
- tela de logs mais completa.

### Fase 3 - Expansao da API

Grupos:

- LIC;
- CRD;
- OUT;
- OSE;
- CPF;
- RPP;
- PAT;
- EMP;
- LIQ;
- PAG.

### Fase 4 - Relatorios gerenciais

Itens:

- despesa com pessoal;
- saude;
- educacao;
- FUNDEB;
- contratos por fornecedor;
- licitacoes;
- pagamentos;
- execucao orcamentaria;
- alertas.

### Fase 5 - Multi-cliente e seguranca

Itens:

- login;
- usuarios;
- clientes;
- permissoes;
- RLS;
- auditoria de acesso.

## 21. Criterios de sucesso

O projeto sera considerado bem sucedido quando:

- um novo municipio puder ser cadastrado pela tela;
- um ou mais anos puderem ser monitorados;
- o sistema baixar dados sem duplicar;
- o operador puder verificar status sem terminal;
- dashboards forem gerados a partir do banco local;
- relatorios contabeis forem gerados com dados confiaveis;
- clientes puderem acessar apenas seus municipios autorizados.

## 22. Proximo passo imediato

Melhorar o cadastro de municipio:

- usuario informa codigo do municipio;
- se existir localmente, usa o cadastro local;
- se nao existir, busca na API do TCE;
- grava em `municipios`;
- cria monitoramento;
- cria assinaturas padrao;
- redireciona para o escopo novo.

Depois disso:

1. atualizar status de endpoint sem recarregar;
2. criar contagem real por endpoint;
3. iniciar proximo grupo oficial da API.
