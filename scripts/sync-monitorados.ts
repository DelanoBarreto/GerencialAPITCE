import "dotenv/config";
import { spawn } from "node:child_process";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin.js";
import { parseCliArgs, stringArg } from "../src/lib/cli/args.js";
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
const exercicioFilter = stringArg(args, "exercicio");
const dataReferenciaFilter = stringArg(args, "data-referencia");
const endpointFilter = stringArg(args, "endpoint");
const force = args.has("force");
const maxPages = stringArg(args, "max-pages");
const supabase = createSupabaseAdminClient();

const subscriptions = await loadSubscriptions();

console.log(`Assinaturas para sincronizar: ${subscriptions.length}`);

let successCount = 0;
let skippedCount = 0;
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
    skippedCount += 1;
    console.log(`pulando: ${subscription.endpoint}, competencia ausente`);
    continue;
  }

  const commandArgs = [
    "run",
    "sync:tce",
    "--",
    "--endpoint",
    subscription.endpoint,
    "--municipio",
    subscription.codigo_municipio
  ];

  if (config.requiredParams.includes("exercicio_orcamento")) {
    commandArgs.push("--exercicio", String(exercicio));
  }

  if (config.requiredParams.includes("data_referencia_doc")) {
    commandArgs.push("--data-referencia", String(dataReferencia));
  }

  if (force) {
    commandArgs.push("--force");
  }

  if (maxPages) {
    commandArgs.push("--max-pages", maxPages);
  }

  console.log(`sincronizando: ${subscription.codigo_municipio} ${subscription.endpoint}`);
  const exitCode = await runNpx(commandArgs);

  if (exitCode === 0) {
    successCount += 1;
  } else {
    errorCount += 1;
  }
}

console.log(`Finalizado. Sucesso=${successCount}; pulados=${skippedCount}; erros=${errorCount}`);

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

function runNpx(commandArgs: string[]): Promise<number | null> {
  return new Promise((resolve) => {
    const child = spawn("cmd.exe", ["/c", "npm.cmd", ...commandArgs], {
      stdio: "inherit",
      shell: false
    });

    child.on("close", resolve);
  });
}
