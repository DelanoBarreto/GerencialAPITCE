# Visão de produto e mercado — APITCE

Atualizado em 2026-09-24. Este documento registra a visão de produto ampliada definida pelo usuário, além do que o PRD original (`docs/projetoAPITCE.md`) e o roadmap técnico (`docs/40-ROADMAP.md`) cobrem. Ele existe para que nenhuma dessas ideias se perca entre sessões, e para deixar claro o que é core (obrigatório, todo cliente tem) e o que é módulo add-on (opcional, vendido separado).

**Relação com os outros documentos:** o roadmap técnico (`docs/40-ROADMAP.md`) continua sendo a referência de execução — fases de segurança, multi-município, confiabilidade e manutenibilidade. Este documento adiciona fases de produto que vêm depois da Fase 2 do roadmap técnico (multi-município), e que ainda não têm plano de execução detalhado.

## O propósito do produto, em uma frase

Dar a gestores municipais (prefeitos, secretários), corpo técnico (contadores, controladores, escritórios de contabilidade) e outros perfis (presidente de câmara, folha de pagamento, patrimônio, jurídico) uma visão consolidada e calculada das finanças do município — incluindo os limites legais que podem gerar punição do TCE — sem depender de pedir relatórios complexos à contabilidade ou a escritórios de assessoria.

## Por que isso é diferente de "só mostrar os dados do TCE"

O SIM/TCE-CE é a fonte oficial, mas **atrasada por natureza**: em 24/09/2026 a receita oficial só estava disponível até 31/07. Um sistema que só espelha o TCE mostra o passado, não ajuda a decidir o presente. Um prefeito que precisa saber, antes de fechar a folha do mês, se vai estourar o limite de despesa com pessoal da LRF não pode esperar dois meses pelo dado oficial — a decisão relevante acontece **antes** do envio ao TCE, não depois.

Essa é a tese central do produto: dado atrasado serve para auditoria e conformidade; dado próximo do tempo real serve para decisão. O produto precisa das duas coisas, sem nunca confundir uma com a outra.

---

## Módulo Core (parte obrigatória de todo cliente)

Já coberto pelo roadmap técnico existente. Resumo do que falta:

1. **Segurança e produção** (`docs/40-ROADMAP.md` Fase 1) — auth/RLS aplicados no banco real, chaves rotacionadas.
2. **Multi-município** (Fase 2) — `loadPilot(codigo, exercicio)` parametrizado, escopo por RLS.
3. **Confiabilidade e manutenibilidade** (Fases 3–4) — logs de erro reais, `sync-runner.ts` quebrado em módulos, tipagem.
4. **Expansão de dados do TCE** (Fase 5 do roadmap técnico) — grupos LIC, CRD, OUT, OSE, CPF, RPP, PAT, EMP, LIQ, PAG.

## Módulo Core — Indicadores legais em tempo real (novo, definido em 2026-09-24)

Este é o diferencial competitivo central do produto, não uma feature de cauda longa. Ainda **não implementado**.

**Indicadores a calcular automaticamente**, com semáforo de risco (verde/amarelo/vermelho) comparando execução acumulada vs. limite legal:

- Despesa com pessoal (LRF/LC 101, art. 19/20 — limite 60% da RCL, com sublimites por poder)
- RCL — Receita Corrente Líquida (base de cálculo da maioria dos limites)
- Despesa com saúde (EC 29/LC 141 — mínimo 15% da receita de impostos)
- Despesa com educação/MDE (art. 212 CF — mínimo 25%)
- VAAT/VAAF (FUNDEB — Valor Anual por Aluno Total/Fundamental)

**O que falta tecnicamente para viabilizar:**
- Views/funções SQL específicas por indicador (hoje só existe execução orçamentária genérica, sem cálculo de limite legal)
- Classificação por natureza de despesa (pessoal, custeio, investimento) e por função/subfunção (saúde=10, educação=12) — precisa confirmar se os grupos BAL/ORC já implementados trazem essa granularidade, ou se depende dos grupos EMP/LIQ/PAG ainda não implementados
- Recomenda-se um spike técnico curto para confirmar exatamente quais endpoints do catálogo de 105 já suportam esses cálculos antes de prometer prazo

## Módulo Core — Camada gerencial complementar (novo, definido em 2026-09-24)

Resolve o problema do atraso do TCE descrito acima. Ainda **não implementado**, deliberadamente adiado pelo usuário até o core estar consolidado.

**Mecânica:** tabelas acessórias, **separadas das tabelas oficiais `tce_balancetes_*`** (nunca misturar), onde a contabilidade do município ou escritório terceirizado sobe manualmente balancetes cobrindo o intervalo entre a última competência oficial do TCE e a data atual (ex.: se o TCE só tem até 31/07 e hoje é 24/09, sobe-se um balancete gerencial de 01/08 até hoje). Quando o TCE publica a competência oficial equivalente, o dado complementar daquele período perde função e é descartado.

**Por que tabelas separadas, e não a mesma tabela:**
- Rastreabilidade: nunca pode ficar ambíguo se um valor é "confirmado TCE" ou "estimativa da contabilidade local"
- Ciclo de vida distinto: o complementar é descartável quando o oficial chega; o oficial é permanente e auditável
- Risco jurídico: confundir as duas fontes em um cálculo de limite legal (ex.: dizer que a despesa com pessoal está OK usando dado não oficial, sem deixar isso claro) é grave — decisões como contratação de pessoal têm implicação direta na LC 101/2000

