# APITCE produto seguro — plano de implementacao

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar APITCE autenticado, multi-municipio e auditavel no Supabase compartilhado, com isolamento por RLS e validacao real em producao.

**Architecture:** `plataforma` continua privada, `portalgov` intocado e `tce` e o unico schema deste repositorio. Leituras usam JWT e cliente SSR; `service_role` atua somente nas operacoes internas apos autorizacao. A primeira liberacao e direta em producao, mas avancos remotos exigem backup e checkpoints explicitos.

**Tech Stack:** Next.js 16.3.5 App Router, TypeScript estrito/NodeNext, `@supabase/ssr` 0.12.4, Supabase Auth/Postgres RLS, Node.js ETL, Playwright.

## Global Constraints

- Nunca expor `plataforma` na Data API, nem alterar objetos `portalgov` neste projeto.
- Nunca enviar senha, JWT, chave secreta ou stdout bruto ao navegador, documentos ou Git.
- Preservar o Supabase antigo `rjqyqbkwavuhwepekohr` ate aceite de paridade e rollback.
- Nao aplicar migration, executar carga, fazer deploy ou rotacionar chave sem autorizacao explicita para esse checkpoint.
- Branch de implementacao: `codex/apitce-produto-seguro`; nao incluir `AGENTS.md`, `CLAUDE.md` nem scratchpads preexistentes no commit.
- O plano visual [2026-09-13-redesign-dashboard.md](2026-09-13-redesign-dashboard.md) esta concluido; este plano acrescenta seguranca, banco e multi-municipio. `docs/40-ROADMAP.md` e a ordem geral; `docs/39-ONDE-PAREI.md` e o checkpoint canonico.

---

## Tarefa 1 — Preparacao local e historico fiel

**Arquivos:** `supabase/migrations/20260915000925_*` ate `20260915002953_*`, `supabase/legacy-apitce-isolated/`, `scripts/extract-tce-migrations.mjs`, `supabase/README.md`.

**Entrega:** onze migrations TCE historicas correspondem byte a byte ao SQL aplicado pelo Claude (normalizando CRLF e newline final); dezesseis migrations do projeto antigo ficam fora da pasta ativa.

- [x] Extrair somente tool inputs `apply_migration` do projeto `omcbfuiyaeakbsqbzgqk`, cruzando nome e timestamp da lista remota.
- [x] Mover `001`–`017` existentes para legado sem apagar (o numero `007` nao existe neste checkout).
- [x] Executar `node scripts/extract-tce-migrations.mjs 'C:/Users/Delano Barreto/.claude/projects/c--Antigravity-GerencialAPITCE/b0f717a3-04b3-416e-a40c-977863ac36bb.jsonl' --verify`; resultado: `11 migrations TCE correspondem exatamente`.
- [x] Comparar `git status --short` com lista remota e confirmar que nenhum SQL de `portalgov` esta no novo conjunto ativo.

## Tarefa 2 — Autenticacao e bloqueio HTTP

**Arquivos:** `src/lib/supabase/{config,server,client,proxy,admin}.ts`, `src/proxy.ts`, `src/lib/auth/{access,operation}.ts`, `src/app/login/`, layouts de `/admin`, `/gestao`, `/apresentacao` e os tres route handlers POST.

**Interfaces:** `getTceAccess(): Promise<TceAccess | null>`, `authorizeInternalOperation(request): Promise<OperationAuthorization>`, RPCs `tce.meu_papel()` e `tce.sou_superadmin()`.

**Entrega:** pagina nao autenticada vai a `/login`; autenticada sem TCE vai a `/acesso-negado`; POST sem sessao devolve `401`, sem papel interno `403`, sem origem canonica `403`, sem JSON `415`.

