# Controle do processo - Admin APITCE

Este documento registra o que já foi entregue na área admin e o que ainda falta fechar antes da área do cliente.

## Objetivo atual

Manter a área `/admin` como painel operacional interno, com largura visual fixa para laptop de `14" a 15"` e leitura clara em monitores grandes.

## O que já está feito

- A área admin existe com rotas próprias.
- A navegação foi separada em:
  - `/admin`
  - `/admin/municipios`
  - `/admin/municipios/[codigo]/[ano]`
  - `/admin/dados`
  - `/admin/logs`
  - `/admin/clientes`
- O layout principal foi limitado para não esticar demais em monitores grandes.
- A tela de logs foi simplificada.
- A tela de dados foi enxugada para priorizar ação, status e leitura rápida.
- O fluxo de operação já destaca:
  - cadastrar município/ano
  - verificar atualização
  - baixar/atualizar dados
  - forçar reprocessamento
  - ver logs
- O escopo de teste principal segue sendo `Aracati 2024` e `Aracati 2025`.

## O que ainda falta fazer

### Prioridade alta

- Deixar o fluxo da tela de município mais óbvio.
- Garantir que fique claro onde cadastra município/ano.
- Garantir que fique claro onde roda atualização.
- Garantir que fique claro onde consulta status e logs.
- Revisar os botões que ainda geram confusão visual.

### O que ainda falta na parte interna

- Ampliar a cobertura da API além do núcleo inicial.
- Consolidar a ordem de sincronização dos grupos e endpoints que ainda faltam.
- Tratar endpoints com comportamento especial ou instável.
- Melhorar o cadastro de municipio/ano para buscar direto na API quando o municipio ainda nao existir localmente.
- Atualizar o status da interface logo depois de verificar ou baixar dados.
- Transformar a coluna de linhas em contagem real por endpoint e tabela.
- Criar rotina diaria automatica para detectar novidade e baixar apenas o que mudou.
- Avancar na normalizacao para liberar relatórios gerenciais mais completos.

### Prioridade média

- Padronizar títulos, textos curtos e chips de status.
- Reduzir blocos técnicos desnecessários.
- Melhorar filtros nas tabelas principais.
- Ajustar longos nomes de endpoints para não quebrar a leitura.

### Prioridade futura

- Criar a área do cliente em `/dashboard`.
- Separar linguagem técnica do admin da linguagem comercial do cliente.
- Implementar login, permissões e RLS.
- Automatizar a liberação de dados por contrato.

## Ordem recomendada de execução

1. Fechar o fluxo de `Municipios`.
2. Confirmar o fluxo de `Dados`.
3. Revisar `Logs`.
4. Ampliar cobertura da API e dos grupos restantes.
5. Transformar contagem e status em dados reais.
6. Automatizar a rotina diaria.
7. Validar tudo com `Aracati 2024` e `Aracati 2025`.
8. Só depois abrir a área do cliente.

## Regra de apresentação

- Tamanho visual fixo.
- Painel limpo.
- Menos texto técnico na tela.
- Ação principal sempre visível.
- Nada de blocos espalhados que competem com a operação.
