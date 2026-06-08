import "dotenv/config";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin.js";
import { loadOpenApiEndpointEntries } from "../src/lib/tce/openapi-catalog.js";

const supabase = createSupabaseAdminClient();
const entries = loadOpenApiEndpointEntries();
const groups = groupEntries(entries);

console.log(`Importando catalogo OpenAPI: ${entries.length} endpoints; ${groups.length} grupos`);

const { error: groupError } = await supabase.from("tce_endpoint_groups").upsert(
  groups.map((group, index) => ({
    slug: group.slug,
    nome: group.name,
    ordem: index + 1
  })),
  { onConflict: "slug" }
);

if (groupError) {
  throw groupError;
}

const { error: endpointError } = await supabase.from("tce_endpoint_catalog").upsert(
  entries.map((entry) => ({
    endpoint: entry.endpoint,
    grupo_slug: slugForGroup(entry.groupName),
    descricao: entry.description,
    parametros_obrigatorios: entry.requiredParams,
    parametros_opcionais: entry.optionalParams,
    frequencia_sugerida: frequencyToDb(entry.frequency),
    habilitado_por_padrao: isDefaultEnabled(entry.endpoint)
  })),
  { onConflict: "endpoint" }
);

if (endpointError) {
  throw endpointError;
}

console.log("Catalogo importado com sucesso.");

function groupEntries(items: { groupName: string }[]) {
  const seen = new Set<string>();
  const groups: { slug: string; name: string }[] = [];

  for (const item of items) {
    const slug = slugForGroup(item.groupName);

    if (!seen.has(slug)) {
      seen.add(slug);
      groups.push({
        slug,
        name: item.groupName
      });
    }
  }

  return groups;
}

function frequencyToDb(frequency: "once" | "annual" | "monthly") {
  if (frequency === "once") {
    return "uma_vez";
  }

  if (frequency === "annual") {
    return "anual";
  }

  return "mensal";
}

function slugForGroup(name: string): string {
  const knownGroups: Record<string, string> = {
    "Auxiliares": "auxiliares",
    "Documentação de Informações Básicas (BAS)": "bas",
    "Documentação referente ao Orçamento Municipal (ORC)": "orc",
    "Documentação referente aos Balancetes (BAL)": "bal",
    "Documentação referente às Licitações e Contratos (LIC)": "lic",
    "Documentação referente à Abertura de Créditos Adicionais (CRD)": "crd",
    "Outros Tipos de Documentos (OUT)": "out",
    "Documentação de Obras Municipais ou Serviços de Engenharia (OSE)": "ose",
    "Cadastro de Pessoal e Folha (CPF)": "cpf",
    "Regime Próprio de Previdência Social (RPP)": "rpp",
    "Documentação referente ao Patrimônio (PAT)": "pat",
    "Documentação referente aos Veículos (VEI)": "vei",
    "Documentação referente aos Empenhos (EMP)": "emp",
    "Documentação referente às Liquidações (LIQ)": "liq",
    "Documentação referente aos Pagamentos (PAG)": "pag"
  };

  return knownGroups[name] ?? name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isDefaultEnabled(endpoint: string): boolean {
  return new Set([
    "municipios",
    "funcoes",
    "tipos_unidades_administrativas",
    "gestores",
    "orgaos",
    "unidades_orcamentarias",
    "contas_bancarias_municipio",
    "unidades_gestoras",
    "ordenadores_despesas",
    "dados_orcamentos",
    "orcamento_receita",
    "orcamento_despesa",
    "orcamento_despesas_projetos_atividades",
    "elementos_despesas_projetos_atividades",
    "programas_governo",
    "balancetes_receitas_orcamentarias",
    "balancetes_despesas_orcamentarias",
    "balancetes_receitas_extra_orcamentarias",
    "balancetes_despesas_extra_orcamentarias"
  ]).has(endpoint);
}

