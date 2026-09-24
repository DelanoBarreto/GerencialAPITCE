# Migração do APITCE para a plataforma

## Correção de segurança — 2026-09-15

A estrutura compartilhada foi criada, mas **RLS habilitado não equivale a acesso seguro**: as 25 tabelas TCE possuem 50 policies com destino `PUBLIC`, e `anon`/`authenticated` tinham grants de leitura amplos. `tce` ainda não está exposto na Data API. A view `tce.municipios` usa `security_invoker=true` sobre `plataforma.catalogo_municipios` e falha por falta de privilégio, inclusive no teste do cliente administrativo. Não resolver com grant direto ao schema privado `plataforma`.

O novo contrato local é: RPCs de entrada `SECURITY INVOKER` em `tce`, ponte `SECURITY DEFINER` em `tce_internal` **fora da Data API**, com verificação de `auth.uid()`, conta não excluída, vínculo ativo ao sistema e assinatura municipal TCE ativa; SELECT autenticado apenas para dados normalizados autorizados; RAW/operações internos; escrita fiscal somente via ETL `service_role`. O app usa cliente SSR autenticado para leituras e cliente admin apenas depois da autorização superadmin nas operações. A antiga função privilegiada `tce.municipios_permitidos()` é removida depois das policies antigas. SQL local em `supabase/migrations/20260915160000_*`–`20260915160200_*`; detalhes em `docs/42-ARQUITETURA-SEGURANCA-APITCE.md`.

Validação adicional local: as 14 migrations executam em PostgreSQL PGlite com fixture compartilhada mínima; a matriz simulada cobre `anon`, sem vínculo, dois municípios, assinatura suspensa, administrador municipal, superadmin, conta excluída, grants e view financeira invoker. Advisors remotos de performance apontaram quatro FKs `tce` sem índice, corrigidas **somente no SQL local**. Os advisors de segurança atuais não acusam `tce` porque o schema ainda não está exposto; os achados exibidos são de `portalgov`, `plataforma` e Auth compartilhado, não um certificado de segurança do APITCE. Os testes com JWT real ainda são obrigatórios.

Essas migrations novas **não foram aplicadas remotamente**. As onze migrations TCE aplicadas pelo Claude foram versionadas com os timestamps remotos; as dezesseis `001`–`017` do banco isolado foram arquivadas. A seção "O que falta" abaixo é histórica: não expor `tce` nem executar carga antes de backup, hardening, teste com JWT real e autorização. `src/middleware.ts` foi substituído por `src/proxy.ts` conforme Next.js 16.

Achados exclusivos de `portalgov`/`plataforma` permanecem sob responsabilidade do projeto da plataforma; este repositório não corrige aqueles schemas.

Iniciada em 2026-09-14. O APITCE deixa de ser um projeto Supabase isolado e passa a ser o segundo sistema da plataforma, ao lado do PortalGov.

## Por quê

O APITCE estava num banco próprio (`rjqyqbkwavuhwepekohr`) com 26 tabelas em `public`, **sem RLS e sem autenticação** — não podia ser publicado nem atender um segundo município.

O banco do PortalGov (`omcbfuiyaeakbsqbzgqk`) já resolvia isso: o schema `plataforma` foi desenhado como camada multi-sistema (tabela `sistemas`, `assinaturas.sistema`, `papeis(sistema, papel)`, `usuarios_sistema.sistema`), com autenticação pronta, funções de RLS parametrizadas por sistema e os 184 municípios do Ceará cadastrados — na mesma codificação de 3 dígitos que o TCE usa.

Construir segurança de novo no banco isolado seria refazer o que já existe, para depois desfazer na hora de juntar. Como efeito colateral, cai de dois projetos Supabase para um.

## Organização dos schemas

| Schema | Conteúdo |
|---|---|
| `plataforma` | Camada comum: organizações, assinaturas, usuários, papéis, catálogo de municípios |
| `portalgov` | Portal público municipal |
| `tce` | Dados do SIM/TCE-CE (este projeto) |

O sistema Jurídico, quando existir, entra como um quarto schema seguindo a mesma receita.

## O que foi feito

### Registro do sistema

`plataforma.sistemas` ganhou a linha `('tce', 'APITCE Gerencial', 'ativo')`, e `plataforma.papeis` recebeu quatro papéis para o sistema: `superadmin` (nível plataforma), `tenant_admin`, `editor` e `viewer`. O PortalGov tem também `revisor`, deixado de fora porque o APITCE não tem fluxo de aprovação de conteúdo.

