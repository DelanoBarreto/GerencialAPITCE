import "dotenv/config";
import { spawn } from "node:child_process";
import { parseCliArgs, numberArg, stringArg } from "../src/lib/cli/args.js";
import { parseExercicioFromArgs } from "../src/lib/tce/exercicio.js";

const args = parseCliArgs(process.argv.slice(2));
const codigoMunicipio = stringArg(args, "municipio") ?? process.env.TCE_DEFAULT_MUNICIPIO;
const grupo = stringArg(args, "grupo");
const exercicio = parseExercicioFromArgs(args, process.env.TCE_DEFAULT_EXERCICIO);
const onlyDefault = args.has("default");
const maxMeses = numberArg(args, "max-meses");

if (!codigoMunicipio) {
  throw new Error("Informe --municipio ou configure TCE_DEFAULT_MUNICIPIO.");
}

if (!grupo) {
  throw new Error("Informe --grupo. Exemplo: --grupo bal");
}

const ano = exercicio.slice(0, 4);
const dataInicial = `${ano}01`;
const dataFinal = `${ano}${String(maxMeses ?? 12).padStart(2, "0")}`;
const commandArgs = [
  "run",
  "check:grupo",
  "--",
  "--municipio",
  codigoMunicipio,
  "--grupo",
  grupo,
  "--exercicio",
  exercicio,
  "--data-inicial",
  dataInicial,
  "--data-final",
  dataFinal
];

if (onlyDefault) {
  commandArgs.push("--default");
}

console.log(`Verificando ano: municipio=${codigoMunicipio}; grupo=${grupo}; exercicio=${exercicio}; intervalo=${dataInicial}-${dataFinal}`);
const exitCode = await runNpm(commandArgs);

if (exitCode !== 0) {
  process.exitCode = exitCode ?? 1;
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
