# Redesign visual do APITCE — dashboard com sidebar

Data: 2026-09-13

## Problema

As três telas (`/admin`, `/gestao`, `/apresentacao/aracati`) foram rejeitadas pelo usuário: "muito pobre, complicado de entender, não é autoexplicativo, está muito feio". O pedido é um layout com cara de dashboard alinhado à esquerda, tendo como referência o AdminLTE (`adminlte.io/themes/vue-nuxt/index2` e `index3`), e que os dados de gestão e apresentação exibam início e fim do período como referência.

A investigação do código mostrou que o visual ruim não é falta de esforço, é acúmulo estrutural:

- **`src/app/styles.css` tem 4.498 linhas com cinco camadas cronológicas de override empilhadas** ("clean theme override", "typography softening", "final polish", "dashboard redesign pass", "cockpit refresh"). Os mesmos seletores (`.admin-shell`, `.admin-kpi`, `.pilot-source-band`, `.pilot-chart`, `.sales-dashboard`, `.management-pilot`) são redefinidos de 2 a 4 vezes; vale sempre a última. Cada tentativa anterior de melhorar o visual virou uma camada nova sem limpar a anterior.
- **Dois sistemas de variáveis concorrentes**: `--bg/--surface/--ink/--green/--line` (definido em styles.css, usado pelo admin) e `--ap-*` (design-tokens.css, usado por gestão/apresentação). Por isso as telas não parecem do mesmo produto.
- **~830 linhas de CSS legado sem prefixo** (`.app-shell`, `.sidebar`, `.workspace`, `.hero-grid`…) de um shell administrativo antigo, provavelmente morto.
- **No admin, o mesmo conjunto de destinos aparece em três lugares** com rótulos diferentes: `admin-topnav` (3 links), `admin-sidenav` (5 itens) e o `admin-workflow` de 3 passos — que ainda é repetido uma quarta vez no dashboard como `admin-next-actions`. Essa duplicação é a causa direta do "não é autoexplicativo".
- **`/gestao` é uma maquete de celular** (`max-width: 520px`, bottom-nav fixa) renderizada no meio do desktop, com navegação fictícia (âncoras `#detalhes`, `#alertas`, `#mais`).
- A barra de progresso de `/gestao` usa um **divisor hardcoded de 160.000.000** com clamp 18–100%, ou seja, não representa proporção real.

### Descoberta sobre os dados

Consultando a view `vw_tce_execucao_orcamentaria_mensal` diretamente, o exercício 2025 de Aracati (`014`/`202500`) tem **os 12 meses completos** (jan a dez), 59 órgãos por competência, todos com execução real — dezembro inclusive, com R$ 68,5 mi de despesa paga (típico de fechamento). O fallback mock de `pilot.ts` sugere apenas 6 meses, o que subrepresenta a base. O período real a exibir é **jan/2025 a dez/2025, 12 competências**.

## Decisões tomadas com o usuário

1. **Base AdminLTE + identidade própria** — mesma estrutura (sidebar escura à esquerda, stat boxes no topo, cards com período), mas paleta e tipografia próprias, sem virar clone de template.
2. **Admin e Gestão usam o mesmo shell com sidebar; Apresentação fica à parte** (mantém caráter de peça comercial, mas herda paleta e tipografia).
3. **Período é informativo agora**, com seletor interativo deixado para uma etapa seguinte; o layout já é preparado para recebê-lo.
4. **Admin mostra as duas coisas em seções separadas**: pendências/ações no topo, panorama de cobertura abaixo.
5. **`styles.css` é reescrito limpo**, não recebe uma sexta camada. Nomes de classe usados pelas sub-rotas do admin são preservados.
6. **Sub-rotas do admin** (clientes, dados, logs, municípios) não são redesenhadas agora — só precisam continuar funcionando, herdando sidebar e paleta.

## Identidade visual

O vocabulário não é "dashboard SaaS genérico", é o mundo de controle de contas públicas: balancete, carimbo, papel-moeda.

### Paleta

| Papel | Token | Valor |
|---|---|---|
| Tinta / sidebar | `--ap-navy` | `#0E1F33` |
| Ação, links, foco | `--ap-blue` | `#0A4A8A` |
| Receita / saudável | `--ap-green` | `#087A58` |
| Despesa / atenção | `--ap-amber` | `#A65D00` |
| Falha / risco | `--ap-red` | `#B42318` |
| Texto principal | `--ap-ink` | `#10233F` |
| Fundo | `--ap-paper` | `#F4F6FA` |
| Superfície | `--ap-surface` | `#FFFFFF` |
| Linha | `--ap-line` | `#DCE5F0` |

A maior parte já existe em `design-tokens.css`; entra `--ap-navy` para a sidebar. O sistema concorrente (`--bg`, `--surface`, `--ink`, `--green`, `--line`) é eliminado — passa a existir um único conjunto `--ap-*`.

### Tipografia

O detalhe que separa ferramenta fazendária de dashboard genérico: **todo valor monetário usa `font-variant-numeric: tabular-nums`**, para que colunas de dinheiro alinhem dígito a dígito como num balancete impresso. Aplicado em KPIs, tabelas e eixos do gráfico.