### Estrutura

25 tabelas criadas em `tce`, com as chaves naturais preservadas — as 17 constraints únicas são o que os upserts do ETL usam em `onConflict`.

As 3 views (`vw_tce_receitas_mensais`, `vw_tce_despesas_mensais`, `vw_tce_execucao_orcamentaria_mensal`) foram recriadas **com `security_invoker = true`**. No banco antigo eram `SECURITY DEFINER`, que o linter apontava como ERROR: executavam com a permissão de quem criou, ignorando o RLS de quem consulta.

### Municípios: catálogo único

A tabela `municipios` do APITCE (1 registro) **não foi migrada**. A fonte de verdade passa a ser `plataforma.catalogo_municipios`, com os 184 municípios do Ceará.

Uma distinção que importa: ter os 184 no catálogo **não significa carregar dados dos 184**. O catálogo é lista de referência (código, nome, UF); os dados do TCE são baixados apenas para quem está em `tce.tce_municipios_monitorados` — clientes, prospects e amostras.

A view `tce.municipios` expõe o catálogo com os nomes de coluna que o ETL já usava (`codigo_municipio`, `nome_municipio`), evitando reescrever as consultas existentes.

### Segurança

RLS habilitado nas 25 tabelas, com dois padrões:

- **21 tabelas de dados** (as que têm `codigo_municipio`): leitura restrita aos municípios que o usuário pode ver; escrita exige papel `superadmin`, `tenant_admin` ou `editor`.
- **4 tabelas de referência** (catálogo de endpoints, funções, tipos): leitura para quem tem acesso ao sistema; escrita só para papel de plataforma.

A ponte entre os dois modelos é `tce.municipios_permitidos()`: as tabelas do TCE se identificam por `codigo_municipio`, enquanto a plataforma usa `organizacao_id`. A função traduz um no outro, reusando `plataforma.tem_acesso('tce')`, `org_atual('tce')` e `eh_papel_de_plataforma('tce')`. `plataforma.organizacoes` já tinha Aracati com código `014`, então a ligação existia naturalmente.

O ETL roda com `service_role`, que ignora RLS por definição.

**Resultado:** o linter de segurança não reporta nenhum ERROR para o schema `tce`. No banco antigo eram 26 (`rls_disabled_in_public`) mais 3 (`security_definer_view`).

### Aplicação

- `src/lib/supabase/admin.ts` define `db: { schema: "tce" }`, então as chamadas `.from("tce_...")` existentes funcionam sem alteração.
- `sync-runner.ts` não reescreve mais o catálogo de municípios.
- A rota de monitoramento apenas valida o código no catálogo, em vez de buscar o município na API do TCE quando não existia localmente.
- `src/lib/tce/group.ts` deixou de fixar o schema `public` no tipo do cliente.

## O que falta

1. **Secret key do PortalGov no `.env`** — o campo está como `COLE_AQUI_A_SECRET_KEY_DO_PORTALGOV`. Fica em Project Settings → API Keys → `service_role`. Sem ela o ETL não escreve.
2. **Popular os dados**: `npm run import:catalog` reconstrói o catálogo de endpoints a partir do OpenAPI, depois `npm run sync:ano` recarrega Aracati/2025 da API do TCE. Decidiu-se recarregar da fonte em vez de copiar, o que também valida o ETL na estrutura nova.
3. **Autenticação na aplicação**: criar `src/middleware.ts` protegendo `/admin/*` e `/api/*`. O banco já está protegido, mas as rotas de operação ainda não verificam sessão.
4. **Multi-município**: `loadAracatiPilot()` ainda tem `"014"`, `"202500"` e `"Aracati"` fixos, sem aceitar parâmetro.
5. **Rotacionar as chaves** do projeto antigo quando ele for desativado — circularam em conversa durante o desenvolvimento.

## Cuidados

- O projeto antigo (`rjqyqbkwavuhwepekohr`) continua intacto e com os dados. Não desativar antes de validar a carga no banco novo. As credenciais dele estão comentadas no fim do `.env` para rollback.
- Achado fora do escopo, mas relevante para o PortalGov: as 9 tabelas de `plataforma` estão sem RLS, e `plataforma.papeis_extras_usuario` tem RLS habilitado com zero políticas — nega tudo, e pode estar quebrando algo silenciosamente.
