import "dotenv/config";
import { spawn } from "node:child_process";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin.js";
import { parseCliArgs, stringArg } from "../src/lib/cli/args.js";
import { parseExercicioFromArgs } from "../src/lib/tce/exercicio.js";

const args = parseCliArgs(process.argv.slice(2));
const codigoMunicipio = stringArg(args, "municipio") ?? process.env.TCE_DEFAULT_MUNICIPIO;
const exercicio = parseExercicioFromArgs(args, process.env.TCE_DEFAULT_EXERCICIO);
const force = args.has("force");
const maxOrgaos = numberArg(args, "max-orgaos");
const supabase = createSupabaseAdminClient();

if (!codigoMunicipio) {
  throw new Error("Informe --municipio ou configure TCE_DEFAULT_MUNICIPIO.");
}

const { data: orgaos, error } = await supabase
  .from("tce_orgaos")
  .select("codigo_orgao,nome_orgao")
  .eq("codigo_municipio", codigoMunicipio)
  .eq("exercicio_orcamento", exercicio)
  .order("codigo_orgao", { ascending: true });

if (error) {
  throw error;
}

if (!orgaos?.length) {
  throw new Error(`Nenhum orgao encontrado para municipio=${codigoMunicipio}, exercicio=${exercicio}.`);
}

const selectedOrgaos = maxOrgaos ? orgaos.slice(0, maxOrgaos) : orgaos;

console.log(
  `Sincronizando contas bancarias por orgao: municipio=${codigoMunicipio}; exercicio=${exercicio}; orgaos=${selectedOrgaos.length}`
);

let successCount = 0;
let errorCount = 0;

for (const orgao of selectedOrgaos) {
  console.log(`Orgao ${orgao.codigo_orgao} - ${orgao.nome_orgao ?? ""}`);

  const commandArgs = [
    "run",
    "sync:tce",
    "--",
    "--endpoint",
    "contasBancariasMunicipio",
    "--municipio",
    codigoMunicipio,
    "--exercicio",
    exercicio,
    "--orgao",
    orgao.codigo_orgao
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
}

const { count, error: countError } = await supabase
  .from("tce_contas_bancarias_municipio")
  .select("*", { count: "exact", head: true })
  .eq("codigo_municipio", codigoMunicipio)
  .eq("exercicio_orcamento", exercicio);

if (countError) {
  throw countError;
}

console.log(`Finalizado. Orgaos ok=${successCount}; erros=${errorCount}; total_normalizado=${count ?? 0}`);

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

function numberArg(values: Map<string, string | true>, key: string): number | undefined {
  const value = stringArg(values, key);
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
