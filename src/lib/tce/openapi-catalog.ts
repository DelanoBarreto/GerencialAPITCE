import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { TceEndpointConfig } from "./endpoints.js";

type ParsedEndpoint = {
  groupName: string;
  endpoint: string;
  description: string;
  requiredParams: string[];
  optionalParams: string[];
};

let cachedConfigs: TceEndpointConfig[] | null = null;
let cachedEntries: OpenApiEndpointEntry[] | null = null;

export type OpenApiEndpointEntry = ParsedEndpoint & {
  frequency: TceEndpointConfig["frequency"];
};

export function loadOpenApiEndpointConfigs(): TceEndpointConfig[] {
  if (cachedConfigs) {
    return cachedConfigs;
  }

  cachedConfigs = loadOpenApiEndpointEntries().map((item) => ({
    endpoint: item.endpoint,
    table: defaultTableForEndpoint(item.endpoint),
    frequency: item.frequency,
    requiredParams: item.requiredParams,
    optionalParams: item.optionalParams,
    description: item.description
  }));

  return cachedConfigs;
}

export function loadOpenApiEndpointEntries(): OpenApiEndpointEntry[] {
  if (cachedEntries) {
    return cachedEntries;
  }

  const openApiPath = join(process.cwd(), "docs", "vendor", "tce-sim", "openapi_prod.yaml");

  if (!existsSync(openApiPath)) {
    cachedEntries = [];
    return cachedEntries;
  }

  const lines = readFileSync(openApiPath, "utf8").split(/\r?\n/);
  const endpoints: ParsedEndpoint[] = [];
  let endpoint: string | null = null;
  let groupName = "";
  let description = "";
  let waitingForTag = false;
  let inParameters = false;
  let paramName: string | null = null;
  let paramRequired = false;
  let requiredParams: string[] = [];
  let optionalParams: string[] = [];

  function flushParam() {
    if (!paramName) {
      return;
    }

    if (!paramName.startsWith("$")) {
      if (paramRequired) {
        requiredParams.push(paramName);
      } else {
        optionalParams.push(paramName);
      }
    }

    paramName = null;
    paramRequired = false;
  }

  function flushEndpoint() {
    flushParam();

    if (endpoint && description) {
      endpoints.push({
        groupName,
        endpoint,
        description,
        requiredParams,
        optionalParams
      });
    }

    endpoint = null;
    groupName = "";
    description = "";
    waitingForTag = false;
    inParameters = false;
    paramName = null;
    paramRequired = false;
    requiredParams = [];
    optionalParams = [];
  }

  for (const line of lines) {
    const pathMatch = line.match(/^  \/([^:]+):\s*$/);
    if (pathMatch) {
      flushEndpoint();
      endpoint = pathMatch[1];
      continue;
    }

    if (line.match(/^      tags:\s*$/)) {
      waitingForTag = true;
      continue;
    }

    if (waitingForTag) {
      const tagMatch = line.match(/^      - (.+)$/);
      if (tagMatch) {
        groupName = tagMatch[1];
        waitingForTag = false;
        continue;
      }
    }

    const summaryMatch = line.match(/^      summary: (.+)$/);
    if (summaryMatch) {
      description = summaryMatch[1];
      continue;
    }

    if (line.match(/^      parameters:\s*$/)) {
      inParameters = true;
      continue;
    }

    if (inParameters) {
      const nameMatch = line.match(/^      - name: (.+)$/);
      if (nameMatch) {
        flushParam();
        paramName = nameMatch[1];
        continue;
      }

      const requiredMatch = line.match(/^        required: (true|false)$/);
      if (requiredMatch) {
        paramRequired = requiredMatch[1] === "true";
        continue;
      }

      if (line.match(/^      responses:/)) {
        flushParam();
        inParameters = false;
      }
    }
  }

  flushEndpoint();

  cachedEntries = endpoints.map((item) => ({
    ...item,
    frequency: inferFrequency(item.requiredParams)
  }));

  return cachedEntries;
}

function inferFrequency(requiredParams: string[]): TceEndpointConfig["frequency"] {
  if (requiredParams.includes("data_referencia_doc")) {
    return "monthly";
  }

  if (requiredParams.includes("exercicio_orcamento")) {
    return "annual";
  }

  return "once";
}

function defaultTableForEndpoint(endpoint: string): string {
  if (endpoint === "municipios") {
    return "municipios";
  }

  if (endpoint === "orgaos") {
    return "tce_orgaos";
  }

  if (endpoint === "unidades_orcamentarias") {
    return "tce_unidades_orcamentarias";
  }

  if (endpoint === "funcoes") {
    return "tce_funcoes";
  }

  if (endpoint === "tipos_unidades_administrativas") {
    return "tce_tipos_unidades_administrativas";
  }

  if (endpoint === "unidades_gestoras") {
    return "tce_unidades_gestoras";
  }

  if (endpoint === "ordenadores_despesas") {
    return "tce_ordenadores_despesas";
  }

  if (endpoint === "contas_bancarias_municipio") {
    return "tce_contas_bancarias_municipio";
  }

  if (endpoint === "balancetes_receitas_orcamentarias") {
    return "tce_balancetes_receitas_orcamentarias";
  }

  if (endpoint === "orcamento_receita") {
    return "tce_orcamentos_receitas";
  }

  if (endpoint === "orcamento_despesa") {
    return "tce_orcamentos_despesas";
  }

  if (endpoint === "orcamento_despesas_projetos_atividades") {
    return "tce_orcamentos_despesas_projetos_atividades";
  }

  if (endpoint === "dados_orcamentos") {
    return "tce_dados_orcamentos";
  }

  if (endpoint === "programas_governo") {
    return "tce_programas_governo";
  }

  if (endpoint === "elementos_despesas_projetos_atividades") {
    return "tce_elementos_despesas_projetos_atividades";
  }

  if (endpoint === "balancetes_despesas_orcamentarias") {
    return "tce_balancetes_despesas_orcamentarias";
  }

  if (endpoint === "balancetes_receitas_extra_orcamentarias") {
    return "tce_balancetes_receitas_extra_orcamentarias";
  }

  if (endpoint === "balancetes_despesas_extra_orcamentarias") {
    return "tce_balancetes_despesas_extra_orcamentarias";
  }

  return "tce_raw_records";
}
