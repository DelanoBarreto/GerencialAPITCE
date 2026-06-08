import "dotenv/config";
import { runSyncContasBancarias } from "../src/lib/tce/sync-runner.js";
import { parseCliArgs, stringArg, numberArg } from "../src/lib/cli/args.js";

const args = parseCliArgs(process.argv.slice(2));
const municipio = stringArg(args, "municipio") ?? process.env.TCE_DEFAULT_MUNICIPIO ?? "014";
const exercicio = stringArg(args, "exercicio") ?? process.env.TCE_DEFAULT_EXERCICIO ?? "202600";

runSyncContasBancarias({
  municipio,
  exercicio,
  force: args.has("force"),
  maxOrgaos: numberArg(args, "max-orgaos")
}).catch((error) => {
  console.error("Fatal:", error);
  process.exitCode = 1;
});