- [x] Separar cliente SSR user-scoped do cliente administrativo `server-only` e instalar versao exata de `@supabase/ssr` no lockfile.
- [x] Criar login/logout, proxy apenas para refresh e guardas por pagina/POST com `getUser()`.
- [x] Escrever e executar testes automatizados das decisoes puras de redirect/origem; o caso de `401` sem Origin foi encontrado e corrigido antes da verificacao final. O ciclo TDD estrito nao foi registrado.
- [x] Em navegador real no servidor local, testar GET anonimo de `/`, `/admin`, `/gestao`, `/gestao/014/202500`, `/apresentacao/aracati`, `/apresentacao/014/202500` e POST anonimo nos tres endpoints; todos exigem login/retornam `401`, em desktop e mobile.
- [x] Confirmar no build que o modulo `server-only` nao entra em componente de navegador.

## Tarefa 3 — Contrato SQL/RLS TCE

**Arquivos:** `supabase/migrations/20260915160000_tce_auth_bridge.sql`, `20260915160100_tce_harden_rls_grants.sql`, `20260915160200_tce_operacoes_auditoria.sql`, `docs/42-ARQUITETURA-SEGURANCA-APITCE.md`.

**Interfaces:** `meu_papel() -> text`, `listar_municipios() -> (codigo_municipio, nome_municipio)`, `tem_acesso_municipio(text) -> boolean`, `sou_superadmin() -> boolean`, `vincular_usuario_existente(uuid,text,text,text) -> uuid`.

**Entrega:** `anon` sem acesso; authenticated so com SELECT/RPC minimos; `service_role` ETL; todas as 25 tabelas TCE com RLS e policies especificas, sem `TO PUBLIC` ou escrita municipal.

- [x] Preparar SQL local sem mudar `plataforma` ou `portalgov` e sem expor `tce.municipios` diretamente.
- [x] Revisar definições de tabelas, status de assinatura/organizacao, indice de `codigo_municipio` e ACLs contra o remoto via consultas somente leitura; `014` existe, ainda sem assinatura/usuario TCE.
- [ ] Capturar backup logico/definicoes/contagens do `tce`; registrar local seguro do backup e operador no checkpoint, sem guardar credenciais no repositorio.
- [ ] Em base isolada compativel, aplicar as tres migrations na ordem timestamp e executar teste negativo (`anon`, usuario sem TCE, assinatura suspensa) e positivo (viewer `014`, superadmin) usando JWTs reais de teste.
- [ ] Executar advisors de seguranca; revisar especificamente RPCs `SECURITY DEFINER`, grants a `PUBLIC`, views invoker e policy de cada tabela.
- [ ] Somente apos autorizacao do usuario, aplicar as tres migrations em producao e repetir a matriz; interromper ao primeiro resultado divergente.

## Tarefa 4 — Multi-municipio e honestidade dos dados

**Arquivos:** `src/lib/queries/{pilot,municipios,dashboard,sync}.ts`, `src/app/gestao/[codigo]/[exercicio]/page.tsx`, `src/app/apresentacao/[codigo]/[exercicio]/page.tsx`, rotas legadas e `src/app/admin/admin-data.ts`.

**Entrega:** municipio/exercicio validado no servidor; view financeira usa cliente do usuario; nome vem da RPC; URL adulterada nao permite leitura; erro de conexao e registrado sem simular dados reais.

- [x] Parametrizar `loadPilot(codigo, exercicio, nome)` e redirecionar rotas legadas.
- [x] Tirar `service_role` das consultas comuns e cache entre usuarios; remover hora falsa de `updatedAt` e escopos ficticios do Admin.
- [ ] Escrever testes para codigo/exercicio invalidos e usuario de outro municipio tentando a URL `014`.
- [ ] Testar as consultas REST diretas sob JWT viewer e superadmin, sem depender apenas da guarda Next.js.
- [ ] Conferir valores da tela com `vw_tce_execucao_orcamentaria_mensal` no banco para o mesmo codigo e exercicio.

## Tarefa 5 — Confiabilidade das operacoes

**Arquivos:** `src/lib/ops/operation-lock.ts`, tres route handlers, migration de auditoria.

