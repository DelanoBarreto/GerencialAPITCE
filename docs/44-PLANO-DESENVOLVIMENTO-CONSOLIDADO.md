# Plano de desenvolvimento consolidado — APITCE

Criado em 2026-09-25. Este documento amarra em uma sequência única os três planos que hoje existem separados: o plano técnico de segurança já em execução (`docs/superpowers/plans/2026-09-15-apitce-produto-seguro.md`), o roadmap técnico geral (`docs/40-ROADMAP.md`) e a visão de produto ampliada (`docs/43-VISAO-PRODUTO-E-MERCADO.md`). Ele existe para responder uma pergunta simples a qualquer momento: **o que fazer depois disso?** — sem precisar reconciliar três documentos manualmente.

Este documento é o de mais alto nível. Os outros três continuam sendo a referência de detalhe de cada fase; aqui eles só são referenciados, não duplicados.

---

## Panorama — onde cada fase está agora

| Fase | Documento de detalhe | Estado em 2026-09-25 |
|---|---|---|
| 0. Segurança e produção | `docs/superpowers/plans/2026-09-15-apitce-produto-seguro.md` | Em execução — código e migrations prontos e testados localmente; aplicação em produção pendente de autorização |
| 1. Multi-município | `docs/40-ROADMAP.md` Fase 2 | Não iniciada — depende da Fase 0 |
| 2. Confiabilidade e manutenibilidade | `docs/40-ROADMAP.md` Fases 3–4 | Não iniciada — pode ser intercalada, não bloqueia |
| 3. Indicadores legais (LRF/RCL/saúde/educação/FUNDEB) | `docs/43-VISAO-PRODUTO-E-MERCADO.md` | Ideia definida, spike técnico não feito |
| 4. Camada gerencial complementar | `docs/43-VISAO-PRODUTO-E-MERCADO.md` | Ideia definida, deliberadamente adiada pelo usuário |
| 5. RBAC multi-perfil | `docs/43-VISAO-PRODUTO-E-MERCADO.md` | Ideia definida, sem desenho de schema |
| 6. Design de interface (todas as telas) | `docs/43-VISAO-PRODUTO-E-MERCADO.md` + exploração pausada | Direção visual inicial esboçada (Dashboard Executivo), pausada a pedido do usuário |
| 7. Automação e Canais (add-on opcional) | `docs/43-VISAO-PRODUTO-E-MERCADO.md` | Ideias registradas, nenhuma execução |

---

## Dependências entre fases

```
Fase 0 — Segurança e produção
    │  (bloqueia tudo: nada pode ser exposto a cliente antes disso)
    ▼
Fase 1 — Multi-município ──────────────┐
    │  (destrava vender para o 2º cliente)
    ▼                                   │
Fase 3 — Indicadores legais             │
    │  (precisa de dado classificado    │
    │   por natureza/função — pode      │
    │   exigir grupos EMP/LIQ/PAG       │
    │   ainda não implementados)        │
    ▼                                   │
Fase 4 — Camada gerencial complementar  │
    │  (só faz sentido depois que os    │
    │   indicadores legais existem —    │
    │   senão não há o que "completar") │
    │                                   │
Fase 5 — RBAC multi-perfil ◄────────────┘
    (pode começar em paralelo à Fase 1, mas
     precisa fechar antes de vender para perfis
     além de gestor/contador — câmara, jurídico etc.)

Fase 6 — Design de interface
    (atravessa todas as fases acima — cada uma que expõe uma tela nova
     passa por esta fase antes de ir ao ar; não é uma fase sequencial isolada)

Fase 2 — Confiabilidade e manutenibilidade
    (sem dependência forte — intercalar conforme incomodar)

Fase 7 — Automação e Canais (add-on opcional)
    (pode começar a qualquer momento depois da Fase 0 fechada,
     mas não é prioridade — é módulo vendido à parte)
```

---

## Ordem de execução recomendada

### Agora — Fase 0 (Segurança e produção)

