import "dotenv/config";
import { spawn } from "node:child_process";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin.js";
import { parseCliArgs, stringArg } from "../src/lib/cli/args.js";
import { parseExercicioFromArgs } from "../src/lib/tce/exercicio.js";
import { ensureGroupSubscriptions, loadGroupEndpoints } from "../src/lib/tce/group.js";
import { buildCompetencias } from "../src/lib/tce/competencias.js";

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
const force = args.has("force");
const maxPages = stringArg(args, "max-pages");
const supabase = createSupabaseAdminClient();

if (!codigoMunicipio) {
  throw new Error("Informe --municipio ou configure TCE_DEFAULT_MUNICIPIO.");
}

if (!grupo) {
  throw new Error("Informe --grupo. Exemplo: --grupo bal");
}

const endpoints = await loadGroupEndpoints(supabase, grupo, onlyDefault);
await ensureGroupSubscriptions(supabase, codigoMunicipio, exercicio, endpoints);

console.log(
  `Sincronizando grupo=${grupo}; municipio=${codigoMunicipio}; exercicio=${exercicio}; competencias=${competencias.join(",")}; endpoints=${endpoints.length}`
);

let successCount = 0;
let skippedCount = 0;
let errorCount = 0;

for (const endpoint of endpoints) {
  if (endpoint.endpoint === "contas_bancarias_municipio") {
    const commandArgs = [
      "run",
      "sync:contas-bancarias",
      "--",
      "--municipio",
      codigoMunicipio,
      "--exercicio",
      exercicio
    ];

    if (force) {
      commandArgs.push("--force");
    }

    const exitCode = await runNpm(commandArgs);

    if (exitCode === 0) {
      successCount += 1;
    } else {
      errorCount += 1;
    }

    continue;
  }

  const endpointCompetencias = endpoint.frequencia_sugerida === "mensal" ? competencias : [undefined];

  for (const competencia of endpointCompetencias) {
  const commandArgs = [
    "run",
    "sync:tce",
    "--",
    "--endpoint",
    endpoint.endpoint,
    "--municipio",
    codigoMunicipio,
    "--exercicio",
    exercicio
  ];

  if (endpoint.frequencia_sugerida === "mensal") {
    commandArgs.push("--data-referencia", String(competencia));
  }

  if (force) {
    commandArgs.push("--force");
  }

  if (maxPages) {
    commandArgs.push("--max-pages", maxPages);
  }

  const exitCode = await runNpm(commandArgs);

  if (exitCode === 0) {
    successCount += 1;
  } else {
    errorCount += 1;
  }
  }
}

console.log(`Finalizado. Sucesso=${successCount}; pulados=${skippedCount}; erros=${errorCount}`);

if (errorCount > 0) {
  process.exitCode = 1;
}

function runNpm(commandArgs: string[]): Promise<number | null> {
  return new Promise((resolve) => {
    const child = spawn("cmd.exe", ["/c", "npm.cmd", ...commandArgs], {
      stdio: "inherit",
      shell: false
    });

    child.on("close", resolve);
  });
}
