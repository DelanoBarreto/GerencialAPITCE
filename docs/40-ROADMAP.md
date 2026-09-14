# Roadmap APITCE

Criado em 2026-09-14, a partir de auditoria do código e do banco. Consolida e substitui o que estava espalhado em `checklist-projeto.md`, `checklist-melhorias.md` e `proximos-passos.md` — esses três continuam valendo como registro histórico, mas a ordem de trabalho é esta.

## Onde o projeto está

Funciona e tem valor: o ETL do SIM/TCE-CE carrega Aracati com os 12 meses de 2025 completos, e as três telas (`/admin`, `/gestao`, `/apresentacao/aracati`) leem do Supabase com identidade visual própria e período explícito. `npm test`, `npm run typecheck` e `npm run build` passam limpos.

O que impede de vender: **não há autenticação, nem RLS, nem multi-município**. Hoje o sistema serve uma demonstração de Aracati, não um produto com clientes.

---

## Fase 1 — Segurança (bloqueia qualquer publicação)

Nada aqui é opcional. Enquanto esta fase não fechar, o sistema não pode ficar acessível fora da máquina local.

### 1.1 Proteger as rotas de API

`src/app/api/operacao/grupo/route.ts`, `endpoint/route.ts` e `monitoramento/municipio/route.ts` executam carga de dados e disparam scripts npm **sem qualquer verificação de identidade**. Não existe `middleware.ts` no projeto e nenhuma rota checa sessão, cookie ou token.

Qualquer pessoa que alcance a URL dispara sincronização no banco de produção. A validação de entrada existente (regex de município, grupo e ano) é boa e deve ser mantida, mas ela impede entrada malformada, não acesso indevido.

- Criar `src/middleware.ts` protegendo `/admin/*` e `/api/*`.
- Exigir sessão autenticada nas três rotas de operação.
- Manter as validações de formato que já existem.

### 1.2 Habilitar RLS nas 26 tabelas

O linter de segurança do Supabase reporta `rls_disabled_in_public` como **ERROR** em 26 tabelas, incluindo `municipios`, `tce_sync_log`, `tce_raw_records` e todas as `tce_balancetes_*`. Confirmado na prática: uma consulta com a chave anônima retornou dados.

A chave anônima é pública por natureza — vai no navegador do cliente. Sem RLS, ela é acesso direto ao banco.

Atenuante honesto: o conteúdo é dado público do TCE, então não há vazamento de informação sigilosa. O risco concreto é **escrita e exclusão**, além da impossibilidade de separar clientes por município.

- Habilitar RLS em todas as tabelas do schema `public`.
- Política de leitura pública apenas onde fizer sentido para os dados do TCE.
- Escrita restrita ao papel de serviço (`service_role`), nunca ao anônimo.

### 1.3 Corrigir as views SECURITY DEFINER

`vw_tce_receitas_mensais`, `vw_tce_despesas_mensais` e `vw_tce_execucao_orcamentaria_mensal` estão com `SECURITY DEFINER` — executam com a permissão de quem criou, ignorando o RLS de quem consulta. Isso anula a Fase 1.2 para quem consultar por essas views.

- Recriar as três com `security_invoker = true`.
- Referência: <https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view>

### 1.4 Rotacionar as chaves expostas

A `SUPABASE_SERVICE_ROLE_KEY` e a chave publicável circularam em conversa durante o desenvolvimento. A de serviço ignora RLS por definição.

- Rotacionar ambas no painel do Supabase.
- Confirmar que `.env` está no `.gitignore` (está) e que nenhuma chave foi commitada.

---

## Fase 2 — Multi-município (destrava o segundo cliente)

### 2.1 Tirar Aracati do código

`src/lib/queries/pilot.ts` tem `"014"`, `"202500"` e `"Aracati"` fixos no corpo da função `loadAracatiPilot()`, que não aceita parâmetro nenhum. Enquanto for assim, `/gestao` e `/apresentacao` só existem para um município.

