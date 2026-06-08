# Monitoramento de municipios

O APITCE deve baixar e manter atualizados apenas os municipios cadastrados em `tce_municipios_monitorados`.

## Regra principal

- Municipio fora da tabela de monitoramento: nao baixa automaticamente.
- Municipio ativo com `sincronizacao_automatica = true`: entra na rotina diaria/mensal.
- Cada municipio pode ter um ou varios exercicios monitorados em `tce_municipio_exercicios_monitorados`.
- No MVP, operar apenas o exercicio `202500`, referente a 2025, mas o modelo ja aceita 2024, 2026 e outros anos.
- Endpoint ativo em `tce_sync_subscriptions`: pode ser sincronizado para aquele municipio.
- Competencia ja sincronizada com status `ok`: nao baixa de novo, salvo com `--force`.

## Fluxo para novo cliente

1. Rodar `npm run monitor:municipio -- --municipio 014 --ano 2025`.
2. O comando cadastra/atualiza `municipios`.
3. O comando ativa `tce_municipios_monitorados`.
4. O comando cadastra o exercicio em `tce_municipio_exercicios_monitorados`.
5. O comando cria assinaturas em `tce_sync_subscriptions` para cada exercicio.
6. Rodar carga historica inicial dos meses/anos contratados.
7. Deixar a rotina automatica verificar novas competencias.

Variacoes:

```bash
npm run monitor:municipio -- --municipio 014 --exercicio 202500
npm run monitor:municipio -- --municipio 014 --ano 2025
npm run monitor:municipio -- --municipio 014 --anos 2024,2025,2026
npm run monitor:municipio -- --municipio 014 --exercicio 202500 --grupo bal
npm run monitor:municipio -- --municipio 014 --exercicio 202500 --endpoint contratos
npm run monitor:municipio -- --municipio 014 --exercicio 202500 --all
npm run check:ano -- --municipio 014 --grupo bal --ano 2025 --default
npm run sync:ano -- --municipio 014 --grupo bal --ano 2025 --default
```

## Interface futura

A tela de sincronizacao deve mostrar:

- lista de municipios monitorados;
- botao para adicionar novo municipio;
- grupos oficiais da API na ordem da OpenAPI do TCE: Auxiliares, BAS, ORC, BAL, DCR, LCO, OSC, CRD, OUT, OSE, CPF, RPP, PAT, VCL, DCD;
- caixas de selecao por endpoint/tabela;
- seletor de exercicio e intervalo de competencias;
- no MVP, o seletor de exercicio pode vir travado em 2025;
- para endpoints mensais, o usuario escolhe ano/intervalo e o sistema roda todos os meses disponiveis;
- status por tabela: nunca baixado, atualizado, pendente, erro, disponivel para baixar;
- acao `baixar agora`;
- acao `forcar atualizacao`;
- ultima verificacao e ultima carga com sucesso.

## Deteccao de atualizacao

O sistema nao deve baixar tudo todos os dias. A rotina automatica deve:

1. listar municipios ativos;
2. listar endpoints ativos para cada municipio;
3. calcular competencias esperadas do ano monitorado;
4. consultar a API com `$count=1` para descobrir se ha dados;
5. registrar o resultado em `tce_sync_availability_checks`;
6. se houver dados e ainda nao existir sync `ok`, baixar a competencia completa.
