# Onde parei — APITCE

Atualizado em 2026-09-13.

## Estado atual

- Base: Next.js, React, TypeScript e Supabase atualizados no `package.json` e `package-lock.json`.
- Pilotos criados: `/apresentacao/aracati`, `/gestao` e a central operacional `/admin` com orientação própria para celular.
- Fonte dos pilotos: consulta server-side à view `vw_tce_execucao_orcamentaria_mensal` para Aracati/2025. Sem Supabase configurado ou sem dados, a interface declara que está em demonstração local; nunca exibe esse fallback como SIM oficial.
- Sistema visual documentado em `docs/20-SISTEMA-VISUAL.md`.
- Validação em 2026-09-13: `npm run typecheck` e `npm run build` concluídos; `/admin`, `/apresentacao/aracati`, `/gestao` e `/icon.svg` responderam HTTP 200 localmente. A área Gestão foi inspecionada em 360 px, 390 px e 430 px; o Admin em 390 px exibe somente o direcionamento para Gestão.
- Consulta real de leitura ao Supabase foi tentada duas vezes e falhou com `TypeError: fetch failed`; não foi possível confirmar a view ou dados remotos nesta sessão.

## Atualização em 2026-09-13 (sessão seguinte)

- Bloqueio de conectividade investigado e resolvido: o projeto Supabase `APITCE` (`ref rjqyqbkwavuhwepekohr`) está `ACTIVE_HEALTHY` e não foi excluído. Um teste direto via `curl` contra `vw_tce_execucao_orcamentaria_mensal` (município `014`, exercício `202500`) retornou HTTP 200 com dados reais de Aracati. O `TypeError: fetch failed` anterior foi um problema pontual do ambiente de execução da sessão anterior, não da rede, da view ou do projeto.
- Servidor `next dev` reiniciado do zero (matando um processo antigo que tinha estado de módulos desatualizado) e as três rotas confirmadas com HTTP 200 sem erros de fetch no log: `/admin`, `/gestao`, `/apresentacao/aracati`.
- Confirmado no HTML renderizado de `/apresentacao/aracati` e `/gestao`: a faixa de origem dos dados usa a classe `pilot-source-band is-real` (não `is-demo`) e o texto "Dados oficiais SIM/TCE-CE" — os pilotos estão exibindo dado oficial da view, não o fallback de demonstração.
- Adicionada ao `.env` local a chave `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (nova nomenclatura Supabase), completando o suporte que já existia em `.env.example`/`env.ts`.
- Pendente: comparar os valores numéricos exibidos (receita/despesa por mês/órgão) com a contabilidade oficial antes de aprovar a tela comercial como demonstração — isso depende de uma referência externa que só o usuário pode fornecer.

## Redesign visual em andamento (2026-09-13, sessão 3)

Usuário rejeitou as 3 telas ("pobre, confuso, feio"). Pediu dashboard com sidebar à esquerda (referência AdminLTE) e período início/fim explícito. Spec e plano completos e aprovados:
- `docs/superpowers/specs/2026-09-13-redesign-dashboard-design.md`
- `docs/superpowers/plans/2026-09-13-redesign-dashboard.md` (8 tasks)

**Descoberta importante:** a base tem os 12 meses de 2025 completos (jan–dez, com execução real em todos, inclusive dezembro). O período correto a exibir é **jan/2025 — dez/2025**, não os 6 meses que o mock antigo sugeria.

**Feito (tasks 1–4 do plano, commitadas):**
1. `src/lib/periodo.ts` — função `describePeriodo()` com detecção de lacunas (testada, `npm test` passa).
2. `src/app/design-tokens.css` — token `--ap-navy` e `formatPeriodoInfo()` em `formatters.ts`.
3. `src/lib/queries/pilot.ts` — `PilotSnapshot` agora expõe `periodo: PeriodoInfo`.
4. `src/app/styles.css` **reescrito do zero**: 4.498 → ~1.660 linhas, elimina 5 camadas de override e 2 paletas concorrentes que existiam antes. Todas as classes usadas pelas sub-rotas do admin foram preservadas por nome (conferido).

**Feito (tasks 5, 6 e 7 do plano — commitadas em 2026-09-14):**
- Task 5: `src/components/shell/DashboardShell.tsx` criado (sidebar + header reutilizável). `AdminShell.tsx` reescrito sobre ele, navegação triplicada (topbar+sidebar+workflow) virou só sidebar. `admin/page.tsx` reescrito em 2 seções: "Precisa de atenção" (pendências/falhas) e "Cobertura" (KPIs + tabela).
- Task 6: `PilotSourceBand` mudou assinatura — agora recebe `periodo: PeriodoInfo` inteiro em vez de `competencia/inicio/fim` soltos, e mostra aviso quando há lacuna. `ExecutiveTrend` ganhou pontos (`circle`) em cada competência com `<title>` acessível, e trata série vazia com `PilotEmpty`. Removidos `PilotDetailLink` e `PilotIcons` (vestigiais, sem uso).
- Task 7: `/gestao` reescrita como dashboard real usando `DashboardShell` — saiu do formato maquete de celular (520px) e da barra de progresso com divisor hardcoded de 160.000.000. Agora mostra os 4 indicadores acumulados do período + tabela mês a mês. `/apresentacao/aracati` atualizada para a nova assinatura de `PilotSourceBand` e `formatPeriodoInfo`, mantendo o formato comercial com sidebar própria.

**Verificado antes de parar (2026-09-14):** `npm test` (6/6 passam), `npm run typecheck` (limpo) e `npm run build` (compila todas as rotas) — todos rodados com sucesso no estado atual.

**Falta fazer (task 8 do plano, a última):**
- Rodar `npm run dev`, instalar o browser do Playwright (`npx playwright install chromium`) e capturar screenshots de `/admin`, `/gestao`, `/apresentacao/aracati` em desktop (1440px) e mobile (390px) — o script `scripts/screenshot.ts` ainda precisa ser criado conforme o plano (Task 8, Step 1).
- Criticar o resultado visualmente e ajustar `src/app/styles.css` diretamente (nunca empilhar uma nova camada por cima — foi isso que degradou o arquivo antes).
- Repetir até ficar apresentável, então mostrar as capturas ao usuário com um resumo do que mudou.
- Detalhe a conferir: a classe `.admin-gestao-grid` foi adicionada ao CSS para a tabela mensal de `/gestao` — vale checar visualmente se o alinhamento numérico (`tabular-nums`) está bom nessa tabela.

**Este é o único passo restante do plano.** Depois da Task 8, o redesign está completo.

## Cuidados

- Não publicar a área gerencial para clientes antes de implementar autenticação, RLS e escopo por município.
- Não misturar dados complementares futuros nas tabelas `tce_*`.
- Preservar arquivos não rastreados que não pertençam à tarefa ao preparar qualquer commit.
