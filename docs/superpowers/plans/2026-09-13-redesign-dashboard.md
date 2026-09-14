# Redesign Dashboard APITCE — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar `/admin`, `/gestao` e `/apresentacao/aracati` como dashboards com sidebar fixa à esquerda, período início/fim explícito, e substituir o `styles.css` de 4.498 linhas por um arquivo limpo com paleta única.

**Architecture:** Uma camada de tokens única (`design-tokens.css`) alimenta um `styles.css` reescrito do zero. As telas de trabalho (admin, gestão) compartilham o padrão de sidebar escura de 240px; a apresentação mantém formato comercial herdando a mesma identidade. A lógica de período vira função pura testável em `src/lib/periodo.ts`, consumida pela query e pelas três telas.

**Tech Stack:** Next.js 16 (App Router, React Server Components), React 19, TypeScript (`moduleResolution: NodeNext` — imports relativos **com extensão `.js`**), CSS semântico manual (sem classes Tailwind nas telas), lucide-react para ícones, `tsx` como executor de teste.

**Spec:** `docs/superpowers/specs/2026-09-13-redesign-dashboard-design.md`

## Global Constraints

- **Imports relativos com extensão `.js`** — `moduleResolution: NodeNext`. Escrever `from "../../lib/periodo.js"`, nunca `from "@/lib/periodo"`. O alias `@/*` existe no tsconfig mas não é usado nas telas.
- **Paleta única `--ap-*`** definida em `src/app/design-tokens.css`. O sistema concorrente (`--bg`, `--surface`, `--ink`, `--green`, `--line`) é eliminado. Valores exatos: `--ap-navy: #0E1F33`, `--ap-blue: #0A4A8A`, `--ap-green: #087A58`, `--ap-amber: #A65D00`, `--ap-red: #B42318`, `--ap-ink: #10233F`, `--ap-paper: #F4F6FA`, `--ap-surface: #FFFFFF`, `--ap-line: #DCE5F0`.
- **Todo valor monetário usa `font-variant-numeric: tabular-nums`** — KPIs, tabelas, eixos do gráfico.
- **Nunca apresentar dado de demonstração como oficial.** `source === "sim"` é a única condição para rotular "Dados oficiais SIM/TCE-CE".
- **Classes `admin-*` consumidas pelas sub-rotas devem sobreviver por nome** no CSS novo: `admin-panel`, `admin-panel-title`, `admin-table`, `admin-table-head`, `admin-table-row`, `admin-status`, `admin-kpi`, `admin-kpi-grid`, `admin-two-column`, `admin-empty`, `admin-data-card`, `admin-data-summary`, `admin-data-note`, `admin-data-note-list`, `admin-form-grid`, `admin-form-message`, `admin-mini-stats`, `admin-release-grid`, `admin-client-grid`, `admin-scope-grid`, `admin-group-grid`, `admin-log-grid`, `admin-scope-card`, `admin-month`, `admin-log-card`, `admin-log-feed`, `admin-log-toolbar`, `admin-focus-*`, `admin-group-card`, `admin-outline-button`, `admin-link-button`, `admin-primary-link`, `admin-secondary-link`.
- **Sem emojis** em código ou UI.
- **Idioma da UI: português do Brasil.**
- Verificação de cada task: `npm run typecheck` deve passar limpo.

---

### Task 1: Lógica de período (função pura + teste)

Hoje o período é inferido silenciosamente por `meses.at(0)`/`meses.at(-1)` nas páginas, sem noção de lacunas — se abril faltar, "jan a jun" mente sobre continuidade. Esta task cria a função pura que descreve o período honestamente.

**Files:**
- Create: `src/lib/periodo.ts`
- Create: `scripts/test-periodo.ts`
- Modify: `package.json` (adicionar script `test`)

**Interfaces:**
- Consumes: nada (função pura, sem dependências do projeto)
- Produces:
  ```ts
  export type PeriodoInfo = {
    inicio: string | null;      // competência AAAAMM, null se lista vazia
    fim: string | null;         // competência AAAAMM, null se lista vazia
    total: number;              // quantidade de competências presentes
    faltantes: string[];        // competências AAAAMM ausentes entre inicio e fim
    continuo: boolean;          // true quando faltantes.length === 0
  };
  export function describePeriodo(competencias: string[]): PeriodoInfo;
  ```

- [ ] **Step 1: Write the failing test**

Criar `scripts/test-periodo.ts`:

