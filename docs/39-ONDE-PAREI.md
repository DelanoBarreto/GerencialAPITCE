# Onde parei — APITCE

## Visão de produto ampliada — 2026-09-24

O usuário definiu uma visão de produto e mercado mais ampla que o PRD original (`docs/projetoAPITCE.md`), registrada em **`docs/43-VISAO-PRODUTO-E-MERCADO.md`**: indicadores legais em tempo real (LRF, RCL, saúde, educação, VAAT/VAAF), uma camada gerencial complementar para cobrir o atraso de 1-2 meses do TCE, RBAC multi-perfil (prefeito, secretários, câmara, contadores, folha, patrimônio, jurídico), e um módulo add-on opcional de automação/canais (Cloudflare, polling automático, WhatsApp, agente conversacional via n8n). Nenhum desses itens está implementado; a prioridade de execução continua sendo o checkpoint abaixo (Fase 1 de segurança).

## Checkpoint atual — 2026-09-15

Branch publicada: `codex/apitce-produto-seguro`, último commit remoto `e0b6297` (GitHub `origin/codex/apitce-produto-seguro`). O código prepara login/logout Supabase SSR, `src/proxy.ts`, guardas de página e POST, cliente autenticado para leituras, rotas `/gestao/[codigo]/[exercicio]` e `/apresentacao/[codigo]/[exercicio]`, migrations TCE de ponte/RLS/auditoria, lock e documentação. A área autenticada não mostra mais meses fictícios quando a consulta não retorna dados. **Nenhuma das três migrations novas foi aplicada ao banco remoto; não houve carga, exposição de `tce` na Data API nem deploy nesta implementação.** O SQL das onze migrations TCE anteriores foi extraído do histórico Claude; as dezesseis migrations antigas do projeto isolado foram movidas para legado.

Verificação local de 2026-09-15: `npm test` (8 testes), `npm run test:browser:anon` (desktop 1440 px e mobile 390 px; seis rotas protegidas e três POSTs retornando 401), `npm run typecheck`, `npm run build`, `git diff --check` e `node scripts/extract-tce-migrations.mjs ... --verify` passaram na versão publicada. `npm audit --omit=dev` confirmou zero vulnerabilidades nas dependências de produção. Consulta somente leitura no Supabase compartilhado confirmou colunas, índices e status da ponte: organização `014` e catálogo `014` existem, mas ainda há **zero assinaturas e zero usuários TCE**. Após o commit, `npm run test:db:local` passou: 14 migrations em PostgreSQL PGlite em memória, com usuários simulados, grants/RLS/RPCs/views invoker. **Esta evolução ainda não foi commitada.** Os testes de RLS com JWT real e a execução do SQL novo em base Supabase isolada **não foram realizados**.

O passo anterior “expor `tce` primeiro” abaixo ficou **obsoleto e inseguro**: antes da exposição, revisar e testar as migrations locais `20260915160000`–`20260915160200` sob anon/usuários reais. O remoto ainda possui policies `TO PUBLIC`, grants amplos e a view `tce.municipios` sobre `plataforma` que falha por permissão. A tela/RPC PortalGov de usuários é fixa a `portalgov`; vínculos TCE usam conta Auth existente, bootstrap interno controlado e RPC TCE restrita ao superadmin.

Próxima ação exata: revisar o diff local e repetir `npm run test:db:local`, testes, tipos e build; **aguardar autorização do usuário para commit**. Depois, preparar backup/ACLs/policies/contagens TCE e testes com JWT real em base Supabase isolada. Não há `psql`, Docker ou Supabase CLI instalados, mas o teste PostgreSQL local já está funcional. **Antes de qualquer alteração remota**, obter autorização específica para aplicação em produção e só depois considerar exposição da Data API. Checklist e critérios em `docs/superpowers/plans/2026-09-15-apitce-produto-seguro.md`; contrato em `docs/42-ARQUITETURA-SEGURANCA-APITCE.md`.

As seções seguintes são o registro histórico de 2026-09-13/14, não instruções atuais de execução.

Atualizado em 2026-09-14. A seção "Migração para a plataforma" no final deste arquivo registra o estado histórico daquela sessão.

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

**Task 8 concluída (2026-09-14).** O redesign está completo. `scripts/screenshot.ts` criado (Playwright, captura 5 rotas em 1440px e 390px para `.screenshots/`, que está no gitignore). Rodar com o dev server no ar: `npx tsx scripts/screenshot.ts`.

### Bugs encontrados na inspeção visual e corrigidos

