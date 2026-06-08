# Visão do projeto APITCE

O APITCE é um sistema para organizar, sincronizar e transformar dados públicos do TCE-CE em informação útil para gestão municipal.

## Finalidade do projeto

O objetivo é permitir que o sistema:

- carregue dados de municípios e exercícios contratados;
- mantenha esses dados atualizados conforme novas prestações são publicadas;
- normalize as informações em banco local;
- entregue uma visão gerencial clara para operação interna e, depois, para a área do cliente;
- reduza o trabalho manual de baixar, conferir e acompanhar dados públicos.

Em resumo: o sistema pega dados brutos, organiza, acompanha atualização e libera leitura gerencial.

## O que o sistema faz hoje

- cadastra município e ano monitorado;
- verifica se há dados novos disponíveis;
- sincroniza grupos e endpoints do TCE;
- registra logs de execução;
- mostra status de carga, pendência e erro;
- centraliza a operação no painel admin;
- prepara a base para dashboards e relatórios futuros.

## Tarefas habituais no dia a dia

### Operação interna

- cadastrar um novo município ou novo ano;
- conferir se o município está ativo;
- verificar se há novas competências disponíveis;
- rodar atualização manual quando necessário;
- forçar reprocessamento quando houver correção de dados;
- acompanhar logs de erro e sucesso;
- validar se o status da tela bate com a execução real.

### Monitoramento

- acompanhar municípios cadastrados;
- ver quais grupos já foram sincronizados;
- identificar meses pendentes ou sem dados;
- checar se a base está atualizada;
- observar falhas em endpoints ou páginas específicas.

### Gestão de dados

- organizar cargas por município, ano, grupo e competência;
- garantir que os registros não sejam duplicados;
- manter histórico de sincronizações;
- preservar rastreabilidade do que foi carregado e quando.

### Preparação comercial

- deixar pronto o escopo que o cliente contratou;
- liberar apenas o que pertence ao município e ano contratado;
- preparar a futura área do cliente com linguagem simples;
- evitar exposição de termos técnicos desnecessários na área pública do cliente.

## Rotina ideal

1. Conferir municípios ativos.
2. Verificar se há dados novos.
3. Rodar sincronização do que mudou.
4. Revisar logs.
5. Confirmar status.
6. Atualizar o que estiver pendente.
7. Manter o painel limpo e compreensível.

## Resultado esperado

O usuário interno deve conseguir entender:

- o que está cadastrado;
- o que já foi baixado;
- o que está pendente;
- o que está com erro;
- o que precisa ser atualizado agora.

O cliente final, mais à frente, deve ver apenas:

- o que contratou;
- o que está disponível;
- o que foi atualizado;
- quais relatórios já pode consultar.

