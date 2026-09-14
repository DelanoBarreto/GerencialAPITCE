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

**Em andamento (task 5, não commitada ainda):**
- `src/components/shell/DashboardShell.tsx` — criado (sidebar + header reutilizável).
- `src/app/admin/AdminShell.tsx` — reescrito sobre o `DashboardShell`, navegação duplicada (topbar+sidebar+workflow) virou só sidebar.
- `src/app/admin/page.tsx` — reescrito em 2 seções: "Precisa de atenção" (pendências/falhas) e "Cobertura" (KPIs + tabela).
- `npm run typecheck` passa limpo neste ponto.

**Falta fazer (tasks 6–8 do plano):**
- Task 6: `PilotSourceBand` mudar assinatura para receber `periodo` inteiro (hoje ainda recebe `competencia/inicio/fim` separados) + pontos no gráfico `ExecutiveTrend`.
- Task 7: reescrever `/gestao` (sair do formato maquete de celular 520px) e `/apresentacao/aracati` para usar a nova `PilotSourceBand` e `DashboardShell`.
- Task 8: rodar `npm run dev`, tirar screenshots (desktop 1440px + mobile 390px) das 3 telas, criticar e ajustar `styles.css`, então mostrar ao usuário.

**Atenção ao retomar:** como o Admin foi commitado mas Gestão/Apresentação ainda não foram atualizadas, `npm run build` pode falhar até a Task 6 terminar (assinatura de `PilotSourceBand` mudando). Seguir o plano na ordem exata das tasks 6→7→8.

## Cuidados

- Não publicar a área gerencial para clientes antes de implementar autenticação, RLS e escopo por município.
- Não misturar dados complementares futuros nas tabelas `tce_*`.
- Preservar arquivos não rastreados que não pertençam à tarefa ao preparar qualquer commit.
