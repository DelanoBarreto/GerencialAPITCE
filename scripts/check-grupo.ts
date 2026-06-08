import "dotenv/config";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin.js";
import { parseCliArgs, stringArg } from "../src/lib/cli/args.js";
import { parseExercicioFromArgs } from "../src/lib/tce/exercicio.js";
import { ensureGroupSubscriptions, loadGroupEndpoints } from "../src/lib/tce/group.js";
import { buildCompetencias } from "../src/lib/tce/competencias.js";
import { TceClient } from "../src/lib/tce/client.js";
import { getEndpointConfig } from "../src/lib/tce/endpoints.js";

const args = parseCliArgs(process.argv.slice(2));
const codigoMunicipio = stringArg(args, "municipio") ?? process.env.TCE_DEFAULT_MUNICIPIO;
const grupo = stringArg(args, "grupo");
const exercicio = parseExercicioFromArgs(args, process.env.TCE_DEFAULT_EXERCICIO);
const competencias = buildCompetencias(exercicio, {
  dataReferencia: stringArg(args, "data-referencia"),
  dataInicial: stringArg(args, "data-inicial"),
  dataFinal: stringArg(args, "data-final")
});
const onlyDefault = args.has("default");
const supabase = createSupabaseAdminClient();
const tce = new TceClient(process.env.TCE_BASE_URL, 1);

if (!codigoMunicipio) {
  throw new Error("Informe --municipio ou configure TCE_DEFAULT_MUNICIPIO.");
}

if (!grupo) {
  throw new Error("Informe --grupo. Exemplo: --grupo bal");
}

const endpoints = await loadGroupEndpoints(supabase, grupo, onlyDefault);
await ensureGroupSubscriptions(supabase, codigoMunicipio, exercicio, endpoints);

console.log(
  `Verificando grupo=${grupo}; municipio=${codigoMunicipio}; exercicio=${exercicio}; competencias=${competencias.join(",")}; endpoints=${endpoints.length}`
);

let successCount = 0;
let errorCount = 0;

for (const endpoint of endpoints) {
  const config = getEndpointConfig(endpoint.endpoint);
  const endpointCompetencias = endpoint.frequencia_sugerida === "mensal" ? competencias : [undefined];

  for (const competencia of endpointCompetencias) {
    const params: Record<string, string | undefined> = {
      codigo_municipio: codigoMunicipio,
      exercicio_orcamento: exercicio
    };

    for (const param of config.requiredParams) {
      if (param === "data_referencia_doc" && competencia) {
        params[param] = competencia;
      }
    }

    try {
      let found = 0;
      for await (const page of tce.paginate(endpoint.endpoint, params)) {
        found = page.rows.length;
        break;
      }

      const status = found > 0 ? "available" : "not_available";
      console.log(`${status}: ${codigoMunicipio} ${endpoint.endpoint}${competencia ? ` [${competencia}]` : ""} rows=${found}`);

      if (status === "available") {
        successCount += 1;
      } else {
        errorCount += 1;
      }
    } catch (error) {
      errorCount += 1;
      console.log(`error: ${codigoMunicipio} ${endpoint.endpoint} ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

console.log(`Finalizado. Sucesso=${successCount}; erros=${errorCount}`);

if (errorCount > 0) {
  process.exitCode = 1;
}
