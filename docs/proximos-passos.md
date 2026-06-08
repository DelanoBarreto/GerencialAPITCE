# Proximos passos do APITCE

## Ordem recomendada

1. Melhorar cadastro de municipio para buscar direto na API do TCE quando ainda nao existir no banco local.
2. Atualizar a tabela de endpoints apos verificar/sincronizar sem depender de recarregar a pagina.
3. Criar contagem real por endpoint/tabela para a coluna `Linhas`.
4. Expandir endpoints conforme a ordem oficial depois de BAL: LIC, CRD, OUT, OSE, CPF, RPP, PAT, EMP, LIQ e PAG.
5. Criar rotina automatica diaria para `check:updates` + `sync:monitorados`.
6. Adicionar autenticacao e permissoes apenas na etapa final.

## Primeiro recorte

Usar:

- municipio: `014`
- exercicio principal validado: `202500`
- ano tambem aceito na interface: `2026` (`202600`)
- grupo operacional atual: Auxiliares, BAS, ORC e BAL

A carga completa validada continua sendo Aracati 2025. Aracati 2026 ja pode ser selecionado e verificado na interface, mas ainda precisa de carga completa e validacao de contagens.

## Cuidados

- Confirmar outros valores de `exercicio_orcamento` apenas quando formos liberar anos historicos.
- Conferir se a competencia mensal vem como `AAAAMM`, exemplo `202501`.
- Validar contagem de registros por endpoint antes de montar graficos.

## Validacoes ja feitas

- `municipios` com `codigo_municipio=014`: 1 registro em dry-run.
- `balancetesReceitasOrcamentarias` com `codigo_municipio=014`, `exercicio_orcamento=202500`, `data_referencia_doc=202501`: 314 registros em dry-run.

## Estado atual do Supabase

- Projeto Supabase: `APITCE`.
- Project ref: `rjqyqbkwavuhwepekohr`.
- Migration aplicada: `init_apitce_schema`.
- Tabelas confirmadas: `municipios`, `tce_sync_log`, `tce_raw_records`, `tce_balancetes_receitas_orcamentarias`, `tce_orcamentos_receitas`.
- Carga real confirmada: municipio `014` gravado como `ARACATI`.
- Carga real confirmada: 314 registros em `tce_balancetes_receitas_orcamentarias` para `014`, `202500`, `202501`.
- Worker ajustado para registrar uma linha por pagina no `tce_sync_log`, atualizando o status ao final.
- Worker ajustado para pular escopos ja sincronizados com sucesso, evitando rebaixar o mesmo mes por engano.
- Validacao de duplicidade: reexecucao com `--force` manteve 314 registros por causa do `upsert` e da chave unica.
- Migration `monitoring_catalog` aplicada no Supabase.
- Grupos oficiais cadastrados: 15.
- Endpoints monitorados inicialmente para Aracati: 19.
- Catalogo local gerado a partir da OpenAPI: `docs/catalogo-endpoints-tce-sim.md` e `docs/catalogo-endpoints-tce-sim.csv`.
- Catalogo completo importado no Supabase: 105 endpoints.
- Comando `check:updates` validado com `balancetes_receitas_orcamentarias`.
- Comando `sync:monitorados` validado; endpoint ja sincronizado foi pulado sem duplicar.
- Comando `check:grupo` validado no grupo `bal`, Aracati 2025, janeiro.
- Comando `sync:grupo` validado no grupo `bal`, Aracati 2025, janeiro, com uma pagina por endpoint.
- Comandos por grupo validados tambem com duas competencias: `202501` e `202502`.
- Comandos `check:ano` e `sync:ano` criados e validados com `--max-meses 2`.
- Para endpoints mensais, a operacao correta na interface e municipio + ano. O backend percorre de `AAAA01` a `AAAA12`.
- Chave bruta de `tce_raw_records` corrigida para incluir hash do payload e preservar linhas distintas com codigos repetidos.
- Grupos anteriores ao BAL testados: `auxiliares`, `bas` e `orc`.
- Pendencia identificada: endpoint `gestores` retorna erro 403 na API publica e foi removido do padrao do MVP.
- `orcamento_receita` e demais endpoints de ORC ainda estao em `tce_raw_records`; normalizadores ficam para a proxima fase.
- Comando `monitor:municipio` validado com Aracati.
- Migration `monitored_years` aplicada: anos/exercicios agora sao monitorados por municipio.
- Aracati esta ativo apenas em 2025 (`202500`) no MVP, mas a estrutura permite cadastrar varios anos depois.
- Normalizadores de BAL extra, BAS referencias, BAS gestao e auxiliares foram criados e validados em Aracati 2025.
- `contas_bancarias_municipio` foi normalizado em `tce_contas_bancarias_municipio`.
- Esse endpoint deve ser sincronizado por orgao, nao por municipio inteiro, porque a paginacao ampla se mostrou instavel.
- Comando dedicado criado: `npm run sync:contas-bancarias -- --municipio 014 --exercicio 202500 --force`.
- Validacao Aracati 2025: 22 orgaos processados, 10.210 registros normalizados, 10.210 payloads distintos e nenhuma chave duplicada.
- Carga controlada Aracati 2025 concluida para `auxiliares`, `bas`, `orc` e `bal`.
- Validacao ORC Aracati 2025: receitas 346, despesas 682, despesas por projeto/atividade 241, elementos por projeto/atividade 1.768.
- Validacao BAL Aracati 2025: receitas orcamentarias de 202501 a 202512 carregadas; despesas orcamentarias de 202501 a 202512 carregadas; receitas/despesas extra de 202501 a 202512 carregadas.
- Views iniciais para dashboard criadas: `vw_tce_receitas_mensais`, `vw_tce_despesas_mensais` e `vw_tce_execucao_orcamentaria_mensal`.
- Validacao das views: consulta mensal de 202501 a 202512 retornou receita arrecadada, despesa empenhada, liquidada e paga; consulta por orgao em 202512 retornou nomes de orgaos e totais acumulados.
- Documento de design da interface operacional criado em `docs/interface-operacional-design.md`.
- Decisao de produto: nao implementar login agora; `/auth` fica para a ultima etapa.
- Interface operacional criada em Next.js e disponivel localmente em `http://127.0.0.1:3030`.
- Rotas internas criadas: `POST /api/operacao/grupo`, `POST /api/operacao/endpoint` e `POST /api/monitoramento/municipio`.
- Filtros manuais de mes removidos da tela de operacao.
- Tabela de endpoints monitorados criada com acoes por endpoint: `Verificar` e `Sync`.
- Documento de retomada criado: `docs/retomada-2026-06-06.md`.
