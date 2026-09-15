---
description: Lê o checkpoint do projeto e resume onde parou e o que fazer agora
---

Leia por completo, nesta ordem:

1. `docs/39-ONDE-PAREI.md` — checkpoint principal, sempre atualizado por último. A seção "Migração para a plataforma" (ou a seção mais recente no topo/final, dependendo de quando isto for lido) tem o estado mais atual e o bloqueio exato.
2. `docs/41-MIGRACAO-PLATAFORMA.md` — contexto completo da migração do APITCE para o schema `tce` no banco do PortalGov (`omcbfuiyaeakbsqbzgqk`), se essa migração ainda estiver em andamento.
3. `docs/40-ROADMAP.md` — roadmap consolidado de segurança, multi-município e produto, para depois que o bloqueio imediato for resolvido.
4. Rode `git log --oneline -10` e `git status --short` para confirmar que o estado real do repositório bate com o que os documentos descrevem.

Depois disso, responda ao usuário em português, de forma direta e sem enrolação:

- **O que já está feito** (resumo de 3-5 linhas, não repita tudo).
- **O bloqueio ou próximo passo exato** — se depender de uma ação do usuário (ex: configurar algo no painel do Supabase, fornecer uma credencial), diga isso primeiro e com destaque.
- **O que fazer em seguida**, na ordem certa, uma vez que o bloqueio for resolvido.

Não comece a implementar nada automaticamente — só relate o estado e pergunte se o usuário quer continuar.
