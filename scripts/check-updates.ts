import "dotenv/config";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin.js";
import { parseCliArgs, stringArg } from "../src/lib/cli/args.js";
import { TceClient, type TceQueryParams } from "../src/lib/tce/client.js";
import { getEndpointConfig } from "../src/lib/tce/endpoints.js";

type SubscriptionRow = {
  codigo_municipio: string;
  exercicio_orcamento: string;
  endpoint: string;
  tce_municipio_exercicios_monitorados: {
    sincronizacao_automatica: boolean;
  } | null;
  tce_endpoint_catalog: {
    frequencia_sugerida: string;
  } | null;
};

const args = parseCliArgs(process.argv.slice(2));
const municipioFilter = stringArg(args, "municipio");
const endpointFilter = stringArg(args, "endpoint");
const exercicioFilter = stringArg(args, "exercicio");
const dataReferenciaFilter = stringArg(args, "data-referencia");
const supabase = createSupabaseAdminClient();
const tce = new TceClient(process.env.TCE_BASE_URL, 1);

const subscriptions = await loadSubscriptions();

console.log(`Assinaturas ativas encontradas: ${subscriptions.length}`);

let availableCount = 0;
let notAvailableCount = 0;
let errorCount = 0;

for (const subscription of subscriptions) {
  const config = getEndpointConfig(subscription.endpoint);
  const frequencia = subscription.tce_endpoint_catalog?.frequencia_sugerida ?? config.frequency;
  const exercicio =
    exercicioFilter ??
    subscription.exercicio_orcamento ??
    process.env.TCE_DEFAULT_EXERCICIO;
  const dataReferencia = dataReferenciaFilter ?? process.env.TCE_DEFAULT_DATA_REFERENCIA;

  if (frequencia === "mensal" && !dataReferencia) {
    console.warn(`Ignorando ${subscription.endpoint}: data_referencia_doc ausente.`);
    continue;
  }

  const params = buildParams(config.requiredParams, {
    codigo_municipio: subscription.codigo_municipio,
    exercicio_orcamento: exercicio,
    data_referencia_doc: frequencia === "mensal" ? dataReferencia : undefined
  });

  try {
    const rowsFound = await countFirstPage(subscription.endpoint, params);
    const status = rowsFound > 0 ? "available" : "not_available";

    await recordAvailability(subscription, params, status, rowsFound);

    if (status === "available") {
      availableCount += 1;
    } else {
      notAvailableCount += 1;
    }

    console.log(`${status}: ${subscription.codigo_municipio} ${subscription.endpoint} rows=${rowsFound}`);
  } catch (error) {
    errorCount += 1;
    await recordAvailability(subscription, params, "error", null, error);
    console.log(`error: ${subscription.codigo_municipio} ${subscription.endpoint} ${errorMessage(error)}`);
  }
}

console.log(
  `Finalizado. Disponiveis=${availableCount}; sem_dados=${notAvailableCount}; erros=${errorCount}`
);

if (errorCount > 0) {
  process.exitCode = 1;
}

async function loadSubscriptions(): Promise<SubscriptionRow[]> {
  let query = supabase
    .from("tce_sync_subscriptions")
    .select(
      "codigo_municipio, exercicio_orcamento, endpoint, tce_municipio_exercicios_monitorados(sincronizacao_automatica), tce_endpoint_catalog(frequencia_sugerida)"
    )
    .eq("ativo", true)
    .eq("sincronizacao_automatica", true)
    .eq("tce_municipio_exercicios_monitorados.sincronizacao_automatica", true)
    .order("endpoint", { ascending: true });

  if (municipioFilter) {
    query = query.eq("codigo_municipio", municipioFilter);
  }

  if (endpointFilter) {
    query = query.eq("endpoint", endpointFilter);
  }

  if (exercicioFilter) {
    query = query.eq("exercicio_orcamento", exercicioFilter);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as SubscriptionRow[];
}

function buildParams(requiredParams: string[], values: TceQueryParams): TceQueryParams {
  const params: TceQueryParams = {};

  for (const requiredParam of requiredParams) {
    params[requiredParam] = values[requiredParam];
  }

  return params;
}

async function countFirstPage(endpoint: string, params: TceQueryParams): Promise<number> {
  for await (const page of tce.paginate(endpoint, params)) {
    return page.rows.length;
  }

  return 0;
}

async function recordAvailability(
  subscription: SubscriptionRow,
  params: TceQueryParams,
  status: "available" | "not_available" | "error",
  rowsFound: number | null,
  error?: unknown
) {
  const { error: insertError } = await supabase.from("tce_sync_availability_checks").insert({
    endpoint: subscription.endpoint,
    codigo_municipio: subscription.codigo_municipio,
    exercicio_orcamento: nullableText(params.exercicio_orcamento),
    data_referencia_doc: nullableText(params.data_referencia_doc),
    status,
    rows_found: rowsFound,
    error_message: error ? errorMessage(error) : null
  });

  if (insertError) {
    throw insertError;
  }
}

function nullableText(value: unknown): string | null {
  return value === undefined || value === null || value === "" ? null : String(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
