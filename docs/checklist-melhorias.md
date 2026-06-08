# Checklist de melhorias do projeto APITCE

Este checklist registra o diagnostico tecnico atual e a ordem recomendada para reduzir lentidao, diminuir arquivos grandes e melhorar a operacao do ETL TCE-CE.

## Diagnostico rapido

O projeto tem uma direcao clara: sincronizar dados do TCE-CE, armazenar no Supabase e oferecer um painel operacional para acompanhamento por municipio e ano.

Os principais pontos de melhoria sao:

- `src/app/page.tsx` concentra muitas consultas e renderizacao em uma pagina grande. Como as queries rodam em serie, a pagina inteira espera a parte mais lenta antes de aparecer.
- `src/lib/tce/sync-runner.ts` concentra regras de mapeamento e upsert de muitos endpoints. O arquivo tende a crescer demais e fica dificil validar mudancas por tabela.
- A operacao ainda precisa de melhor visibilidade: logs em tempo real, contagem real de registros, status por endpoint e filtros mais objetivos.

## Prioridade alta

### 1. Quebrar `sync-runner.ts` em mappers e router

Problema:

- O arquivo mistura coleta, transformacao, mapeamento por tabela e decisao de upsert.
- A inclusao de novos endpoints aumenta o risco de regressao em endpoints ja validados.

Acao recomendada:

- Criar um mapper por tabela ou grupo de tabelas em `src/lib/tce/mappers/`.
- Criar um router de upsert que escolha o mapper correto pelo endpoint/tabela.
- Manter `sync-runner.ts` como orquestrador, sem carregar toda a regra de negocio.

Criterios de aceite:

- `sync-runner.ts` fica menor e focado em fluxo.
- Cada mapper pode ser lido e testado isoladamente.
- Endpoints ja sincronizados continuam funcionando para Aracati `014`, anos `2024` e `2025`.

Estimativa: 1 a 2 dias.

### 2. Quebrar `page.tsx` com componentes e `Suspense`

Problema:

- A tela principal aguarda todas as consultas antes de renderizar.
- Uma query lenta bloqueia a experiencia inteira.

Acao recomendada:

- Separar a pagina em componentes de dados independentes.
- Usar `Suspense` para permitir carregamento progressivo.
- Colocar skeletons simples nos blocos mais lentos.

Criterios de aceite:

- A estrutura principal da pagina aparece rapidamente.
- Blocos lentos carregam de forma independente.
- A pagina continua exibindo os mesmos dados atuais.

Estimativa: 1 dia.

## Prioridade media

### 3. Streaming de logs em tempo real

Problema:

- A interface ainda depende de atualizacao manual ou retorno final do processo.

Acao recomendada:

- Criar endpoint SSE para acompanhar execucoes.
- Exibir logs progressivamente na area administrativa.
- Registrar inicio, progresso, erro e conclusao.

Criterios de aceite:

- O operador acompanha uma sincronizacao em andamento sem recarregar a pagina.
- Falhas aparecem com mensagem objetiva.

Estimativa: 1 a 2 dias.

### 4. Contagem real de registros por endpoint

Problema:

- A operacao precisa saber o que foi carregado, atualizado, ignorado ou falhou.

Acao recomendada:

- Persistir ou consultar contagens por endpoint, municipio, ano e competencia.
- Exibir totais na tela de status.
- Separar registros novos, atualizados e com erro quando possivel.

Criterios de aceite:

- Cada endpoint mostra quantidade real sincronizada.
- O operador consegue identificar rapidamente lacunas de carga.

Estimativa: 1 dia.

### 5. CSS Modules por componente

Problema:

- Estilos globais ou concentrados dificultam manutencao da interface.

Acao recomendada:

- Separar estilos dos componentes principais em CSS Modules.
- Manter o layout administrativo contido para telas de 14 a 15 polegadas.
- Evitar refatoracao visual ampla junto com mudancas de regra.

Criterios de aceite:

- Componentes principais possuem estilos mais localizados.
- A interface preserva largura fixa, clareza e centralizacao em monitores grandes.

Estimativa: 0,5 a 1 dia.

### 6. Novos grupos da API: `EMP`, `LIQ`, `PAG`

Problema:

- A cobertura atual ainda nao representa todo o fluxo contabil necessario.

Acao recomendada:

- Priorizar empenhos, liquidacoes e pagamentos.
- Validar parametros no contrato da API antes da carga completa.
- Fazer piloto com Aracati `014`.

Criterios de aceite:

- Cada grupo novo tem script/rota operacional.
- Dados principais entram em tabelas normalizadas ou staging bem definido.
- Existe documentacao curta com filtros usados.

Estimativa: 2 a 4 dias.

## Prioridade baixa

### 7. Rotina automatica diaria

Problema:

- A atualizacao manual nao escala quando houver muitos municipios e anos.

Acao recomendada:

- Criar rotina agendada para verificar novidades.
- Sincronizar apenas o que mudou quando a API permitir.
- Registrar execucoes em tabela de logs.

Criterios de aceite:

- A rotina diaria roda sem acao manual.
- O painel mostra ultima execucao e resultado.

Estimativa: 1 a 2 dias.

### 8. Tela de logs com filtros

Problema:

- Logs sem filtro dificultam suporte e auditoria.

Acao recomendada:

- Filtrar por municipio, ano, grupo, endpoint, status e data.
- Permitir abrir detalhes de uma execucao.
- Manter linguagem operacional, sem excesso de termos internos da API.

Criterios de aceite:

- O operador encontra uma falha especifica em poucos cliques.
- Logs antigos continuam consultaveis.

Estimativa: 1 dia.

### 9. README, `.env.example` e documentacao tecnica

Problema:

- O projeto precisa ser retomavel por outra IA ou desenvolvedor sem reanalise completa.

Acao recomendada:

- Atualizar README com instalacao, variaveis, scripts e fluxo de sync.
- Revisar `.env.example`.
- Documentar arquitetura atual e proximas frentes.

Criterios de aceite:

- Um novo ambiente consegue subir o projeto seguindo o README.
- As principais decisoes ficam registradas em `docs/`.

Estimativa: 0,5 a 1 dia.

## Ordem recomendada

1. Refatorar `page.tsx` com componentes e `Suspense`, porque melhora a percepcao de velocidade.
2. Refatorar `sync-runner.ts`, porque reduz risco antes de expandir endpoints.
3. Adicionar contagem real por endpoint.
4. Melhorar logs e acompanhamento em tempo real.
5. Expandir grupos `EMP`, `LIQ` e `PAG`.
6. Automatizar rotina diaria.
7. Consolidar documentacao tecnica.

## Testes minimos apos cada etapa

- Rodar verificacao TypeScript.
- Validar pagina principal.
- Validar area administrativa.
- Testar Aracati `014` em `2024`.
- Testar Aracati `014` em `2025`.
- Conferir logs de sucesso e erro.
- Conferir que nenhuma mudanca visual quebrou a largura fixa do admin.