**Impacto nos indicadores legais:** os cálculos de RCL, % pessoal etc. precisam somar oficial + complementar quando o complementar existir para o período, e usar só oficial quando não existir. A UI precisa sempre indicar a fonte (badge "oficial TCE" vs "gerencial/estimado"), nunca escondida.

## Módulo Core — Perfis de usuário e RBAC ampliado (novo, definido em 2026-09-24)

Os papéis atuais do schema `tce` (`superadmin`, `tenant_admin`, `editor`, `viewer`) são genéricos demais para a diversidade de perfis que o produto pretende atender:

| Perfil | Necessidade principal |
|---|---|
| Prefeito / Secretário | Visão executiva — semáforos de limite legal, alertas, comparativo mês a mês |
| Contador / Escritório de contabilidade | Detalhe técnico — balancetes, rubricas, fonte de recurso, exportação para prestação de contas |
| Presidente de Câmara Municipal | Execução do Legislativo isolada, mesmos limites mas outro recorte |
| Folha de pagamento / RH | Módulo EMP/LIQ/PAG (empenho/liquidação/pagamento) — ainda não implementado |
| Patrimônio | Módulo ainda não mapeado no catálogo oficial de grupos do TCE — precisa investigar se a API do TCE cobre isso |
| Advogado / Escritório jurídico | Módulo de processos/prazos junto ao TCE — mais próximo dos grupos LIC (licitações), ainda não implementado |

Isso exige redesenhar o modelo de papéis (RBAC por módulo, não só por município) antes de expor os perfis técnicos e executivos com telas diferentes.

---

## Módulo Add-on — Automação e Canais (opcional, vendido separado)

**Decisão de modelo comercial confirmada em 2026-09-24:** este bloco é um módulo **opcional**, contratado à parte — não faz parte do pacote básico que todo cliente recebe. Um cliente que não contratar continua com sincronização manual/agendada simples, sem WhatsApp nem agente conversacional. O desenho técnico deve manter este módulo desacoplável (feature flag ou tabela de assinatura de módulo por cliente, no mesmo padrão já usado em `tce_sync_subscriptions` para endpoints), nunca como dependência rígida do resto do sistema.

Ainda são **ideias**, sem plano de execução. Ordem sugerida de avaliação, do mais simples ao mais complexo:

1. **Hospedagem em Cloudflare Pages/Workers** — precisa validar compatibilidade do app atual (Server Actions, `@supabase/ssr` com cookies, sessão/RLS) com o adapter Cloudflare antes de comprometer, já que Cloudflare Workers roda em edge runtime com restrições de Node APIs.
2. **Polling automático do SIM/TCE 1–2x/dia**, disparando carga automática assim que houver dado novo. Já existia como item do roadmap técnico ("Fase 5 — rotina diária de sincronização, hoje manual"); a novidade é usar Cloudflare Cron Triggers como agendador.
3. **Notificações via WhatsApp para gestores** — sistema de eventos/gatilhos (ex.: risco de estourar limite de pessoal) disparando mensagem ao responsável. Precisa de provedor de WhatsApp (API oficial Meta Business, Twilio, Z-API ou similar).
4. **Agente conversacional no WhatsApp** — usuário pergunta em linguagem natural ("qual o valor atual da LRF?", "qual fornecedor devo pagar hoje por ordem cronológica?") e um agente de IA busca nos dados da plataforma e responde. É o item de maior escopo: exige LLM com function calling sobre o banco `tce`, autenticação de quem pergunta (mapear número de WhatsApp → usuário → município autorizado, respeitando RLS). É essencialmente um produto novo.
5. **n8n como orquestrador**, amarrando polling, webhooks do WhatsApp e chamadas ao LLM — reduz código customizado em troca de mais uma peça de infraestrutura para manter.

**Pré-requisito explícito:** nenhum item deste módulo deve começar antes da Fase 1 do roadmap técnico (auth/RLS em produção) estar fechada — o agente de WhatsApp herdaria os mesmos buracos de segurança da aplicação web se a base de controle de acesso não estiver sólida primeiro.

---

## Ordem geral recomendada (visão consolidada)

```
Roadmap técnico (docs/40-ROADMAP.md)
  Fase 1 — Segurança (bloqueia tudo)
  Fase 2 — Multi-município (destrava 2º cliente)
  Fase 3 — Confiabilidade
  Fase 4 — Manutenibilidade
  Fase 5 (técnica) — Expansão de grupos de dados do TCE

Visão de produto (este documento)
  Indicadores legais em tempo real — diferencial competitivo, depende de parte da Fase 5 técnica (EMP/LIQ/PAG)
  Camada gerencial complementar — resolve o atraso do TCE, depende dos indicadores legais existirem primeiro
  RBAC multi-perfil — pode ser feito em paralelo às fases acima, mas antes de vender para perfis além de gestor/contador

  [Add-on opcional, a qualquer momento após Fase 1 do roadmap técnico]
  Automação e Canais — Cloudflare, polling automático, WhatsApp, agente conversacional
```