Escala: título de tela 24px/600, título de card 15px/600, rótulo de KPI 12px/500 em maiúsculas com `letter-spacing: .04em`, valor de KPI 26px/650 tabular, corpo 14px/400.

### Assinatura

A **faixa de período** (`PeriodBand`) presente no topo de toda tela de dados: exibe origem do dado (oficial SIM/TCE-CE ou demonstração), o intervalo explícito "Jan/2025 — Dez/2025", a contagem de competências, e um aviso quando há mês faltando no intervalo em vez de fingir continuidade. É o elemento que responde ao pedido de "início e fim pra ter referência" e é o que amarra as três telas como um produto só.

## Estrutura

```
┌───────────┬─────────────────────────────────────────┐
│ SIDEBAR   │ HEADER  título · Jan/2025 — Dez/2025    │
│ #0E1F33   ├─────────────────────────────────────────┤
│ 240px     │ FAIXA DE PERÍODO (origem + intervalo)   │
│ fixa      ├─────────────────────────────────────────┤
│           │ [stat] [stat] [stat] [stat]             │
│ marca     ├───────────────────────┬─────────────────┤
│ · Painel  │ gráfico               │ tabela / lista  │
│ · Municí. │                       │                 │
│ · Dados   ├───────────────────────┴─────────────────┤
│ · Logs    │ tabela                                  │
└───────────┴─────────────────────────────────────────┘
```

### `/admin`

Uma única navegação, na sidebar. O `admin-topnav` duplicado e o `admin-workflow` de 3 passos repetido saem. Conteúdo em duas seções nomeadas:

1. **Precisa de atenção** — falhas abertas, escopos pendentes, com a ação corretiva ao lado de cada item. Responde "o que eu faço agora".
2. **Cobertura** — municípios/anos/grupos já carregados, contagem, última competência. Responde "o que já tenho".

O `admin-mobile-gate` (que hoje esconde o admin inteiro no celular e manda para `/gestao`) é mantido: é uma decisão deliberada registrada no sistema visual, não um defeito.

### `/gestao`

Deixa de ser maquete de 520px. Vira dashboard com a mesma sidebar; abaixo de 900px a sidebar recolhe em menu. A barra de progresso com divisor hardcoded é removida — proporção passa a ser calculada sobre valor real (receita prevista) ou o elemento sai, se não houver base honesta de comparação.

### `/apresentacao/aracati`

Mantém o formato de peça comercial (sem sidebar de navegação operacional), mas adota a paleta, a tipografia tabular e a mesma faixa de período. Continua declarando a origem do dado com honestidade — `source === "sim"` versus demonstração.

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/app/styles.css` | reescrito limpo, uma paleta só, sem camadas de override |
| `src/app/design-tokens.css` | acrescenta `--ap-navy`; vira fonte única de verdade |
| `src/app/admin/AdminShell.tsx` | shell com sidebar única; remove topnav e workflow duplicados |
| `src/app/admin/page.tsx` | duas seções: atenção e cobertura |
| `src/app/gestao/page.tsx` | dashboard com sidebar, sem maquete de 520px |
| `src/app/apresentacao/aracati/page.tsx` | mesma identidade, formato comercial |
| `src/components/pilot/PilotUi.tsx` | `PilotSourceBand` vira a faixa de período com início/fim/contagem |
| `src/components/pilot/ExecutiveTrend.tsx` | eixos tabulares, pontos, tratamento de série vazia |
| `src/lib/queries/pilot.ts` | expõe período (início, fim, contagem, lacunas) explicitamente |

Classes com prefixo `admin-*` consumidas pelas sub-rotas (`admin-panel`, `admin-table`, `admin-status`, `admin-kpi`, `admin-two-column`, `admin-empty`, `admin-data-card`, `admin-form-*`, `admin-mini-stats`, `admin-scope-card`, `admin-month*`, `admin-release-grid`, `admin-log-*`, `admin-group-*`, `admin-focus-*`) são preservadas por nome no CSS novo, para que clientes/dados/logs/municípios continuem renderizando.

## Verificação

- `npm run typecheck` e `npm run build` sem erros.
- As rotas `/admin`, `/gestao`, `/apresentacao/aracati` e as sub-rotas `/admin/clientes`, `/admin/dados`, `/admin/logs`, `/admin/municipios` respondem HTTP 200.
- Inspeção visual por screenshot em desktop (1440px) e celular (390px), com auto-crítica e ajuste antes de apresentar ao usuário.
- A faixa de período exibe "jan/2025 — dez/2025 · 12 competências" com os dados reais, e `is-real` (não `is-demo`).
- Nenhuma regressão de conteúdo nas sub-rotas do admin.

## Fora de escopo

- Seletor de período interativo (filtro) — etapa seguinte, layout já preparado.
- Redesenho do conteúdo das sub-rotas do admin.
- Autenticação, RLS e escopo por município — continua sendo pré-requisito para publicar a área gerencial a clientes, conforme `docs/39-ONDE-PAREI.md`.
- Refatoração de `sync-runner.ts` em mappers (pendência antiga de `docs/checklist-melhorias.md`).
