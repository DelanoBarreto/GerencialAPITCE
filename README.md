# APITCE

Sistema para sincronizar dados publicos do SIM/TCE-CE para uma base Supabase/Postgres e gerar dashboards e relatorios gerenciais municipais.

## Objetivo inicial

O MVP comeca por Aracati, codigo `014`, priorizando:

- arquivos basicos;
- estrutura orcamentaria;
- receitas;
- despesas;
- balancetes mensais.

Neste primeiro momento, o MVP deve operar apenas o exercicio 2025 (`202500`). A estrutura de banco e comandos ja aceita varios anos por municipio, para liberar 2024, 2026 e outros anos depois da interface estar estavel.

Depois da base inicial validada, o projeto deve evoluir para contratos, licitacoes, fornecedores, folha de pagamento, limites legais e consultas multi-municipio.

## Decisao de arquitetura

A aplicacao nao deve consultar a API do TCE em tempo real para montar cada tela. O caminho escolhido e:

1. buscar os dados na API oficial;
2. paginar e normalizar no worker de sincronizacao;
3. gravar no Supabase/Postgres;
4. consultar o banco local nos dashboards e relatorios.

Isso evita lentidao, duplicidade, dependencia de disponibilidade da API externa e dificuldade de cruzar endpoints grandes.

## Documentacao versionada

- Manual local: [docs/vendor/tce-sim/Manual_SIM_2026_-_Municipios_vMAR-1.pdf](docs/vendor/tce-sim/Manual_SIM_2026_-_Municipios_vMAR-1.pdf)
- OpenAPI local: [docs/vendor/tce-sim/openapi_prod.yaml](docs/vendor/tce-sim/openapi_prod.yaml)
- Fontes e regras: [docs/tce-sim-documentacao.md](docs/tce-sim-documentacao.md)
- Filtros e estrategia de sync: [docs/api-filtros-sync.md](docs/api-filtros-sync.md)
- Catalogo oficial de endpoints: [docs/catalogo-endpoints-tce-sim.md](docs/catalogo-endpoints-tce-sim.md)
- Monitoramento de municipios: [docs/monitoramento-municipios.md](docs/monitoramento-municipios.md)
- Checklist do projeto: [docs/checklist-projeto.md](docs/checklist-projeto.md)
- Visão do projeto e rotina: [docs/visao-projeto-e-rotina.md](docs/visao-projeto-e-rotina.md)
- Controle de processo do admin: [docs/controle-processo-admin.md](docs/controle-processo-admin.md)
- Design da interface operacional: [docs/interface-operacional-design.md](docs/interface-operacional-design.md)
- Retomada mais recente: [docs/retomada-2026-06-06.md](docs/retomada-2026-06-06.md)
- Diagrama: [docs/assets/apitce_arquitetura_plano.svg](docs/assets/apitce_arquitetura_plano.svg)

## Stack definida

- Next.js para aplicacao web.
- Supabase/Postgres para banco, autenticacao e RLS.
- Worker Node.js para sincronizacao mensal.
- Views/funcoes SQL para calculos contabeis e relatorios.

## Comandos iniciais

Instalar dependencias:

```bash
npm install
```

Validar TypeScript:

```bash
npm run typecheck
```

Testar a API sem gravar no Supabase:

```bash
npm run sync:tce:dry -- --endpoint municipios --max-pages 1
npm run sync:tce:dry -- --endpoint balancetesReceitasOrcamentarias --municipio 014 --exercicio 202500 --data-referencia 202501 --max-pages 1
```

Importar/atualizar o catalogo completo da OpenAPI no Supabase:

```bash
npm run import:catalog
```

Cadastrar um municipio para monitoramento:

```bash
npm run monitor:municipio -- --municipio 014 --exercicio 202500
npm run monitor:municipio -- --municipio 014 --ano 2025
npm run monitor:municipio -- --municipio 014 --anos 2024,2025,2026
```