```ts
import assert from "node:assert/strict";
import { describePeriodo } from "../src/lib/periodo.js";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

test("lista vazia nao tem periodo", () => {
  const result = describePeriodo([]);
  assert.equal(result.inicio, null);
  assert.equal(result.fim, null);
  assert.equal(result.total, 0);
  assert.equal(result.continuo, true);
  assert.deepEqual(result.faltantes, []);
});

test("exercicio completo de 12 meses e continuo", () => {
  const meses = ["202501","202502","202503","202504","202505","202506","202507","202508","202509","202510","202511","202512"];
  const result = describePeriodo(meses);
  assert.equal(result.inicio, "202501");
  assert.equal(result.fim, "202512");
  assert.equal(result.total, 12);
  assert.equal(result.continuo, true);
  assert.deepEqual(result.faltantes, []);
});

test("detecta competencia faltante no meio", () => {
  const result = describePeriodo(["202501", "202502", "202504"]);
  assert.equal(result.inicio, "202501");
  assert.equal(result.fim, "202504");
  assert.equal(result.total, 3);
  assert.equal(result.continuo, false);
  assert.deepEqual(result.faltantes, ["202503"]);
});

test("ordena entrada fora de ordem", () => {
  const result = describePeriodo(["202503", "202501", "202502"]);
  assert.equal(result.inicio, "202501");
  assert.equal(result.fim, "202503");
  assert.equal(result.continuo, true);
});

test("atravessa virada de ano", () => {
  const result = describePeriodo(["202511", "202512", "202601"]);
  assert.equal(result.inicio, "202511");
  assert.equal(result.fim, "202601");
  assert.equal(result.total, 3);
  assert.equal(result.continuo, true);
});

test("ignora duplicatas", () => {
  const result = describePeriodo(["202501", "202501", "202502"]);
  assert.equal(result.total, 2);
  assert.equal(result.continuo, true);
});

console.log(`\n${passed} teste(s) passaram.`);
```

Adicionar em `package.json`, dentro de `scripts`, logo após a linha `"typecheck": "tsc --noEmit",`:

```json
    "test": "tsx scripts/test-periodo.ts",
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — erro de módulo não encontrado, porque `src/lib/periodo.ts` ainda não existe.

- [ ] **Step 3: Write minimal implementation**

Criar `src/lib/periodo.ts`:

```ts
export type PeriodoInfo = {
  inicio: string | null;
  fim: string | null;
  total: number;
  faltantes: string[];
  continuo: boolean;
};

export function describePeriodo(competencias: string[]): PeriodoInfo {
  const validas = [...new Set(competencias.filter((c) => /^\d{6}$/.test(c)))].sort();

  if (!validas.length) {
    return { inicio: null, fim: null, total: 0, faltantes: [], continuo: true };
  }

  const inicio = validas[0]!;
  const fim = validas[validas.length - 1]!;
  const presentes = new Set(validas);
  const faltantes: string[] = [];

  for (let cursor = inicio; cursor <= fim; cursor = proximaCompetencia(cursor)) {
    if (!presentes.has(cursor)) faltantes.push(cursor);
  }

  return { inicio, fim, total: validas.length, faltantes, continuo: faltantes.length === 0 };
}

