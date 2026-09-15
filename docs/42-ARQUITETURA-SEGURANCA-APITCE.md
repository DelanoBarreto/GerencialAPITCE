# Arquitetura e seguranca do APITCE

Atualizado em 2026-09-15. Este documento descreve o contrato **preparado no codigo e nas migrations locais**; nao atesta que as novas migrations tenham sido aplicadas ao banco remoto. O estado executado fica em [39-ONDE-PAREI.md](39-ONDE-PAREI.md).

## Fronteiras

| Schema | Dono | Data API | Acesso APITCE |
|---|---|---|---|
| `plataforma` | Camada multi-sistema | Nunca expor | Somente dentro das RPCs TCE privilegiadas e auditadas |
| `portalgov` | PortalGov Municipal | Configuracao propria | Nenhuma alteracao neste projeto |
| `tce` | Gerencial APITCE | Expor apenas apos grants/RLS testados | Cliente autenticado para leitura; `service_role` para ETL interno |

O projeto compartilhado e `PortalGov-Producao` (`omcbfuiyaeakbsqbzgqk`). O projeto APITCE antigo (`rjqyqbkwavuhwepekohr`) e contingencia temporaria. Migrations de `public` do projeto antigo foram arquivadas em `supabase/legacy-apitce-isolated/` e nunca devem ser reaplicadas no compartilhado.

## Identidade, sessao e autorizacao

1. A pessoa informa a senha somente em `/login`, por HTTPS. A Server Action chama Supabase Auth `signInWithPassword`; a senha nao e armazenada pela aplicacao.
2. `@supabase/ssr` guarda os tokens de acesso e renovacao em cookies. `src/proxy.ts` atualiza os cookies; nao decide papel ou municipio.
3. Cada pagina protegida e cada POST validam o usuario novamente com `auth.getUser()`. `getSession()` nunca e prova de autorizacao.
4. O cliente SSR com chave publicavel executa consultas no schema `tce` sob o JWT do usuario e **respeita RLS**. O cliente de navegador nao recebe chave secreta.
5. `tce.meu_papel()` e `tce.listar_municipios()` leem somente vinculos `usuarios_sistema` ativos do sistema `tce`. Para usuario municipal, exigem tambem organizacao e assinatura TCE ativas.
6. A URL escolhe o municipio, mas `tce.tem_acesso_municipio()` e RLS confirmam o vinculo. A validacao de pagina e uma segunda barreira, nao substitui o banco.
7. `service_role` ignora RLS. Por isso ele fica em modulo `server-only`, exclusivamente nas rotas de ETL/monitoramento apos `getUser()` + `tce.sou_superadmin()`; nunca em consultas comuns.

As RPCs de ponte sao `SECURITY DEFINER` apenas porque `plataforma` e privada. Todas usam `search_path = ''`, nomes qualificados, `auth.uid()` no corpo e `EXECUTE` restrito; mesmo assim, precisam de teste como usuarios reais antes da exposicao do schema. A view legada `tce.municipios` continua no historico, mas o aplicativo usa `listar_municipios()` e o grant direto da view e revogado.

## Papel e dados

| Papel | Dados de municipios vinculados | Apresentacao | Operacao/monitoramento | Vincular usuarios TCE |
|---|---:|---:|---:|---:|
| `viewer` | Sim | Sim | Nao | Nao |
| `editor` | Sim | Sim | Nao nesta entrega | Nao |
| `tenant_admin` | Sim | Sim | Nao nesta entrega | Nao |
| `superadmin` interno | Todos | Sim | Sim | Sim, via RPC restrita |

`anon` nao deve ter `USAGE`, `SELECT` ou `EXECUTE` em `tce`. `authenticated` recebe apenas SELECT das tabelas normalizadas, views `security_invoker` e tabelas de referencia necessarias. Tabelas brutas e verificacoes internas nao recebem SELECT; logs e escopos operacionais sao visiveis somente ao superadmin por RLS. Nenhum usuario autenticado recebe grants de escrita fiscal. O ETL usa apenas `service_role` no servidor.

Contas PortalGov existentes sao reutilizadas por `auth_user_id`. A tela/RPC PortalGov existente fixa `sistema='portalgov'`, portanto **nao cadastra vinculo TCE**. Para o piloto, um operador privilegiado cria uma vez o vinculo `superadmin` TCE apos conferir UUID e backup; depois `tce.vincular_usuario_existente(...)` permite ao superadmin vincular contas ja existentes a municipios com assinatura TCE ativa. Nao ha duplicacao de senha, nem tela completa de gestao TCE nesta entrega.

## Operacoes e auditoria

Os tres POSTs (`monitoramento/municipio`, `operacao/endpoint`, `operacao/grupo`) exigem origem HTTPS canonica configurada em `APITCE_APP_ORIGIN`, `Content-Type: application/json`, sessao valida e `sou_superadmin() = true`. Validacoes de codigo municipal, exercicio, grupo e endpoint continuam no servidor. A chave unica em `tce_operacoes_ativas` bloqueia operacoes simultaneas no mesmo alvo; TTL cobre queda do processo. `tce_operacoes_auditoria` registra UUID da operacao, usuario, alvo, inicio, fim e resultado. A resposta ao navegador nao inclui comandos, stdout bruto, segredo ou stack trace.

Limitacao: a trava cobre operacoes iniciadas pelas rotas HTTP. Scripts CLI executados diretamente devem ser coordenados na janela de manutencao; a idempotencia dos upserts nao substitui esta coordenacao.

## Producao e rollback

O usuario escolheu primeira validacao diretamente em producao. Isso **nao** autoriza aplicar migrations ou publicar sem um checkpoint explicito. A ordem obrigatoria e: diagnostico/backup do `tce`, revisao dos SQL locais, migrations de ponte/grants/RLS/auditoria, testes por papel no banco, configuracao de `tce` na Data API sem `plataforma`, vinculos/assinatura do piloto, deploy, catalogo, sincronizacao controlada e E2E no dominio real. Nenhum dado de outro schema e alterado por estas migrations novas.

Se um checkpoint falhar: nao avancar; retirar `tce` da Data API, voltar o deploy anterior e consultar backup/definicoes capturadas. Nao apagar dados TCE durante o diagnostico. Manter o projeto antigo disponivel ate a paridade de Aracati/2025, os testes de isolamento e a rotacao de credenciais serem aprovados.

## Evidencia necessaria para aceite

- `anon` negado; usuario sem TCE negado; viewer de Aracati le somente `014`; usuario de outro municipio nao le `014`.
- Usuario com assinatura suspensa deixa de receber municipio, inclusive alterando URL ou consultando REST diretamente.
- `tenant_admin` recebe `403` nos POSTs; superadmin recebe resposta controlada e auditoria; duas chamadas iguais recebem `409`.
- View financeira respeita RLS nas tabelas de origem; `plataforma` nao aparece na Data API.
- Valores da tela conferem com views/tabelas no banco; fonte `is-real` aparece apenas com dados oficiais.
- Build, tipos, testes e navegador real passam; rollback e backup ficam registrados em `docs/39-ONDE-PAREI.md`.