- `loadPilot(codigoMunicipio, exercicio)` recebendo os dois valores.
- Rotas viram `/gestao/[codigo]/[ano]` e `/apresentacao/[codigo]`.
- Nome do município vem da tabela `municipios`, não de literal no código.

### 2.2 Escopo por cliente

Depois que a Fase 1 entregar autenticação, cada cliente enxerga apenas os municípios contratados — via RLS, não via filtro na aplicação (filtro em aplicação se contorna trocando a URL).

### 2.3 Dados comerciais reais

`/admin/clientes` opera sobre mock, e a própria tela avisa isso. Precisa de origem real antes de virar controle de contrato.

---

## Fase 3 — Confiabilidade

### 3.1 Parar de esconder falha de conexão

`src/lib/queries/pilot.ts:77` tem `catch {}` que engole qualquer erro e devolve dados de demonstração. Foi exatamente isso que fez uma sessão inteira ser gasta investigando um `TypeError: fetch failed` que nunca aparecia em lugar nenhum.

A interface acerta em declarar a origem do dado (`is-demo` versus `is-real`) e nunca mente ao usuário. O problema é operacional: ninguém fica sabendo que o banco caiu.

- Registrar o erro no log do servidor antes de cair no fallback.
- Manter o fallback e a declaração honesta de origem — isso está certo.

### 3.2 `updatedAt` informa a hora errada

Ainda em `pilot.ts`, `updatedAt` recebe `new Date().toISOString()` — a hora da requisição, não a da última carga. Nenhuma tela usa hoje, então é uma informação falsa esperando para ser exibida.

- Buscar a data real da última sincronização em `tce_sync_log`, ou remover o campo.

### 3.3 Aproveitar o acumulado da view

A view já entrega `*_ate_mes` pronto, e a aplicação soma os 12 meses de `*_no_mes` para chegar no mesmo número (conferido: bate exatamente — receita R$ 453.940.889, empenhado R$ 572.304.300). Funciona, mas é trabalho redundante.

### 3.4 Tipar o cliente Supabase

Dez ocorrências de `any`, a maioria em `sync-runner.ts` (`supabase: any`, `config: any`). O Supabase gera tipos a partir do schema — vale usar.

---

## Fase 4 — Manutenibilidade

### 4.1 Quebrar `sync-runner.ts`

1.135 linhas com o mapeamento de 18 tabelas no mesmo arquivo. É pendência antiga de `checklist-melhorias.md`, marcada como prioridade alta lá, e continua valendo: um arquivo desse tamanho é difícil de revisar e de alterar com segurança.

- `src/lib/tce/mappers/` com um módulo por tabela.
- `sync-runner.ts` fica só com orquestração e paginação.

### 4.2 Ampliar a cobertura de testes

Hoje só `describePeriodo()` tem teste (6 casos, via `tsx`, sem dependência extra). Os candidatos naturais são os formatadores e a agregação de competências — lógica pura, fácil de testar.

---

## Fase 5 — Produto

- **Filtro de período interativo.** O layout já está preparado: a faixa de período é componente isolado e a query já expõe `PeriodoInfo` com início, fim e lacunas. É o passo seguinte natural do redesign.
- **Rotina diária de sincronização**, hoje manual.
- **Novos grupos de endpoints**: LIC, CRD, OUT, OSE, CPF, RPP, PAT, EMP, LIQ, PAG — ordem definida em `proximos-passos.md`.
- **Contagem real de registros por endpoint** na interface de operação.

---

## Ordem recomendada

Fase 1 inteira antes de qualquer publicação — é o que separa demonstração de produto. Fase 2 em seguida, porque destrava a venda. Fase 3 e 4 podem ser intercaladas conforme incomodarem. Fase 5 é evolução, não bloqueio.

Uma observação sobre sequência: a Fase 2.2 depende da autenticação da 1.1, e a 1.3 precisa vir junto com a 1.2 ou o RLS fica sem efeito nas views.
