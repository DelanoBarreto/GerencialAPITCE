import "dotenv/config";
import { runSyncGrupo } from "../src/lib/tce/sync-runner.js";
import { parseCliArgs, stringArg } from "../src/lib/cli/args.js";

const args = parseCliArgs(process.argv.slice(2));
const municipio = stringArg(args, "municipio") ?? process.env.TCE_DEFAULT_MUNICIPIO ?? "014";
const grupo = stringArg(args, "grupo");
const exercicio = stringArg(args, "exercicio") ?? process.env.TCE_DEFAULT_EXERCICIO ?? "202600";

if (!grupo) {
  console.error("Informe --grupo. Exemplo: --grupo bal");
  process.exitCode = 1;
} else {
  runSyncGrupo({
    municipio,
    grupo,
    exercicio,
    dataReferencia: stringArg(args, "data-referencia"),
    dataInicial: stringArg(args, "data-inicial"),
    dataFinal: stringArg(args, "data-final"),
    onlyDefault: args.has("default"),
    force: args.has("force"),
    maxPages: stringArg(args, "max-pages")
  }).catch((error) => {
    console.error("Fatal:", error);
    process.exitCode = 1;
  });
}