Não é opcional discutir prioridade aqui: nenhuma outra fase começa a valer comercialmente enquanto o sistema não puder ficar acessível fora da máquina local com segurança. O plano detalhado já existe e está em execução; o próximo passo exato está registrado em `docs/39-ONDE-PAREI.md`.

**Ação que só o usuário pode tomar:** autorizar a aplicação das migrations `20260915160000`–`20260915160200` em produção, depois do checkpoint de backup e teste isolado.

### Em seguida — Fase 1 (Multi-município)

Curta e de alto valor: tira o hardcode de Aracati/014/2025 do código (`loadPilot(codigo, exercicio)`), troca filtro de URL por RLS de verdade. É o que permite o segundo município pagante existir.

### Em paralelo à Fase 1 — Fase 5 (RBAC multi-perfil), início do desenho

Não precisa esperar a Fase 1 terminar para começar a **desenhar** o modelo de papéis (quem vê o quê), mas a implementação de RLS por papel deve vir depois ou junto da Fase 1, já que ambas mexem na mesma camada de autorização. Vale tratar como uma extensão da Fase 1, não uma fase isolada no tempo.

### Depois — spike técnico curto: Fase 3 (Indicadores legais)

Antes de prometer prazo para os cálculos de LRF/RCL/saúde/educação/FUNDEB, confirmar tecnicamente:
- quais dos 105 endpoints do catálogo já trazem classificação por natureza de despesa (pessoal/custeio/investimento) e por função/subfunção (10=saúde, 12=educação)
- se falta isso, quais dos grupos ainda não implementados (EMP, LIQ, PAG) resolvem

Esse spike é curto (1–2 dias de investigação, sem código de produção) e evita comprometer prazo sem saber se o dado já está disponível ou se precisa de um grupo novo inteiro.

### Depois — Fase 3 completa, depois Fase 4 (Camada gerencial complementar)

Implementar os indicadores legais primeiro (usando só dado oficial do TCE). Só depois faz sentido construir a camada complementar, porque ela existe para "completar" um cálculo que já existe — não há o que completar antes dos indicadores estarem prontos.

### Contínuo, do início ao fim — Fase 6 (Design de interface)

Cada tela nova que qualquer fase acima expõe passa pelo processo de design (objetivo → público-alvo → dados → mockup → validação com o usuário) antes de ir para produção. A direção visual inicial já esboçada (paleta marfim/tinta/dourado, Fraunces + Inter, gauges radiais para limites legais) é o ponto de partida quando essa fase reabrir — não recomeçar do zero.

### Sem prioridade fixa — Fase 2 (Confiabilidade e manutenibilidade)

Intercalar conforme incomodar no dia a dia (ex.: `sync-runner.ts` monolítico dificultando uma mudança específica). Não bloqueia nenhuma fase de produto.

### Só depois da Fase 0 fechada, sem urgência — Fase 7 (Automação e Canais)

Módulo add-on opcional (Cloudflare, polling automático, WhatsApp, agente conversacional). Vendido separado, habilitado por cliente. Não iniciar nenhuma implementação aqui antes da Fase 0 estar fechada — o agente de WhatsApp herdaria os mesmos buracos de segurança da aplicação web se a base de controle de acesso não estiver sólida primeiro.

---

## O que fica fora deste plano (propositalmente)

- Detalhe de execução da Fase 0: está em `docs/superpowers/plans/2026-09-15-apitce-produto-seguro.md`, não duplicado aqui.
- Detalhe técnico das Fases 1–2: está em `docs/40-ROADMAP.md`.
- Justificativa de negócio de cada ideia de produto (Fases 3–5, 7): está em `docs/43-VISAO-PRODUTO-E-MERCADO.md`.
- Mockups e decisões de UI pixel a pixel: ficam em Artifacts de design quando a Fase 6 for retomada; este documento só registra a direção já esboçada, não o desenho completo.

## Como manter este documento útil

Atualizar a tabela de panorama sempre que uma fase mudar de estado (iniciada, bloqueada, concluída). Não é necessário reescrever a ordem de execução a cada atualização — só a tabela e, se a dependência entre fases mudar de fato, o diagrama.