function proximaCompetencia(competencia: string) {
  const ano = Number(competencia.slice(0, 4));
  const mes = Number(competencia.slice(4));
  if (mes >= 12) return `${ano + 1}01`;
  return `${ano}${String(mes + 1).padStart(2, "0")}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS — seis linhas `ok - ...` e `6 teste(s) passaram.`

Run: `npm run typecheck`
Expected: sem saída de erro.

- [ ] **Step 5: Commit**

```bash
git add src/lib/periodo.ts scripts/test-periodo.ts package.json
git commit -m "feat(periodo): descreve intervalo de competencias com deteccao de lacunas"
```

---

### Task 2: Tokens e formatador de período

**Files:**
- Modify: `src/app/design-tokens.css`
- Modify: `src/lib/formatters.ts`

**Interfaces:**
- Consumes: `PeriodoInfo` de `src/lib/periodo.js` (Task 1)
- Produces:
  ```ts
  export function formatPeriodoInfo(periodo: PeriodoInfo): string;
  // 12 competências contínuas -> "jan/2025 — dez/2025"
  // vazio -> "período não informado"
  // um único mês -> "jan/2025"
  ```

- [ ] **Step 1: Adicionar o token da sidebar**

Em `src/app/design-tokens.css`, dentro do bloco `:root`, logo após a linha `--ap-ink-soft: #4c617a;`, acrescentar exatamente estas duas linhas:

```css
  --ap-navy: #0e1f33;
  --ap-navy-line: #24384f;
```

E no bloco `@theme`, após `--color-apitce-ink: #10233f;`, acrescentar:

```css
  --color-apitce-navy: #0e1f33;
```

- [ ] **Step 2: Adicionar o formatador de período**

Ao final de `src/lib/formatters.ts`, acrescentar:

```ts
import type { PeriodoInfo } from "./periodo.js";

export function formatPeriodoInfo(periodo: PeriodoInfo) {
  if (!periodo.inicio || !periodo.fim) return "período não informado";
  if (periodo.inicio === periodo.fim) return formatCompetencia(periodo.inicio);
  return `${formatCompetencia(periodo.inicio)} — ${formatCompetencia(periodo.fim)}`;
}
```

O `import type` deve ficar junto aos demais imports, no topo do arquivo, não ao final.

- [ ] **Step 3: Verificar**

Run: `npm run typecheck`
Expected: sem saída de erro.

- [ ] **Step 4: Commit**

```bash
git add src/app/design-tokens.css src/lib/formatters.ts
git commit -m "feat(tokens): adiciona navy da sidebar e formatador de periodo"
```

---

### Task 3: Query expõe o período

**Files:**
- Modify: `src/lib/queries/pilot.ts`

**Interfaces:**
- Consumes: `describePeriodo`, `PeriodoInfo` de `src/lib/periodo.js` (Task 1)
- Produces: `PilotSnapshot` ganha o campo `periodo: PeriodoInfo`. As três telas passam a ler `snapshot.periodo` em vez de recalcular `meses.at(0)`/`meses.at(-1)`.

- [ ] **Step 1: Estender o tipo e o retorno**

Em `src/lib/queries/pilot.ts`, acrescentar ao topo, junto aos imports existentes:

```ts
import { describePeriodo, type PeriodoInfo } from "../periodo.js";
```

Em `PilotSnapshot`, acrescentar o campo após `meses: PilotMonth[];`:

```ts
  periodo: PeriodoInfo;
```

No `fallback()`, acrescentar após `meses: fallbackMonths,`:

```ts
    periodo: describePeriodo(fallbackMonths.map((m) => m.competencia)),
```

No retorno do caminho real, substituir o bloco que monta `meses` por:

```ts
    const meses = [...aggregate.values()].sort((a, b) => a.competencia.localeCompare(b.competencia));

    return {
      municipio: "Aracati",
      codigoMunicipio: "014",
      exercicio: "202500",
      meses,
      periodo: describePeriodo(meses.map((m) => m.competencia)),
      source: "sim",
      updatedAt: new Date().toISOString()
    };
```

- [ ] **Step 2: Verificar**

Run: `npm run typecheck`
Expected: FALHA esperada nas três páginas que constroem objetos `PilotSnapshot` ou que ainda não passam `periodo`. Se as páginas apenas consomem o snapshot, passa limpo. Corrigir somente erros de tipo em `pilot.ts` nesta task; os erros das páginas serão resolvidos nas tasks 5–7.

Run: `npm run build`
Expected: pode falhar enquanto as páginas não forem atualizadas — aceitável até a Task 7.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/pilot.ts
git commit -m "feat(pilot): expoe periodo com inicio, fim e lacunas no snapshot"
```

---

### Task 4: Reescrever styles.css

A task de maior risco. O arquivo atual tem 4.498 linhas com cinco camadas de override e duas paletas concorrentes; é substituído por um arquivo organizado em seções, com uma paleta só.

**Files:**
- Modify: `src/app/styles.css` (substituição integral do conteúdo)

**Interfaces:**
- Consumes: tokens `--ap-*` de `design-tokens.css` (Task 2)
- Produces: as classes que as telas e sub-rotas usam. Nomes preservados conforme Global Constraints.

- [ ] **Step 1: Registrar o inventário de classes antes de apagar**

Run:
```bash
cd /c/Antigravity/GerencialAPITCE
grep -ohE 'className="[^"]+"' -r src/app src/components | grep -oE '[a-z][a-z0-9-]+' | sort -u > /tmp/classes-usadas.txt
wc -l /tmp/classes-usadas.txt
```

Esse arquivo é a lista de toda classe referenciada no JSX. O CSS novo precisa cobrir todas as que pertencem aos prefixos `admin-`, `pilot-`, `sales-`, `management-`. Manter o arquivo aberto durante a escrita e conferir ao final.

- [ ] **Step 2: Escrever o CSS novo**

Substituir **todo** o conteúdo de `src/app/styles.css`. Estrutura obrigatória, nesta ordem:

```css
@import "tailwindcss";

/* 1. Reset e base
   - *, *::before, *::after { box-sizing: border-box }
   - body: background var(--ap-paper); color var(--ap-ink);
     font-family: Aptos, "Segoe UI", system-ui, sans-serif; margin: 0
   - .valor, .admin-kpi strong, .pilot-metric strong, td numérico:
     font-variant-numeric: tabular-nums
   - :focus-visible { outline: 2px solid var(--ap-blue); outline-offset: 2px }

   2. Shell de dashboard (compartilhado admin + gestão)
   - .ap-shell: display grid; grid-template-columns: 240px 1fr; min-height: 100dvh
   - .ap-sidebar: background var(--ap-navy); color #fff; position sticky; top 0;
     height 100dvh; display flex; flex-direction column; padding 20px 0
   - .ap-sidebar-brand, .ap-sidebar-nav, .ap-sidebar-item (+ .is-active),
     .ap-sidebar-foot
   - .ap-main: padding 24px 28px 56px; min-width 0
   - .ap-header: título + período; display flex; justify-content space-between;
     align-items flex-start; gap 16px; margin-bottom 20px

   3. Faixa de período (assinatura do produto)
   - .pilot-source-band (+ .is-real, .is-demo): display flex; align-items center;
     gap 12px; padding 12px 16px; border-radius var(--ap-radius-md);
     border 1px solid; background var(--ap-surface)
   - .is-real: borda/ícone var(--ap-green); .is-demo: var(--ap-amber)
   - .pilot-period-range: margin-left auto; tabular-nums
   - .pilot-period-gap: aviso de lacuna, cor var(--ap-amber)

   4. Cards e métricas
   - .pilot-metric-grid: grid; repeat(auto-fit, minmax(200px, 1fr)); gap 16px
   - .pilot-metric (+ .tone-blue|green|amber|red): borda-topo 3px na cor do tom
   - .pilot-section, .pilot-section-head, .pilot-notice (.ok/.attention),
     .pilot-empty, .pilot-detail-link
   - .pilot-chart, .pilot-chart-grid, .pilot-chart-axis, .pilot-chart-line
     (.income-line var(--ap-green), .paid-line var(--ap-amber)),
     .pilot-chart-dot, .pilot-legend

   5. Admin (preservar TODOS os nomes listados em Global Constraints)
   - .admin-kpi-grid, .admin-kpi (+ tons), .admin-panel, .admin-panel-title,
     .admin-table + grids (-scope-grid, -client-grid, -group-grid, -log-grid),
     .admin-table-head, .admin-table-row, .admin-status (.ok/.erro/.parcial/.pendente),
     .admin-two-column, .admin-empty, .admin-data-card, .admin-data-summary,
     .admin-data-note, .admin-data-note-list, .admin-form-grid, .admin-form-message,
     .admin-mini-stats, .admin-release-grid, .admin-scope-card, .admin-month,
     .admin-log-card, .admin-log-feed, .admin-log-toolbar, .admin-focus-*,
     .admin-group-card, .admin-outline-button, .admin-link-button,
     .admin-primary-link, .admin-secondary-link, .admin-activity (.ok/.error/.warn)
   - .admin-mobile-gate: display none por padrão

   6. Apresentação comercial (.sales-*)
   - .sales-pilot, .sales-sidebar, .sales-brand, .sales-dashboard,
     .sales-console-head, .sales-kicker, .sales-period-strip, .sales-visual-grid,
     .sales-value-list, .sales-secondary, .sales-year

   7. Responsivo — um único bloco ao final, sem overrides espalhados
   - @media (max-width: 1100px): .ap-shell vira uma coluna; .ap-sidebar
     horizontal com scroll; .sales-pilot uma coluna
   - @media (max-width: 760px): .admin-mobile-gate vira display flex,
     min-height 100dvh, e o .ap-shell do admin é ocultado
   - @media (prefers-reduced-motion: reduce): * { animation: none !important;
     transition: none !important }
*/
```

Regras ao escrever:
- **Cada seletor aparece uma única vez no arquivo.** Se surgir vontade de redefinir algo mais abaixo, editar a definição original.
- **Sem `!important`**, exceto no bloco `prefers-reduced-motion`.
- **Sem cores literais** fora de `design-tokens.css` — usar sempre `var(--ap-*)`.
- **Apagar todo o CSS legado sem prefixo** (`.app-shell`, `.sidebar`, `.brand`, `.nav-list`, `.workspace`, `.topbar`, `.hero-grid`, `.summary-panel`, `.panel`, `.metric-card`, `.monitor-*`, `.group-*`, `.endpoint-table`, `.log-table`, `.bar-chart`, `.import-row`, `.operation-*`, `.command-preview`, `.empty-state`, `.status-badge`, `.context-pill`) — não é referenciado pelas telas atuais.
- Alvo: arquivo final bem abaixo de 1.500 linhas.

- [ ] **Step 3: Conferir cobertura de classes**

Run:
```bash
cd /c/Antigravity/GerencialAPITCE
for c in $(grep -E '^(admin|pilot|sales|management|ap)-' /tmp/classes-usadas.txt); do
  grep -q "\.$c" src/app/styles.css || echo "SEM ESTILO: $c"
done
```
Expected: nenhuma saída, ou apenas classes que o JSX das tasks 5–7 vai remover. Anotar as que sobrarem e resolver ao final da Task 7.

- [ ] **Step 4: Verificar**

Run: `npm run typecheck`
Expected: sem saída de erro (CSS não afeta tipos; serve para confirmar que nada mais quebrou).

- [ ] **Step 5: Commit**

```bash
git add src/app/styles.css
git commit -m "refactor(css): reescreve styles.css com paleta unica e sem camadas de override"
```

---

### Task 5: Shell de dashboard + tela `/admin`

**Files:**
- Create: `src/components/shell/DashboardShell.tsx`
- Modify: `src/app/admin/AdminShell.tsx`
- Modify: `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: classes `.ap-shell`/`.ap-sidebar`/`.ap-main`/`.ap-header` (Task 4); `formatPeriodoInfo` (Task 2)
- Produces:
  ```tsx
  export type ShellNavItem = { href: string; label: string; icon: ReactNode; active?: boolean };
  export function DashboardShell(props: {
    nav: ShellNavItem[];
    brand: string;
    title: string;
    subtitle?: string;
    periodLabel?: string;
    aside?: ReactNode;      // conteúdo do rodapé da sidebar
    children: ReactNode;
  }): JSX.Element;
  ```

- [ ] **Step 1: Criar o DashboardShell**

Criar `src/components/shell/DashboardShell.tsx` — server component, sem `"use client"`. Estrutura JSX:

```tsx
<div className="ap-shell">
  <aside className="ap-sidebar">
    <div className="ap-sidebar-brand">{brand}</div>
    <nav className="ap-sidebar-nav">
      {nav.map((item) => (
        <a key={item.href} href={item.href}
           className={item.active ? "ap-sidebar-item is-active" : "ap-sidebar-item"}
           aria-current={item.active ? "page" : undefined}>
          {item.icon}
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
    {aside ? <div className="ap-sidebar-foot">{aside}</div> : null}
  </aside>
  <div className="ap-main">
    <header className="ap-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {periodLabel ? <span className="ap-header-period">{periodLabel}</span> : null}
    </header>
    {children}
  </div>
</div>
```

Importar ícones de `lucide-react` apenas onde forem usados pelo chamador; o shell recebe `icon` pronto como `ReactNode`.

- [ ] **Step 2: Reescrever AdminShell sobre o DashboardShell**

`src/app/admin/AdminShell.tsx` mantém a mesma assinatura de props que as sub-rotas já usam (`active`, `title`, `subtitle`, `status`, `periodLabel`, `scopeLabel`, `hidePageChrome`, `logs`, `children`) para **não quebrar** `clientes/`, `dados/`, `logs/`, `municipios/`.

Mudanças internas obrigatórias:
- Passa a renderizar `DashboardShell` com os cinco itens de navegação: Painel (`/admin`), Municípios (`/admin/municipios`), Clientes (`/admin/clientes`), Controle de dados (`/admin/dados`), Logs (`/admin/logs`).
- **Remover `admin-topbar` e `admin-topnav`** — a navegação duplicada some; fica só a sidebar.
- **Remover `admin-workflow`** (os 3 passos numerados) — era a terceira repetição dos mesmos destinos.
- Manter `admin-live` (atividades recentes) como `aside` ou painel lateral do conteúdo.
- Manter integralmente o bloco `admin-mobile-gate` e o `fallbackLiveLogs`.
- `hidePageChrome` continua suprimindo o heading próprio quando a página traz o seu.

- [ ] **Step 3: Reescrever o dashboard do admin em duas seções**

`src/app/admin/page.tsx` — manter `export const dynamic = "force-dynamic"` e a chamada `loadAdminData()`. Substituir as quatro seções atuais (`admin-dashboard-hero`, `admin-kpi-grid`, `admin-ops-grid`, `admin-content-grid`) por **duas seções nomeadas**, conforme a decisão registrada no spec:

1. `<section className="admin-panel">` com título **"Precisa de atenção"** — lista de falhas abertas e escopos pendentes, cada item com a ação corretiva ao lado (link para `/admin/dados`). Quando não houver pendência, renderizar `<div className="admin-empty">` dizendo que não há pendências.
2. `<section className="admin-panel">` com título **"Cobertura"** — `admin-kpi-grid` com os KPIs (Municípios ativos, Clientes ativos, Atualizações 24h, Falhas abertas) seguido de `<AdminScopeStatusTable rows={data.scopeRows} />`.

**Remover `admin-next-actions`** (a quarta repetição do fluxo de 3 passos).

Preservar o cálculo de `periodLabel` que já existe no arquivo (deriva de `currentScope`, `monthLabelToCompetencia` e `formatPeriodoCompetencias`) e repassá-lo ao shell.

- [ ] **Step 4: Verificar**

Run: `npm run typecheck`
Expected: sem erros.

Run: `npm run build`
Expected: build completo; as rotas `/admin`, `/admin/clientes`, `/admin/dados`, `/admin/logs`, `/admin/municipios` aparecem na listagem.

- [ ] **Step 5: Commit**

```bash
git add src/components/shell/DashboardShell.tsx src/app/admin/AdminShell.tsx src/app/admin/page.tsx
git commit -m "feat(admin): sidebar unica e dashboard em secoes de atencao e cobertura"
```

---

### Task 6: Faixa de período + gráfico

**Files:**
- Modify: `src/components/pilot/PilotUi.tsx`
- Modify: `src/components/pilot/ExecutiveTrend.tsx`

**Interfaces:**
- Consumes: `PeriodoInfo` (Task 1), `formatPeriodoInfo` (Task 2), classes `.pilot-*` (Task 4)
- Produces:
  ```tsx
  export function PilotSourceBand(props: {
    source: "sim" | "demonstracao";
    periodo: PeriodoInfo;
  }): JSX.Element;
  ```
  Assinatura **muda**: antes recebia `{ source, competencia, inicio, fim }`, agora recebe `periodo` inteiro. As tasks 5 e 7 são os chamadores.

- [ ] **Step 1: Reescrever PilotSourceBand**

Em `src/components/pilot/PilotUi.tsx`:

```tsx
export function PilotSourceBand({ source, periodo }: { source: "sim" | "demonstracao"; periodo: PeriodoInfo }) {
  const real = source === "sim";
  return (
    <div className={real ? "pilot-source-band is-real" : "pilot-source-band is-demo"}>
      {real ? <ShieldCheck size={16} /> : <Database size={16} />}
      <span>{real ? "Dados oficiais SIM/TCE-CE" : "Dados de demonstração local"}</span>
      <strong className="pilot-period-range">
        {formatPeriodoInfo(periodo)}
        <small>{periodo.total} competências</small>
      </strong>
      {!periodo.continuo ? (
        <span className="pilot-period-gap">
          {periodo.faltantes.length} competência(s) sem dados no intervalo
        </span>
      ) : null}
    </div>
  );
}
```

Acrescentar os imports no topo: `import type { PeriodoInfo } from "../../lib/periodo.js";` e `import { formatPeriodoInfo } from "../../lib/formatters.js";`.

Acrescentar `"red"` aos tons aceitos por `PilotMetric` (hoje só `blue | green | amber`).

Remover `PilotDetailLink`, `PilotEmpty` e o reexport `PilotIcons` **apenas se** nenhuma tela os usar após a Task 7 — conferir com `grep -r "PilotDetailLink\|PilotEmpty\|PilotIcons" src/` antes de apagar.

- [ ] **Step 2: Melhorar o gráfico**

Em `src/components/pilot/ExecutiveTrend.tsx`:
- Tratar série vazia: se `meses.length === 0`, retornar `<p className="pilot-empty">Sem competências no período.</p>` em vez de emitir polylines vazias.
- Emitir os `<circle className="pilot-chart-dot">` em cada ponto das duas séries — o CSS já prevê a classe e o componente nunca a emitiu.
- Adicionar `<title>` acessível em cada ponto com competência e valor formatado.
- Manter o thinning de rótulos do eixo X, mas ajustar para 12 competências: mostrar se `meses.length <= 6 || index % 2 === 0 || index === meses.length - 1`.

- [ ] **Step 3: Verificar**

Run: `npm run typecheck`
Expected: FALHA nas telas que ainda chamam `PilotSourceBand` com a assinatura antiga (`competencia`/`inicio`/`fim`). Esperado — resolvido na Task 7.

- [ ] **Step 4: Commit**

```bash
git add src/components/pilot/PilotUi.tsx src/components/pilot/ExecutiveTrend.tsx
git commit -m "feat(pilot): faixa de periodo com inicio, fim e lacunas; pontos no grafico"
```

---

### Task 7: Telas `/gestao` e `/apresentacao/aracati`

**Files:**
- Modify: `src/app/gestao/page.tsx`
- Modify: `src/app/apresentacao/aracati/page.tsx`

**Interfaces:**
- Consumes: `DashboardShell` (Task 5), `PilotSourceBand` com a nova assinatura (Task 6), `snapshot.periodo` (Task 3)
- Produces: nada consumido por outras tasks — é a ponta da cadeia.

- [ ] **Step 1: Reescrever /gestao como dashboard**

`src/app/gestao/page.tsx` deixa de ser maquete de celular. Mudanças obrigatórias:
- **Remover** `management-pilot` de largura 520px, `management-topbar`, `management-scroll` e `management-bottom-nav` com âncoras fictícias (`#detalhes`, `#alertas`, `#mais`).
- Renderizar dentro de `DashboardShell` com nav de dois itens reais: Visão geral (`/gestao`, ativo) e Apresentação (`/apresentacao/aracati`).
- `periodLabel` vem de `formatPeriodoInfo(snapshot.periodo)`.
- `<PilotSourceBand source={snapshot.source} periodo={snapshot.periodo} />` logo abaixo do header.
- `pilot-metric-grid` com quatro `PilotMetric` do acumulado do período: Receita arrecadada (green), Empenhado (amber), Liquidado (blue), Pago (green).
- `PilotSection` com `ExecutiveTrend`.
- **Remover a barra de progresso** `management-progress` — usa divisor hardcoded de 160.000.000 com clamp, não representa proporção real. Não substituir por outra estimativa inventada.
- Manter `PilotNotice` com a regra atual (`current.empenhado > current.receita` → atenção).

- [ ] **Step 2: Atualizar a apresentação comercial**

`src/app/apresentacao/aracati/page.tsx` mantém o formato de peça comercial (sidebar própria `sales-sidebar`, não o `DashboardShell`). Mudanças:
- `<PilotSourceBand source={snapshot.source} periodo={snapshot.periodo} />` com a nova assinatura.
- `sales-period-strip` passa a usar `snapshot.periodo`: Período analisado (`formatPeriodoInfo`), Competências (`periodo.total`), Saldo do período.
- Substituir o literal `"Exercício 2025"` de `sales-year` por `snapshot.exercicio.slice(0, 4)`.
- Manter os quatro `PilotMetric` com `formatCurrency` completo e o `PilotNotice` condicional a `source === "sim"`.

- [ ] **Step 3: Verificar tipos e build**

Run: `npm run typecheck`
Expected: sem erros — todos os chamadores de `PilotSourceBand` já usam a nova assinatura.

Run: `npm run build`
Expected: build completo, todas as rotas listadas.

- [ ] **Step 4: Verificar as rotas no navegador**

```bash
cd /c/Antigravity/GerencialAPITCE
npm run dev > "$SCRATCH/dev.log" 2>&1 &
sleep 8
for p in / /admin /admin/clientes /admin/dados /admin/logs /admin/municipios /gestao /apresentacao/aracati; do
  printf "%-28s " "$p"
  curl -s -o /dev/null -w "%{http_code}\n" --max-time 25 "http://localhost:3000$p"
done
```
Expected: `200` em todas. Conferir `dev.log` — não pode haver `fetch failed` nem erro de módulo.

Confirmar que a faixa mostra dado oficial e o período real:
```bash
curl -s --max-time 20 "http://localhost:3000/gestao" | grep -o "is-real\|is-demo" | sort -u
curl -s --max-time 20 "http://localhost:3000/gestao" | grep -o "jan/2025 — dez/2025"
```
Expected: `is-real`, e o intervalo `jan/2025 — dez/2025` presente (a base tem os 12 meses de 2025 com execução real).

- [ ] **Step 5: Commit**

```bash
git add src/app/gestao/page.tsx src/app/apresentacao/aracati/page.tsx
git commit -m "feat(telas): gestao vira dashboard e apresentacao adota periodo explicito"
```

---

### Task 8: Crítica visual e ajuste

O usuário pediu para eu iterar sozinho com screenshots até ficar apresentável, e só então mostrar o resultado.

**Files:**
- Create: `scripts/screenshot.ts`
- Modify: `src/app/styles.css` (ajustes decorrentes da crítica)

**Interfaces:**
- Consumes: as telas prontas das tasks 5–7
- Produces: imagens em `.screenshots/` (diretório temporário, não versionado)

- [ ] **Step 1: Script de captura**

Criar `scripts/screenshot.ts` usando `playwright`, que já é devDependency:

```ts
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const rotas = [
  { path: "/admin", nome: "admin" },
  { path: "/gestao", nome: "gestao" },
  { path: "/apresentacao/aracati", nome: "apresentacao" },
  { path: "/admin/dados", nome: "admin-dados" },
  { path: "/admin/municipios", nome: "admin-municipios" }
];

const viewports = [
  { nome: "desktop", width: 1440, height: 900 },
  { nome: "mobile", width: 390, height: 844 }
];

mkdirSync(".screenshots", { recursive: true });

const browser = await chromium.launch();
for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  for (const rota of rotas) {
    await page.goto(`http://localhost:3000${rota.path}`, { waitUntil: "networkidle", timeout: 45000 });
    await page.screenshot({ path: `.screenshots/${rota.nome}-${vp.nome}.png`, fullPage: true });
    console.log(`capturado ${rota.nome}-${vp.nome}`);
  }
  await page.close();
}
await browser.close();
```

Acrescentar `.screenshots/` ao `.gitignore`.

- [ ] **Step 2: Capturar**

Com o dev server no ar:
```bash
npx playwright install chromium
npx tsx scripts/screenshot.ts
```

- [ ] **Step 3: Criticar e ajustar**

Abrir cada PNG com a ferramenta Read e avaliar honestamente contra a régua do spec:
- A sidebar tem peso visual correto, ou está pesada/apagada demais?
- O período (início — fim) é legível de imediato no topo?
- Os números alinham? (`tabular-nums` aplicado)
- O admin responde "o que faço agora" na primeira dobra?
- Em 390px: a sidebar recolhe bem? O `admin-mobile-gate` aparece no admin?
- Há espaçamento inconsistente entre seções — sintoma clássico de especificidade de CSS cancelando regra?

Ajustar `src/app/styles.css` e recapturar. Repetir até o resultado estar apresentável. **Editar as regras existentes; não acrescentar uma camada de override ao final do arquivo** — foi exatamente o que degradou o arquivo anterior.

- [ ] **Step 4: Verificação final**

Run: `npm test` — 6 testes passam.
Run: `npm run typecheck` — limpo.
Run: `npm run build` — completo.
Todas as 8 rotas em `200`.

- [ ] **Step 5: Commit**

```bash
git add scripts/screenshot.ts .gitignore src/app/styles.css
git commit -m "chore(visual): script de captura e ajustes apos critica das telas"
```

- [ ] **Step 6: Apresentar ao usuário**

Enviar as capturas de `/admin`, `/gestao` e `/apresentacao/aracati` em desktop e mobile, com um resumo curto do que mudou e o que ficou pendente.

---

## Notas de execução

- **Ordem é obrigatória.** Tasks 3 e 6 deixam o build temporariamente quebrado por mudança de assinatura; a Task 7 fecha a cadeia. Não interromper entre 6 e 7.
- **Não commitar** `.env` (contém chaves), `AGENTS.md`/`CLAUDE.md` (boilerplate do Next.js), nem o `screenshot.js` solto no diretório de scratchpad de sessão antiga. Sempre revisar `git status` antes de cada `git add`.
- **Não tocar** em `src/lib/tce/sync-runner.ts`, `src/lib/tce/env.ts` nem `src/lib/supabase/admin.ts` — fora do escopo e com alterações do trabalho anterior ainda não commitadas.
- As sub-rotas do admin não são redesenhadas, mas **devem continuar renderizando**. Se a Task 4 remover uma classe que elas usam, restaurá-la no CSS.
