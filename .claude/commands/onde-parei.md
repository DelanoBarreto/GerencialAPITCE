---
description: Lê o checkpoint do projeto e resume onde parou e o que fazer agora
---

Leia por completo, nesta ordem:

1. `docs/39-ONDE-PAREI.md` — checkpoint principal, sempre atualizado por último. A seção mais recente no topo tem o estado mais atual e o bloqueio exato.
2. `docs/44-PLANO-DESENVOLVIMENTO-CONSOLIDADO.md` — plano de mais alto nível: amarra em ordem única o plano de segurança em execução, o roadmap técnico e a visão de produto. Consultar a tabela de panorama para saber o estado de cada fase antes de ler o detalhe de qualquer uma.
3. `docs/41-MIGRACAO-PLATAFORMA.md` — contexto completo da migração do APITCE para o schema `tce` no banco do PortalGov (`omcbfuiyaeakbsqbzgqk`), se essa migração ainda estiver em andamento.
4. `docs/40-ROADMAP.md` — detalhe técnico das fases de segurança, multi-município, confiabilidade e manutenibilidade.
5. `docs/43-VISAO-PRODUTO-E-MERCADO.md` — visão de produto ampliada: indicadores legais (LRF/RCL/saúde/educação/FUNDEB), camada gerencial complementar, RBAC multi-perfil, padrão de design exigido (multi-dispositivo, direção visual já esboçada) e módulo add-on de automação/canais (Cloudflare, WhatsApp, agente conversacional). Ler mesmo que o foco do momento seja só a Fase 0 técnica — evita perder de vista para onde o produto vai depois.
6. Rode `git log --oneline -10` e `git status --short` para confirmar que o estado real do repositório bate com o que os documentos descrevem.

Depois disso, responda ao usuário em português, de forma direta e sem enrolação:

- **O que já está feito** (resumo de 3-5 linhas, não repita tudo).
- **O bloqueio ou próximo passo exato** — se depender de uma ação do usuário (ex: configurar algo no painel do Supabase, fornecer uma credencial), diga isso primeiro e com destaque.
- **O que fazer em seguida**, na ordem certa, uma vez que o bloqueio for resolvido — usando `docs/44-PLANO-DESENVOLVIMENTO-CONSOLIDADO.md` como referência de sequência entre fases, não só o próximo passo técnico isolado.

Não comece a implementar nada automaticamente — só relate o estado e pergunte se o usuário quer continuar.