**Entrega:** lock unico por escopo/alvo, TTL de duas horas, auditoria de inicio/fim e resposta sem log bruto; upserts continuam idempotentes.

- [x] Preparar lock/auditoria para check, sync e monitor; manter detalhe generico no banco/HTTP.
- [ ] Testar duas requisicoes simultaneas do mesmo alvo; uma deve obter `409` sem segundo ETL.
- [ ] Simular falha do ETL e queda antes da liberacao; testar registro `erro`, expiracao de lock e nova tentativa.
- [ ] Conferir contagem da tabela antes/depois de repetir uma sincronizacao limitada; esperado: nenhuma duplicidade de chave natural.
- [ ] Definir janela de operacao em que scripts CLI diretos nao competem com operacoes HTTP.

## Tarefa 6 — Implantacao controlada em producao

**Interfaces externas:** painel Supabase Data API e configuracao Coolify/VPS; `APITCE_APP_ORIGIN` deve ser o origin HTTPS canonico do dominio aprovado.

**Entrega:** aplicacao real autenticada, catalogo e Aracati/2025 carregados e verificados; projeto antigo permanece reversivel.

- [ ] Identificar dominio, responsavel e janela; registrar backup, versao do deploy anterior e lista atual de exposed schemas.
- [ ] Preparar usuario interno TCE superadmin via operacao privilegiada unica, conferindo UUID antes do INSERT; criar assinatura TCE ativa para Aracati e vincular conta existente via RPC restrita.
- [ ] Testar matriz anon/sem TCE/viewer/outro municipio/superadmin **antes** de expor `tce` na Data API.
- [ ] Expor somente `tce` no painel e confirmar que `plataforma` permanece fora; publicar app com origin, URL e chave publicavel no build/runtime e segredo apenas no runtime servidor.
- [ ] Executar `npm run import:catalog` com autorizacao; comparar 105 endpoints esperados com contagem real.
- [ ] Configurar monitoramento `014`/`202500` e executar grupos/meses em lotes; confrontar registros normalizados/views com a origem.
- [ ] Validar login, logout, cookie, redirect, E2E desktop/mobile, fonte `is-real`, status HTTP, logs e valores no dominio real.
- [ ] Registrar teste/documento de rollback: remover `tce` da Data API, restaurar deploy anterior e preservar dados; nao desativar o projeto antigo antes do aceite formal.
- [ ] Apos aceite, rotacionar chaves expostas e atualizar secrets no painel, sem colar valores em chat/Git.

## Tarefa 7 — Integracao Git e checkpoint

**Arquivos:** `docs/39-ONDE-PAREI.md`, `docs/40-ROADMAP.md`, `docs/41-MIGRACAO-PLATAFORMA.md`, `README.md` e este plano.

- [x] Executar `npm test`, `npm run typecheck`, `npm run build`, `git diff --check`, `npm run test:browser:anon`, `npm audit --omit=dev` e a verificacao das 11 migrations; todos passaram em 2026-09-15.
- [x] Verificar `git status --short` e stage apenas os arquivos TCE deste plano; `AGENTS.md`, `CLAUDE.md` e scratchpad preexistentes ficaram fora.
- [x] Commitar apenas fase local validada como `692851e` e enviar `codex/apitce-produto-seguro` ao GitHub, sem merge em `main` ou deploy automatico.
- [x] Atualizar `docs/39-ONDE-PAREI.md` com commit, testes, limite de validacao remota e proxima acao exata.

## Criterio de encerramento

Uma fase local compilada nao equivale a produto pronto. O plano fecha somente com migrations aplicadas/testadas sob usuarios reais, `tce` exposto de modo controlado, piloto carregado e confrontado com banco/navegador, isolamento provado, backup/rollback documentados e aceite formal. Alertas exclusivos do PortalGov sao reportados ao repositorio responsavel, nao corrigidos aqui.
