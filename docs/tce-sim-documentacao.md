# Documentacao TCE-CE SIM

Esta pasta guarda as fontes oficiais usadas para modelar a carga da API do SIM/TCE-CE no projeto APITCE.

## Fontes oficiais

- Portal da API: https://api-dados-abertos.tce.ce.gov.br/sim/
- OpenAPI: https://api-dados-abertos.tce.ce.gov.br/sim/openapi_prod.yaml
- Documentacao e programas: https://www.tce.ce.gov.br/municipios/sim/documentacao-e-programas
- Manual SIM 2026 - Municipios: https://www.tce.ce.gov.br/downloads/municipios/sim-documentacao-e-programas/Manual_SIM_2026_-_Municpios_vMAR-1.pdf

O portal de documentacao do TCE lista o Manual do SIM aos Municipios - versao 2026, atualizado em 19/12/2025 e aprovado pela Portaria 1227/2025. A copia local do PDF foi salva em `docs/vendor/tce-sim/Manual_SIM_2026_-_Municipios_vMAR-1.pdf`.

## Como usar esta documentacao no projeto

- A OpenAPI define endpoints, nomes de parametros e formato tecnico da resposta.
- O Manual SIM explica o significado contabile/orcamentario dos campos, periodicidade de envio e relacoes entre tabelas.
- O sistema deve manter os dois tipos de documentacao: a OpenAPI orienta o worker; o Manual orienta a modelagem, filtros e relatorios.

## Regras importantes ja identificadas

- A API usa paginacao por `$count` e `$start_index`; o limite pratico por pagina deve ser `1000`.
- As respostas retornam registros dentro de `elements`, acompanhados de `links`.
- `codigo_municipio` deve ser tratado como texto de 3 posicoes, por exemplo `014` para Aracati.
- `exercicio_orcamento` aparece no manual como campo numerico de 6 posicoes, por exemplo `202600`.
- `data_referencia_doc` aparece como Ano/Mes em 6 posicoes, por exemplo `202601`.
- Campos de codigo como orgao, unidade orcamentaria, rubrica, fonte e fornecedor devem ser guardados como texto para preservar zeros a esquerda.

## Prioridade de leitura para o MVP

1. Municipios e arquivos basicos.
2. Orgaos e unidades orcamentarias.
3. Programas de governo, funcoes, projetos e atividades.
4. Orcamento da receita e da despesa.
5. Balancetes de receitas e despesas.
6. Empenhos, liquidacoes e pagamentos.

