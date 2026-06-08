# Filtros da API e estrategia de sincronizacao

Este guia orienta a primeira versao do worker APITCE para buscar dados do TCE-CE e gravar no Supabase.

## Padrao de filtros

| Campo | Tipo no projeto | Uso |
| --- | --- | --- |
| `codigo_municipio` | texto | Municipio do SIM. Aracati = `014`. |
| `exercicio_orcamento` | texto | Exercicio/entidade do orcamento. Exemplo observado no manual: `202600`. |
| `data_referencia_doc` | texto | Competencia mensal em `AAAAMM`. Exemplo: `202601`. |
| `codigo_orgao` | texto | Filtro opcional para orgao. Preservar zeros a esquerda. |
| `codigo_unidade_orcamentaria` | texto | Filtro opcional para unidade. Preservar zeros a esquerda. |
| `$count` | numero | Tamanho da pagina. Usar `1000`. |
| `$start_index` | numero | Inicio da pagina. Incrementar de 1000 em 1000. |

## Estrategia de paginacao

O worker deve buscar paginas ate uma destas condicoes:

- resposta sem `elements`;
- `elements` vazio;
- quantidade retornada menor que `$count`;
- ausencia de link `next`, quando disponivel.

Mesmo quando existir link `prev` ou `next`, o worker deve registrar o valor de `$start_index` usado no log para permitir retentativa.

## Grupos do MVP

### Grupo 1 - Referencias

Carga inicial e atualizacao quando mudar o exercicio:

- `municipios`
- `orgaos`
- `unidades_orcamentarias`
- `funcoes`
- `tipos_unidades_administrativas`
- `gestores`
- `programas_governo`

Filtros principais: `codigo_municipio` e `exercicio_orcamento`, quando exigidos pelo endpoint.

### Grupo 2 - Orcamento

Carga anual por exercicio:

- `orcamento_receita`
- `orcamento_despesa`
- `orcamento_despesas_projetos_atividades`
- `elementos_despesas_projetos_atividades`

Filtros principais: `codigo_municipio`, `exercicio_orcamento` e, opcionalmente, `codigo_orgao`.

### Grupo 3 - Execucao mensal

Carga mensal por competencia:

- `balancetes_receitas_orcamentarias`
- `balancetes_despesas_orcamentarias`
- `balancetes_receitas_extra_orcamentarias`
- `balancetes_despesas_extra_orcamentarias`
- `notas_empenhos`
- `liquidacoes`
- `notas_pagamentos`

Filtros principais: `codigo_municipio`, `exercicio_orcamento`, `data_referencia_doc`.

## Tabela de controle obrigatoria

Criar uma tabela `sync_log` no Supabase com pelo menos:

- `id`
- `endpoint`
- `codigo_municipio`
- `exercicio_orcamento`
- `data_referencia_doc`
- `start_index`
- `count_requested`
- `rows_received`
- `status`
- `error_message`
- `started_at`
- `finished_at`

## Regras para evitar duplicidade

- Cada tabela sincronizada deve ter chave natural composta baseada nos campos de identificacao do Manual SIM e da resposta da API.
- Valores monetarios podem ser negativos e devem ser aceitos.
- Codigos devem ser texto, nao numero.
- A carga mensal deve usar upsert, nao insert simples.
- Erros de uma pagina devem ser registrados sem apagar dados ja carregados.
- Antes de baixar, o worker consulta `tce_sync_log`; se ja existir status `ok` para o mesmo endpoint, municipio, exercicio e competencia, a carga e pulada.
- Use `--force` apenas quando quiser rebaixar uma competencia ja sincronizada para aplicar correcoes do TCE; mesmo nesse caso o `upsert` evita duplicidade.
- Em `tce_raw_records`, a chave natural inclui hash do payload. Isso evita perder linhas quando a API retorna varias linhas com os mesmos codigos principais.

## Atualizacao mensal

Para endpoints mensais, o cadastro principal e municipio + exercicio. Os meses sao competencias dentro do exercicio e devem ser verificados automaticamente.

Exemplo:

```bash
npm run sync:tce -- --endpoint balancetesReceitasOrcamentarias --municipio 014 --exercicio 202500 --data-referencia 202502
npm run sync:grupo -- --municipio 014 --grupo bal --ano 2025 --data-inicial 202501 --data-final 202502 --default
```

Se rodar novamente `202501`, o worker deve retornar `Paginas=0; registros=0`, porque essa competencia ja foi carregada.

Na interface futura, o usuario deve escolher municipio e ano; o sistema deve verificar todos os meses disponiveis daquele ano e baixar automaticamente as competencias novas.
