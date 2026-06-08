import "dotenv/config";
import { runSyncTce } from "../src/lib/tce/sync-runner.js";
import { parseCliArgs, stringArg, numberArg } from "../src/lib/cli/args.js";

const args = parseCliArgs(process.argv.slice(2));

const options = {
  endpoint: stringArg(args, "endpoint") ?? "balancetesReceitasOrcamentarias",
  municipio: stringArg(args, "municipio") ?? process.env.TCE_DEFAULT_MUNICIPIO ?? "014",
  exercicio: stringArg(args, "exercicio") ?? process.env.TCE_DEFAULT_EXERCICIO ?? "202600",
  dataReferencia: stringArg(args, "data-referencia") ?? process.env.TCE_DEFAULT_DATA_REFERENCIA ?? "202601",
  orgao: stringArg(args, "orgao"),
  unidadeOrcamentaria: stringArg(args, "unidade-orcamentaria"),
  dryRun: args.has("dry-run") || args.has("dry"),
  force: args.has("force"),
  maxPages: numberArg(args, "max-pages")
};

runSyncTce(options).catch((error) => {
  console.error("Fatal:", error);
  process.exitCode = 1;
});