1. **`[object Object]` gravado no banco** (o mais grave): `sync-runner.ts:831` usava `String(error)` em erros do Supabase/TCE, que são objetos simples e não instâncias de `Error`. Toda falha registrada até agora perdeu a causa real. Corrigido com `describeError()`, que extrai `message`/`details`/`hint`/`code`. O admin também ignora os `[object Object]` já gravados.
2. Falhas duplicadas do mesmo endpoint apareciam repetidas na fila de atenção — agora deduplicadas.
3. Textos grudados (`ARACATI014 / 2026`, `unidades_orcamentariasmunicípio 014`) porque `strong`/`small`/`span` são inline por padrão — corrigido no CSS.
4. Tabela mensal da gestão no celular mostrava quatro números sem dizer o que eram — agora cada célula tem rótulo via `data-label`.
5. Botão de ação de linha sem área de toque — agora 34x34px.
6. **Alerta enganoso na gestão**: acusava atenção sempre que empenho > receita, o que é rotina no setor público (Aracati empenhou R$ 228 mi em janeiro — dado real, é o orçamento anual empenhado na abertura). O critério agora é pagamento acima da arrecadação, que é o que pressiona caixa de verdade.

Nota: o círculo preto flutuante que aparece nas capturas é o indicador de dev do Next.js, não existe em produção.

### Validação dos números

Conferido contra a view: a soma dos 12 meses de `*_no_mes` bate exatamente com o `*_ate_mes` de dezembro (receita R$ 453.940.889, empenhado R$ 572.304.300). Os totais do painel estão corretos.

## Roadmap

A ordem de trabalho daqui em diante está em **`docs/40-ROADMAP.md`**, criado a partir de auditoria do código e do banco em 2026-09-14. Ele consolida o que estava espalhado em `checklist-projeto.md`, `checklist-melhorias.md` e `proximos-passos.md`.

Achado que muda a prioridade: **as rotas de API não têm autenticação** (`/api/operacao/*` dispara carga de dados sem verificar identidade, e não existe `middleware.ts`), **26 tabelas estão sem RLS** e **3 views estão com SECURITY DEFINER** — os dois últimos confirmados pelo linter de segurança do Supabase como ERROR. A Fase 1 do roadmap trata disso e bloqueia qualquer publicação.

## Melhorias sugeridas (detalhadas no roadmap)

1. **Filtro de período interativo** — o layout já está preparado (a faixa de período é um componente isolado), mas hoje o recorte é fixo em jan–dez/2025. É o próximo passo natural do que o usuário pediu.
2. **`loadAracatiPilot()` é hardcoded** para Aracati/`014`/`202500` — não aceita parâmetro. Para o painel servir outros municípios, precisa receber `codigoMunicipio` e `exercicio`. Bloqueia a venda para o segundo cliente.
3. **Usar `*_ate_mes` da view em vez de somar 12 meses** no cliente — a view já traz o acumulado pronto; a soma manual funciona mas é trabalho redundante.
4. **`updatedAt` do snapshot é `new Date()`**, ou seja, a hora da requisição, não da última carga real. Nenhuma tela usa hoje, mas é uma informação falsa esperando para ser exibida.
5. **`sync-runner.ts` tem ~1.130 linhas** e continua monolítico — a quebra em mappers por tabela é pendência antiga de `docs/checklist-melhorias.md`, prioridade alta lá.
6. **Dados comerciais de `/admin/clientes` são mock** — a tela já avisa, mas em algum momento precisa de origem real.
7. **Sem autenticação/RLS** — pré-requisito registrado abaixo, continua valendo: não publicar a área gerencial para clientes antes disso.

## Migração para a plataforma (2026-09-14, sessão 4) — LEIA ISTO PRIMEIRO

O usuário revelou que está construindo uma plataforma multi-sistema (PortalGov + Jurídico + APITCE) usando **schemas** no mesmo banco Supabase, em vez de um projeto por sistema — estratégia para reduzir custo. Decisão tomada e **já em execução**: migrar o APITCE do projeto isolado (`rjqyqbkwavuhwepekohr`) para o banco do PortalGov (`omcbfuiyaeakbsqbzgqk`, projeto `PortalGov-Producao`), como schema `tce`.

Detalhes completos da decisão e do porquê em **`docs/41-MIGRACAO-PLATAFORMA.md`** — leia esse arquivo antes de continuar, ele tem o raciocínio inteiro. Resumo do que já foi feito:

1. **Schema `tce` criado** no banco do PortalGov, registrado em `plataforma.sistemas` com 4 papéis (`superadmin`, `tenant_admin`, `editor`, `viewer`).
2. **25 tabelas migradas** (estrutura, não dados ainda) com todas as chaves naturais preservadas. A tabela `municipios` do APITCE (1 registro) foi descartada — vira uma **view** `tce.municipios` sobre `plataforma.catalogo_municipios`, que já tem os 184 municípios do Ceará. Importante: ter 184 no catálogo não significa carregar dados de todos — dados do TCE só são baixados para quem estiver em `tce_municipios_monitorados` (clientes/prospects/amostras).
3. **3 views recriadas com `security_invoker = true`** (corrige o erro `SECURITY DEFINER` que existia no banco antigo).
4. **RLS aplicado nas 25 tabelas**, reusando as funções que o PortalGov já tinha (`plataforma.tem_acesso('tce')` etc.). Criada `tce.municipios_permitidos()` como ponte entre `codigo_municipio` (modelo do TCE) e `organizacao_id` (modelo da plataforma) — teve que ser corrigida uma vez porque a função `org_atual()` original dependia de um header específico do PortalGov (`x-portalgov-tenant-slug`) que o APITCE não envia.
5. **Linter de segurança do Supabase confirmou zero ERROR no schema `tce`** (antes eram 26 tabelas sem RLS + 3 views SECURITY DEFINER = 29 erros).
6. **Código apontado para o banco novo**: `.env` atualizado, `src/lib/supabase/admin.ts` usa `db: { schema: "tce" }`, `sync-runner.ts` não reescreve mais o catálogo de municípios, rota de monitoramento simplificada (só valida código no catálogo, não busca mais no TCE). Tudo commitado e no GitHub.

### Bloqueio exato onde parou

O schema `tce` tem os *grants* de banco (`USAGE`/`SELECT`/`ALL`) mas **ainda não foi adicionado à lista de "Exposed schemas" nas configurações do projeto Supabase** — isso só se faz pelo painel web, não por SQL/MCP. Testei com um script e confirma: `ERRO: Invalid schema: tce`.

**Próxima ação, antes de qualquer outra coisa:**
1. Abrir `https://supabase.com/dashboard/project/omcbfuiyaeakbsqbzgqk/settings/api`
2. Em **"Exposed schemas"**, acrescentar `tce` à lista (deve ter `public, portalgov` hoje)
3. Salvar
4. Confirmar rodando: `npx tsx` num script temporário que chama `createSupabaseAdminClient().from("tce_endpoint_groups").select("slug")` — se retornar sem erro `Invalid schema`, está liberado.

### Depois disso, na ordem

1. `npm run import:catalog` — reconstrói o catálogo de 105 endpoints a partir do OpenAPI do TCE (a estrutura já existe, só falta popular).
2. `npm run sync:ano` (ou equivalente) — recarrega Aracati/2025 direto da API do TCE para o banco novo. Decisão tomada: recarregar da fonte em vez de copiar do banco antigo, porque valida o ETL inteiro na estrutura nova.
3. Rodar `npm test`, `npm run typecheck`, `npm run build` e subir o `/admin`, `/gestao`, `/apresentacao/aracati` para confirmar que tudo funciona lendo do banco novo (checar `is-real` na faixa de período, não `is-demo`).
4. **Autenticação na aplicação** (ainda não feita): criar `src/middleware.ts` protegendo `/admin/*` e `/api/*`. O banco já está protegido por RLS, mas as rotas HTTP ainda não verificam sessão — usuário escolheu "login próprio, mesma base de usuários" (mesmo Supabase Auth e tabela `usuarios_sistema`, filtrando por `sistema='tce'`). Precisa instalar `@supabase/ssr` (ainda não instalado).
5. Depois: `loadAracatiPilot()` continua hardcoded para `"014"`/`"202500"`/`"Aracati"` — vira parâmetro, é o que destrava o segundo cliente.
6. **Não desativar o projeto Supabase antigo** (`rjqyqbkwavuhwepekohr`) até a carga nova estar validada. Credenciais antigas ficaram comentadas no fim do `.env` para rollback.
7. **Rotacionar a secret key do PortalGov** quando a migração estiver validada — ela apareceu em texto nesta conversa.

### O que NÃO fazer

- Não integrar com o PortalGov ainda (publicar contratos, etc.) — usuário pediu explicitamente para adiar isso e focar no desenvolvimento do APITCE primeiro. Fica registrado em `41-MIGRACAO-PLATAFORMA.md` para quando for a hora.
- Achado fora do escopo, mas relevante: `plataforma` (9 tabelas do PortalGov) está sem RLS, e `papeis_extras_usuario` tem RLS ligado com zero políticas (nega tudo). Não é deste projeto, mas vale avisar o usuário.

## Cuidados

- Não publicar a área gerencial para clientes antes de implementar autenticação, RLS e escopo por município.
- Não misturar dados complementares futuros nas tabelas `tce_*`.
- Preservar arquivos não rastreados que não pertençam à tarefa ao preparar qualquer commit.