Verificar se um endpoint/competencia tem dados disponiveis:

```bash
npm run check:updates -- --municipio 014 --endpoint balancetes_receitas_orcamentarias --exercicio 202500 --data-referencia 202501
```

Verificar um grupo oficial inteiro:

```bash
npm run check:grupo -- --municipio 014 --grupo bal --ano 2025 --data-referencia 202501 --default
npm run check:grupo -- --municipio 014 --grupo bal --ano 2025 --data-inicial 202501 --data-final 202502 --default
```

Sincronizar endpoints ativos de municipios monitorados:

```bash
npm run sync:monitorados -- --municipio 014 --endpoint balancetes_receitas_orcamentarias --exercicio 202500 --data-referencia 202501
```

Sincronizar um grupo oficial inteiro:

```bash
npm run sync:grupo -- --municipio 014 --grupo bal --ano 2025 --data-referencia 202501 --default
npm run sync:grupo -- --municipio 014 --grupo bal --ano 2025 --data-inicial 202501 --data-final 202502 --default
```

Verificar/sincronizar o ano inteiro de um grupo:

```bash
npm run check:ano -- --municipio 014 --grupo bal --ano 2025 --default
npm run sync:ano -- --municipio 014 --grupo bal --ano 2025 --default
```

Para testes controlados, limitar aos primeiros meses:

```bash
npm run check:ano -- --municipio 014 --grupo bal --ano 2025 --default --max-meses 2
npm run sync:ano -- --municipio 014 --grupo bal --ano 2025 --default --max-meses 2 --max-pages 1
```

Quando o Supabase estiver configurado no `.env`, remover `--dry-run` usando:

```bash
npm run sync:tce -- --endpoint balancetesReceitasOrcamentarias --municipio 014 --exercicio 202500 --data-referencia 202501
```

Se a mesma competencia ja foi sincronizada com sucesso, o worker nao baixa de novo. Para forcar uma atualizacao porque o TCE corrigiu dados antigos, use `--force`:

```bash
npm run sync:tce -- --endpoint balancetesReceitasOrcamentarias --municipio 014 --exercicio 202500 --data-referencia 202501 --force
```

## Supabase APITCE

O projeto Supabase `APITCE` ja recebeu a migration inicial e uma carga real de validacao:

- `municipios`: Aracati `014`.
- `tce_balancetes_receitas_orcamentarias`: 314 registros de janeiro/2025.
- Reexecucao sem `--force`: pula a carga e nao baixa registros ja sincronizados.
- Reexecucao com `--force`: baixa novamente, mas usa `upsert` e mantem 314 registros sem duplicidade.
- Monitoramento: Aracati `014` esta cadastrado como municipio piloto em `tce_municipios_monitorados`.
- Catalogo: os 15 grupos oficiais da API foram cadastrados em `tce_endpoint_groups`; os blocos iniciais Auxiliares, BAS, ORC e BAL ja possuem endpoints em `tce_endpoint_catalog`.
- Catalogo completo: 105 endpoints importados da OpenAPI oficial.
- Comando operacional: `monitor:municipio` cadastra novos clientes/municipios e cria assinaturas de sincronizacao.
- Comandos por grupo: `check:grupo` e `sync:grupo` ja operam endpoints por grupo oficial da API.
- Comandos por ano: `check:ano` e `sync:ano` percorrem automaticamente as competencias do exercicio.
- Endpoints mensais sao operados na interface por ano completo. A tela nao usa filtros manuais de mes; para grupos mensais, o backend roda de `AAAA01` a `AAAA12`.
- Registros brutos usam chave natural com hash do payload para evitar perda de linhas quando a API retorna codigos repetidos.
- O endpoint `gestores` retornou 403 na API publica e ficou fora do padrao do MVP ate revisao.

O arquivo `.env` local guarda as credenciais e nao deve ser commitado.
