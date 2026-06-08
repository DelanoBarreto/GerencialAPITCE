import "dotenv/config";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin.js";
import { parseCliArgs, stringArg } from "../src/lib/cli/args.js";
import { TceClient } from "../src/lib/tce/client.js";
import { parseExerciciosFromArgs } from "../src/lib/tce/exercicio.js";

const args = parseCliArgs(process.argv.slice(2));
const codigoMunicipio = stringArg(args, "municipio") ?? process.env.TCE_DEFAULT_MUNICIPIO;
const exercicios = parseExerciciosFromArgs(args, process.env.TCE_DEFAULT_EXERCICIO);
const grupo = stringArg(args, "grupo");
const endpoint = stringArg(args, "endpoint");
const subscribeAll = args.has("all");
const supabase = createSupabaseAdminClient();
const tce = new TceClient(process.env.TCE_BASE_URL, 1);

if (!codigoMunicipio) {
  throw new Error("Informe --municipio ou TCE_DEFAULT_MUNICIPIO.");
}

if (exercicios.length === 0) {
  throw new Error("Informe --ano, --anos, --exercicio ou TCE_DEFAULT_EXERCICIO.");
}

const municipio = await fetchMunicipio(codigoMunicipio);
await upsertMunicipio(municipio);
const endpoints = await loadEndpointsToSubscribe();

for (const exercicio of exercicios) {
  await upsertMonitoring(codigoMunicipio, exercicio);
  await upsertMonitoringYear(codigoMunicipio, exercicio);
  await subscribeEndpoints(codigoMunicipio, exercicio, endpoints);
}

console.log(
  `Municipio monitorado: ${codigoMunicipio}; exercicios=${exercicios.join(",")}; endpoints_por_exercicio=${endpoints.length}`
);

async function fetchMunicipio(codigo: string): Promise<Record<string, unknown>> {
  for await (const page of tce.paginate("municipios", { codigo_municipio: codigo })) {
    const [row] = page.rows;

    if (!row) {
      break;
    }

    return row;
  }

  throw new Error(`Municipio nao encontrado na API do TCE: ${codigo}`);
}

async function upsertMunicipio(row: Record<string, unknown>) {
  const { error } = await supabase.from("municipios").upsert(
    {
      codigo_municipio: asText(row.codigo_municipio),
      nome_municipio: asText(row.nome_municipio ?? row.descricao_municipio ?? row.nome),
      payload: row,
      updated_at: new Date().toISOString()
    },
    { onConflict: "codigo_municipio" }
  );

  if (error) {
    throw error;
  }
}

async function upsertMonitoring(codigo: string, exercicioOrcamento: string) {
  const { error } = await supabase.from("tce_municipios_monitorados").upsert(
    {
      codigo_municipio: codigo,
      ativo: true,
      sincronizacao_automatica: true,
      exercicio_orcamento_padrao: exercicioOrcamento,
      observacoes: "Municipio cadastrado pelo comando monitor:municipio",
      updated_at: new Date().toISOString()
    },
    { onConflict: "codigo_municipio" }
  );

  if (error) {
    throw error;
  }
}

async function upsertMonitoringYear(codigo: string, exercicioOrcamento: string) {
  const { error } = await supabase.from("tce_municipio_exercicios_monitorados").upsert(
    {
      codigo_municipio: codigo,
      exercicio_orcamento: exercicioOrcamento,
      ano: Number(exercicioOrcamento.slice(0, 4)),
      ativo: true,
      sincronizacao_automatica: true,
      observacoes: "Exercicio cadastrado pelo comando monitor:municipio",
      updated_at: new Date().toISOString()
    },
    { onConflict: "codigo_municipio,exercicio_orcamento" }
  );

  if (error) {
    throw error;
  }
}

async function loadEndpointsToSubscribe(): Promise<string[]> {
  let query = supabase.from("tce_endpoint_catalog").select("endpoint").order("endpoint", { ascending: true });

  if (endpoint) {
    query = query.eq("endpoint", endpoint);
  } else if (grupo) {
    query = query.eq("grupo_slug", grupo);
  } else if (!subscribeAll) {
    query = query.eq("habilitado_por_padrao", true);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.endpoint);
}

async function subscribeEndpoints(codigo: string, exercicio: string, endpoints: string[]) {
  if (endpoints.length === 0) {
    return;
  }

  const { error } = await supabase.from("tce_sync_subscriptions").upsert(
    endpoints.map((item) => ({
      codigo_municipio: codigo,
      exercicio_orcamento: exercicio,
      endpoint: item,
      ativo: true,
      sincronizacao_automatica: true,
      updated_at: new Date().toISOString()
    })),
    { onConflict: "codigo_municipio,exercicio_orcamento,endpoint" }
  );

  if (error) {
    throw error;
  }
}

function asText(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    throw new Error("Campo obrigatorio ausente.");
  }

  return String(value);
}
