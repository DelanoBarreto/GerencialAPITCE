import { loadOpenApiEndpointConfigs } from "./openapi-catalog.js";

export type SyncFrequency = "once" | "annual" | "monthly";

export type TceEndpointConfig = {
  endpoint: string;
  table: string;
  frequency: SyncFrequency;
  requiredParams: string[];
  optionalParams: string[];
  description: string;
};

export const TCE_ENDPOINTS = {
  municipios: {
    endpoint: "municipios",
    table: "municipios",
    frequency: "once",
    requiredParams: [],
    optionalParams: ["codigo_municipio"],
    description: "Catalogo de municipios do Ceara."
  },
  orgaos: {
    endpoint: "orgaos",
    table: "tce_orgaos",
    frequency: "annual",
    requiredParams: ["codigo_municipio", "exercicio_orcamento"],
    optionalParams: [],
    description: "Orgaos municipais por exercicio."
  },
  funcoes: {
    endpoint: "funcoes",
    table: "tce_funcoes",
    frequency: "once",
    requiredParams: [],
    optionalParams: [],
    description: "Funcoes governamentais."
  },
  tiposUnidadesAdministrativas: {
    endpoint: "tipos_unidades_administrativas",
    table: "tce_tipos_unidades_administrativas",
    frequency: "once",
    requiredParams: [],
    optionalParams: [],
    description: "Tipos de unidades administrativas."
  },
  gestores: {
    endpoint: "gestores",
    table: "tce_raw_records",
    frequency: "annual",
    requiredParams: ["codigo_municipio", "exercicio_orcamento"],
    optionalParams: ["codigo_unidade_gestora", "codigo_orgao", "codigo_unidade_orcamentaria", "data_referencia_doc"],
    description: "Gestores por municipio e exercicio."
  },
  unidadesOrcamentarias: {
    endpoint: "unidades_orcamentarias",
    table: "tce_unidades_orcamentarias",
    frequency: "annual",
    requiredParams: ["codigo_municipio", "exercicio_orcamento"],
    optionalParams: ["codigo_orgao"],
    description: "Unidades orcamentarias por municipio, orgao e exercicio."
  },
  contasBancariasMunicipio: {
    endpoint: "contas_bancarias_municipio",
    table: "tce_contas_bancarias_municipio",
    frequency: "annual",
    requiredParams: ["codigo_municipio", "exercicio_orcamento"],
    optionalParams: ["codigo_orgao", "codigo_unidade_orcamentaria"],
    description: "Contas bancarias do municipio."
  },
  unidadesGestoras: {
    endpoint: "unidades_gestoras",
    table: "tce_unidades_gestoras",
    frequency: "annual",
    requiredParams: ["codigo_municipio", "exercicio_orcamento"],
    optionalParams: ["codigo_unidade_gestora"],
    description: "Unidades gestoras."
  },
  ordenadoresDespesas: {
    endpoint: "ordenadores_despesas",
    table: "tce_ordenadores_despesas",
    frequency: "annual",
    requiredParams: ["codigo_municipio", "exercicio_orcamento"],
    optionalParams: ["codigo_orgao", "codigo_unidade_orcamentaria"],
    description: "Ordenadores de despesas."
  },
  dadosOrcamentos: {
    endpoint: "dados_orcamentos",
    table: "tce_dados_orcamentos",
    frequency: "annual",
    requiredParams: ["codigo_municipio", "exercicio_orcamento"],
    optionalParams: [],
    description: "Dados gerais dos orcamentos."
  },
  orcamentosReceitas: {
    endpoint: "orcamento_receita",
    table: "tce_orcamentos_receitas",
    frequency: "annual",
    requiredParams: ["codigo_municipio", "exercicio_orcamento"],
    optionalParams: ["codigo_orgao"],
    description: "Receita prevista no orcamento inicial."
  },
  orcamentosDespesas: {
    endpoint: "orcamento_despesa",
    table: "tce_orcamentos_despesas",
    frequency: "annual",
    requiredParams: ["codigo_municipio", "exercicio_orcamento"],
    optionalParams: ["codigo_orgao"],
    description: "Despesa autorizada no orcamento inicial."
  },
  orcamentosDespesasProjetosAtividades: {
    endpoint: "orcamento_despesas_projetos_atividades",
    table: "tce_orcamentos_despesas_projetos_atividades",
    frequency: "annual",
    requiredParams: ["codigo_municipio", "exercicio_orcamento"],
    optionalParams: ["codigo_orgao"],
    description: "Orcamento de despesas por projetos e atividades."
  },
  elementosDespesasProjetosAtividades: {
    endpoint: "elementos_despesas_projetos_atividades",
    table: "tce_elementos_despesas_projetos_atividades",
    frequency: "annual",
    requiredParams: ["codigo_municipio", "exercicio_orcamento"],
    optionalParams: ["codigo_orgao"],
    description: "Elementos de despesas por projetos e atividades."
  },
  programasGoverno: {
    endpoint: "programas_governo",
    table: "tce_programas_governo",
    frequency: "annual",
    requiredParams: ["codigo_municipio", "exercicio_orcamento"],
    optionalParams: [],
    description: "Programas de governo."
  },
  balancetesReceitasOrcamentarias: {
    endpoint: "balancetes_receitas_orcamentarias",
    table: "tce_balancetes_receitas_orcamentarias",
    frequency: "monthly",
    requiredParams: ["codigo_municipio", "exercicio_orcamento", "data_referencia_doc"],
    optionalParams: ["codigo_orgao", "codigo_unidade_orcamentaria"],
    description: "Execucao mensal da receita orcamentaria."
  },
  balancetesDespesasOrcamentarias: {
    endpoint: "balancetes_despesas_orcamentarias",
    table: "tce_balancetes_despesas_orcamentarias",
    frequency: "monthly",
    requiredParams: ["codigo_municipio", "exercicio_orcamento", "data_referencia_doc"],
    optionalParams: ["codigo_orgao", "codigo_unidade_orcamentaria"],
    description: "Execucao mensal da despesa orcamentaria."
  },
  balancetesReceitasExtraOrcamentarias: {
    endpoint: "balancetes_receitas_extra_orcamentarias",
    table: "tce_balancetes_receitas_extra_orcamentarias",
    frequency: "monthly",
    requiredParams: ["codigo_municipio", "exercicio_orcamento", "data_referencia_doc"],
    optionalParams: [],
    description: "Execucao mensal da receita extra-orcamentaria."
  },
  balancetesDespesasExtraOrcamentarias: {
    endpoint: "balancetes_despesas_extra_orcamentarias",
    table: "tce_balancetes_despesas_extra_orcamentarias",
    frequency: "monthly",
    requiredParams: ["codigo_municipio", "exercicio_orcamento", "data_referencia_doc"],
    optionalParams: [],
    description: "Execucao mensal da despesa extra-orcamentaria."
  }
} satisfies Record<string, TceEndpointConfig>;

export type TceEndpointKey = keyof typeof TCE_ENDPOINTS;

export function getEndpointConfig(key: string): TceEndpointConfig {
  const normalizedKey = normalizeEndpointKey(key);
  const config =
    TCE_ENDPOINTS[key as TceEndpointKey] ??
    TCE_ENDPOINTS[normalizedKey as TceEndpointKey] ??
    Object.values(TCE_ENDPOINTS).find((endpointConfig) => endpointConfig.endpoint === key) ??
    Object.values(TCE_ENDPOINTS).find((endpointConfig) => endpointConfig.endpoint === normalizedKey) ??
    loadOpenApiEndpointConfigs().find((endpointConfig) => endpointConfig.endpoint === key);

  if (!config) {
    throw new Error(`Endpoint nao configurado: ${key}`);
  }

  return config;
}

function normalizeEndpointKey(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();
}
