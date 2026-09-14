# Sistema visual APITCE

## Propósito

O APITCE apresenta informação financeira municipal com clareza, evidência de origem e aparência premium. A interface não usa estética genérica de dashboard: a competência SIM, a origem do dado e o valor financeiro são elementos centrais da leitura.

## Experiências separadas

- **Central operacional (`/admin`)**: uso de escritório em desktop, com carga, logs, municípios e conferência.
- **Gestão (`/gestao`)**: consulta mobile-first para gestores e contadores.
- **Apresentação (`/apresentacao/aracati`)**: demonstração comercial com município e dados de amostra/oficiais identificados.

## Tokens

| Papel | Token | Valor |
| --- | --- | --- |
| Confiança / ação | `--ap-blue` | `#0A4A8A` |
| Situação saudável | `--ap-green` | `#087A58` |
| Atenção | `--ap-amber` | `#A65D00` |
| Risco / erro | `--ap-red` | `#B42318` |
| Texto principal | `--ap-ink` | `#10233F` |
| Fundo | `--ap-paper` | `#F6F8FC` |

Os tokens vivem em `src/app/design-tokens.css`. Nenhuma tela nova deve criar cores de status, raios ou sombras próprias sem antes incluir o token correspondente.

O projeto conserva `moduleResolution: NodeNext`; por isso, componentes novos devem usar imports relativos com extensão `.js` até que uma migração completa de imports seja planejada. A configuração do shadcn está preparada, mas seu gerador remoto não foi usado nesta etapa.

## Componentes-base

- `PilotSourceBand`: sempre informa se o dado é SIM oficial ou demonstração e mostra a última competência.
- `PilotMetric`: indicador financeiro com rótulo, valor e contexto.
- `PilotSection`: cabeçalho consistente para blocos de leitura.
- `PilotNotice`: mensagem de situação saudável ou atenção necessária.
- `ExecutiveTrend`: gráfico padrão de receita x despesa paga.

## Regras de tela

- Nunca apresentar dado de demonstração como dado oficial.
- Toda visão financeira informa município, exercício e última competência.
- Desktop pode usar tabelas densas; celular usa cartões e detalhamento progressivo.
- Controles de toque têm área mínima de 44 px e a navegação inferior respeita a área segura do aparelho.
- Uma tela nova precisa ser comparada com as três telas-piloto antes de entrar no produto.

## Validação visual

Validar as telas em desktop, iPhone pequeno, iPhone grande e Android. Registrar no `docs/39-ONDE-PAREI.md` as rotas validadas, a data e eventuais pendências.

Em 2026-09-13, confirmado que `/apresentacao/aracati` e `/gestao` renderizam `PilotSourceBand` com a classe `is-real` e o texto "Dados oficiais SIM/TCE-CE" — a leitura da view do Supabase está funcionando, não é o fallback de demonstração. Detalhes da investigação em `docs/39-ONDE-PAREI.md`.

Em 2026-09-14, após o redesign com sidebar: `/admin`, `/gestao`, `/apresentacao/aracati`, `/admin/dados` e `/admin/municipios` capturadas em 1440 px e 390 px via `npx tsx scripts/screenshot.ts` (Playwright). Correções aplicadas a partir dessa inspeção estão listadas em `docs/39-ONDE-PAREI.md`. As capturas ficam em `.screenshots/`, fora do versionamento.

O shell de dashboard (`src/components/shell/DashboardShell.tsx`) é o layout padrão das telas de trabalho: sidebar escura de 240 px à esquerda com marca, escopo e navegação, e cabeçalho com título e período à direita. Abaixo de 1100 px a sidebar vira barra horizontal rolável; abaixo de 760 px o admin cede lugar ao `admin-mobile-gate`, enquanto a gestão continua acessível.
